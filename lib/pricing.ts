import { prisma } from "@/lib/prisma";
import { STAYKRO_BILLING_CONFIG, type ListingPassPlanCode, type PropertyBoostType } from "@/config/billing";
import { unstable_cache } from "next/cache";

export const PRICING_CACHE_TAG = "system-pricing";

export interface EffectivePassConfig {
  code: ListingPassPlanCode;
  name: string;
  subtitle: string;
  priceInr: number;
  originalPriceInr?: number | null;
  durationDays: number;
  maxProperties: number;
  tagline: string;
  description: string;
  badge: string;
  features: string[];
  isActive: boolean;
}

export interface EffectiveBoostConfig {
  type: PropertyBoostType;
  days: number;
  priceInr: number;
  originalPriceInr?: number | null;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  isActive: boolean;
}

export interface EffectivePricingConfig {
  currency: string;
  plusMaxProperties: number;
  passes: {
    SOLO: EffectivePassConfig;
    PLUS: EffectivePassConfig;
  };
  boosts: {
    SEVEN_DAYS: EffectiveBoostConfig;
    FIFTEEN_DAYS: EffectiveBoostConfig;
    THIRTY_DAYS: EffectiveBoostConfig;
  };
}

export const CANONICAL_PLANS = [
  {
    code: "PASS_SOLO",
    category: "LISTING_PASS",
    name: STAYKRO_BILLING_CONFIG.passes.SOLO.name,
    subtitle: STAYKRO_BILLING_CONFIG.passes.SOLO.subtitle,
    tagline: STAYKRO_BILLING_CONFIG.passes.SOLO.tagline,
    description: STAYKRO_BILLING_CONFIG.passes.SOLO.description,
    badge: STAYKRO_BILLING_CONFIG.passes.SOLO.badge,
    priceInr: STAYKRO_BILLING_CONFIG.passes.SOLO.priceInr,
    originalPriceInr: 799,
    durationDays: STAYKRO_BILLING_CONFIG.passes.SOLO.durationDays,
    maxProperties: STAYKRO_BILLING_CONFIG.passes.SOLO.maxProperties,
    features: [...STAYKRO_BILLING_CONFIG.passes.SOLO.features],
    isActive: true,
  },
  {
    code: "PASS_PLUS",
    category: "LISTING_PASS",
    name: STAYKRO_BILLING_CONFIG.passes.PLUS.name,
    subtitle: STAYKRO_BILLING_CONFIG.passes.PLUS.subtitle,
    tagline: STAYKRO_BILLING_CONFIG.passes.PLUS.tagline,
    description: STAYKRO_BILLING_CONFIG.passes.PLUS.description,
    badge: STAYKRO_BILLING_CONFIG.passes.PLUS.badge,
    priceInr: STAYKRO_BILLING_CONFIG.passes.PLUS.priceInr,
    originalPriceInr: 1499,
    durationDays: STAYKRO_BILLING_CONFIG.passes.PLUS.durationDays,
    maxProperties: STAYKRO_BILLING_CONFIG.passes.PLUS.maxProperties,
    features: [...STAYKRO_BILLING_CONFIG.passes.PLUS.features],
    isActive: true,
  },
  {
    code: "BOOST_7_DAYS",
    category: "PROPERTY_BOOST",
    name: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.name,
    subtitle: "7-Day Promoted Search",
    tagline: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.tagline,
    description: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.description,
    badge: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.badge,
    priceInr: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.priceInr,
    originalPriceInr: 149,
    durationDays: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.days,
    maxProperties: 1,
    features: ["Top of local search results", "Verified promoted badge", "Valid for 7 full days"],
    isActive: true,
  },
  {
    code: "BOOST_15_DAYS",
    category: "PROPERTY_BOOST",
    name: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.name,
    subtitle: "15-Day Promoted Search",
    tagline: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.tagline,
    description: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.description,
    badge: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.badge,
    priceInr: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.priceInr,
    originalPriceInr: 249,
    durationDays: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.days,
    maxProperties: 1,
    features: ["High-visibility ranking boost", "Promoted ribbon banner", "Valid for 15 full days"],
    isActive: true,
  },
  {
    code: "BOOST_30_DAYS",
    category: "PROPERTY_BOOST",
    name: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.name,
    subtitle: "30-Day Promoted Search",
    tagline: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.tagline,
    description: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.description,
    badge: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.badge,
    priceInr: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.priceInr,
    originalPriceInr: 399,
    durationDays: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.days,
    maxProperties: 1,
    features: ["Maximum exposure across city", "Priority algorithm placement", "Valid for 30 full days"],
    isActive: true,
  },
];

/**
 * Ensures all canonical pricing plans exist in the database.
 * Non-destructive: Existing rows are kept untouched.
 */
