"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import {
  GenderPolicy,
  DietaryPreference,
  SmokingPreference,
  DrinkingPreference,
  OccupationPreference,
  SleepSchedule,
  RoommateRequestStatus,
  RoommateInterestStatus,
} from "@/lib/prisma";

export interface CreateRoommateRequestInput {
  title?: string;
  description: string;
  propertyId?: string | null;
  roomTypeId?: string | null;
  propertyName?: string | null;
  roomTypeName?: string | null;
  locality?: string;
  city?: string;
  state?: string;
  rentPerPerson?: number;
  securityDeposit?: number;
  requiredRoommateCount?: number;
  currentOccupantsCount?: number;
  preferredGender?: GenderPolicy;
  minAge?: number | null;
  maxAge?: number | null;
  moveInDate: string; // ISO date string
  availabilityDescription?: string | null;
  isFurnished?: boolean;
  hasAttachedBathroom?: boolean;
  // Preferences
  dietary?: DietaryPreference;
  smoking?: SmokingPreference;
  drinking?: DrinkingPreference;
  occupation?: OccupationPreference;
  sleepSchedule?: SleepSchedule;
  petsAllowed?: boolean;
  customTags?: string[];
  // Images
  imageUrls?: { url: string; storageKey: string }[];
}

export interface RoommateActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new Roommate Request with associated preferences and optional images.
 * Server-side validates propertyId & roomTypeId and authoritatively derives rent, deposit,
 * address, features, and roommate count from the database.
 */
