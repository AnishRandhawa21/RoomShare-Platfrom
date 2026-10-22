"use server";

import { prisma, Role, PropertyStatus, RoomOperationalStatus, GenderPolicy, FoodOffering, PropertyType } from "@/lib/prisma";
import { EnquiryStatus, RoommateRequestStatus } from "@/lib/enums";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { getOwnerPublishingEntitlement } from "@/lib/billing-entitlements";
import { getEffectivePricingConfig } from "@/lib/pricing";

// Utility for URL-friendly slugs
function generateSlug(name: string, locality: string): string {
  const base = `${name}-${locality}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${randomSuffix}`;
}

export interface RegisterOwnerInput {
  businessName?: string;
  contactPhone: string;
  whatsappNumber?: string;
  altPhone?: string;
}

export interface InitialRoomTypeInput {
  name: string;
  occupancy: number;
  monthlyRent: number;
  securityDeposit: number;
  maintenanceCharges?: number;
  foodCharges?: number;
  hasAttachedBathroom?: boolean;
  hasBalcony?: boolean;
  hasAirConditioning?: boolean;
  genderRestriction?: GenderPolicy;
  initialRoomsCount: number;
  startRoomNumber: number;
  floor?: number;
}

export interface CreatePropertyInput {
  name: string;
  propertyType: PropertyType;
  genderPolicy: GenderPolicy;
  description: string;
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  whatsappNumber?: string;
  gateClosingTime?: string;
  noticePeriodDays?: number;
  houseRules: string[];
  foodIncluded: boolean;
  foodOffering: FoodOffering;
  amenityIds: string[];
  roomTypes: InitialRoomTypeInput[];
  status?: PropertyStatus;
}

/**
 * Ensures the authenticated user has OWNER or ADMIN role (granted via accepted invitation)
 * and an active OwnerProfile.
 */
