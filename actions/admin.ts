"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import {
  Role,
  PropertyStatus,
  PropertyType,
  VerificationStatus,
  RoommateRequestStatus,
  ReportStatus,
  ReportTargetType,
  ReviewStatus,
  FeaturedStatus,
} from "@/lib/enums";
import { revalidatePath } from "next/cache";

export interface AdminActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Strict server-side Admin privilege enforcement.
 * Every admin server action MUST call this first.
 */
export async function requireAdminContext() {
  const user = await requireUser("/login");

  if (user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Admin privileges required.");
  }

  return user;
}

/**
 * Creates an append-only AuditLog record in the database.
 */
export async function logAdminAction(
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: Record<string, unknown> | null,
  adminUserId?: string
) {
  try {
    let userId = adminUserId;
    if (!userId) {
      const admin = await requireAdminContext();
      userId = admin.id;
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId: targetId || null,
        details: (details as any) || undefined,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

// ==============================================================================
// 1. OVERVIEW & ANALYTICS
// ==============================================================================

export async function getAdminOverviewStatsAction(): Promise<
  AdminActionResult<{
    stats: {
      totalUsers: number;
      totalOwners: number;
      totalProperties: number;
      activeProperties: number;
      roommateRequests: number;
      pendingReports: number;
      revenueInr: number;
      activeSubscriptions: number;
      activeBoosts: number;
    };
    recentActivities: {
      recentOwners: any[];
      recentProperties: any[];
      recentRoommates: any[];
      recentReports: any[];
      recentPayments: any[];
      recentAuditLogs: any[];
    };
  }>
> {
  try {
    await requireAdminContext();

    const [
      totalUsers,
      totalOwners,
      totalProperties,
      activeProperties,
      roommateRequests,
      pendingReports,
      revenueResult,
      activeSubscriptions,
      activeBoosts,
      recentOwners,
      recentProperties,
      recentRoommates,
      recentReports,
      recentPayments,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.ownerProfile.count(),
      prisma.property.count({ where: { deletedAt: null } }),
      prisma.property.count({ where: { status: PropertyStatus.PUBLISHED, deletedAt: null } }),
      prisma.roommateRequest.count({ where: { status: RoommateRequestStatus.ACTIVE, deletedAt: null } }),
      prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "CAPTURED" },
      }),
      prisma.ownerListingPass.count({
        where: { status: "ACTIVE", expiresAt: { gte: new Date() } },
      }),
      prisma.propertyBoost.count({
        where: { status: "ACTIVE", endDate: { gte: new Date() } },
      }),
      // Recent owners
      prisma.ownerProfile.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true, profile: { select: { fullName: true } } },
          },
          _count: { select: { properties: true } },
        },
      }),
      // Recent properties
      prisma.property.findMany({
        take: 5,
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          locality: true,
          city: true,
          status: true,
          propertyType: true,
          createdAt: true,
          owner: {
            select: {
              businessName: true,
              user: { select: { profile: { select: { fullName: true } } } },
            },
          },
        },
      }),
      // Recent roommate requests
      prisma.roommateRequest.findMany({
        take: 5,
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          city: true,
          locality: true,
          rentPerPerson: true,
          status: true,
          createdAt: true,
          creator: {
            select: { profile: { select: { fullName: true } } },
          },
        },
      }),
      // Recent reports
      prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { profile: { select: { fullName: true } }, email: true } },
        },
      }),
      // Recent payments
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { profile: { select: { fullName: true } }, email: true } },
        },
      }),
      // Recent audit logs
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, profile: { select: { fullName: true } } } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        stats: {
          totalUsers,
          totalOwners,
          totalProperties,
          activeProperties,
          roommateRequests,
          pendingReports,
          revenueInr: revenueResult._sum.amount || 0,
          activeSubscriptions,
          activeBoosts,
        },
        recentActivities: {
          recentOwners,
          recentProperties,
          recentRoommates,
          recentReports,
          recentPayments,
          recentAuditLogs,
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load overview data." };
  }
}

// ==============================================================================
// 2. PROPERTY MANAGEMENT
// ==============================================================================

export interface GetAdminPropertiesParams {
  search?: string;
  city?: string;
  locality?: string;
  status?: PropertyStatus | "ALL";
  propertyType?: PropertyType | "ALL";
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "name";
}

let cachedAdminFilterCities: { timestamp: number; cities: string[] } | null = null;

