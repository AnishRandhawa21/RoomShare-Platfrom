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
      prisma.ownerSubscription.count({ where: { status: "ACTIVE" } }),
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

    const [total, properties, cities] = await Promise.all([
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
      prisma.property.findMany({
        where: { deletedAt: null },
        distinct: ["city"],
        select: { city: true },
      }),
    ]);

    return {
      success: true,
      data: {
        properties,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        filterCities: cities.map((c) => c.city),
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
// 10. SUBSCRIPTIONS
// ==============================================================================

export async function getAdminSubscriptionsAction(params: {
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const [total, subscriptions] = await Promise.all([
      prisma.ownerSubscription.count(),
      prisma.ownerSubscription.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          plan: true,
          owner: {
            include: {
              user: { select: { email: true, profile: { select: { fullName: true } } } },
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
        subscriptions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load subscriptions." };
  }
}

// ==============================================================================
// 11. FEATURED LISTINGS
// ==============================================================================

export async function getAdminFeaturedListingsAction(params: {
  page?: number;
  limit?: number;
}) {
  try {
    await requireAdminContext();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const [total, featured] = await Promise.all([
      prisma.featuredListing.count(),
      prisma.featuredListing.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          pricingPlan: true,
          property: {
            select: { id: true, name: true, slug: true, city: true },
          },
          roomType: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        featured,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load featured listings." };
  }
}

export async function updateAdminFeaturedStatusAction(input: {
  featuredId: string;
  status: FeaturedStatus;
}) {
  try {
    const admin = await requireAdminContext();

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