export async function requireOwnerContext() {
  const user = await requireUser("/login");

  if (user.role !== Role.OWNER && user.role !== Role.ADMIN) {
    throw new Error(
      "Owner access is by invitation only. Please use the invitation link sent to you by an administrator."
    );
  }

  let ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: user.id },
  });

  // If user has OWNER role via accepted invite but profile not yet completed, create starter profile
  if (!ownerProfile) {
    ownerProfile = await prisma.ownerProfile.create({
      data: {
        userId: user.id,
        contactPhone: user.phone || "",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
  }

  return { user, ownerProfile };
}

/**
 * Updates an owner profile for an authorized owner.
 * Does NOT allow unauthorized public users to self-promote.
 */
export async function registerOwnerAction(input: RegisterOwnerInput) {
  try {
    const { user } = await requireOwnerContext();

    if (!input.contactPhone || input.contactPhone.trim().length < 10) {
      return { success: false, error: "A valid 10-digit primary contact phone number is required." };
    }

    const updatedProfile = await prisma.ownerProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: input.businessName?.trim() || null,
        contactPhone: input.contactPhone.trim(),
        whatsappNumber: input.whatsappNumber?.trim() || null,
        altPhone: input.altPhone?.trim() || null,
      },
      create: {
        userId: user.id,
        businessName: input.businessName?.trim() || null,
        contactPhone: input.contactPhone.trim(),
        whatsappNumber: input.whatsappNumber?.trim() || null,
        altPhone: input.altPhone?.trim() || null,
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    revalidatePath("/owner/properties");
    revalidatePath("/owner/onboarding");
    revalidatePath("/profile");

    return { success: true, ownerProfile: updatedProfile };
  } catch (error: unknown) {
    console.error("registerOwnerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update owner profile.",
    };
  }
}

/**
 * Fetches all catalog amenities for property creation.
 */
export async function getCatalogAmenitiesAction() {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return { success: true, amenities };
  } catch (error: unknown) {
    console.error("getCatalogAmenitiesAction error:", error);
    return {
      success: false,
      amenities: [],
      error: error instanceof Error ? error.message : "Failed to fetch amenities.",
    };
  }
}

/**
 * Creates a new Property with RoomTypes and initial provisioned Room records.
 * Atomic transaction maintains strict relationship: Owner -> Property -> RoomType -> Room.
 */
export async function createPropertyAction(input: CreatePropertyInput) {
  try {
    const { ownerProfile } = await requireOwnerContext();

    if (!input.name || input.name.trim().length < 3) {
      return { success: false, error: "Property name must be at least 3 characters." };
    }
    if (!input.locality || !input.city) {
      return { success: false, error: "Locality and city are required." };
    }
    if (!input.addressLine1) {
      return { success: false, error: "Address line 1 is required." };
    }
    if (!input.roomTypes || input.roomTypes.length === 0) {
      return { success: false, error: "Please configure at least one Room Type (e.g., 2-Seater, Private Room)." };
    }

    const slug = generateSlug(input.name, input.locality);

    // Calculate starting price across active room types
    const startingPrice = input.roomTypes.length > 0
      ? Math.min(...input.roomTypes.map((rt) => rt.monthlyRent))
      : null;

    const entitlement = await getOwnerPublishingEntitlement(ownerProfile.id);
    if (!entitlement.canPublish) {
      return {
        success: false,
        limitReached: true,
        error:
          entitlement.reason ||
          "You have reached the property limit for your current subscription plan. Upgrade to StayKro Plus to list and publish more properties.",
        entitlement: {
          publishedCount: entitlement.publishedCount,
          allowedCount: entitlement.allowedCount,
          planName: entitlement.activePlan?.name || "StayKro Solo",
        },
      };
    }

    const initialStatus = PropertyStatus.PUBLISHED;

    const property = await prisma.$transaction(async (tx) => {
      // 1. Create Property
      const newProperty = await tx.property.create({
        data: {
          ownerId: ownerProfile.id,
          name: input.name.trim(),
          slug,
          propertyType: input.propertyType || PropertyType.PG,
          genderPolicy: input.genderPolicy || GenderPolicy.UNISEX,
          status: initialStatus,
          description: input.description.trim(),
          addressLine1: input.addressLine1.trim(),
          addressLine2: input.addressLine2?.trim() || null,
          locality: input.locality.trim(),
          city: input.city.trim(),
          state: input.state.trim() || "Punjab",
          postalCode: input.postalCode.trim() || "144001",
          latitude: input.latitude || 31.3260,
          longitude: input.longitude || 75.5762,
          contactPhone: input.contactPhone.trim() || ownerProfile.contactPhone,
          whatsappNumber: input.whatsappNumber?.trim() || ownerProfile.whatsappNumber,
          gateClosingTime: input.gateClosingTime?.trim() || null,
          noticePeriodDays: input.noticePeriodDays || 30,
          houseRules: input.houseRules || [],
          foodIncluded:
            input.foodOffering === FoodOffering.NO_FOOD
              ? false
              : (input.foodIncluded ?? false),
          foodOffering: input.foodOffering || FoodOffering.NO_FOOD,
          startingPrice,
        },
      });

      // 2. Attach Amenities
      if (input.amenityIds && input.amenityIds.length > 0) {
        await tx.propertyAmenity.createMany({
          data: input.amenityIds.map((amenityId) => ({
            propertyId: newProperty.id,
            amenityId,
          })),
          skipDuplicates: true,
        });
      }

      // 3. Create RoomTypes and generate Room Inventory
      for (const rt of input.roomTypes) {
        const roomType = await tx.roomType.create({
          data: {
            propertyId: newProperty.id,
            name: rt.name.trim(),
            occupancy: rt.occupancy,
            monthlyRent: rt.monthlyRent,
            securityDeposit: rt.securityDeposit,
            maintenanceCharges: rt.maintenanceCharges || 0,
            foodCharges: rt.foodCharges || 0,
            hasAttachedBathroom: rt.hasAttachedBathroom ?? false,
            hasBalcony: rt.hasBalcony ?? false,
            hasAirConditioning: rt.hasAirConditioning ?? false,
            genderRestriction: rt.genderRestriction || input.genderPolicy || GenderPolicy.UNISEX,
          },
        });

        // Auto-provision initial rooms (e.g., 101, 102, 103...)
        if (rt.initialRoomsCount > 0) {
          const startNum = rt.startRoomNumber || 101;
          const roomsToCreate = [];
          for (let i = 0; i < rt.initialRoomsCount; i++) {
            roomsToCreate.push({
              roomTypeId: roomType.id,
              roomNumber: `${startNum + i}`,
              floor: rt.floor ?? Math.floor(startNum / 100),
              occupiedBeds: 0,
              status: RoomOperationalStatus.AVAILABLE,
            });
          }

          await tx.room.createMany({
            data: roomsToCreate,
          });
        }
      }

      return newProperty;
    });

    revalidatePath("/owner/properties");
    revalidatePath(`/owner/properties/${property.id}/rooms`);

    return {
      success: true,
      propertyId: property.id,
      slug: property.slug,
    };
  } catch (error: unknown) {
    console.error("createPropertyAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create property.",
    };
  }
}

/**
 * Returns all properties owned by current authenticated owner with occupancy statistics.
 */
export async function getOwnerPropertiesAction() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, properties: [], error: "Unauthorized" };

    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!ownerProfile) {
      return { success: true, properties: [], hasOwnerProfile: false };
    }

    const properties = await prisma.property.findMany({
      where: {
        ownerId: ownerProfile.id,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        },
        roomTypes: {
          include: {
            rooms: true,
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute aggregated metrics for each property
    const enrichedProperties = properties.map((prop) => {
      let totalRooms = 0;
      let totalNominalCapacity = 0;
      let totalOccupiedBeds = 0;

      prop.roomTypes.forEach((rt) => {
        totalRooms += rt.rooms.length;
        rt.rooms.forEach((room) => {
          if (room.status !== RoomOperationalStatus.INACTIVE) {
            totalNominalCapacity += rt.occupancy;
            totalOccupiedBeds += room.occupiedBeds;
          }
        });
      });

      const totalVacantBeds = Math.max(0, totalNominalCapacity - totalOccupiedBeds);
      const occupancyRate =
        totalNominalCapacity > 0
          ? Math.round((totalOccupiedBeds / totalNominalCapacity) * 100)
          : 0;

      const reviewCount = prop.reviews?.length || 0;
      const averageRating =
        reviewCount > 0
          ? Math.round(
              (prop.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
            ) / 10
          : null;

      return {
        ...prop,
        totalRooms,
        totalNominalCapacity,
        totalOccupiedBeds,
        totalVacantBeds,
        occupancyRate,
        averageRating,
        reviewCount,
      };
    });

    return {
      success: true,
      hasOwnerProfile: true,
      ownerProfile,
      properties: enrichedProperties,
    };
  } catch (error: unknown) {
    console.error("getOwnerPropertiesAction error:", error);
    return {
      success: false,
      properties: [],
      error: error instanceof Error ? error.message : "Failed to load properties.",
    };
  }
}

/**
 * Retrieves a single property with complete RoomType and Room inventory breakdown.
 * Guarantees server-side ownership authorization.
 */
export async function getPropertyInventoryAction(propertyId: string) {
  try {
    const { ownerProfile } = await requireOwnerContext();

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: ownerProfile.id,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        },
        roomTypes: {
          include: {
            rooms: {
              orderBy: { roomNumber: "asc" },
            },
            amenities: {
              include: { amenity: true },
            },
          },
          orderBy: { monthlyRent: "asc" },
        },
        amenities: {
          include: { amenity: true },
        },
      },
    });

    if (!property) {
      return { success: false, error: "Property not found or unauthorized access." };
    }

    // Calculate aggregated inventory stats
    let totalRooms = 0;
    let totalNominalCapacity = 0;
    let totalOccupiedBeds = 0;
    let availableRoomsCount = 0;

    property.roomTypes.forEach((rt) => {
      totalRooms += rt.rooms.length;
      rt.rooms.forEach((room) => {
        if (room.status !== RoomOperationalStatus.INACTIVE) {
          totalNominalCapacity += rt.occupancy;
          totalOccupiedBeds += room.occupiedBeds;
          if (room.status === RoomOperationalStatus.AVAILABLE && room.occupiedBeds < rt.occupancy) {
            availableRoomsCount++;
          }
        }
      });
    });

    const totalVacantBeds = Math.max(0, totalNominalCapacity - totalOccupiedBeds);

    return {
      success: true,
      property,
      stats: {
        totalRooms,
        availableRoomsCount,
        totalNominalCapacity,
        totalOccupiedBeds,
        totalVacantBeds,
        occupancyRate:
          totalNominalCapacity > 0
            ? Math.round((totalOccupiedBeds / totalNominalCapacity) * 100)
            : 0,
      },
    };
  } catch (error: unknown) {
    console.error("getPropertyInventoryAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch property inventory.",
    };
  }
}

/**
 * Updates an individual Room's occupancy, operational status, or notes.
 * Enforces server-side authorization: verifies room belongs to property owned by user.
 */