export async function getAdminPropertiesAction(params: GetAdminPropertiesParams) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params.propertyType && params.propertyType !== "ALL") {
      where.propertyType = params.propertyType;
    }

    if (params.city && params.city !== "ALL") {
      where.city = { contains: params.city, mode: "insensitive" };
    }

    if (params.locality && params.locality !== "ALL") {
      where.locality = { contains: params.locality, mode: "insensitive" };
    }

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { locality: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { owner: { businessName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const orderBy: any = {};
    if (params.sort === "oldest") orderBy.createdAt = "asc";
    else if (params.sort === "name") orderBy.name = "asc";
    else orderBy.createdAt = "desc";

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            include: {
              user: { select: { email: true, profile: { select: { fullName: true } } } },
            },
          },
          roomTypes: {
            where: { isActive: true },
            select: { id: true, name: true, monthlyRent: true, occupancy: true },
          },
          images: {
            where: { isCover: true },
            take: 1,
            select: { url: true },
          },
          _count: { select: { roomTypes: true } },
        },
      }),
    ]);
    let filterCities: string[] = [];
    if (cachedAdminFilterCities && Date.now() - cachedAdminFilterCities.timestamp < 300000) {
      filterCities = cachedAdminFilterCities.cities;
    } else {
      const distinctCities = await prisma.property.findMany({
        where: { deletedAt: null },
        distinct: ["city"],
        select: { city: true },
      });
      filterCities = distinctCities.map((c) => c.city);
      cachedAdminFilterCities = { timestamp: Date.now(), cities: filterCities };
    }

    return {
      success: true,
      data: {
        properties,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        filterCities,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load properties." };
  }
}

export async function getAdminPropertyDetailAction(propertyId: string) {
  try {
    await requireAdminContext();

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          include: {
            user: { select: { id: true, email: true, phone: true, profile: true } },
          },
        },
        images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
        amenities: { include: { amenity: true } },
        roomTypes: {
          include: {
            rooms: true,
          },
        },
        reports: {
          include: {
            reporter: { select: { profile: { select: { fullName: true } }, email: true } },
          },
        },
        reviews: {
          include: {
            user: { select: { profile: { select: { fullName: true } }, email: true } },
          },
        },
      },
    });

    if (!property) {
      return { success: false, error: "Property not found." };
    }

    return { success: true, data: property };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load property details." };
  }
}

