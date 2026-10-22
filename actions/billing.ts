"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { STAYKRO_BILLING_CONFIG, type ListingPassPlanCode, type PropertyBoostType } from "@/config/billing";
import { getEffectivePricingConfig, getEffectivePricingForOwner } from "@/lib/pricing";
import {
  createRazorpayOrder,
  verifyRazorpayOrderSignature,
} from "@/lib/razorpay";
import { getOwnerPublishingEntitlement } from "@/lib/billing-entitlements";

/**
 * Ensures authenticated user is an authorized owner and returns their owner profile.
 */
async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required. Please sign in.");
  }

  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!ownerProfile) {
    throw new Error("Owner profile not found. You must be registered as an owner to manage listing passes.");
  }

  return { user, ownerProfile };
}

/**
 * 1. Checks publishing entitlement for an owner and a specific property.
 */
export async function checkPublishingEntitlementAction(propertyId?: string) {
  try {
    const { ownerProfile } = await requireOwner();
    const entitlement = await getOwnerPublishingEntitlement(ownerProfile.id, propertyId);
    return { success: true, entitlement };
  } catch (error: unknown) {
    console.error("checkPublishingEntitlementAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify publishing entitlement.",
    };
  }
}

/**
 * 2. Creates a one-time Razorpay Order for a 30-Day Listing Pass (Solo ₹499 / Plus ₹999).
 * Non-recurring: This is a 30-day license, NOT an auto-renewing subscription.
 */
export async function createListingPassOrderAction(planCode: ListingPassPlanCode = "SOLO") {
  try {
    const { user, ownerProfile } = await requireOwner();
    const pricingConfig = await getEffectivePricingForOwner(ownerProfile.id);
    const passConfig = pricingConfig.passes[planCode];

    if (!passConfig) {
      return { success: false, error: "Invalid listing pass tier selected." };
    }

    const now = new Date();

    // Prevent owners with an active PLUS pass from purchasing or extending SOLO pass
    if (planCode === "SOLO") {
      const activePlusPass = await prisma.ownerListingPass.findFirst({
        where: {
          ownerId: ownerProfile.id,
          planType: "PLUS",
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
      });

      const activeLegacyPlus = await prisma.ownerSubscription.findFirst({
        where: {
          ownerId: ownerProfile.id,
          status: "ACTIVE",
          endDate: { gt: now },
          plan: { code: { in: ["PLUS", "OWNER_MULTI_PROPERTY"] } },
        },
      });

      if (activePlusPass || activeLegacyPlus) {
        return {
          success: false,
          error:
            "You currently have an active StayKro Plus pass. You can only purchase a Solo pass after your Plus pass expires.",
        };
      }
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      return {
        success: false,
        error: "Razorpay Key ID is not configured. Please set RAZORPAY_KEY_ID in environment.",
      };
    }

    // Amount in paise
    const amountPaise = passConfig.priceInr * 100;
    const receipt = `pass_${planCode.toLowerCase()}_${Date.now().toString().slice(-8)}`;

    const rzpOrder = await createRazorpayOrder({
      amountInr: passConfig.priceInr,
      receipt,
      notes: {
        staykroOwnerId: ownerProfile.id,
        staykroUserId: user.id,
        paymentType: "OWNER_LISTING_PASS",
        planCode,
        planName: passConfig.name,
      },
    });

    // Record pending transaction in database
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: passConfig.priceInr,
        currency: "INR",
        purpose: "OWNER_LISTING_PASS",
        status: "CREATED",
        paymentType: "ONE_TIME",
        razorpayOrderId: rzpOrder.id,
        metadata: {
          planCode,
          planName: passConfig.name,
          durationDays: 30,
          receipt,
        },
      },
    });

    return {
      success: true,
      orderId: rzpOrder.id,
      amountPaise,
      amountInr: passConfig.priceInr,
      keyId: razorpayKeyId,
      planCode,
      planName: passConfig.name,
      durationDays: 30,
      user: {
        email: user.email,
        phone: ownerProfile.contactPhone,
        name: ownerProfile.businessName || "Property Owner",
      },
    };
  } catch (error: unknown) {
    console.error("createListingPassOrderAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initiate listing pass order.",
    };
  }
}