export async function createRoommateRequestAction(
  input: CreateRoommateRequestInput
): Promise<RoommateActionResult<{ requestId: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please sign in to post a roommate requirement." };
  }

  // Rate Limiting (max 10 requests per day per user)
  const rateLimit = checkRateLimit(`roommate_create:${user.id}`, 10, 86400000);
  if (!rateLimit.success) {
    return { success: false, error: "You have reached the maximum roommate post limit for today." };
  }

  const cleanDescription = sanitizeText(input.description || "", 2000);
  if (cleanDescription.length < 10) {
    return {
      success: false,
      error: "Please provide a brief 'About you' description (at least 10 characters).",
    };
  }

  if (!input.moveInDate) {
    return { success: false, error: "Please specify an expected move-in date." };
  }

  try {
    let propertyId: string | null = null;
    let roomTypeId: string | null = null;
    let propertyName: string | null = null;
    let roomTypeName: string | null = null;
    let locality: string = input.locality?.trim() || "";
    let city: string = input.city?.trim() || "";
    const state: string = input.state?.trim() || "Punjab";
    let rentPerPerson: number = Number(input.rentPerPerson) || 0;
    let securityDeposit: number = Number(input.securityDeposit) || 0;
    let preferredGender: GenderPolicy = input.preferredGender || GenderPolicy.UNISEX;
    let isFurnished: boolean = input.isFurnished ?? true;
    let hasAttachedBathroom: boolean = input.hasAttachedBathroom ?? false;
    let requiredRoommateCount: number = input.requiredRoommateCount ?? 1;
    let currentOccupantsCount: number = input.currentOccupantsCount ?? 1;
    let title: string = input.title?.trim() || "";
    let propertySlug: string | null = null;

    // 1. Authoritative derivation from DB when propertyId & roomTypeId are provided
    if (input.propertyId && input.roomTypeId) {
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId, status: "PUBLISHED", deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          locality: true,
          city: true,
          state: true,
          genderPolicy: true,
        },
      });

      if (!property) {
        return {
          success: false,
          error: "Selected property was not found or is no longer active.",
        };
      }

      const roomType = await prisma.roomType.findFirst({
        where: { id: input.roomTypeId, propertyId: property.id, isActive: true },
        include: {
          rooms: {
            where: { status: "AVAILABLE" },
            select: { id: true, occupiedBeds: true },
          },
        },
      });

      if (!roomType) {
        return {
          success: false,
          error: "Selected room type does not belong to this property.",
        };
      }

      if (roomType.occupancy <= 1) {
        return {
          success: false,
          error: "Private single rooms cannot have a roommate request. Please select a sharing room type.",
        };
      }

      // Authoritative properties from database (NEVER trusting client pricing)
      propertyId = property.id;
      roomTypeId = roomType.id;
      propertyName = property.name;
      roomTypeName = roomType.name;
      locality = property.locality;
      city = property.city;
      // For room sharing, split the total room rent & deposit equally in between persons
      const splitCount = Math.max(1, roomType.occupancy);
      rentPerPerson = Math.round(roomType.monthlyRent / splitCount);
      securityDeposit = Math.round(roomType.securityDeposit / splitCount);
      preferredGender = property.genderPolicy;
      isFurnished = true;
      hasAttachedBathroom = roomType.hasAttachedBathroom;
      propertySlug = property.slug;

      // Calculate roommate count from inventory / capacity
      const activeRooms = roomType.rooms;
      const totalBeds =
        activeRooms.length > 0 ? activeRooms.length * roomType.occupancy : roomType.occupancy;
      const occupiedBeds = activeRooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
      const vacantBeds = Math.max(1, totalBeds - occupiedBeds);
      requiredRoommateCount = Math.max(1, Math.min(vacantBeds, roomType.occupancy - 1 || 1));
      currentOccupantsCount = Math.max(1, roomType.occupancy - requiredRoommateCount);

      // Auto-generate title if not explicitly provided
      if (!title || title.length < 5) {
        title = `Roommate needed for ${roomType.name} at ${property.name}`;
      }
    } else {
      // Direct post validation (if created without PG link)
      if (!locality || !city) {
        return { success: false, error: "Locality and city are required." };
      }
      if (rentPerPerson <= 0) {
        return { success: false, error: "Please specify a valid monthly rent per person." };
      }
      if (!title || title.length < 5) {
        title = `Looking for a roommate in ${locality}, ${city}`;
      }
      propertyName = input.propertyName?.trim() || null;
      roomTypeName = input.roomTypeName?.trim() || null;
    }

    const moveIn = new Date(input.moveInDate);
    // Request expires in 30 days by default
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Roommate Request
      const request = await tx.roommateRequest.create({
        data: {
          creatorId: user.id,
          propertyId,
          roomTypeId,
          propertyName,
          roomTypeName,
          title,
          description: input.description.trim(),
          locality,
          city,
          state,
          requiredRoommateCount,
          currentOccupantsCount,
          rentPerPerson,
          securityDeposit,
          preferredGender,
          minAge: input.minAge ? Number(input.minAge) : null,
          maxAge: input.maxAge ? Number(input.maxAge) : null,
          moveInDate: moveIn,
          availabilityDescription: input.availabilityDescription || null,
          isFurnished,
          hasAttachedBathroom,
          status: RoommateRequestStatus.ACTIVE,
          expiresAt,
        },
      });

      // 2. Create Preferences
      await tx.roommatePreference.create({
        data: {
          requestId: request.id,
          dietary: input.dietary || DietaryPreference.NO_PREFERENCE,
          smoking: input.smoking || SmokingPreference.NON_SMOKER_ONLY,
          drinking: input.drinking || DrinkingPreference.NO_PREFERENCE,
          occupation: input.occupation || OccupationPreference.ANY,
          sleepSchedule: input.sleepSchedule || SleepSchedule.FLEXIBLE,
          petsAllowed: input.petsAllowed ?? false,
          customTags: input.customTags || [],
        },
      });

      // 3. Attach optional images
      if (input.imageUrls && input.imageUrls.length > 0) {
        await tx.roommateRequestImage.createMany({
          data: input.imageUrls.map((img, idx) => ({
            requestId: request.id,
            url: img.url,
            storageKey: img.storageKey,
            sortOrder: idx,
          })),
        });
      }

      return request;
    });

    try {
      revalidatePath("/");
      revalidatePath("/roommates");
      if (propertySlug) {
        revalidatePath(`/property/${propertySlug}`);
      }
    } catch {
      // safe fallback outside request context
    }

    return {
      success: true,
      data: { requestId: result.id },
    };
  } catch (error: unknown) {
    console.error("Failed to create roommate request:", error);
    const message = error instanceof Error ? error.message : "Failed to create roommate post.";
    return { success: false, error: message };
  }
}

/**
 * Submits an application / interest in a roommate request.
 */