export async function ensureDefaultPricingPlansSeeded() {
  try {
    const model = (prisma as any).systemPricingPlan;
    if (!model) {
      console.warn("prisma.systemPricingPlan is not yet available on Prisma client.");
      return;
    }

    for (const plan of CANONICAL_PLANS) {
      await model.upsert({
        where: { code: plan.code },
        update: {}, // keep existing values
        create: {
          code: plan.code,
          category: plan.category,
          name: plan.name,
          subtitle: plan.subtitle,
          tagline: plan.tagline,
          description: plan.description,
          badge: plan.badge,
          priceInr: plan.priceInr,
          originalPriceInr: plan.originalPriceInr,
          durationDays: plan.durationDays,
          maxProperties: plan.maxProperties,
          features: plan.features,
          isActive: plan.isActive,
        },
      });
    }
  } catch (err) {
    console.error("ensureDefaultPricingPlansSeeded error:", err);
  }
}

/**
 * Internal un-cached fetcher from database.
 */
async function fetchEffectivePricingFromDb(): Promise<EffectivePricingConfig> {
  // Safe default fallback structure
  const config: EffectivePricingConfig = {
    currency: "INR",
    plusMaxProperties: STAYKRO_BILLING_CONFIG.plusMaxProperties,
    passes: {
      SOLO: {
        code: "SOLO",
        name: STAYKRO_BILLING_CONFIG.passes.SOLO.name,
        subtitle: STAYKRO_BILLING_CONFIG.passes.SOLO.subtitle,
        priceInr: STAYKRO_BILLING_CONFIG.passes.SOLO.priceInr,
        originalPriceInr: 799,
        durationDays: STAYKRO_BILLING_CONFIG.passes.SOLO.durationDays,
        maxProperties: STAYKRO_BILLING_CONFIG.passes.SOLO.maxProperties,
        tagline: STAYKRO_BILLING_CONFIG.passes.SOLO.tagline,
        description: STAYKRO_BILLING_CONFIG.passes.SOLO.description,
        badge: STAYKRO_BILLING_CONFIG.passes.SOLO.badge,
        features: [...STAYKRO_BILLING_CONFIG.passes.SOLO.features],
        isActive: true,
      },
      PLUS: {
        code: "PLUS",
        name: STAYKRO_BILLING_CONFIG.passes.PLUS.name,
        subtitle: STAYKRO_BILLING_CONFIG.passes.PLUS.subtitle,
        priceInr: STAYKRO_BILLING_CONFIG.passes.PLUS.priceInr,
        originalPriceInr: 1499,
        durationDays: STAYKRO_BILLING_CONFIG.passes.PLUS.durationDays,
        maxProperties: STAYKRO_BILLING_CONFIG.passes.PLUS.maxProperties,
        tagline: STAYKRO_BILLING_CONFIG.passes.PLUS.tagline,
        description: STAYKRO_BILLING_CONFIG.passes.PLUS.description,
        badge: STAYKRO_BILLING_CONFIG.passes.PLUS.badge,
        features: [...STAYKRO_BILLING_CONFIG.passes.PLUS.features],
        isActive: true,
      },
    },
    boosts: {
      SEVEN_DAYS: {
        type: "SEVEN_DAYS",
        days: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.days,
        priceInr: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.priceInr,
        originalPriceInr: 149,
        name: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.name,
        tagline: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.tagline,
        description: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.description,
        badge: STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS.badge,
        isActive: true,
      },
      FIFTEEN_DAYS: {
        type: "FIFTEEN_DAYS",
        days: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.days,
        priceInr: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.priceInr,
        originalPriceInr: 249,
        name: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.name,
        tagline: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.tagline,
        description: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.description,
        badge: STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS.badge,
        isActive: true,
      },
      THIRTY_DAYS: {
        type: "THIRTY_DAYS",
        days: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.days,
        priceInr: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.priceInr,
        originalPriceInr: 399,
        name: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.name,
        tagline: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.tagline,
        description: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.description,
        badge: STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS.badge,
        isActive: true,
      },
    },
  };

  try {
    const model = (prisma as any).systemPricingPlan;
    if (!model) {
      return config;
    }

    const plans = await model.findMany({
      where: { isActive: true },
    });

    if (!plans || plans.length === 0) {
      // Lazy seed in background
      ensureDefaultPricingPlansSeeded().catch(() => {});
      return config;
    }

    for (const p of plans) {
      if (p.code === "PASS_SOLO") {
        config.passes.SOLO = {
          code: "SOLO",
          name: p.name || config.passes.SOLO.name,
          subtitle: p.subtitle || config.passes.SOLO.subtitle,
          priceInr: p.priceInr > 0 ? p.priceInr : config.passes.SOLO.priceInr,
          originalPriceInr: p.originalPriceInr,
          durationDays: p.durationDays || 30,
          maxProperties: p.maxProperties || 1,
          tagline: p.tagline || config.passes.SOLO.tagline,
          description: p.description || config.passes.SOLO.description,
          badge: p.badge || config.passes.SOLO.badge,
          features: p.features.length > 0 ? p.features : config.passes.SOLO.features,
          isActive: p.isActive,
        };
      } else if (p.code === "PASS_PLUS") {
        config.passes.PLUS = {
          code: "PLUS",
          name: p.name || config.passes.PLUS.name,
          subtitle: p.subtitle || config.passes.PLUS.subtitle,
          priceInr: p.priceInr > 0 ? p.priceInr : config.passes.PLUS.priceInr,
          originalPriceInr: p.originalPriceInr,
          durationDays: p.durationDays || 30,
          maxProperties: p.maxProperties || config.plusMaxProperties,
          tagline: p.tagline || config.passes.PLUS.tagline,
          description: p.description || config.passes.PLUS.description,
          badge: p.badge || config.passes.PLUS.badge,
          features: p.features.length > 0 ? p.features : config.passes.PLUS.features,
          isActive: p.isActive,
        };
        config.plusMaxProperties = config.passes.PLUS.maxProperties;
      } else if (p.code === "BOOST_7_DAYS") {
        config.boosts.SEVEN_DAYS = {
          type: "SEVEN_DAYS",
          days: p.durationDays || 7,
          priceInr: p.priceInr > 0 ? p.priceInr : config.boosts.SEVEN_DAYS.priceInr,
          originalPriceInr: p.originalPriceInr,
          name: p.name || config.boosts.SEVEN_DAYS.name,
          tagline: p.tagline || config.boosts.SEVEN_DAYS.tagline,
          description: p.description || config.boosts.SEVEN_DAYS.description,
          badge: p.badge || config.boosts.SEVEN_DAYS.badge,
          isActive: p.isActive,
        };
      } else if (p.code === "BOOST_15_DAYS") {
        config.boosts.FIFTEEN_DAYS = {
          type: "FIFTEEN_DAYS",
          days: p.durationDays || 15,
          priceInr: p.priceInr > 0 ? p.priceInr : config.boosts.FIFTEEN_DAYS.priceInr,
          originalPriceInr: p.originalPriceInr,
          name: p.name || config.boosts.FIFTEEN_DAYS.name,
          tagline: p.tagline || config.boosts.FIFTEEN_DAYS.tagline,
          description: p.description || config.boosts.FIFTEEN_DAYS.description,
          badge: p.badge || config.boosts.FIFTEEN_DAYS.badge,
          isActive: p.isActive,
        };
      } else if (p.code === "BOOST_30_DAYS") {
        config.boosts.THIRTY_DAYS = {
          type: "THIRTY_DAYS",
          days: p.durationDays || 30,
          priceInr: p.priceInr > 0 ? p.priceInr : config.boosts.THIRTY_DAYS.priceInr,
          originalPriceInr: p.originalPriceInr,
          name: p.name || config.boosts.THIRTY_DAYS.name,
          tagline: p.tagline || config.boosts.THIRTY_DAYS.tagline,
          description: p.description || config.boosts.THIRTY_DAYS.description,
          badge: p.badge || config.boosts.THIRTY_DAYS.badge,
          isActive: p.isActive,
        };
      }
    }
  } catch (err) {
    console.error("fetchEffectivePricingFromDb error (falling back to static billing config):", err);
  }

  return config;
}

