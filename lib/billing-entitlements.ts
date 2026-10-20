import { prisma } from "@/lib/prisma";
import { STAYKRO_BILLING_CONFIG } from "@/config/billing";

export interface OwnerPublishingEntitlement {
  canPublish: boolean;
  activePass: {
    id: string;
    planType: "SOLO" | "PLUS";
    name: string;
    amount: number;
    propertyLimit: number;
    startsAt: Date;
    expiresAt: Date;
    daysRemaining: number;
    isExpiringSoon: boolean;
    status: string;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
  } | null;
  // Backward compatibility alias
  activePlan: {
    id: string;
    code: string;
    name: string;
    priceInr: number;
    maxProperties: number;
    status: string;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
  } | null;
  publishedCount: number;
  allowedCount: number;
  isCurrentlyPublished: boolean;
  reason?: string;
  suggestedUpgrade?: "SOLO" | "PLUS" | null;
  hasExpiredPass?: boolean;
}

/**
 * Checks and updates expired listing passes for an owner.
 * If 30 days have elapsed:
 * - Mark license as EXPIRED
 * - Transition properties to DRAFT so they disappear from public search
 * - Never delete property data/photos/rooms
 */
export async function syncExpiredListingPasses(ownerId: string): Promise<void> {
  const now = new Date();

  // Find any active passes that have passed their expiresAt timestamp
  const expiredPasses = await prisma.ownerListingPass.findMany({
    where: {
      ownerId,
      status: "ACTIVE",
      expiresAt: { lt: now },
    },
    select: { id: true },
  });

  if (expiredPasses.length > 0) {
    await prisma.ownerListingPass.updateMany({
      where: {
        id: { in: expiredPasses.map((p) => p.id) },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Check if the owner still has any other active pass
    const remainingActivePass = await prisma.ownerListingPass.findFirst({
      where: {
        ownerId,
        status: "ACTIVE",
        expiresAt: { gte: now },
      },
      select: { id: true },
    });

    // If no active pass remains, unpublish their properties
    if (!remainingActivePass) {
      await prisma.property.updateMany({
        where: {
          ownerId,
          status: "PUBLISHED",
          deletedAt: null,
        },
        data: {
          status: "DRAFT",
        },
      });
    }
  }
}

/**
 * Checks an owner's 30-day Listing Pass entitlement against their live property inventory.
 *
 * Rules:
 * - StayKro Solo: allows 1 active property for 30 days
 * - StayKro Plus: allows multiple properties (configurable) for 30 days
 * - When expired: properties become unpublished/draft, owner can renew manually
 * - Non-recurring: zero automatic recurring charges
 */
export async function getOwnerPublishingEntitlement(
  ownerId: string,
  targetPropertyId?: string
): Promise<OwnerPublishingEntitlement> {
  // 1. Sync any expired passes first
  await syncExpiredListingPasses(ownerId);

  const now = new Date();

  // 2. Fetch published properties & active 30-day Listing Pass in parallel
  const [publishedProperties, activePass] = await Promise.all([
    prisma.property.findMany({
      where: {
        ownerId,
        status: "PUBLISHED",
        deletedAt: null,
      },
      select: { id: true },
    }),
    prisma.ownerListingPass.findFirst({
      where: {
        ownerId,
        status: "ACTIVE",
        expiresAt: { gte: now },
      },
      orderBy: {
        expiresAt: "desc",
      },
    }),
  ]);

  const publishedCount = publishedProperties.length;
  const isCurrentlyPublished = targetPropertyId
    ? publishedProperties.some((p) => p.id === targetPropertyId)
    : false;

  // If no active listing pass, check if they have a legacy active subscription
  let activeSub: any = null;
  if (!activePass) {
    activeSub = await prisma.ownerSubscription.findFirst({
      where: {
        ownerId,
        status: "ACTIVE",
        endDate: { gte: now },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // 4. Case: Owner has NO active Listing Pass or Subscription
  if (!activePass && !activeSub) {
    const latestExpired = await prisma.ownerListingPass.findFirst({
      where: { ownerId },
      orderBy: { expiresAt: "desc" },
    });

    const hasExpiredPass = Boolean(latestExpired);

    return {
      canPublish: false,
      activePass: null,
      activePlan: null,
      publishedCount,
      allowedCount: 0,
      isCurrentlyPublished,
      hasExpiredPass,
      reason: hasExpiredPass
        ? "Your StayKro 30-day Listing Pass has expired. Renew your pass to publish and keep your PG visible."
        : "You need an active 30-Day Listing Pass to publish your PG. Choose StayKro Solo (₹499) or StayKro Plus (₹999).",
      suggestedUpgrade: "SOLO",
    };
  }

  // 5. Case: Active Listing Pass
  if (activePass) {
    const planType = activePass.planType as "SOLO" | "PLUS";
    const allowedCount =
      planType === "PLUS"
        ? Math.max(activePass.propertyLimit, STAYKRO_BILLING_CONFIG.plusMaxProperties)
        : 1;

    const daysRemaining = Math.max(
      0,
      Math.ceil((activePass.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const isExpiringSoon = daysRemaining <= 5;
    const planName = planType === "PLUS" ? "StayKro Plus" : "StayKro Solo";

    const standardPrice =
      STAYKRO_BILLING_CONFIG.passes[planType]?.priceInr ||
      (planType === "PLUS" ? 999 : 499);

    const passData = {
      id: activePass.id,
      planType,
      name: `${planName} (30-Day Pass)`,
      amount: standardPrice,
      propertyLimit: allowedCount,
      startsAt: activePass.startsAt,
      expiresAt: activePass.expiresAt,
      daysRemaining,
      isExpiringSoon,
      status: activePass.status,
      razorpayOrderId: activePass.razorpayOrderId,
      razorpayPaymentId: activePass.razorpayPaymentId,
    };

    const legacyPlanData = {
      id: activePass.id,
      code: planType,
      name: `${planName} (30-Day Pass)`,
      priceInr: standardPrice,
      maxProperties: allowedCount,
      status: activePass.status,
      startDate: activePass.startsAt,
      endDate: activePass.expiresAt,
      autoRenew: false,
    };

    // If this specific property is already published, keep it published
    if (isCurrentlyPublished) {
      return {
        canPublish: true,
        activePass: passData,
        activePlan: legacyPlanData,
        publishedCount,
        allowedCount,
        isCurrentlyPublished: true,
      };
    }

    // Checking if owner can publish a new or draft property
    const canPublish = publishedCount < allowedCount;
    let reason: string | undefined;
    let suggestedUpgrade: "SOLO" | "PLUS" | null = null;

    if (!canPublish) {
      if (allowedCount === 1) {
        reason = `Your StayKro Solo 30-day pass allows 1 active property. You have reached your limit (${publishedCount}/${allowedCount}). Upgrade to StayKro Plus to publish more properties.`;
        suggestedUpgrade = "PLUS";
      } else {
        reason = `You have reached your StayKro Plus property limit (${publishedCount}/${allowedCount} published). Contact support if you need a higher portfolio allocation.`;
        suggestedUpgrade = null;
      }
    }

    return {
      canPublish,
      activePass: passData,
      activePlan: legacyPlanData,
      publishedCount,
      allowedCount,
      isCurrentlyPublished: false,
      reason,
      suggestedUpgrade,
    };
  }

  // 6. Legacy fallback for active subscription if any
  const planCode = activeSub.plan.code.toUpperCase();
  const allowedCount =
    planCode === "PLUS" || planCode === "OWNER_MULTI_PROPERTY"
      ? STAYKRO_BILLING_CONFIG.plusMaxProperties
      : activeSub.plan.maxProperties || 1;

  const legacyPlan = {
    id: activeSub.id,
    code: activeSub.plan.code,
    name: activeSub.plan.name,
    priceInr: activeSub.plan.priceInr,
    maxProperties: allowedCount,
    status: activeSub.status,
    startDate: activeSub.startDate,
    endDate: activeSub.endDate,
    autoRenew: false,
  };

  const daysRemaining = Math.max(
    0,
    Math.ceil((activeSub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const passEquivalent = {
    id: activeSub.id,
    planType: (planCode === "PLUS" ? "PLUS" : "SOLO") as "SOLO" | "PLUS",
    name: activeSub.plan.name,
    amount: activeSub.plan.priceInr,
    propertyLimit: allowedCount,
    startsAt: activeSub.startDate,
    expiresAt: activeSub.endDate,
    daysRemaining,
    isExpiringSoon: daysRemaining <= 5,
    status: activeSub.status,
  };

  const canPublish = isCurrentlyPublished || publishedCount < allowedCount;

  return {
    canPublish,
    activePass: passEquivalent,
    activePlan: legacyPlan,
    publishedCount,
    allowedCount,
    isCurrentlyPublished,
    reason: canPublish
      ? undefined
      : `Your pass limit has been reached (${publishedCount}/${allowedCount}). Upgrade to StayKro Plus to publish additional properties.`,
    suggestedUpgrade: allowedCount === 1 ? "PLUS" : null,
  };
}
