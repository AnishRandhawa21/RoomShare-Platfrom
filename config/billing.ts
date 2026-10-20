/**
 * Centralized StayKro Billing & Subscription Configuration
 * Single source of truth for plans, property allowances, boost pricing, and Razorpay IDs.
 */

export const STAYKRO_BILLING_CONFIG = {
  currency: "INR",
  // Configurable application property limit for StayKro Plus
  plusMaxProperties: Number(process.env.STAYKRO_PLUS_PROPERTY_LIMIT) || 10,

  // 30-Day Listing Passes (Non-recurring one-time payments)
  passes: {
    SOLO: {
      code: "SOLO",
      name: "StayKro Solo",
      subtitle: "30-Day Listing Pass",
      priceInr: 499,
      durationDays: 30,
      maxProperties: 1,
      tagline: "For Independent PG Owners",
      description: "Keep 1 verified property live and published for 30 days with direct tenant leads.",
      badge: "Single PG • 30 Days",
      features: [
        "Publish 1 Live PG Property for 30 Days",
        "Full Bed & Room Inventory Management",
        "Direct Phone & WhatsApp Enquiry Leads",
        "Verified Owner Badge Eligibility",
        "Real-Time Tenant Chat & Inquiries",
        "Zero Commission • One-Time Payment",
      ],
    },
    PLUS: {
      code: "PLUS",
      name: "StayKro Plus",
      subtitle: "30-Day Portfolio Pass",
      priceInr: 999,
      durationDays: 30,
      maxProperties: Number(process.env.STAYKRO_PLUS_PROPERTY_LIMIT) || 10,
      tagline: "For Multi-Property Hospitality Partners",
      description: "Keep multiple PG properties active for 30 days with priority discovery visibility.",
      badge: "Multi-PG • 30 Days",
      features: [
        `Publish Multiple PGs (Up to ${Number(process.env.STAYKRO_PLUS_PROPERTY_LIMIT) || 10} Properties)`,
        "Valid for 30 Days across all listed PGs",
        "Priority Search & Discovery Algorithm Boost",
        "Multi-Property Centralized Occupancy Hub",
        "Direct Phone & WhatsApp Tenant Enquiries",
        "Zero Commission • One-Time Payment",
      ],
    },
  },

  // Backwards compatibility alias for plans
  get plans() {
    return this.passes;
  },

  // Property Boost Tiers (One-Time Payments via Razorpay Orders)
  boosts: {
    SEVEN_DAYS: {
      type: "SEVEN_DAYS" as const,
      days: 7,
      priceInr: 99,
      name: "7-Day Visibility Boost",
      tagline: "Quick Vacancy Fill",
      description: "Highlight your property at the top of local searches for 7 days.",
      badge: "Fast Results",
    },
    FIFTEEN_DAYS: {
      type: "FIFTEEN_DAYS" as const,
      days: 15,
      priceInr: 149,
      name: "15-Day Visibility Boost",
      tagline: "Sustained Priority",
      description: "15 days of prominent search placement and verified promoted badge.",
      badge: "Best Value",
    },
    THIRTY_DAYS: {
      type: "THIRTY_DAYS" as const,
      days: 30,
      priceInr: 249,
      name: "30-Day Visibility Boost",
      tagline: "Maximum Exposure",
      description: "A full month of top-tier search discovery to maximize enquiry volume.",
      badge: "Maximum Leads",
    },
  },
} as const;

export type ListingPassPlanCode = "SOLO" | "PLUS";
export type SubscriptionPlanCode = ListingPassPlanCode;
export type PropertyBoostType = keyof typeof STAYKRO_BILLING_CONFIG.boosts;