export async function updateRoomInventoryAction(
  roomId: string,
  data: {
    occupiedBeds?: number;
    status?: RoomOperationalStatus;
    notes?: string;
  }
) {
  try {
    const { ownerProfile } = await requireOwnerContext();

    // Verify room belongs to this owner
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!existingRoom || existingRoom.roomType.property.ownerId !== ownerProfile.id) {
      return { success: false, error: "Room not found or unauthorized." };
    }

    const maxCapacity = existingRoom.roomType.occupancy;

    // Validate occupiedBeds range
    let newOccupiedBeds = existingRoom.occupiedBeds;
    if (typeof data.occupiedBeds === "number") {
      if (data.occupiedBeds < 0 || data.occupiedBeds > maxCapacity) {
        return {
          success: false,
          error: `Occupied beds must be between 0 and maximum capacity (${maxCapacity}).`,
        };
      }
      newOccupiedBeds = data.occupiedBeds;
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        occupiedBeds: newOccupiedBeds,
        status: data.status !== undefined ? data.status : existingRoom.status,
        notes: data.notes !== undefined ? data.notes : existingRoom.notes,
      },
    });

    const propId = existingRoom.roomType.propertyId;
    const slug = existingRoom.roomType.property.slug;

    revalidatePath(`/owner/properties/${propId}/rooms`);
    revalidatePath(`/owner/properties/${propId}`);
    revalidatePath(`/owner/properties/${propId}/room-types`);
    revalidatePath("/owner/properties");
    revalidatePath("/owner/rooms");
    revalidatePath("/owner");
    if (slug) revalidatePath(`/property/${slug}`);
    revalidatePath("/");

    return { success: true, room: updatedRoom };
  } catch (error: unknown) {
    console.error("updateRoomInventoryAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update room inventory.",
    };
  }
}

/**
 * Adds an individual room to an existing RoomType.
 */
export async function addSingleRoomAction(
  roomTypeId: string,
  data: {
    roomNumber: string;
    floor?: number;
    notes?: string;
  }
) {
  try {
    const { ownerProfile } = await requireOwnerContext();

    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { property: true },
    });

    if (!roomType || roomType.property.ownerId !== ownerProfile.id) {
      return { success: false, error: "Room type not found or unauthorized." };
    }

    const cleanRoomNum = data.roomNumber.trim();
    if (!cleanRoomNum) {
      return { success: false, error: "Room number is required." };
    }

    // Check duplicate roomNumber in this room type
    const duplicate = await prisma.room.findUnique({
      where: {
        roomTypeId_roomNumber: {
          roomTypeId,
          roomNumber: cleanRoomNum,
        },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: `Room number "${cleanRoomNum}" already exists for this room type.`,
      };
    }

    const newRoom = await prisma.room.create({
      data: {
        roomTypeId,
        roomNumber: cleanRoomNum,
        floor: data.floor !== undefined ? data.floor : Math.floor(parseInt(cleanRoomNum, 10) / 100) || 1,
        occupiedBeds: 0,
        status: RoomOperationalStatus.AVAILABLE,
        notes: data.notes?.trim() || null,
      },
    });

    const propId = roomType.propertyId;
    const slug = roomType.property.slug;

    revalidatePath(`/owner/properties/${propId}/rooms`);
    revalidatePath(`/owner/properties/${propId}`);
    revalidatePath(`/owner/properties/${propId}/room-types`);
    revalidatePath("/owner/properties");
    revalidatePath("/owner/rooms");
    revalidatePath("/owner");
    if (slug) revalidatePath(`/property/${slug}`);
    revalidatePath("/");

    return { success: true, room: newRoom };
  } catch (error: unknown) {
    console.error("addSingleRoomAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add room.",
    };
  }
}

/**
 * Adds a new RoomType and optionally batch-generates rooms.
 */
export async function addRoomTypeWithInventoryAction(
  propertyId: string,
  data: {
    name: string;
    occupancy: number;
    monthlyRent: number;
    securityDeposit: number;
    maintenanceCharges?: number;
    foodCharges?: number;
    hasAttachedBathroom?: boolean;
    hasBalcony?: boolean;
    hasAirConditioning?: boolean;
    genderRestriction?: GenderPolicy;
    initialRoomsCount?: number;
    startRoomNumber?: number;
    floor?: number;
  }
) {
  try {
    const { ownerProfile } = await requireOwnerContext();

    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: ownerProfile.id },
    });

    if (!property) {
      return { success: false, error: "Property not found or unauthorized." };
    }

    const cleanName = data.name.trim();
    if (!cleanName) {
      return { success: false, error: "Room type name is required (e.g. 2-Seater AC)." };
    }
    if (data.occupancy < 1) {
      return { success: false, error: "Occupancy capacity must be at least 1." };
    }
    if (data.monthlyRent <= 0) {
      return { success: false, error: "Monthly rent must be greater than ₹0." };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create RoomType
      const newRoomType = await tx.roomType.create({
        data: {
          propertyId,
          name: cleanName,
          occupancy: data.occupancy,
          monthlyRent: data.monthlyRent,
          securityDeposit: data.securityDeposit || 0,
          maintenanceCharges: data.maintenanceCharges || 0,
          foodCharges: data.foodCharges || 0,
          hasAttachedBathroom: data.hasAttachedBathroom ?? false,
          hasBalcony: data.hasBalcony ?? false,
          hasAirConditioning: data.hasAirConditioning ?? false,
          genderRestriction: data.genderRestriction || property.genderPolicy,
        },
      });

      // 2. Batch generate rooms if specified
      if (data.initialRoomsCount && data.initialRoomsCount > 0) {
        const startNum = data.startRoomNumber || 101;
        const rooms = [];
        for (let i = 0; i < data.initialRoomsCount; i++) {
          rooms.push({
            roomTypeId: newRoomType.id,
            roomNumber: `${startNum + i}`,
            floor: data.floor ?? (Math.floor(startNum / 100) || 1),
            occupiedBeds: 0,
            status: RoomOperationalStatus.AVAILABLE,
          });
        }
        await tx.room.createMany({ data: rooms });
      }

      // 3. Recalculate property startingPrice
      const allActiveTypes = await tx.roomType.findMany({
        where: { propertyId, isActive: true },
        select: { monthlyRent: true },
      });
      const lowestRent = Math.min(...allActiveTypes.map((t) => t.monthlyRent));

      await tx.property.update({
        where: { id: propertyId },
        data: { startingPrice: lowestRent },
      });

      return newRoomType;
    });

    const slug = property.slug;

    revalidatePath(`/owner/properties/${propertyId}/rooms`);
    revalidatePath(`/owner/properties/${propertyId}`);
    revalidatePath(`/owner/properties/${propertyId}/room-types`);
    revalidatePath("/owner/properties");
    revalidatePath("/owner/rooms");
    revalidatePath("/owner");
    if (slug) revalidatePath(`/property/${slug}`);
    revalidatePath("/");

    return { success: true, roomType: result };
  } catch (error: unknown) {
    console.error("addRoomTypeWithInventoryAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add room type.",
    };
  }
}