/**
 * Cached fetcher for Next.js server runtime.
 */
const getCachedPricing = unstable_cache(
  async () => {
    return fetchEffectivePricingFromDb();
  },
  ["staykro-system-pricing"],
  {
    tags: [PRICING_CACHE_TAG],
    revalidate: 60, // 60s background revalidation fallback
  }
);

/**
 * Returns effective pricing config. Cached in Next.js, automatically falls back in CLI / scripts.
 */
export async function getEffectivePricingConfig(): Promise<EffectivePricingConfig> {
  try {
    return await getCachedPricing();
  } catch {
    // Falls back cleanly when called outside Next.js incremental cache (scripts, tests)
    return fetchEffectivePricingFromDb();
  }
}

/**
 * Owner-specific discount metadata attached to pricing config.
 */
export interface OwnerDiscountMeta {
  isApplied: boolean;
  discountType: "PERCENTAGE" | "FIXED_PRICE";
  percentageOff?: number | null;
  customSoloPrice?: number | null;
  customPlusPrice?: number | null;
  reason?: string | null;
  expiresAt?: string | null;
}

export interface EffectivePricingConfigWithDiscount extends EffectivePricingConfig {
  ownerDiscount?: OwnerDiscountMeta | null;
}

/**
 * Returns effective pricing config customized for a specific owner if an active override exists.
 */