export async function updateAdminPropertyStatusAction(input: {
  propertyId: string;
  status: PropertyStatus;
  rejectionReason?: string;
}) {
  try {
    const admin = await requireAdminContext();

    const existing = await prisma.property.findUnique({
      where: { id: input.propertyId },
      select: { id: true, name: true, status: true },
    });

    if (!existing) {
      return { success: false, error: "Property not found." };
    }

    const updated = await prisma.property.update({
      where: { id: input.propertyId },
      data: {
        status: input.status,
        rejectionReason: input.status === PropertyStatus.REJECTED ? input.rejectionReason : null,
        isVerified: input.status === PropertyStatus.PUBLISHED,
        verifiedAt: input.status === PropertyStatus.PUBLISHED ? new Date() : undefined,
      },
    });

    await logAdminAction(
      `PROPERTY_STATUS_${input.status}`,
      "PROPERTY",
      existing.id,
      {
        previousStatus: existing.status,
        newStatus: input.status,
        propertyName: existing.name,
        rejectionReason: input.rejectionReason,
      },
      admin.id
    );

    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${input.propertyId}`);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update property status." };
  }
}

export async function deleteAdminPropertyAction(propertyId: string) {
  try {
    const admin = await requireAdminContext();

    const existing = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true },
    });

    if (!existing) {
      return { success: false, error: "Property not found." };
    }

    // Soft delete
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        deletedAt: new Date(),
        status: PropertyStatus.INACTIVE,
      },
    });

    await logAdminAction(
      "SOFT_DELETE_PROPERTY",
      "PROPERTY",
      existing.id,
      { propertyName: existing.name },
      admin.id
    );

    revalidatePath("/admin/properties");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete property." };
  }
}

// ==============================================================================
// 3. OWNER MANAGEMENT
// ==============================================================================

export async function getAdminOwnersAction(params: {
  search?: string;
  status?: VerificationStatus | "ALL";
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status && params.status !== "ALL") {
      where.verificationStatus = params.status;
    }

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { businessName: { contains: q, mode: "insensitive" } },
        { contactPhone: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { profile: { fullName: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, owners] = await Promise.all([
      prisma.ownerProfile.count({ where }),
      prisma.ownerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, phone: true, isActive: true, createdAt: true, profile: true },
          },
          properties: {
            where: { deletedAt: null },
            select: { id: true, name: true, city: true, status: true },
          },
          subscriptions: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { plan: true },
          },
          _count: { select: { properties: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        owners,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load owners." };
  }
}

export async function getAdminOwnerDetailAction(ownerId: string) {
  try {
    await requireAdminContext();

    const owner = await prisma.ownerProfile.findUnique({
      where: { id: ownerId },
      include: {
        user: { include: { profile: true } },
        properties: {
          where: { deletedAt: null },
          include: {
            roomTypes: { where: { isActive: true } },
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          include: { plan: true },
        },
      },
    });

    if (!owner) {
      return { success: false, error: "Owner not found." };
    }

    return { success: true, data: owner };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load owner details." };
  }
}

export async function updateAdminOwnerVerificationAction(input: {
  ownerId: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
}) {
  try {
    const admin = await requireAdminContext();

    const updated = await prisma.ownerProfile.update({
      where: { id: input.ownerId },
      data: {
        verificationStatus: input.verificationStatus,
        verifiedAt: input.verificationStatus === VerificationStatus.VERIFIED ? new Date() : null,
        rejectionReason: input.verificationStatus === VerificationStatus.REJECTED ? input.rejectionReason : null,
      },
      include: { user: { select: { id: true, email: true } } },
    });

    await logAdminAction(
      `OWNER_VERIFICATION_${input.verificationStatus}`,
      "OWNER",
      input.ownerId,
      {
        ownerEmail: updated.user?.email,
        verificationStatus: input.verificationStatus,
        rejectionReason: input.rejectionReason,
      },
      admin.id
    );

    revalidatePath("/admin/owners");
    revalidatePath(`/admin/owners/${input.ownerId}`);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update owner verification." };
  }
}

export async function toggleAdminUserActiveAction(input: {
  userId: string;
  isActive: boolean;
  reason?: string;
}) {
  try {
    const admin = await requireAdminContext();

    if (admin.id === input.userId) {
      return { success: false, error: "Cannot suspend your own administrator account." };
    }

    const updated = await prisma.user.update({
      where: { id: input.userId },
      data: { isActive: input.isActive },
      select: { id: true, email: true, isActive: true, role: true },
    });

    await logAdminAction(
      input.isActive ? "UNBAN_USER" : "BAN_USER",
      "USER",
      updated.id,
      { userEmail: updated.email, reason: input.reason },
      admin.id
    );

    revalidatePath("/admin/users");
    revalidatePath("/admin/owners");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to change user status." };
  }
}

// ==============================================================================
// 4. USER MANAGEMENT
// ==============================================================================

export async function getAdminUsersAction(params: {
  search?: string;
  role?: Role | "ALL";
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role && params.role !== "ALL") {
      where.role = params.role;
    }

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { profile: { fullName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          profile: true,
          ownerProfile: { select: { id: true, businessName: true, verificationStatus: true } },
          _count: {
            select: {
              roommateRequests: true,
              reportsSubmitted: true,
              payments: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load users." };
  }
}

export async function updateAdminUserRoleAction(input: {
  userId: string;
  newRole: Role;
}) {
  try {
    const admin = await requireAdminContext();

    if (admin.id === input.userId && input.newRole !== Role.ADMIN) {
      return { success: false, error: "Cannot demote your own administrator account." };
    }

    // Guard: Prevent arbitrary promotion to OWNER without invitation flow
    if (input.newRole === Role.OWNER) {
      const hasAcceptedInvite = await prisma.ownerInvitation.findFirst({
        where: { acceptedByUserId: input.userId, status: "ACCEPTED" },
      });
      if (!hasAcceptedInvite) {
        return {
          success: false,
          error: "Security Rule: Owners must be invited via the Owner Invitation system. Send an invitation first.",
        };
      }
    }

    const updated = await prisma.user.update({
      where: { id: input.userId },
      data: { role: input.newRole },
      select: { id: true, email: true, role: true },
    });

    await logAdminAction(
      `CHANGE_USER_ROLE_${input.newRole}`,
      "USER",
      updated.id,
      { userEmail: updated.email, newRole: input.newRole },
      admin.id
    );

    revalidatePath("/admin/users");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update role." };
  }
}

// ==============================================================================
// 5. LOCATION MASTER DATA MANAGEMENT
// ==============================================================================

export async function getAdminLocationsAction() {
  try {
    await requireAdminContext();

    const states = await prisma.state.findMany({
      orderBy: { name: "asc" },
      include: {
        cities: {
          orderBy: { name: "asc" },
          include: {
            localities: {
              orderBy: { name: "asc" },
            },
            _count: { select: { localities: true } },
          },
        },
      },
    });

    const pendingLocalityRequests = await prisma.localityRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: {
          select: { email: true, profile: { select: { fullName: true } } },
        },
      },
    });

    return {
      success: true,
      data: {
        states,
        pendingLocalityRequests,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load locations." };
  }
}

export async function createAdminStateAction(input: { name: string; code?: string }) {
  try {
    const admin = await requireAdminContext();
    const name = input.name.trim();
    if (!name) return { success: false, error: "State name is required." };

    const state = await prisma.state.create({
      data: {
        name,
        code: input.code?.trim().toUpperCase() || undefined,
        isActive: true,
      },
    });

    await logAdminAction("CREATE_STATE", "LOCATION", state.id, { stateName: state.name }, admin.id);
    revalidatePath("/admin/locations");
    return { success: true, data: state };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create state." };
  }
}

export async function updateAdminStateAction(input: {
  stateId: string;
  name?: string;
  code?: string;
  isActive?: boolean;
}) {
  try {
    const admin = await requireAdminContext();

    const updated = await prisma.state.update({
      where: { id: input.stateId },
      data: {
        name: input.name?.trim(),
        code: input.code?.trim().toUpperCase(),
        isActive: input.isActive,
      },
    });

    await logAdminAction("UPDATE_STATE", "LOCATION", updated.id, { stateName: updated.name }, admin.id);
    revalidatePath("/admin/locations");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update state." };
  }
}

export async function createAdminCityAction(input: { stateId: string; name: string }) {
  try {
    const admin = await requireAdminContext();
    const name = input.name.trim();
    if (!name) return { success: false, error: "City name is required." };

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const city = await prisma.city.create({
      data: {
        stateId: input.stateId,
        name,
        slug,
        isActive: true,
      },
    });

    await logAdminAction("CREATE_CITY", "LOCATION", city.id, { cityName: city.name }, admin.id);
    revalidatePath("/admin/locations");
    return { success: true, data: city };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create city." };
  }
}

export async function updateAdminCityAction(input: {
  cityId: string;
  name?: string;
  isActive?: boolean;
}) {
  try {
    const admin = await requireAdminContext();

    const updated = await prisma.city.update({
      where: { id: input.cityId },
      data: {
        name: input.name?.trim(),
        isActive: input.isActive,
      },
    });

    await logAdminAction("UPDATE_CITY", "LOCATION", updated.id, { cityName: updated.name }, admin.id);
    revalidatePath("/admin/locations");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update city." };
  }
}

export async function createAdminLocalityAction(input: {
  cityId: string;
  name: string;
  postalCode?: string;
}) {
  try {
    const admin = await requireAdminContext();
    const name = input.name.trim();
    if (!name) return { success: false, error: "Locality name is required." };

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const locality = await prisma.locality.create({
      data: {
        cityId: input.cityId,
        name,
        slug,
        postalCode: input.postalCode?.trim() || undefined,
        isActive: true,
      },
    });

    await logAdminAction("CREATE_LOCALITY", "LOCATION", locality.id, { localityName: locality.name }, admin.id);
    revalidatePath("/admin/locations");
    return { success: true, data: locality };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create locality." };
  }
}

export async function updateAdminLocalityAction(input: {
  localityId: string;
  name?: string;
  postalCode?: string;
  isActive?: boolean;
}) {
  try {
    const admin = await requireAdminContext();

    const updated = await prisma.locality.update({
      where: { id: input.localityId },
      data: {
        name: input.name?.trim(),
        postalCode: input.postalCode?.trim(),
        isActive: input.isActive,
      },
    });

    await logAdminAction("UPDATE_LOCALITY", "LOCATION", updated.id, { localityName: updated.name }, admin.id);
    revalidatePath("/admin/locations");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update locality." };
  }
}

export async function deleteAdminStateAction(stateId: string) {
  try {
    const admin = await requireAdminContext();
    const existing = await prisma.state.findUnique({
      where: { id: stateId },
      include: { _count: { select: { cities: true } } },
    });
    if (!existing) return { success: false, error: "State not found." };

    await prisma.state.delete({ where: { id: stateId } });

    await logAdminAction(
      "DELETE_STATE",
      "LOCATION",
      stateId,
      {
        stateName: existing.name,
        deletedCitiesCount: existing._count.cities,
      },
      admin.id
    );

    revalidatePath("/admin/locations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete state." };
  }
}

export async function deleteAdminCityAction(cityId: string) {
  try {
    const admin = await requireAdminContext();
    const existing = await prisma.city.findUnique({
      where: { id: cityId },
      include: { _count: { select: { localities: true } } },
    });
    if (!existing) return { success: false, error: "City not found." };

    await prisma.city.delete({ where: { id: cityId } });

    await logAdminAction(
      "DELETE_CITY",
      "LOCATION",
      cityId,
      {
        cityName: existing.name,
        deletedLocalitiesCount: existing._count.localities,
      },
      admin.id
    );

    revalidatePath("/admin/locations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete city." };
  }
}

export async function deleteAdminLocalityAction(localityId: string) {
  try {
    const admin = await requireAdminContext();
    const existing = await prisma.locality.findUnique({
      where: { id: localityId },
    });
    if (!existing) return { success: false, error: "Locality not found." };

    await prisma.locality.delete({ where: { id: localityId } });

    await logAdminAction(
      "DELETE_LOCALITY",
      "LOCATION",
      localityId,
      {
        localityName: existing.name,
      },
      admin.id
    );

    revalidatePath("/admin/locations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete locality." };
  }
}

export async function resolveAdminLocalityRequestAction(input: {
  requestId: string;
  status: ReportStatus; // RESOLVED or DISMISSED
  notes?: string;
}) {
  try {
    const admin = await requireAdminContext();

    const updated = await prisma.localityRequest.update({
      where: { id: input.requestId },
      data: {
        status: input.status,
        notes: input.notes,
      },
    });

    await logAdminAction(
      `LOCALITY_REQUEST_${input.status}`,
      "LOCATION",
      input.requestId,
      { status: input.status, locality: updated.localityName },
      admin.id
    );

    revalidatePath("/admin/locations");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to resolve locality request." };
  }
}

// ==============================================================================
// 6. ROOMMATE REQUESTS MANAGEMENT
// ==============================================================================

export async function getAdminRoommatesAction(params: {
  search?: string;
  city?: string;
  status?: RoommateRequestStatus | "ALL";
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params.city && params.city !== "ALL") {
      where.city = { contains: params.city, mode: "insensitive" };
    }

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { locality: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { creator: { profile: { fullName: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, requests, cities] = await Promise.all([
      prisma.roommateRequest.count({ where }),
      prisma.roommateRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: { id: true, email: true, profile: true },
          },
          property: {
            select: { id: true, name: true, slug: true },
          },
          roomType: {
            select: { id: true, name: true, occupancy: true },
          },
          preferences: true,
          _count: { select: { interests: true } },
        },
      }),
      prisma.roommateRequest.findMany({
        where: { deletedAt: null },
        distinct: ["city"],
        select: { city: true },
      }),
    ]);

    return {
      success: true,
      data: {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        filterCities: cities.map((c) => c.city),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load roommate requests." };
  }
}

export async function updateAdminRoommateStatusAction(input: {
  requestId: string;
  status: RoommateRequestStatus;
  reason?: string;
}) {
  try {
    const admin = await requireAdminContext();

    const updated = await prisma.roommateRequest.update({
      where: { id: input.requestId },
      data: { status: input.status },
      select: { id: true, title: true, status: true },
    });

    await logAdminAction(
      `ROOMMATE_STATUS_${input.status}`,
      "ROOMMATE_REQUEST",
      input.requestId,
      { title: updated.title, newStatus: input.status, reason: input.reason },
      admin.id
    );

    revalidatePath("/admin/roommates");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update roommate status." };
  }
}

// ==============================================================================
// 7. REPORTS & MODERATION
// ==============================================================================

export async function getAdminReportsAction(params: {
  status?: ReportStatus | "ALL";
  targetType?: ReportTargetType | "ALL";
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }
    if (params.targetType && params.targetType !== "ALL") {
      where.targetType = params.targetType;
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
          property: {
            select: { id: true, name: true, slug: true, city: true },
          },
          roommateRequest: {
            select: { id: true, title: true, city: true },
          },
          reportedUser: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        reports,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load reports." };
  }
}

export async function updateAdminReportStatusAction(input: {
  reportId: string;
  status: ReportStatus;
  moderationNotes?: string;
}) {
  try {
    const admin = await requireAdminContext();

    const updated = await prisma.report.update({
      where: { id: input.reportId },
      data: {
        status: input.status,
      },
    });

    await logAdminAction(
      `REPORT_${input.status}`,
      "REPORT",
      input.reportId,
      {
        status: input.status,
        notes: input.moderationNotes,
        targetType: updated.targetType,
      },
      admin.id
    );

    revalidatePath("/admin/reports");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update report." };
  }
}

// ==============================================================================
// 8. REVIEWS & MODERATION
// ==============================================================================

export async function getAdminReviewsAction(params: {
  status?: ReviewStatus | "ALL";
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
          property: {
            select: { id: true, name: true, slug: true, city: true },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load reviews." };
  }
}

export async function updateAdminReviewStatusAction(input: {
  reviewId: string;
  status: ReviewStatus;
}) {
  try {
    const admin = await requireAdminContext();

    const updated = await prisma.review.update({
      where: { id: input.reviewId },
      data: { status: input.status },
    });

    await logAdminAction(
      `REVIEW_${input.status}`,
      "REVIEW",
      input.reviewId,
      { status: input.status, propertyId: updated.propertyId },
      admin.id
    );

    revalidatePath("/admin/reviews");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update review status." };
  }
}

// ==============================================================================
// 9. PAYMENTS LEDGER
// ==============================================================================

export async function getAdminPaymentsAction(params: {
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
          ownerSubscription: {
            include: { plan: true },
          },
          ownerListingPass: {
            include: { owner: { select: { id: true, businessName: true } } },
          },
          featuredListing: true,
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
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load payments." };
  }
}

// ==============================================================================
// 10. LISTING PASSES & LICENSES
// ==============================================================================

export async function getAdminListingPassesAction(params: {
  page?: number;
  limit?: number;
  filter?: "ALL" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "SOLO" | "PLUS";
  search?: string;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const where: any = {};

    if (params.filter === "ACTIVE") {
      where.status = "ACTIVE";
      where.expiresAt = { gte: now };
    } else if (params.filter === "EXPIRING_SOON") {
      where.status = "ACTIVE";
      where.expiresAt = { gte: now, lte: in7Days };
    } else if (params.filter === "EXPIRED") {
      where.OR = [
        { status: "EXPIRED" },
        { expiresAt: { lt: now } },
      ];
    } else if (params.filter === "SOLO") {
      where.planType = "SOLO";
    } else if (params.filter === "PLUS") {
      where.planType = "PLUS";
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const searchConditions = [
        { owner: { businessName: { contains: q, mode: "insensitive" } } },
        { owner: { user: { email: { contains: q, mode: "insensitive" } } } },
        { owner: { user: { profile: { fullName: { contains: q, mode: "insensitive" } } } } },
        { razorpayOrderId: { contains: q, mode: "insensitive" } },
        { razorpayPaymentId: { contains: q, mode: "insensitive" } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [
      filteredTotal,
      allTotal,
      passes,
      activeCount,
      expiredCount,
      expiringSoonCount,
      soloCount,
      plusCount,
    ] = await Promise.all([
      prisma.ownerListingPass.count({ where }),
      prisma.ownerListingPass.count({}),
      prisma.ownerListingPass.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            include: {
              user: { select: { email: true, profile: { select: { fullName: true } } } },
              _count: { select: { properties: { where: { deletedAt: null } } } },
            },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.ownerListingPass.count({ where: { status: "ACTIVE", expiresAt: { gte: now } } }),
      prisma.ownerListingPass.count({ where: { OR: [{ status: "EXPIRED" }, { expiresAt: { lt: now } }] } }),
      prisma.ownerListingPass.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: in7Days } } }),
      prisma.ownerListingPass.count({ where: { planType: "SOLO" } }),
      prisma.ownerListingPass.count({ where: { planType: "PLUS" } }),
    ]);

    return {
      success: true,
      data: {
        passes,
        total: filteredTotal,
        page,
        totalPages: Math.ceil(filteredTotal / limit),
        counts: {
          total: allTotal,
          active: activeCount,
          expired: expiredCount,
          expiringSoon: expiringSoonCount,
          solo: soloCount,
          plus: plusCount,
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load listing passes." };
  }
}

export async function getAdminSubscriptionsAction(params: {
  page?: number;
  limit?: number;
  filter?: any;
  search?: string;
}) {
  const result = await getAdminListingPassesAction(params);
  if (!result.success || !result.data) {
    return result as any;
  }
  const now = new Date();
  return {
    success: true,
    data: {
      subscriptions: result.data.passes.map((pass: any) => {
        const isUpgraded = pass.status === "EXPIRED" && new Date(pass.expiresAt) > now;
        const status = isUpgraded
          ? "UPGRADED"
          : pass.status === "ACTIVE" && new Date(pass.expiresAt) < now
          ? "EXPIRED"
          : pass.status;

        return {
          id: pass.id,
          status,
          isUpgraded,
          startDate: pass.startsAt,
          endDate: pass.expiresAt,
          autoRenew: false,
          cancelledAt: null,
          createdAt: pass.createdAt,
          propertyLimit: pass.propertyLimit,
          planType: pass.planType,
          plan: {
            id: pass.id,
            name: pass.planType === "PLUS" ? "StayKro Plus Listing Pass" : "StayKro Solo Listing Pass",
            priceInr: pass.amount,
            maxProperties: pass.propertyLimit,
            billingCycle: "30-Day License",
            interval: "30-Day License",
          },
          owner: pass.owner,
          payments: pass.payments,
        };
      }),
      passes: result.data.passes,
      counts: result.data.counts,
      total: result.data.total,
      page: result.data.page,
      totalPages: result.data.totalPages,
    },
  };
}

/**
 * Returns complete monetization and billing intelligence for the admin panel.
 */
export async function getAdminBillingDashboardAction() {
  try {
    await requireAdminContext();

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activePassesCount,
      expiredPassesCount,
      upcomingExpirationsCount,
      failedPaymentsCount,
      totalRevenueAggregate,
      soloCount,
      plusCount,
      activeBoostsCount,
      recentTransactions,
      recentBoosts,
      listingPassesList,
    ] = await Promise.all([
      prisma.ownerListingPass.count({ where: { status: "ACTIVE", expiresAt: { gte: now } } }),
      prisma.ownerListingPass.count({
        where: {
          OR: [{ status: "EXPIRED" }, { expiresAt: { lt: now } }],
        },
      }),
      prisma.ownerListingPass.count({
        where: {
          status: "ACTIVE",
          expiresAt: { gte: now, lte: in7Days },
        },
      }),
      prisma.payment.count({ where: { status: "FAILED" } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "CAPTURED" },
      }),
      prisma.ownerListingPass.count({
        where: { planType: "SOLO" },
      }),
      prisma.ownerListingPass.count({
        where: { planType: "PLUS" },
      }),
      prisma.propertyBoost.count({
        where: { status: "ACTIVE", endDate: { gte: now } },
      }),
      prisma.payment.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true, profile: { select: { fullName: true } } },
          },
          ownerSubscription: {
            include: {
              plan: true,
              owner: {
                select: { id: true, businessName: true },
              },
            },
          },
          ownerListingPass: {
            include: {
              owner: {
                select: { id: true, businessName: true },
              },
            },
          },
          propertyBoost: {
            include: {
              property: { select: { name: true, slug: true } },
              owner: { select: { id: true, businessName: true } },
            },
          },
        },
      }),
      prisma.propertyBoost.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          property: { select: { id: true, name: true, slug: true, city: true } },
          owner: {
            include: {
              user: { select: { email: true, profile: { select: { fullName: true } } } },
            },
          },
        },
      }),
      prisma.ownerListingPass.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            include: {
              user: { select: { email: true, profile: { select: { fullName: true } } } },
              _count: { select: { properties: { where: { deletedAt: null } } } },
            },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        activePassesCount,
        expiredPassesCount,
        upcomingExpirationsCount,
        activeSubscriptionsCount: activePassesCount,
        cancelledSubscriptionsCount: expiredPassesCount,
        failedPaymentsCount,
        totalRevenueInr: totalRevenueAggregate._sum.amount || 0,
        planDistribution: {
          solo: soloCount,
          plus: plusCount,
        },
        activeBoostsCount,
        recentTransactions,
        recentBoosts,
        listingPassesList,
        subscriptionsList: listingPassesList.map((pass: any) => ({
          id: pass.id,
          status: pass.status === "ACTIVE" && new Date(pass.expiresAt) < now ? "EXPIRED" : pass.status,
          startDate: pass.startsAt,
          endDate: pass.expiresAt,
          autoRenew: false,
          cancelledAt: null,
          createdAt: pass.createdAt,
          plan: {
            id: pass.id,
            name: pass.planType === "PLUS" ? "StayKro Plus Listing Pass" : "StayKro Solo Listing Pass",
            priceInr: pass.amount,
            maxProperties: pass.propertyLimit,
            billingCycle: "30-Day License",
            interval: "30-Day License",
          },
          owner: pass.owner,
          payments: pass.payments,
        })),
      },
    };
  } catch (err: any) {
    console.error("getAdminBillingDashboardAction error:", err);
    return { success: false, error: err?.message || "Failed to load admin billing data." };
  }
}

// ==============================================================================
// 11. FEATURED LISTINGS
// ==============================================================================

export async function getAdminFeaturedListingsAction(params: {
  page?: number;
  limit?: number;
  filter?: "ALL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  search?: string;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;
    const now = new Date();

    const boostWhere: any = {};
    if (params.filter === "ACTIVE") {
      boostWhere.status = "ACTIVE";
      boostWhere.endDate = { gte: now };
    } else if (params.filter === "EXPIRED") {
      boostWhere.OR = [
        { status: "EXPIRED" },
        { endDate: { lt: now } },
      ];
    } else if (params.filter === "CANCELLED") {
      boostWhere.status = "CANCELLED";
    }

    if (params.search?.trim()) {
      const q = params.search.trim();
      const searchOR = [
        { property: { name: { contains: q, mode: "insensitive" } } },
        { property: { city: { contains: q, mode: "insensitive" } } },
        { property: { locality: { contains: q, mode: "insensitive" } } },
        { owner: { user: { email: { contains: q, mode: "insensitive" } } } },
        { razorpayPaymentId: { contains: q, mode: "insensitive" } },
      ];
      if (boostWhere.OR) {
        boostWhere.AND = [{ OR: boostWhere.OR }, { OR: searchOR }];
        delete boostWhere.OR;
      } else {
        boostWhere.OR = searchOR;
      }
    }

    const [
      filteredBoostsCount,
      allBoostsCount,
      activeBoostsCount,
      expiredBoostsCount,
      cancelledBoostsCount,
      boostsRevenueResult,
      boosts,
      legacyFeatured,
    ] = await Promise.all([
      prisma.propertyBoost.count({ where: boostWhere }),
      prisma.propertyBoost.count({}),
      prisma.propertyBoost.count({ where: { status: "ACTIVE", endDate: { gte: now } } }),
      prisma.propertyBoost.count({ where: { OR: [{ status: "EXPIRED" }, { endDate: { lt: now } }] } }),
      prisma.propertyBoost.count({ where: { status: "CANCELLED" } }),
      prisma.propertyBoost.aggregate({
        _sum: { amountInr: true },
        where: { status: "ACTIVE" },
      }),
      prisma.propertyBoost.findMany({
        where: boostWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: { id: true, name: true, slug: true, city: true, locality: true },
          },
          owner: {
            include: {
              user: {
                select: {
                  email: true,
                  profile: { select: { fullName: true } },
                },
              },
            },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.featuredListing.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          pricingPlan: true,
          property: {
            select: { id: true, name: true, slug: true, city: true, locality: true },
          },
          roomType: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    // Map PropertyBoost records to standardized featured row format
    const mappedBoosts = boosts.map((boost) => {
      const isExpired = boost.endDate && new Date(boost.endDate) < now;
      const effectiveStatus =
        boost.status === "ACTIVE" && isExpired
          ? "EXPIRED"
          : (boost.status as any);

      return {
        id: boost.id,
        isBoost: true,
        targetType: "PROPERTY_BOOST",
        startDate: boost.startDate || boost.createdAt,
        endDate: boost.endDate || new Date(boost.createdAt.getTime() + boost.durationDays * 24 * 60 * 60 * 1000),
        status: effectiveStatus,
        pricePaidInr: boost.amountInr,
        createdAt: boost.createdAt,
        razorpayPaymentId: boost.razorpayPaymentId,
        pricingPlan: {
          id: boost.id,
          name:
            boost.durationDays === 7
              ? "7-Day Visibility Boost"
              : boost.durationDays === 15
              ? "15-Day Visibility Boost"
              : `${boost.durationDays}-Day Visibility Boost`,
          durationDays: boost.durationDays,
          priceInr: boost.amountInr,
        },
        property: boost.property,
        roomType: null,
        owner: boost.owner,
        payments: boost.payments,
      };
    });

    const mappedLegacy = legacyFeatured.map((item) => ({
      id: item.id,
      isBoost: false,
      targetType: item.targetType,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
      pricePaidInr: item.pricePaidInr,
      createdAt: item.createdAt,
      pricingPlan: item.pricingPlan,
      property: item.property,
      roomType: item.roomType,
      owner: null,
      payments: [],
    }));

    const combined = [...mappedBoosts, ...mappedLegacy];
    const totalCount = filteredBoostsCount + legacyFeatured.length;

    return {
      success: true,
      data: {
        featured: combined,
        total: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        counts: {
          total: allBoostsCount + legacyFeatured.length,
          active: activeBoostsCount,
          expired: expiredBoostsCount,
          cancelled: cancelledBoostsCount,
          revenueInr: boostsRevenueResult._sum.amountInr || 0,
        },
      },
    };
  } catch (err: any) {
    console.error("getAdminFeaturedListingsAction error:", err);
    return { success: false, error: err.message || "Failed to load featured listings." };
  }
}

export async function updateAdminFeaturedStatusAction(input: {
  featuredId: string;
  status: FeaturedStatus;
}) {
  try {
    const admin = await requireAdminContext();

    // Check if it is a PropertyBoost first
    const boost = await prisma.propertyBoost.findUnique({
      where: { id: input.featuredId },
    });

    if (boost) {
      const updated = await prisma.propertyBoost.update({
        where: { id: input.featuredId },
        data: { status: input.status as any },
      });

      await logAdminAction(
        `BOOST_${input.status}`,
        "PROPERTY_BOOST",
        input.featuredId,
        { status: input.status },
        admin.id
      );

      revalidatePath("/admin/featured");
      revalidatePath("/admin/billing");
      return { success: true, data: updated };
    }

    const updated = await prisma.featuredListing.update({
      where: { id: input.featuredId },
      data: { status: input.status },
    });

    await logAdminAction(
      `FEATURED_${input.status}`,
      "FEATURED_LISTING",
      input.featuredId,
      { status: input.status },
      admin.id
    );

    revalidatePath("/admin/featured");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update featured status." };
  }
}

// ==============================================================================
// 12. AUDIT LOGS
// ==============================================================================

export async function getAdminAuditLogsAction(params: {
  action?: string;
  targetType?: string;
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.action && params.action !== "ALL") {
      where.action = params.action;
    }
    if (params.targetType && params.targetType !== "ALL") {
      where.targetType = params.targetType;
    }

    const [total, auditLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        auditLogs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load audit logs." };
  }
}