/**
 * Toggles a property's status (e.g., between DRAFT and PUBLISHED).
 */
export async function togglePropertyStatusAction(
  propertyId: string,
  newStatus: PropertyStatus
) {
  try {
    const { ownerProfile } = await requireOwnerContext();

    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: ownerProfile.id },
    });

    if (!property) {
      return { success: false, error: "Property not found or unauthorized." };
    }

    if (newStatus === PropertyStatus.PUBLISHED) {
      const entitlement = await getOwnerPublishingEntitlement(ownerProfile.id, propertyId);
      if (!entitlement.canPublish) {
        return {
          success: false,
          error: entitlement.reason || "Your subscription property limit has been reached. Please upgrade to publish this property.",
          limitReached: true,
          entitlement,
        };
      }
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: { status: newStatus },
    });

    revalidatePath(`/owner/properties/${propertyId}/rooms`);
    revalidatePath(`/owner/properties/${propertyId}`);
    revalidatePath(`/owner/properties/${propertyId}/room-types`);
    revalidatePath("/owner/properties");
    revalidatePath("/owner/rooms");
    revalidatePath("/owner");
    if (property.slug) revalidatePath(`/property/${property.slug}`);
    revalidatePath("/");

    return { success: true, status: updated.status };
  } catch (error: unknown) {
    console.error("togglePropertyStatusAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle status.",
    };
  }
}

/**
 * Deletes an individual room.
 */
export async function deleteRoomAction(roomId: string) {
  try {
    const { ownerProfile } = await requireOwnerContext();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: {
          include: { property: true },
        },
      },
    });

    if (!room || room.roomType.property.ownerId !== ownerProfile.id) {
      return { success: false, error: "Room not found or unauthorized." };
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    const propId = room.roomType.propertyId;
    const slug = room.roomType.property.slug;

    revalidatePath(`/owner/properties/${propId}/rooms`);
    revalidatePath(`/owner/properties/${propId}`);
    revalidatePath(`/owner/properties/${propId}/room-types`);
    revalidatePath("/owner/properties");
    revalidatePath("/owner/rooms");
    revalidatePath("/owner");
    if (slug) revalidatePath(`/property/${slug}`);
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    console.error("deleteRoomAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete room.",
    };
  }
}

/**
 * Returns top-level aggregated statistics and recent activity for the Owner Dashboard.
 */