export async function applyRoommateInterestAction({
  requestId,
  introMessage,
}: {
  requestId: string;
  introMessage?: string;
}): Promise<RoommateActionResult<{ interestId: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please sign in to connect with this flatmate." };
  }

  // Rate Limiting (max 10 roommate interest applications per hour per user)
  const rateLimit = rateLimiters.roommateInterest(user.id);
  if (!rateLimit.success) {
    return {
      success: false,
      error: "You have submitted multiple applications recently. Please wait a while before sending more.",
    };
  }

  const cleanIntro = introMessage ? sanitizeText(introMessage, 1000) : null;

  const request = await prisma.roommateRequest.findUnique({
    where: { id: requestId },
    select: { id: true, creatorId: true, status: true },
  });

  if (!request) {
    return { success: false, error: "Roommate request not found." };
  }

  if (request.status !== RoommateRequestStatus.ACTIVE) {
    return { success: false, error: "This roommate requirement is no longer accepting inquiries." };
  }

  if (request.creatorId === user.id) {
    return { success: false, error: "You cannot apply to your own roommate requirement." };
  }

  // Check if an interest already exists
  const existing = await prisma.roommateInterest.findUnique({
    where: {
      requestId_applicantId: {
        requestId,
        applicantId: user.id,
      },
    },
  });

  if (existing) {
    if (existing.status === RoommateInterestStatus.PENDING) {
      return { success: false, error: "You have already sent an interest application for this post." };
    }
    if (existing.status === RoommateInterestStatus.ACCEPTED) {
      return { success: false, error: "Your application was already accepted! Check your chats." };
    }
    if (existing.status === RoommateInterestStatus.DECLINED) {
      return { success: false, error: "This inquiry was previously closed by the host." };
    }
  }

  try {
    const interest = await prisma.roommateInterest.create({
      data: {
        requestId,
        applicantId: user.id,
        introMessage: cleanIntro,
        status: RoommateInterestStatus.PENDING,
      },
    });

    try {
      revalidatePath(`/roommates/${requestId}`);
    } catch {
      // safe fallback
    }

    return {
      success: true,
      data: { interestId: interest.id },
    };
  } catch (error: unknown) {
    console.error("Failed to submit roommate interest:", error);
    const message = error instanceof Error ? error.message : "Failed to send interest.";
    return { success: false, error: message };
  }
}

/**
 * Creator accepts or declines an applicant's interest.
 * Accepting automatically initializes a secure Conversation in Supabase Realtime!
 */
export async function respondToRoommateInterestAction({
  interestId,
  decision,
}: {
  interestId: string;
  decision: "ACCEPT" | "DECLINE";
}): Promise<RoommateActionResult<{ conversationId?: string; status: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const interest = await prisma.roommateInterest.findUnique({
    where: { id: interestId },
    include: {
      request: true,
      applicant: {
        include: { profile: true },
      },
    },
  });

  if (!interest) {
    return { success: false, error: "Interest application not found." };
  }

  // Only the creator of the roommate post (or admin) can accept/decline
  if (interest.request.creatorId !== user.id && user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized to respond to this application." };
  }

  if (decision === "DECLINE") {
    const updated = await prisma.roommateInterest.update({
      where: { id: interestId },
      data: { status: RoommateInterestStatus.DECLINED },
    });

    try {
      revalidatePath(`/roommates/${interest.requestId}`);
    } catch {
      // safe fallback
    }

    return {
      success: true,
      data: { status: updated.status },
    };
  }

  // ACCEPT FLOW:
  // Transaction: Update status -> Create or reuse Conversation -> Add participants -> Post system intro message
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Conversation
      const conversation = await tx.conversation.create({
        data: {
          roommateRequestId: interest.requestId,
          status: "ACTIVE",
          lastMessageText: "Match confirmed! You can now chat and coordinate move-in details safely.",
          lastMessageAt: new Date(),
          participants: {
            create: [
              { userId: user.id }, // Host
              { userId: interest.applicantId }, // Applicant
            ],
          },
          messages: {
            create: [
              {
                senderId: user.id,
                messageType: "SYSTEM",
                content: `Match confirmed for "${interest.request.title}"! Say hello to each other and coordinate details.`,
              },
            ],
          },
        },
      });

      // 2. Update interest to ACCEPTED and link conversation
      const updatedInterest = await tx.roommateInterest.update({
        where: { id: interestId },
        data: {
          status: RoommateInterestStatus.ACCEPTED,
          conversationId: conversation.id,
        },
      });

      return {
        status: updatedInterest.status,
        conversationId: conversation.id,
      };
    });

    try {
      revalidatePath(`/roommates/${interest.requestId}`);
      revalidatePath(`/chat`);
      revalidatePath(`/chat/${result.conversationId}`);
    } catch {
      // safe fallback
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    console.error("Failed to accept roommate interest:", error);
    const message = error instanceof Error ? error.message : "Failed to accept application.";
    return { success: false, error: message };
  }
}

/**
 * Updates the operational status of a roommate post (e.g. mark as FILLED).
 */
export async function updateRoommateRequestStatusAction({
  requestId,
  status,
}: {
  requestId: string;
  status: RoommateRequestStatus;
}): Promise<RoommateActionResult<{ status: RoommateRequestStatus }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  const request = await prisma.roommateRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return { success: false, error: "Request not found." };
  }

  if (request.creatorId !== user.id && user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const updated = await prisma.roommateRequest.update({
      where: { id: requestId },
      data: { status },
    });

    try {
      revalidatePath(`/roommates/${requestId}`);
      revalidatePath(`/roommates`);
      revalidatePath(`/`);
    } catch {
      // safe fallback
    }

    return {
      success: true,
      data: { status: updated.status },
    };
  } catch (error: unknown) {
    console.error("Failed to update status:", error);
    const message = error instanceof Error ? error.message : "Failed to update status.";
    return { success: false, error: message };
  }
}