export async function getEffectivePricingForOwner(
  ownerProfileId?: string | null
): Promise<EffectivePricingConfigWithDiscount> {
  const baseConfig = await getEffectivePricingConfig();
  if (!ownerProfileId) return baseConfig;

  try {
    const model = (prisma as any).ownerPricingOverride;
    if (!model) return baseConfig;

    const now = new Date();
    const override = await model.findFirst({
      where: {
        ownerProfileId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    });

    if (!override) return baseConfig;

    // If owner already holds an active pass created/extended after this override was issued,
    // the custom offer has already been availed. Deactivate it and return standard global catalog.
    const activePass = await prisma.ownerListingPass.findFirst({
      where: {
        ownerId: ownerProfileId,
        status: "ACTIVE",
        expiresAt: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (activePass) {
      const passTime = new Date(activePass.createdAt).getTime();
      const overrideTime = new Date(override.updatedAt || override.createdAt).getTime();
      if (passTime >= overrideTime - 60000) {
        await model
          .update({
            where: { id: override.id },
            data: { isActive: false },
          })
          .catch(() => {});
        return baseConfig;
      }
    }

    // Deep copy passes so we never mutate cached singleton in memory
    const customized: EffectivePricingConfigWithDiscount = {
      ...baseConfig,
      passes: {
        SOLO: { ...baseConfig.passes.SOLO },
        PLUS: { ...baseConfig.passes.PLUS },
      },
      ownerDiscount: {
        isApplied: true,
        discountType: override.discountType,
        percentageOff: override.percentageOff,
        customSoloPrice: override.customSoloPrice,
        customPlusPrice: override.customPlusPrice,
        reason: override.reason,
        expiresAt: override.expiresAt ? override.expiresAt.toISOString() : null,
      },
    };

    if (
      override.discountType === "PERCENTAGE" &&
      override.percentageOff &&
      override.percentageOff > 0
    ) {
      const pct = Math.min(Math.max(override.percentageOff, 1), 100);
      const soloBase = baseConfig.passes.SOLO.priceInr;
      const plusBase = baseConfig.passes.PLUS.priceInr;

      customized.passes.SOLO.originalPriceInr = soloBase;
      customized.passes.SOLO.priceInr = Math.max(0, Math.round(soloBase * (1 - pct / 100)));
      customized.passes.SOLO.badge = pct === 100 ? "100% Free Pass" : `${pct}% Partner Discount`;

      customized.passes.PLUS.originalPriceInr = plusBase;
      customized.passes.PLUS.priceInr = Math.max(0, Math.round(plusBase * (1 - pct / 100)));
      customized.passes.PLUS.badge = pct === 100 ? "100% Free Pass" : `${pct}% Partner Discount`;
    } else if (override.discountType === "FIXED_PRICE") {
      if (
        override.customSoloPrice !== null &&
        override.customSoloPrice !== undefined &&
        override.customSoloPrice >= 0
      ) {
        customized.passes.SOLO.originalPriceInr = baseConfig.passes.SOLO.priceInr;
        customized.passes.SOLO.priceInr = override.customSoloPrice;
        customized.passes.SOLO.badge =
          override.customSoloPrice === 0 ? "Complimentary Free Pass" : "Exclusive Partner Rate";
      }
      if (
        override.customPlusPrice !== null &&
        override.customPlusPrice !== undefined &&
        override.customPlusPrice >= 0
      ) {
        customized.passes.PLUS.originalPriceInr = baseConfig.passes.PLUS.priceInr;
        customized.passes.PLUS.priceInr = override.customPlusPrice;
        customized.passes.PLUS.badge =
          override.customPlusPrice === 0 ? "Complimentary Free Pass" : "Exclusive Partner Rate";
      }
    }

    return customized;
  } catch (err) {
    console.error("getEffectivePricingForOwner error:", err);
    return baseConfig;
  }
}

/**
 * Direct price getter for 30-Day Listing Pass (SOLO / PLUS), respecting owner overrides.
 */
export async function getListingPassPrice(
  planCode: ListingPassPlanCode = "SOLO",
  ownerProfileId?: string | null
): Promise<number> {
  const config = await getEffectivePricingForOwner(ownerProfileId);
  const plan = config.passes[planCode];
  return plan?.priceInr || STAYKRO_BILLING_CONFIG.passes[planCode].priceInr;
}

/**
 * Direct price getter for Property Boosts (7 / 15 / 30 days).
 */
export async function getPropertyBoostPrice(
  boostType: PropertyBoostType = "SEVEN_DAYS"
): Promise<number> {
  const config = await getEffectivePricingConfig();
  const boost = config.boosts[boostType];
  return boost?.priceInr || STAYKRO_BILLING_CONFIG.boosts[boostType].priceInr;
}