export async function getOwnerDashboardMetricsAction() {
  try {
    const { ownerProfile } = await requireOwnerContext();

    const properties = await prisma.property.findMany({
      where: { ownerId: ownerProfile.id, deletedAt: null },
      include: {
        images: { where: { isCover: true }, take: 1 },
        roomTypes: {
          where: { isActive: true },
          include: {
            rooms: {
              select: { status: true, occupiedBeds: true },
            },
          },
        },
        enquiries: {
          where: { status: "NEW" },
          select: { id: true },
        },
        roommateRequests: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalNominalCapacity = 0;
    let totalOccupiedBeds = 0;
    let pendingEnquiriesCount = 0;
    let activeRoommateRequestsCount = 0;
    let totalAllReviews = 0;
    let sumAllRatings = 0;

    const propertySummaries = properties.map((p) => {
      let propTotalBeds = 0;
      let propOccupiedBeds = 0;

      p.roomTypes.forEach((rt) => {
        rt.rooms.forEach((r) => {
          if (r.status !== RoomOperationalStatus.INACTIVE) {
            propTotalBeds += rt.occupancy;
            propOccupiedBeds += r.occupiedBeds;
          }
        });
      });

      totalNominalCapacity += propTotalBeds;
      totalOccupiedBeds += propOccupiedBeds;
      pendingEnquiriesCount += p.enquiries.length;
      activeRoommateRequestsCount += p.roommateRequests.length;

      const propReviews = p.reviews || [];
      const reviewCount = propReviews.length;
      const averageRating =
        reviewCount > 0
          ? Math.round(
              (propReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
            ) / 10
          : null;

      totalAllReviews += reviewCount;
      sumAllRatings += propReviews.reduce((sum, r) => sum + r.rating, 0);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        locality: p.locality,
        city: p.city,
        status: p.status,
        coverImage: p.images[0]?.url || null,
        roomTypesCount: p.roomTypes.length,
        totalBeds: propTotalBeds,
        availableBeds: Math.max(0, propTotalBeds - propOccupiedBeds),
        pendingEnquiriesCount: p.enquiries.length,
        activeRoommatesCount: p.roommateRequests.length,
        averageRating,
        reviewCount,
      };
    });

    const portfolioAverageRating =
      totalAllReviews > 0 ? Math.round((sumAllRatings / totalAllReviews) * 10) / 10 : null;

    const [recentEnquiries, recentReviews] = await Promise.all([
      prisma.pGEnquiry.findMany({
        where: {
          property: { ownerId: ownerProfile.id, deletedAt: null },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          property: { select: { id: true, name: true, slug: true } },
          roomType: { select: { id: true, name: true } },
        },
      }),
      prisma.review.findMany({
        where: {
          property: { ownerId: ownerProfile.id, deletedAt: null },
          status: "APPROVED",
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          property: { select: { id: true, name: true, slug: true } },
          user: {
            include: {
              profile: {
                select: { fullName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalProperties: properties.length,
        activeProperties: properties.filter((p) => p.status === PropertyStatus.PUBLISHED).length,
        totalBeds: totalNominalCapacity,
        occupiedBeds: totalOccupiedBeds,
        availableBeds: Math.max(0, totalNominalCapacity - totalOccupiedBeds),
        pendingEnquiriesCount,
        activeRoommateRequestsCount,
        averageRating: portfolioAverageRating,
        totalReviews: totalAllReviews,
        properties: propertySummaries,
        recentEnquiries,
        recentReviews: recentReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          cleanliness: r.cleanliness,
          foodQuality: r.foodQuality,
          safety: r.safety,
          createdAt: r.createdAt.toISOString(),
          property: r.property,
          userName: r.user.profile?.fullName || "Verified Resident",
          userAvatar: r.user.profile?.avatarUrl || null,
        })),
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerDashboardMetricsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load owner dashboard.",
    };
  }
}

/**
 * Returns active States, Cities, and Localities from the database for the property creation flow.
 */
export async function getOwnerLocationOptionsAction() {
  try {
    const states = await prisma.state.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        cities: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            localities: {
              where: { isActive: true },
              orderBy: { name: "asc" },
            },
          },
        },
      },
    });

    return { success: true, states };
  } catch (error: unknown) {
    console.error("getOwnerLocationOptionsAction error:", error);
    return { success: false, states: [], error: "Failed to load master locations." };
  }
}

/**
 * Submits a new locality request to the administrator.
 */
export async function requestOwnerLocalityAction(input: {
  stateName: string;
  cityName: string;
  localityName: string;
  notes?: string;
}) {
  try {
    const { user } = await requireOwnerContext();

    if (!input.stateName?.trim() || !input.cityName?.trim() || !input.localityName?.trim()) {
      return { success: false, error: "State, city, and locality names are required." };
    }

    const created = await prisma.localityRequest.create({
      data: {
        stateName: input.stateName.trim(),
        cityName: input.cityName.trim(),
        localityName: input.localityName.trim(),
        notes: input.notes?.trim() || null,
        requestedById: user.id,
        status: "PENDING",
      },
    });

    return { success: true, request: created };
  } catch (error: unknown) {
    console.error("requestOwnerLocalityAction error:", error);
    return { success: false, error: "Failed to submit locality request." };
  }
}

/**
 * Fetches paginated enquiries for properties owned by this owner.
 */
export async function getOwnerEnquiriesAction(params: {
  propertyId?: string;
  status?: EnquiryStatus | "ALL";
  page?: number;
  limit?: number;
}) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {
      property: { ownerId: ownerProfile.id, deletedAt: null },
    };

    if (params.propertyId && params.propertyId !== "ALL") {
      where.propertyId = params.propertyId;
    }
    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    const [total, enquiries] = await Promise.all([
      prisma.pGEnquiry.count({ where }),
      prisma.pGEnquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: { select: { id: true, name: true, slug: true, locality: true, city: true } },
          roomType: { select: { id: true, name: true, monthlyRent: true } },
          user: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        enquiries,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerEnquiriesAction error:", error);
    return { success: false, error: "Failed to load enquiries." };
  }
}

/**
 * Updates status of an enquiry for an owner's property.
 */
export async function updateOwnerEnquiryStatusAction(input: {
  enquiryId: string;
  status: EnquiryStatus;
}) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const existing = await prisma.pGEnquiry.findFirst({
      where: {
        id: input.enquiryId,
        property: { ownerId: ownerProfile.id },
      },
    });

    if (!existing) {
      return { success: false, error: "Enquiry not found or unauthorized." };
    }

    const updated = await prisma.pGEnquiry.update({
      where: { id: input.enquiryId },
      data: { status: input.status },
    });

    revalidatePath("/owner/enquiries");
    revalidatePath("/owner");
    return { success: true, enquiry: updated };
  } catch (error: unknown) {
    console.error("updateOwnerEnquiryStatusAction error:", error);
    return { success: false, error: "Failed to update enquiry status." };
  }
}

/**
 * Fetches paginated roommate requests for owner's properties.
 */
export async function getOwnerRoommateRequestsAction(params: {
  propertyId?: string;
  status?: RoommateRequestStatus | "ALL";
  page?: number;
  limit?: number;
}) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {
      property: { ownerId: ownerProfile.id, deletedAt: null },
    };

    if (params.propertyId && params.propertyId !== "ALL") {
      where.propertyId = params.propertyId;
    }
    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    const [total, requests] = await Promise.all([
      prisma.roommateRequest.count({ where }),
      prisma.roommateRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: { select: { id: true, name: true, slug: true, locality: true, city: true } },
          roomType: {
            select: {
              id: true,
              name: true,
              occupancy: true,
              rooms: { select: { id: true, occupiedBeds: true, status: true } },
            },
          },
          creator: { select: { id: true, email: true, profile: true } },
          preferences: true,
          interests: { take: 5 },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerRoommateRequestsAction error:", error);
    return { success: false, error: "Failed to load roommate requests." };
  }
}

/**
 * Deactivates or closes a roommate request under the owner's property.
 */
export async function updateOwnerRoommateRequestStatusAction(input: {
  requestId: string;
  status: RoommateRequestStatus;
}) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const existing = await prisma.roommateRequest.findFirst({
      where: {
        id: input.requestId,
        property: { ownerId: ownerProfile.id },
      },
    });

    if (!existing) {
      return { success: false, error: "Roommate request not found or unauthorized." };
    }

    const updated = await prisma.roommateRequest.update({
      where: { id: input.requestId },
      data: { status: input.status },
    });

    revalidatePath("/owner/roommate-requests");
    revalidatePath("/owner");
    return { success: true, request: updated };
  } catch (error: unknown) {
    console.error("updateOwnerRoommateRequestStatusAction error:", error);
    return { success: false, error: "Failed to update roommate request status." };
  }
}

/**
 * Returns owner subscription status, active membership, and all available plans from DB.
 */
