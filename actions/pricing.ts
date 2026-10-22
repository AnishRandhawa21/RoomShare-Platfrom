"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, logAdminAction } from "@/actions/admin";
import {
  ensureDefaultPricingPlansSeeded,
  PRICING_CACHE_TAG,
  CANONICAL_PLANS,
} from "@/lib/pricing";

export interface UpdatePricingPlanInput {
  id: string;
  name: string;
  subtitle?: string | null;
  tagline?: string | null;
  description?: string | null;
  badge?: string | null;
  priceInr: number;
  originalPriceInr?: number | null;
  durationDays: number;
  maxProperties?: number;
  features?: string[];
  isActive?: boolean;
}

/**
 * Fetches all pricing plans for the admin portal, ensuring canonical defaults exist.
 */
export async function getAdminPricingPlansAction() {
  try {
    await requireAdminContext();
    await ensureDefaultPricingPlansSeeded();

    const model = (prisma as any).systemPricingPlan;
    if (!model) {
      return {
        success: false,
        error: "Database schema is initializing. Please restart your dev server (npm run dev) to refresh Prisma client.",
      };
    }

    const plans = await model.findMany({
      orderBy: [{ category: "asc" }, { priceInr: "asc" }],
      include: {
        updatedByUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Recent pricing audit logs for history timeline
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: "UPDATE_SYSTEM_PRICING",
        targetType: "PRICING_PLAN",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    return {
      success: true,
      data: {
        plans,
        auditLogs,
      },
    };
  } catch (error: unknown) {
    console.error("getAdminPricingPlansAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load pricing plans.",
    };
  }
}

/**
 * Updates a pricing plan with validation, audit logging, and cache invalidation.
 */
export async function updateAdminPricingPlanAction(input: UpdatePricingPlanInput) {
  try {
    const admin = await requireAdminContext();

    if (!input.id) {
      return { success: false, error: "Pricing plan ID is required." };
    }

    // Validation
    const priceInr = Math.round(Number(input.priceInr));
    if (isNaN(priceInr) || priceInr < 1) {
      return { success: false, error: "Price must be a valid positive amount in ₹ (minimum ₹1)." };
    }

    if (priceInr > 500000) {
      return { success: false, error: "Price cannot exceed ₹5,00,000." };
    }

    let originalPriceInr: number | null = null;
    if (input.originalPriceInr !== undefined && input.originalPriceInr !== null) {
      originalPriceInr = Math.round(Number(input.originalPriceInr));
      if (isNaN(originalPriceInr) || originalPriceInr < priceInr) {
        return {
          success: false,
          error: "Original / strikethrough price must be greater than or equal to the selling price.",
        };
      }
    }

    const durationDays = Math.max(1, Math.round(Number(input.durationDays) || 30));
    const maxProperties = Math.max(1, Math.round(Number(input.maxProperties) || 1));

    const existingPlan = await prisma.systemPricingPlan.findUnique({
      where: { id: input.id },
    });

    if (!existingPlan) {
      return { success: false, error: "Pricing plan not found." };
    }

    // Update plan in DB
    const updatedPlan = await prisma.systemPricingPlan.update({
      where: { id: input.id },
      data: {
        name: input.name.trim(),
        subtitle: input.subtitle?.trim() || null,
        tagline: input.tagline?.trim() || null,
        description: input.description?.trim() || null,
        badge: input.badge?.trim() || null,
        priceInr,
        originalPriceInr,
        durationDays,
        maxProperties,
        features: input.features || existingPlan.features,
        isActive: input.isActive !== undefined ? input.isActive : existingPlan.isActive,
        updatedByUserId: admin.id,
      },
    });

    // Immutable audit trail
    await logAdminAction(
      "UPDATE_SYSTEM_PRICING",
      "PRICING_PLAN",
      updatedPlan.id,
      {
        planCode: updatedPlan.code,
        category: updatedPlan.category,
        previousPriceInr: existingPlan.priceInr,
        newPriceInr: updatedPlan.priceInr,
        previousOriginalPriceInr: existingPlan.originalPriceInr,
        newOriginalPriceInr: updatedPlan.originalPriceInr,
        name: updatedPlan.name,
      }
    );

    // Revalidate pricing cache
    try {
      (revalidateTag as any)(PRICING_CACHE_TAG, "max");
    } catch {
      // Background / non-request context safety
    }

    // Revalidate relevant pages
    revalidatePath("/admin/pricing");
    revalidatePath("/admin/billing");
    revalidatePath("/owner/subscription");
    revalidatePath("/owner/subscriptions");
    revalidatePath("/owner/featured");
    revalidatePath("/owner/properties");

    return {
      success: true,
      data: updatedPlan,
    };
  } catch (error: unknown) {
    console.error("updateAdminPricingPlanAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update pricing plan.",
    };
  }
}

/**
 * Resets a pricing plan back to StayKro's canonical default prices.
 */
export async function resetPricingPlanToDefaultAction(code: string) {
  try {
    const admin = await requireAdminContext();

    const canonical = CANONICAL_PLANS.find((p) => p.code === code);
    if (!canonical) {
      return { success: false, error: `No canonical default found for plan code '${code}'.` };
    }

    const existingPlan = await prisma.systemPricingPlan.findUnique({
      where: { code },
    });

    if (!existingPlan) {
      return { success: false, error: "Pricing plan not found." };
    }

    const updatedPlan = await prisma.systemPricingPlan.update({
      where: { code },
      data: {
        name: canonical.name,
        subtitle: canonical.subtitle,
        tagline: canonical.tagline,
        description: canonical.description,
        badge: canonical.badge,
        priceInr: canonical.priceInr,
        originalPriceInr: canonical.originalPriceInr,
        durationDays: canonical.durationDays,
        maxProperties: canonical.maxProperties,
        features: canonical.features,
        isActive: true,
        updatedByUserId: admin.id,
      },
    });

    await logAdminAction(
      "UPDATE_SYSTEM_PRICING",
      "PRICING_PLAN",
      updatedPlan.id,
      {
        planCode: updatedPlan.code,
        actionType: "RESET_TO_CANONICAL_DEFAULT",
        previousPriceInr: existingPlan.priceInr,
        newPriceInr: updatedPlan.priceInr,
      }
    );

    try {
      (revalidateTag as any)(PRICING_CACHE_TAG, "max");
    } catch {}

    revalidatePath("/admin/pricing");
    revalidatePath("/admin/billing");
    revalidatePath("/owner/subscription");
    revalidatePath("/owner/subscriptions");
    revalidatePath("/owner/featured");
    revalidatePath("/owner/properties");

    return {
      success: true,
      data: updatedPlan,
    };
  } catch (error: unknown) {
    console.error("resetPricingPlanToDefaultAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset pricing plan.",
    };
  }
}

export interface UpsertOwnerPricingOverrideInput {
  ownerProfileId: string;
  discountType: "PERCENTAGE" | "FIXED_PRICE";
  percentageOff?: number | null;
  customSoloPrice?: number | null;
  customPlusPrice?: number | null;
  reason?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

/**
 * Fetches all active and configured owner pricing overrides for the admin dashboard.
 */
export async function getAdminOwnerPricingOverridesAction() {
  try {
    await requireAdminContext();

    const model = (prisma as any).ownerPricingOverride;
    if (!model) {
      return { success: true, data: [] };
    }

    const overrides = await model.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ownerProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                profile: {
                  select: {
                    fullName: true,
                    avatarUrl: true,
                    city: true,
                  },
                },
              },
            },
            _count: {
              select: {
                properties: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: overrides,
    };
  } catch (error: unknown) {
    console.error("getAdminOwnerPricingOverridesAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load owner overrides.",
    };
  }
}

/**
 * Search owners by name, business name, phone, or email to attach a custom discount.
 */
export async function searchOwnersForDiscountAction(searchQuery: string) {
  try {
    await requireAdminContext();
    const query = searchQuery.trim();
    if (!query) return { success: true, data: [] };

    const owners = await prisma.ownerProfile.findMany({
      where: {
        OR: [
          { businessName: { contains: query, mode: "insensitive" } },
          { contactPhone: { contains: query, mode: "insensitive" } },
          { user: { email: { contains: query, mode: "insensitive" } } },
          { user: { profile: { fullName: { contains: query, mode: "insensitive" } } } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                city: true,
              },
            },
          },
        },
        pricingOverride: true,
        _count: {
          select: {
            properties: true,
          },
        },
      },
      take: 12,
    });

    return {
      success: true,
      data: owners,
    };
  } catch (error: unknown) {
    console.error("searchOwnersForDiscountAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search owners.",
    };
  }
}

/**
 * Saves (creates or updates) an owner-specific custom discount override.
 */
export async function saveOwnerPricingOverrideAction(input: UpsertOwnerPricingOverrideInput) {
  try {
    const admin = await requireAdminContext();
    const model = (prisma as any).ownerPricingOverride;
    if (!model) {
      return { success: false, error: "Database table not ready." };
    }

    if (!input.ownerProfileId) {
      return { success: false, error: "Owner profile is required." };
    }

    if (input.discountType === "PERCENTAGE") {
      const pct = Number(input.percentageOff);
      if (isNaN(pct) || pct < 1 || pct > 100) {
        return { success: false, error: "Discount percentage must be between 1% and 100%." };
      }
    } else if (input.discountType === "FIXED_PRICE") {
      const hasSolo = typeof input.customSoloPrice === "number" && !isNaN(input.customSoloPrice);
      const hasPlus = typeof input.customPlusPrice === "number" && !isNaN(input.customPlusPrice);
      if (!hasSolo && !hasPlus) {
        return { success: false, error: "Provide at least one custom price for Solo or Plus." };
      }
    }

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    const resolvedSoloPrice =
      input.discountType === "FIXED_PRICE" && typeof input.customSoloPrice === "number"
        ? Math.max(0, input.customSoloPrice)
        : null;

    const resolvedPlusPrice =
      input.discountType === "FIXED_PRICE" && typeof input.customPlusPrice === "number"
        ? Math.max(0, input.customPlusPrice)
        : null;

    const saved = await model.upsert({
      where: { ownerProfileId: input.ownerProfileId },
      create: {
        ownerProfileId: input.ownerProfileId,
        discountType: input.discountType,
        percentageOff: input.discountType === "PERCENTAGE" ? Number(input.percentageOff) : null,
        customSoloPrice: resolvedSoloPrice,
        customPlusPrice: resolvedPlusPrice,
        reason: input.reason || null,
        expiresAt,
        isActive: input.isActive ?? true,
        createdByUserId: admin.id,
      },
      update: {
        discountType: input.discountType,
        percentageOff: input.discountType === "PERCENTAGE" ? Number(input.percentageOff) : null,
        customSoloPrice: resolvedSoloPrice,
        customPlusPrice: resolvedPlusPrice,
        reason: input.reason || null,
        expiresAt,
        isActive: input.isActive ?? true,
        createdByUserId: admin.id,
      },
      include: {
        ownerProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                profile: { select: { fullName: true, avatarUrl: true, city: true } },
              },
            },
            _count: { select: { properties: true } },
          },
        },
      },
    });

    await logAdminAction("UPSERT_OWNER_DISCOUNT", "OWNER_PROFILE", input.ownerProfileId, {
      discountType: input.discountType,
      percentageOff: input.percentageOff,
      customSoloPrice: input.customSoloPrice,
      customPlusPrice: input.customPlusPrice,
      reason: input.reason,
    });

    revalidatePath("/admin/pricing");
    revalidatePath("/owner/subscription");
    revalidatePath("/owner/properties");

    return {
      success: true,
      data: saved,
    };
  } catch (error: unknown) {
    console.error("saveOwnerPricingOverrideAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save owner discount.",
    };
  }
}

/**
 * Deletes an owner pricing override.
 */
export async function deleteOwnerPricingOverrideAction(overrideId: string) {
  try {
    await requireAdminContext();
    const model = (prisma as any).ownerPricingOverride;
    if (!model) return { success: false, error: "Database table not ready." };

    await model.delete({
      where: { id: overrideId },
    });

    revalidatePath("/admin/pricing");
    revalidatePath("/owner/subscription");
    revalidatePath("/owner/properties");

    return { success: true };
  } catch (error: unknown) {
    console.error("deleteOwnerPricingOverrideAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove discount.",
    };
  }
}

/**
 * Toggles an owner pricing override active/paused.
 */
export async function toggleOwnerPricingOverrideAction(overrideId: string, isActive: boolean) {
  try {
    await requireAdminContext();
    const model = (prisma as any).ownerPricingOverride;
    if (!model) return { success: false, error: "Database table not ready." };

    const updated = await model.update({
      where: { id: overrideId },
      data: { isActive },
    });

    revalidatePath("/admin/pricing");
    revalidatePath("/owner/subscription");
    revalidatePath("/owner/properties");

    return { success: true, data: updated };
  } catch (error: unknown) {
    console.error("toggleOwnerPricingOverrideAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle discount.",
    };
  }
}