/**
 * Activates a 100% Free / Complimentary Listing Pass directly without invoking Razorpay.
 * Strictly verifies server-side that the effective price for this owner is ₹0.
 */
export async function claimFreeListingPassAction(planCode: ListingPassPlanCode = "SOLO") {
  try {
    const { user, ownerProfile } = await requireOwner();
    const pricingConfig = await getEffectivePricingForOwner(ownerProfile.id);
    const passConfig = pricingConfig.passes[planCode];

    if (!passConfig) {
      return { success: false, error: "Invalid listing pass tier selected." };
    }

    if (passConfig.priceInr > 0) {
      return {
        success: false,
        error: `This pass is ₹${passConfig.priceInr} for your account. Please complete checkout to activate.`,
      };
    }

    const now = new Date();

    // Prevent owners with an active PLUS pass from claiming a SOLO pass
    if (planCode === "SOLO") {
      const activePlusPass = await prisma.ownerListingPass.findFirst({
        where: {
          ownerId: ownerProfile.id,
          planType: "PLUS",
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
      });

      const activeLegacyPlus = await prisma.ownerSubscription.findFirst({
        where: {
          ownerId: ownerProfile.id,
          status: "ACTIVE",
          endDate: { gt: now },
          plan: { code: { in: ["PLUS", "OWNER_MULTI_PROPERTY"] } },
        },
      });

      if (activePlusPass || activeLegacyPlus) {
        return {
          success: false,
          error:
            "You currently have an active StayKro Plus pass. You can only claim a Solo pass after your Plus pass expires.",
        };
      }
    }

    // 1. Check for existing active pass to calculate extension or start date
    const currentActivePass = await prisma.ownerListingPass.findFirst({
      where: {
        ownerId: ownerProfile.id,
        status: "ACTIVE",
        expiresAt: { gte: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    let baseDate = now;
    if (currentActivePass && currentActivePass.expiresAt > baseDate) {
      baseDate = currentActivePass.expiresAt;
    }

    // Determine expiration date:
    // If owner has an explicit expiresAt in override, honor that valid date; otherwise standard 30 days
    let expiresAt: Date;
    if (
      pricingConfig.ownerDiscount?.expiresAt &&
      new Date(pricingConfig.ownerDiscount.expiresAt) > now
    ) {
      expiresAt = new Date(pricingConfig.ownerDiscount.expiresAt);
    } else {
      expiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const startsAt = currentActivePass?.startsAt || now;
    const propertyLimit =
      planCode === "PLUS"
        ? Math.max(passConfig.maxProperties, STAYKRO_BILLING_CONFIG.plusMaxProperties)
        : 1;

    const receipt = `free_${planCode.toLowerCase()}_${Date.now().toString().slice(-8)}`;

    // Create or extend OwnerListingPass
    let listingPass: any;
    if (currentActivePass && currentActivePass.planType === planCode) {
      listingPass = await prisma.ownerListingPass.update({
        where: { id: currentActivePass.id },
        data: {
          expiresAt,
          amount: 0,
          status: "ACTIVE",
          razorpayPaymentId: "FREE_COMPLIMENTARY_GRANT",
          razorpayOrderId: null,
        },
      });
    } else {
      if (currentActivePass) {
        await prisma.ownerListingPass.update({
          where: { id: currentActivePass.id },
          data: { status: "EXPIRED" },
        });
      }

      listingPass = await prisma.ownerListingPass.create({
        data: {
          ownerId: ownerProfile.id,
          planType: planCode,
          amount: 0,
          currency: "INR",
          propertyLimit,
          startsAt,
          expiresAt,
          status: "ACTIVE",
          razorpayPaymentId: "FREE_COMPLIMENTARY_GRANT",
        },
      });
    }

    // Record complimentary transaction record for financial accounting
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 0,
        currency: "INR",
        purpose: "OWNER_LISTING_PASS",
        status: "CAPTURED",
        paymentType: "ONE_TIME",
        razorpayPaymentId: `FREE_${Date.now()}`,
        metadata: {
          planCode,
          planName: passConfig.name,
          durationDays: 30,
          receipt,
          isComplimentary: true,
          ownerDiscountReason: pricingConfig.ownerDiscount?.reason || "Admin Free Pass Grant",
        },
        ownerListingPassId: listingPass.id,
      },
    });

    // Revert owner pricing to global catalog by consuming/deactivating the custom discount override
    await prisma.ownerPricingOverride.updateMany({
      where: {
        ownerProfileId: ownerProfile.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/owner/subscription");
    revalidatePath("/owner/subscriptions");
    revalidatePath("/owner/properties");
    revalidatePath("/admin/pricing");
    revalidatePath("/admin/billing");

    return {
      success: true,
      message: `${passConfig.name} activated for free! Valid until ${expiresAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}.`,
      expiresAt: expiresAt.toISOString(),
      planName: passConfig.name,
    };
  } catch (error: unknown) {
    console.error("claimFreeListingPassAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to claim free listing pass.",
    };
  }
}

/**
 * 3. Cryptographically verifies Razorpay payment signature server-side and activates 30-day pass.
 *
 * Renewal Logic:
 * - If current pass is still active: extends from current expiresAt + 30 days.
 * - If pass has already expired or first purchase: starts from now + 30 days.
 * - Idempotent: repeated calls will not double-grant days.
 */
export async function verifyListingPassPaymentAction(input: {
  planCode: ListingPassPlanCode;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  try {
    const { user, ownerProfile } = await requireOwner();
    const pricingConfig = await getEffectivePricingForOwner(ownerProfile.id);
    const passConfig = pricingConfig.passes[input.planCode];

    if (!passConfig) {
      return { success: false, error: "Invalid listing pass tier." };
    }

    // 1. Verify cryptographic signature
    const isValid = verifyRazorpayOrderSignature({
      orderId: input.razorpay_order_id,
      paymentId: input.razorpay_payment_id,
      signature: input.razorpay_signature,
    });

    if (!isValid) {
      console.error("Cryptographic signature mismatch for listing pass order:", input);
      return {
        success: false,
        error: "Payment verification failed. Invalid cryptographic signature from Razorpay.",
      };
    }

    // 2. Check if this payment was already verified (idempotency)
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayPaymentId: input.razorpay_payment_id },
      include: { ownerListingPass: true },
    });

    if (existingPayment?.status === "CAPTURED" && existingPayment.ownerListingPass) {
      // Revert owner pricing to global catalog by consuming/deactivating the custom discount override
      await prisma.ownerPricingOverride.updateMany({
        where: {
          ownerProfileId: ownerProfile.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      revalidatePath("/owner/subscription");
      revalidatePath("/owner/subscriptions");
      revalidatePath("/owner/billing");
      revalidatePath("/owner/properties");
      revalidatePath("/admin/pricing");
      revalidatePath("/owner");

      return {
        success: true,
        message: `${passConfig.name} is active!`,
        planName: passConfig.name,
        expiresAt: existingPayment.ownerListingPass.expiresAt.toISOString(),
      };
    }

    const now = new Date();

    // 3. Check for existing active pass OR active subscription to calculate extension
    const currentActivePass = await prisma.ownerListingPass.findFirst({
      where: {
        ownerId: ownerProfile.id,
        status: "ACTIVE",
        expiresAt: { gte: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    const activeLegacySub = await prisma.ownerSubscription.findFirst({
      where: {
        ownerId: ownerProfile.id,
        status: "ACTIVE",
        endDate: { gte: now },
      },
      orderBy: { endDate: "desc" },
    });

    // Find the furthest future expiry across all active passes and subscriptions
    let baseDate = now;
    if (currentActivePass && currentActivePass.expiresAt > baseDate) {
      baseDate = currentActivePass.expiresAt;
    }
    if (activeLegacySub && activeLegacySub.endDate > baseDate) {
      baseDate = activeLegacySub.endDate;
    }

    const startsAt = currentActivePass?.startsAt || now;
    // Add 30 full days to baseDate
    const expiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const propertyLimit =
      input.planCode === "PLUS"
        ? Math.max(passConfig.maxProperties, STAYKRO_BILLING_CONFIG.plusMaxProperties)
        : 1;

    // 4. Create or update OwnerListingPass record
    let listingPass: any;
    if (currentActivePass && currentActivePass.planType === input.planCode) {
      // Extend current active pass by +30 days
      listingPass = await prisma.ownerListingPass.update({
        where: { id: currentActivePass.id },
        data: {
          expiresAt,
          razorpayOrderId: input.razorpay_order_id,
          razorpayPaymentId: input.razorpay_payment_id,
          amount: passConfig.priceInr,
          status: "ACTIVE",
        },
      });
    } else {
      // Expire previous active pass if upgrading (e.g. Solo to Plus)
      if (currentActivePass) {
        await prisma.ownerListingPass.update({
          where: { id: currentActivePass.id },
          data: { status: "EXPIRED" },
        });
      }

      listingPass = await prisma.ownerListingPass.create({
        data: {
          ownerId: ownerProfile.id,
          planType: input.planCode,
          razorpayOrderId: input.razorpay_order_id,
          razorpayPaymentId: input.razorpay_payment_id,
          amount: passConfig.priceInr,
          currency: "INR",
          propertyLimit,
          startsAt,
          expiresAt,
          status: "ACTIVE",
        },
      });
    }

    // 5. Update or record in Payments ledger
    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: "CAPTURED",
          verifiedAt: now,
          razorpayPaymentId: input.razorpay_payment_id,
          razorpaySignature: input.razorpay_signature,
          ownerListingPassId: listingPass.id,
        },
      });
    } else {
      // Check payment by orderId
      const paymentByOrder = await prisma.payment.findUnique({
        where: { razorpayOrderId: input.razorpay_order_id },
      });

      if (paymentByOrder) {
        await prisma.payment.update({
          where: { id: paymentByOrder.id },
          data: {
            status: "CAPTURED",
            verifiedAt: now,
            razorpayPaymentId: input.razorpay_payment_id,
            razorpaySignature: input.razorpay_signature,
            ownerListingPassId: listingPass.id,
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            userId: user.id,
            amount: passConfig.priceInr,
            currency: "INR",
            purpose: "OWNER_LISTING_PASS",
            status: "CAPTURED",
            paymentType: "ONE_TIME",
            razorpayOrderId: input.razorpay_order_id,
            razorpayPaymentId: input.razorpay_payment_id,
            razorpaySignature: input.razorpay_signature,
            verifiedAt: now,
            ownerListingPassId: listingPass.id,
            metadata: {
              planCode: input.planCode,
              planName: passConfig.name,
              durationDays: 30,
              verifiedVia: "FRONTEND_VERIFY_ACTION",
            },
          },
        });
      }
    }

    // Revert owner pricing to global catalog by consuming/deactivating the custom discount override
    await prisma.ownerPricingOverride.updateMany({
      where: {
        ownerProfileId: ownerProfile.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/owner/subscription");
    revalidatePath("/owner/subscriptions");
    revalidatePath("/owner/billing");
    revalidatePath("/owner/properties");
    revalidatePath("/admin/pricing");
    revalidatePath("/owner");

    return {
      success: true,
      message: `${passConfig.name} is active for 30 days!`,
      planName: passConfig.name,
      propertyLimit,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: unknown) {
    console.error("verifyListingPassPaymentAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify listing pass payment.",
    };
  }
}

// --------------------------------------------------------------------------
// Backward-Compatibility Wrappers for Components
// --------------------------------------------------------------------------

/**
 * Backward compatibility alias: initiates a 30-day listing pass order.
 */
export async function createSubscriptionOrderAction(planCode: ListingPassPlanCode = "SOLO") {
  return createListingPassOrderAction(planCode);
}

/**
 * Backward compatibility alias: verifies a 30-day listing pass payment.
 */
export async function verifySubscriptionPaymentAction(input: any) {
  // If called with razorpay_order_id, verify as order
  if (input.razorpay_order_id) {
    return verifyListingPassPaymentAction({
      planCode: input.planCode || "SOLO",
      razorpay_order_id: input.razorpay_order_id,
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_signature: input.razorpay_signature,
    });
  }

  // Fallback if legacy checkout returned subscriptionId
  return {
    success: true,
    planName: "StayKro Solo",
  };
}

/**
 * Cancel action for 30-day pass: Inform owner it expires naturally with no recurring charge.
 */
export async function cancelSubscriptionAction() {
  return {
    success: true,
    message: "StayKro Listing Passes do not auto-renew. Your pass will naturally expire at the end of its 30-day duration.",
  };
}

// --------------------------------------------------------------------------
// Property Boosts (One-Time Payments via Razorpay Orders)
// --------------------------------------------------------------------------

/**
 * 4. Creates a one-time Razorpay Order for a Property Boost (7, 15, or 30 Days).
 */
export async function createPropertyBoostOrderAction(input: {
  propertyId: string;
  boostType: PropertyBoostType;
}) {
  try {
    const { user, ownerProfile } = await requireOwner();
    const pricingConfig = await getEffectivePricingConfig();
    const boostConfig = pricingConfig.boosts[input.boostType];

    if (!boostConfig) {
      return { success: false, error: "Invalid boost duration tier." };
    }

    const property = await prisma.property.findFirst({
      where: {
        id: input.propertyId,
        ownerId: ownerProfile.id,
        deletedAt: null,
      },
    });

    if (!property) {
      return { success: false, error: "Property not found or unauthorized." };
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      return { success: false, error: "Razorpay Key ID is not configured." };
    }

    const receipt = `boost_${input.boostType.toLowerCase()}_${Date.now().toString().slice(-8)}`;

    const rzpOrder = await createRazorpayOrder({
      amountInr: boostConfig.priceInr,
      receipt,
      notes: {
        staykroOwnerId: ownerProfile.id,
        staykroPropertyId: property.id,
        propertyName: property.name,
        boostType: input.boostType,
        paymentType: "PROPERTY_BOOST",
      },
    });

    const boostRecord = await prisma.propertyBoost.create({
      data: {
        propertyId: property.id,
        ownerId: ownerProfile.id,
        boostType: input.boostType,
        durationDays: boostConfig.days,
        amountInr: boostConfig.priceInr,
        status: "PENDING_PAYMENT",
        razorpayOrderId: rzpOrder.id,
      },
    });

    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: boostConfig.priceInr,
        currency: "INR",
        purpose: "PROPERTY_BOOST",
        status: "CREATED",
        paymentType: "ONE_TIME",
        razorpayOrderId: rzpOrder.id,
        propertyBoostId: boostRecord.id,
        metadata: {
          propertyId: property.id,
          propertyName: property.name,
          boostType: input.boostType,
          durationDays: boostConfig.days,
        },
      },
    });

    return {
      success: true,
      orderId: rzpOrder.id,
      amountPaise: boostConfig.priceInr * 100,
      amountInr: boostConfig.priceInr,
      keyId: razorpayKeyId,
      propertyName: property.name,
      boostName: boostConfig.name,
      boostDays: boostConfig.days,
      user: {
        email: user.email,
        phone: ownerProfile.contactPhone,
        name: ownerProfile.businessName || "Property Owner",
      },
    };
  } catch (error: unknown) {
    console.error("createPropertyBoostOrderAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initiate boost order.",
    };
  }
}

/**
 * 5. Verifies Razorpay payment signature for a Property Boost and activates promotion.
 */
export async function verifyPropertyBoostPaymentAction(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  boostType: PropertyBoostType;
  propertyId?: string;
}) {
  try {
    const { ownerProfile } = await requireOwner();
    const pricingConfig = await getEffectivePricingConfig();
    const boostConfig = pricingConfig.boosts[input.boostType];

    const isValid = verifyRazorpayOrderSignature({
      orderId: input.razorpay_order_id,
      paymentId: input.razorpay_payment_id,
      signature: input.razorpay_signature,
    });

    if (!isValid) {
      return { success: false, error: "Boost verification failed. Signature mismatch." };
    }

    const boostRecord = await prisma.propertyBoost.findUnique({
      where: { razorpayOrderId: input.razorpay_order_id },
      include: { property: true },
    });

    if (!boostRecord || boostRecord.ownerId !== ownerProfile.id) {
      return { success: false, error: "Boost record not found or unauthorized." };
    }

    const now = new Date();
    const boostEnd = new Date(now.getTime() + boostRecord.durationDays * 24 * 60 * 60 * 1000);

    await prisma.propertyBoost.update({
      where: { id: boostRecord.id },
      data: {
        status: "ACTIVE",
        startDate: now,
        endDate: boostEnd,
        razorpayPaymentId: input.razorpay_payment_id,
      },
    });

    await prisma.payment.updateMany({
      where: { razorpayOrderId: input.razorpay_order_id },
      data: {
        status: "CAPTURED",
        razorpayPaymentId: input.razorpay_payment_id,
        razorpaySignature: input.razorpay_signature,
        verifiedAt: now,
      },
    });

    revalidatePath(`/pg/${boostRecord.property.city}/${boostRecord.property.locality}`);
    revalidatePath("/owner/properties");
    revalidatePath("/owner/subscription");
    revalidatePath("/");

    return {
      success: true,
      message: `Your property is now promoted for ${boostRecord.durationDays} days!`,
      boostName: boostConfig.name,
      endDate: boostEnd.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  } catch (error: unknown) {
    console.error("verifyPropertyBoostPaymentAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify boost payment.",
    };
  }
}

/**
 * 6. Returns full billing summary for owner dashboard.
 */
export async function getOwnerBillingSummaryAction() {
  try {
    const { ownerProfile } = await requireOwner();
    const now = new Date();

    const [entitlement, activePass, passesHistory, activeBoosts, payments, properties] =
      await Promise.all([
        getOwnerPublishingEntitlement(ownerProfile.id),
        prisma.ownerListingPass.findFirst({
          where: {
            ownerId: ownerProfile.id,
            status: "ACTIVE",
            expiresAt: { gte: now },
          },
          orderBy: { expiresAt: "desc" },
        }),
        prisma.ownerListingPass.findMany({
          where: { ownerId: ownerProfile.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.propertyBoost.findMany({
          where: {
            ownerId: ownerProfile.id,
            status: "ACTIVE",
            endDate: { gte: now },
          },
          include: {
            property: {
              select: { id: true, name: true, slug: true, locality: true, city: true },
            },
          },
          orderBy: { endDate: "desc" },
        }),
        prisma.payment.findMany({
          where: { userId: ownerProfile.userId },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            ownerListingPass: true,
            propertyBoost: {
              include: {
                property: { select: { name: true } },
              },
            },
          },
        }),
        prisma.property.findMany({
          where: { ownerId: ownerProfile.id, deletedAt: null },
          select: { id: true, name: true, slug: true, status: true, locality: true, city: true },
        }),
      ]);

    // If owner has an active custom pricing override that was already availed
    // (i.e. they possess an active pass created/extended on or after the override was issued),
    // automatically deactivate the consumed override so the subscription page reflects global catalog pricing.
    if (activePass) {
      const activeOverride = await prisma.ownerPricingOverride.findFirst({
        where: { ownerProfileId: ownerProfile.id, isActive: true },
      });

      if (activeOverride) {
        const passTime = new Date(activePass.createdAt).getTime();
        const overrideTime = new Date(activeOverride.updatedAt || activeOverride.createdAt).getTime();
        if (passTime >= overrideTime - 60000) {
          await prisma.ownerPricingOverride.update({
            where: { id: activeOverride.id },
            data: { isActive: false },
          });
        }
      }
    }

    const pricingConfig = await getEffectivePricingForOwner(ownerProfile.id);

    return {
      success: true,
      data: {
        entitlement,
        activePass,
        passesHistory,
        // Legacy alias for existing UI components
        activeSubscription: entitlement.activePlan,
        subscriptionsHistory: passesHistory.map((p) => ({
          id: p.id,
          status: p.status,
          startDate: p.startsAt,
          endDate: p.expiresAt,
          autoRenew: false,
          cancelledAt: null,
          plan: {
            id: p.id,
            code: p.planType,
            name: p.planType === "PLUS" ? "StayKro Plus" : "StayKro Solo",
            priceInr: p.amount ?? (p.planType === "PLUS" ? 999 : 499),
            maxProperties: p.propertyLimit,
          },
        })),
        activeBoosts,
        payments,
        properties,
        publishedPropertiesCount: entitlement.publishedCount,
        allowedPropertiesCount: entitlement.allowedCount,
        plansConfig: pricingConfig.passes,
        passesConfig: pricingConfig.passes,
        boostsConfig: pricingConfig.boosts,
        plusMaxProperties: pricingConfig.plusMaxProperties,
        ownerDiscount: pricingConfig.ownerDiscount,
      },
    };
  } catch (error: unknown) {
    console.error("getOwnerBillingSummaryAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load billing summary.",
    };
  }
}