export async function getOwnerSubscriptionAction() {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const [activeSubscription, plans, history] = await Promise.all([
      prisma.ownerSubscription.findFirst({
        where: { ownerId: ownerProfile.id, status: "ACTIVE" },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { priceInr: "asc" },
      }),
      prisma.ownerSubscription.findMany({
        where: { ownerId: ownerProfile.id },
        include: { plan: true, payments: { take: 1, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      success: true,
      data: {
        activeSubscription,
        plans,
        history,
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerSubscriptionAction error:", error);
    return { success: false, error: "Failed to load subscription information." };
  }
}

/**
 * Returns payments ledger for the authenticated owner.
 */
export async function getOwnerPaymentsAction(params: { page?: number; limit?: number }) {
  try {
    const { ownerProfile, user } = await requireOwnerContext();
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { userId: user.id },
        { ownerSubscription: { ownerId: ownerProfile.id } },
        { featuredListing: { property: { ownerId: ownerProfile.id } } },
      ],
    };

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          ownerSubscription: { include: { plan: true } },
          featuredListing: { include: { pricingPlan: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        payments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerPaymentsAction error:", error);
    return { success: false, error: "Failed to load payments history." };
  }
}

/**
 * Returns featured promotional campaigns for owner's properties.
 */
export async function getOwnerFeaturedListingsAction() {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const now = new Date();

    const [propertyBoosts, legacyFeatured, pricingConfig, properties] = await Promise.all([
      prisma.propertyBoost.findMany({
        where: { ownerId: ownerProfile.id },
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: { id: true, name: true, slug: true, city: true, locality: true },
          },
        },
      }),
      prisma.featuredListing.findMany({
        where: { property: { ownerId: ownerProfile.id } },
        orderBy: { createdAt: "desc" },
        include: {
          pricingPlan: true,
          property: { select: { id: true, name: true, slug: true, city: true, locality: true } },
          roomType: { select: { id: true, name: true } },
        },
      }),
      getEffectivePricingConfig(),
      prisma.property.findMany({
        where: { ownerId: ownerProfile.id, deletedAt: null },
        select: { id: true, name: true, slug: true, locality: true, city: true, status: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Map modern PropertyBoost records
    const mappedBoosts = propertyBoosts.map((b) => {
      const isExpired = b.endDate && new Date(b.endDate) < now;
      const effectiveStatus =
        b.status === "ACTIVE" && isExpired ? "EXPIRED" : b.status;
      const boostConfig = pricingConfig.boosts[b.boostType];

      return {
        id: b.id,
        isBoost: true,
        boostType: b.boostType,
        status: effectiveStatus,
        startDate: b.startDate || b.createdAt,
        endDate: b.endDate || new Date(b.createdAt.getTime() + b.durationDays * 24 * 60 * 60 * 1000),
        property: b.property,
        pricingPlan: {
          name: boostConfig?.name || `${b.durationDays}-Day Visibility Boost`,
          priceInr: b.amountInr,
          durationDays: b.durationDays,
        },
      };
    });

    // Map any legacy FeaturedListing records
    const mappedLegacy = legacyFeatured.map((item) => ({
      id: item.id,
      isBoost: false,
      boostType: "SEVEN_DAYS",
      status: item.status,
      startDate: item.startDate,
      endDate: item.endDate,
      property: item.property,
      pricingPlan: {
        name: item.pricingPlan.name,
        priceInr: item.pricingPlan.priceInr,
        durationDays: item.pricingPlan.durationDays,
      },
    }));

    return {
      success: true,
      data: {
        featuredListings: [...mappedBoosts, ...mappedLegacy],
        pricingConfig,
        properties,
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerFeaturedListingsAction error:", error);
    return { success: false, error: "Failed to load featured listings." };
  }
}

/**
 * Updates owner profile information (contact, business name) without ID verification requirement.
 */
export async function updateOwnerProfileAction(input: {
  fullName?: string;
  businessName?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  altPhone?: string;
}) {
  try {
    const { ownerProfile, user } = await requireOwnerContext();

    if (input.fullName && input.fullName.trim()) {
      await prisma.profile.upsert({
        where: { userId: user.id },
        update: { fullName: input.fullName.trim() },
        create: { userId: user.id, fullName: input.fullName.trim() },
      });
    }

    const updated = await prisma.ownerProfile.update({
      where: { id: ownerProfile.id },
      data: {
        businessName: input.businessName?.trim() || null,
        contactPhone: input.contactPhone?.trim() || ownerProfile.contactPhone,
        whatsappNumber: input.whatsappNumber?.trim() || null,
        altPhone: input.altPhone?.trim() || null,
      },
    });

    const newPhone = input.contactPhone?.trim() || ownerProfile.contactPhone;
    const newWhatsapp = input.whatsappNumber?.trim() || newPhone;

    if (newPhone && newPhone !== "Not provided") {
      await prisma.property.updateMany({
        where: {
          ownerId: ownerProfile.id,
          OR: [
            { contactPhone: "Not provided" },
            { contactPhone: "" },
          ],
        },
        data: { contactPhone: newPhone },
      });
    }

    if (newWhatsapp && newWhatsapp !== "Not provided") {
      await prisma.property.updateMany({
        where: {
          ownerId: ownerProfile.id,
          OR: [
            { whatsappNumber: "Not provided" },
            { whatsappNumber: "" },
            { whatsappNumber: null },
          ],
        },
        data: { whatsappNumber: newWhatsapp },
      });
    }

    revalidatePath("/owner/profile");
    revalidatePath("/owner");
    revalidatePath("/owner/properties");
    return { success: true, ownerProfile: updated };
  } catch (error: unknown) {
    console.error("updateOwnerProfileAction error:", error);
    return { success: false, error: "Failed to update profile." };
  }
}

/**
 * Returns a single property with complete RoomType, Room, Image, and Amenity breakdown for owner view.
 */
export async function getOwnerPropertyDetailAction(propertyId: string) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: ownerProfile.id, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        roomTypes: {
          include: {
            rooms: { orderBy: { roomNumber: "asc" } },
            amenities: { include: { amenity: true } },
            images: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { monthlyRent: "asc" },
        },
        amenities: { include: { amenity: true } },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        _count: {
          select: {
            enquiries: true,
            roommateRequests: true,
            reviews: { where: { status: "APPROVED" } },
          },
        },
      },
    });

    if (!property) {
      return { success: false, error: "Property not found or unauthorized access." };
    }

    const reviews = property.reviews || [];
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
        : null;

    const cleanlinessScores = reviews
      .map((r) => r.cleanliness)
      .filter((s): s is number => typeof s === "number");
    const safetyScores = reviews
      .map((r) => r.safety)
      .filter((s): s is number => typeof s === "number");
    const foodScores = reviews
      .map((r) => r.foodQuality)
      .filter((s): s is number => typeof s === "number");

    const avgCleanliness =
      cleanlinessScores.length > 0
        ? Math.round(
            (cleanlinessScores.reduce((a, b) => a + b, 0) / cleanlinessScores.length) * 10
          ) / 10
        : null;
    const avgSafety =
      safetyScores.length > 0
        ? Math.round((safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length) * 10) / 10
        : null;
    const avgFood =
      foodScores.length > 0
        ? Math.round((foodScores.reduce((a, b) => a + b, 0) / foodScores.length) * 10) / 10
        : null;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    const serializedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      cleanliness: r.cleanliness,
      foodQuality: r.foodQuality,
      safety: r.safety,
      createdAt: r.createdAt.toISOString(),
      user: {
        fullName: r.user.profile?.fullName || "Verified Resident",
        avatarUrl: r.user.profile?.avatarUrl || null,
      },
    }));

    return {
      success: true,
      property: {
        ...property,
        averageRating,
        reviewCount,
        avgCleanliness,
        avgSafety,
        avgFood,
        ratingDistribution,
        reviews: serializedReviews,
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerPropertyDetailAction error:", error);
    return { success: false, error: "Failed to load property details." };
  }
}

/**
 * Soft deletes an owner's property (marks INACTIVE and sets deletedAt).
 */
export async function deleteOwnerPropertyAction(propertyId: string) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: ownerProfile.id },
    });

    if (!existing) {
      return { success: false, error: "Property not found or unauthorized." };
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: { deletedAt: new Date(), status: PropertyStatus.INACTIVE },
    });

    revalidatePath("/owner/properties");
    revalidatePath("/owner");
    return { success: true };
  } catch (error: unknown) {
    console.error("deleteOwnerPropertyAction error:", error);
    return { success: false, error: "Failed to deactivate property." };
  }
}

/**
 * Updates a RoomType for a property owned by caller.
 */
export async function updateOwnerRoomTypeAction(
  roomTypeId: string,
  input: {
    name?: string;
    monthlyRent?: number;
    securityDeposit?: number;
    maintenanceCharges?: number;
    foodCharges?: number;
    hasAttachedBathroom?: boolean;
    hasBalcony?: boolean;
    hasAirConditioning?: boolean;
    genderRestriction?: GenderPolicy;
    isActive?: boolean;
  }
) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const rt = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { property: true },
    });

    if (!rt || rt.property.ownerId !== ownerProfile.id) {
      return { success: false, error: "Room type not found or unauthorized." };
    }

    const updated = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: {
        name: input.name?.trim(),
        monthlyRent: input.monthlyRent,
        securityDeposit: input.securityDeposit,
        maintenanceCharges: input.maintenanceCharges,
        foodCharges: input.foodCharges,
        hasAttachedBathroom: input.hasAttachedBathroom,
        hasBalcony: input.hasBalcony,
        hasAirConditioning: input.hasAirConditioning,
        genderRestriction: input.genderRestriction,
        isActive: input.isActive,
      },
    });

    if (input.monthlyRent) {
      const allActive = await prisma.roomType.findMany({
        where: { propertyId: rt.propertyId, isActive: true },
        select: { monthlyRent: true },
      });
      if (allActive.length > 0) {
        const minRent = Math.min(...allActive.map((t) => t.monthlyRent));
        await prisma.property.update({
          where: { id: rt.propertyId },
          data: { startingPrice: minRent },
        });
      }
    }

    revalidatePath(`/owner/properties/${rt.propertyId}/room-types`);
    revalidatePath(`/owner/properties/${rt.propertyId}/rooms`);
    revalidatePath(`/owner/properties/${rt.propertyId}`);
    revalidatePath("/owner/properties");
    revalidatePath("/owner/rooms");
    revalidatePath("/owner");
    if (rt.property?.slug) revalidatePath(`/property/${rt.property.slug}`);
    revalidatePath("/");
    return { success: true, roomType: updated };
  } catch (error: unknown) {
    console.error("updateOwnerRoomTypeAction error:", error);
    return { success: false, error: "Failed to update room type." };
  }
}

/**
 * Deletes a RoomType if no rooms have occupied beds.
 */
export async function deleteOwnerRoomTypeAction(roomTypeId: string) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const rt = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { property: true, rooms: true },
    });

    if (!rt || rt.property.ownerId !== ownerProfile.id) {
      return { success: false, error: "Room type not found or unauthorized." };
    }

    const occupied = rt.rooms.some((r) => r.occupiedBeds > 0);
    if (occupied) {
      return {
        success: false,
        error: "Cannot delete room type with occupied beds. Please reassign occupants first.",
      };
    }

    await prisma.roomType.delete({ where: { id: roomTypeId } });

    const remainingActive = await prisma.roomType.findMany({
      where: { propertyId: rt.propertyId, isActive: true },
      select: { monthlyRent: true },
    });
    const newStartingPrice =
      remainingActive.length > 0 ? Math.min(...remainingActive.map((t) => t.monthlyRent)) : null;

    await prisma.property.update({
      where: { id: rt.propertyId },
      data: { startingPrice: newStartingPrice },
    });

    revalidatePath(`/owner/properties/${rt.propertyId}/room-types`);
    revalidatePath(`/owner/properties/${rt.propertyId}/rooms`);
    revalidatePath(`/owner/properties/${rt.propertyId}`);
    revalidatePath("/owner/properties");
    revalidatePath("/owner/rooms");
    revalidatePath("/owner");
    if (rt.property?.slug) revalidatePath(`/property/${rt.property.slug}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("deleteOwnerRoomTypeAction error:", error);
    return { success: false, error: "Failed to delete room type." };
  }
}

/**
 * Returns conversations involving owner's properties or where owner is participant.
 */
export async function getOwnerConversationsAction() {
  try {
    const { user, ownerProfile } = await requireOwnerContext();

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participants: { some: { userId: user.id } } },
          { roommateRequest: { property: { ownerId: ownerProfile.id } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        roommateRequest: {
          include: {
            property: { select: { id: true, name: true, locality: true, city: true } },
            roomType: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, conversations };
  } catch (error: unknown) {
    console.error("getOwnerConversationsAction error:", error);
    return { success: false, conversations: [], error: "Failed to load conversations." };
  }
}

/**
 * Updates an owner's property details (rules, contact, food, description, basic info).
 */
export async function updateOwnerPropertyAction(
  propertyId: string,
  input: {
    name?: string;
    description?: string;
    propertyType?: PropertyType;
    genderPolicy?: GenderPolicy;
    startingPrice?: number | null;
    locality?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    addressLine1?: string;
    addressLine2?: string;
    contactPhone?: string;
    whatsappNumber?: string;
    gateClosingTime?: string;
    noticePeriodDays?: number;
    houseRules?: string[];
    foodIncluded?: boolean;
    foodOffering?: FoodOffering;
    latitude?: number;
    longitude?: number;
  }
) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: ownerProfile.id },
    });

    if (!existing) {
      return { success: false, error: "Property not found or unauthorized." };
    }

    // Safely map genderPolicy to valid Prisma GenderPolicy enum
    let safeGenderPolicy: GenderPolicy | undefined = undefined;
    if (input.genderPolicy) {
      const g = String(input.genderPolicy).toUpperCase().trim();
      if (g === "BOYS" || g === "MALE" || g === "MALE_ONLY" || g === "GENTS") {
        safeGenderPolicy = GenderPolicy.BOYS;
      } else if (g === "GIRLS" || g === "FEMALE" || g === "FEMALE_ONLY" || g === "LADIES") {
        safeGenderPolicy = GenderPolicy.GIRLS;
      } else {
        safeGenderPolicy = GenderPolicy.UNISEX;
      }
    }

    // Safely map propertyType to valid Prisma PropertyType enum (FLAT -> APARTMENT)
    let safePropertyType: PropertyType | undefined = undefined;
    if (input.propertyType) {
      const pt = String(input.propertyType).toUpperCase().trim();
      if (pt === "FLAT" || pt === "APARTMENT") {
        safePropertyType = PropertyType.APARTMENT;
      } else if (pt === "COLIVING" || pt === "CO_LIVING" || pt === "CO-LIVING") {
        safePropertyType = PropertyType.COLIVING;
      } else if (pt === "HOSTEL") {
        safePropertyType = PropertyType.HOSTEL;
      } else {
        safePropertyType = PropertyType.PG;
      }
    }

    // Determine startingPrice: if property has active room types, the lowest rent is the source of truth
    const activeRoomTypes = await prisma.roomType.findMany({
      where: { propertyId, isActive: true },
      select: { monthlyRent: true },
    });

    let effectiveStartingPrice: number | null | undefined =
      input.startingPrice !== undefined
        ? input.startingPrice
          ? Number(input.startingPrice)
          : null
        : undefined;

    if (activeRoomTypes.length > 0) {
      effectiveStartingPrice = Math.min(...activeRoomTypes.map((t) => t.monthlyRent));
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        name: input.name?.trim(),
        description: input.description?.trim(),
        propertyType: safePropertyType,
        genderPolicy: safeGenderPolicy,
        startingPrice: effectiveStartingPrice,
        locality: input.locality?.trim(),
        city: input.city?.trim(),
        state: input.state?.trim(),
        postalCode: input.postalCode?.trim(),
        addressLine1: input.addressLine1?.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        contactPhone: input.contactPhone?.trim(),
        whatsappNumber: input.whatsappNumber?.trim() || null,
        gateClosingTime: input.gateClosingTime?.trim() || null,
        noticePeriodDays: input.noticePeriodDays,
        houseRules: input.houseRules,
        foodIncluded:
          input.foodOffering === FoodOffering.NO_FOOD
            ? false
            : input.foodIncluded,
        foodOffering: input.foodOffering,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });

    revalidatePath(`/owner/properties/${propertyId}`);
    revalidatePath(`/owner/properties/${propertyId}/edit`);
    revalidatePath(`/property/${updated.slug}`);
    revalidatePath("/owner/properties");
    revalidatePath("/");
    revalidatePath("/roommates");

    return { success: true, property: updated };
  } catch (error: unknown) {
    console.error("updateOwnerPropertyAction error:", error);
    return { success: false, error: "Failed to update property details." };
  }
}

/**
 * Updates property amenities with transactional sync.
 */
export async function updateOwnerPropertyAmenitiesAction(
  propertyId: string,
  amenityIds: string[]
) {
  try {
    const { ownerProfile } = await requireOwnerContext();
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: ownerProfile.id },
    });

    if (!property) {
      return { success: false, error: "Property not found or unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.propertyAmenity.deleteMany({
        where: { propertyId },
      });

      if (amenityIds.length > 0) {
        await tx.propertyAmenity.createMany({
          data: amenityIds.map((amenityId) => ({
            propertyId,
            amenityId,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidatePath(`/owner/properties/${propertyId}`);
    revalidatePath(`/owner/properties/${propertyId}/amenities`);
    revalidatePath(`/property/${property.slug}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("updateOwnerPropertyAmenitiesAction error:", error);
    return { success: false, error: "Failed to update amenities." };
  }
}

/**
 * Returns all reviews and ratings across all owner properties or for a specific property,
 * along with score breakdown and distribution metrics.
 */
export async function getOwnerReviewsAction(options?: { propertyId?: string }) {
  try {
    const { ownerProfile } = await requireOwnerContext();

    const whereClause: any = {
      property: {
        ownerId: ownerProfile.id,
        deletedAt: null,
      },
      status: "APPROVED",
    };

    if (options?.propertyId) {
      whereClause.propertyId = options.propertyId;
    }

    const [reviews, properties] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: { id: true, name: true, slug: true, locality: true, city: true },
          },
          user: {
            include: {
              profile: {
                select: { fullName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      prisma.property.findMany({
        where: { ownerId: ownerProfile.id, deletedAt: null },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : null;

    const cleanlinessScores = reviews
      .map((r) => r.cleanliness)
      .filter((s): s is number => typeof s === "number");
    const safetyScores = reviews
      .map((r) => r.safety)
      .filter((s): s is number => typeof s === "number");
    const foodScores = reviews
      .map((r) => r.foodQuality)
      .filter((s): s is number => typeof s === "number");

    const avgCleanliness =
      cleanlinessScores.length > 0
        ? Math.round(
            (cleanlinessScores.reduce((a, b) => a + b, 0) / cleanlinessScores.length) * 10
          ) / 10
        : null;
    const avgSafety =
      safetyScores.length > 0
        ? Math.round((safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length) * 10) / 10
        : null;
    const avgFood =
      foodScores.length > 0
        ? Math.round((foodScores.reduce((a, b) => a + b, 0) / foodScores.length) * 10) / 10
        : null;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          id: r.id,
          propertyId: r.propertyId,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          cleanliness: r.cleanliness,
          foodQuality: r.foodQuality,
          safety: r.safety,
          createdAt: r.createdAt.toISOString(),
          property: r.property,
          user: {
            fullName: r.user.profile?.fullName || "Verified Resident",
            avatarUrl: r.user.profile?.avatarUrl || null,
          },
        })),
        stats: {
          totalReviews,
          averageRating,
          avgCleanliness,
          avgSafety,
          avgFood,
          ratingDistribution,
        },
        properties,
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerReviewsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load property reviews.",
    };
  }
}

export interface ReportOwnerReviewInput {
  reviewId: string;
  reason: "ABUSIVE_LANGUAGE" | "FALSE_REVIEW" | "HARASSMENT" | "SPAM" | "OTHER";
  notes?: string;
}

/**
 * Allows property owners to dispute or report abusive/fake reviews.
 * The review is immediately quarantined (status set to PENDING) and logged to AuditLog for administrator review.
 */
export async function reportOwnerReviewAction(input: ReportOwnerReviewInput) {
  try {
    const { ownerProfile, user } = await requireOwnerContext();

    const review = await prisma.review.findUnique({
      where: { id: input.reviewId },
      include: {
        property: {
          select: { id: true, ownerId: true, name: true, slug: true },
        },
      },
    });

    if (!review || review.property.ownerId !== ownerProfile.id) {
      return { success: false, error: "Review not found or unauthorized access." };
    }

    // Quarantine the review by setting status to PENDING so it is removed from public view immediately
    await prisma.review.update({
      where: { id: input.reviewId },
      data: { status: "PENDING" },
    });

    // Record formal administrative audit log for the trust & safety team
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REVIEW_DISPUTED_BY_OWNER",
        targetType: "REVIEW",
        targetId: review.id,
        details: {
          reason: input.reason,
          notes: input.notes?.trim() || null,
          propertyId: review.propertyId,
          propertyName: review.property.name,
          reviewRating: review.rating,
          reviewComment: review.comment,
        },
      },
    });

    revalidatePath(`/property/${review.property.slug}`);
    revalidatePath(`/owner/properties/${review.propertyId}/reviews`);
    revalidatePath("/owner/reviews");
    revalidatePath("/admin/reviews");

    return {
      success: true,
      message:
        "The review has been reported and temporarily hidden from public view while our moderation team investigates.",
    };
  } catch (error: unknown) {
    console.error("reportOwnerReviewAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to report review.",
    };
  }
}

