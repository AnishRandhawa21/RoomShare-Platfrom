import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { STAYKRO_BILLING_CONFIG } from "@/config/billing";

export const runtime = "nodejs";

/**
 * Production-ready Razorpay Webhook Handler
 * Secure, idempotent, and handles full lifecycle for 30-Day Listing Passes and Property Boost Orders.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("Razorpay Webhook rejected: Missing x-razorpay-signature header");
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.error("Razorpay Webhook rejected: Cryptographic signature mismatch");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.log(`[Razorpay Webhook] Received event: ${eventType} (id: ${event.id || "N/A"})`);

    const payload = event.payload || {};

    // --------------------------------------------------------------------------
    // 1. One-Time Payment Events (30-Day Listing Passes & Property Boosts)
    // --------------------------------------------------------------------------

    if (eventType === "order.paid" || eventType === "payment.captured") {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id || payload.order?.entity?.id;
      const notes = paymentEntity?.notes || payload.order?.entity?.notes || {};

      if (orderId) {
        // A. Check if order is for an Owner Listing Pass
        const isListingPass =
          notes.paymentType === "OWNER_LISTING_PASS" ||
          (notes.planCode && (notes.planCode === "SOLO" || notes.planCode === "PLUS"));

        if (isListingPass) {
          const ownerId = notes.staykroOwnerId;
          const planCode = (notes.planCode || "SOLO") as "SOLO" | "PLUS";
          const passConfig = STAYKRO_BILLING_CONFIG.passes[planCode];

          if (ownerId && passConfig) {
            const now = new Date();

            // Check if this payment was already handled
            const existingPass = await prisma.ownerListingPass.findFirst({
              where: { razorpayOrderId: orderId },
            });

            if (!existingPass || existingPass.status !== "ACTIVE") {
              const currentActivePass = await prisma.ownerListingPass.findFirst({
                where: {
                  ownerId,
                  status: "ACTIVE",
                  expiresAt: { gte: now },
                },
                orderBy: { expiresAt: "desc" },
              });

              const activeLegacySub = await prisma.ownerSubscription.findFirst({
                where: {
                  ownerId,
                  status: "ACTIVE",
                  endDate: { gte: now },
                },
                orderBy: { endDate: "desc" },
              });

              let baseDate = now;
              if (currentActivePass && currentActivePass.expiresAt > baseDate) {
                baseDate = currentActivePass.expiresAt;
              }
              if (activeLegacySub && activeLegacySub.endDate > baseDate) {
                baseDate = activeLegacySub.endDate;
              }

              const startsAt = currentActivePass?.startsAt || now;
              const expiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

              const propertyLimit =
                planCode === "PLUS"
                  ? Math.max(passConfig.maxProperties, STAYKRO_BILLING_CONFIG.plusMaxProperties)
                  : 1;

              let listingPassRecord: any;
              if (existingPass) {
                listingPassRecord = await prisma.ownerListingPass.update({
                  where: { id: existingPass.id },
                  data: {
                    status: "ACTIVE",
                    expiresAt,
                    razorpayPaymentId: paymentEntity?.id || existingPass.razorpayPaymentId,
                  },
                });
              } else {
                listingPassRecord = await prisma.ownerListingPass.create({
                  data: {
                    ownerId,
                    planType: planCode,
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentEntity?.id || null,
                    amount: passConfig.priceInr,
                    currency: "INR",
                    propertyLimit,
                    startsAt,
                    expiresAt,
                    status: "ACTIVE",
                  },
                });
              }

              // Update Payment ledger
              if (paymentEntity?.id) {
                const owner = await prisma.ownerProfile.findUnique({
                  where: { id: ownerId },
                });

                if (owner) {
                  const existingPayment = await prisma.payment.findUnique({
                    where: { razorpayPaymentId: paymentEntity.id },
                  });

                  if (existingPayment) {
                    await prisma.payment.update({
                      where: { id: existingPayment.id },
                      data: {
                        status: "CAPTURED",
                        verifiedAt: now,
                        ownerListingPassId: listingPassRecord.id,
                      },
                    });
                  } else {
                    await prisma.payment.upsert({
                      where: { razorpayOrderId: orderId },
                      update: {
                        status: "CAPTURED",
                        razorpayPaymentId: paymentEntity.id,
                        verifiedAt: now,
                        ownerListingPassId: listingPassRecord.id,
                      },
                      create: {
                        userId: owner.userId,
                        amount: Math.round(paymentEntity.amount / 100),
                        currency: paymentEntity.currency || "INR",
                        purpose: "OWNER_LISTING_PASS",
                        status: "CAPTURED",
                        paymentType: "ONE_TIME",
                        razorpayOrderId: orderId,
                        razorpayPaymentId: paymentEntity.id,
                        paymentMethod: paymentEntity.method,
                        verifiedAt: now,
                        ownerListingPassId: listingPassRecord.id,
                        metadata: {
                          planCode,
                          planName: passConfig.name,
                          source: "WEBHOOK",
                        },
                      },
                    });
                  }
                }
              }
            }

            // Revert owner pricing to global catalog by deactivating custom discount override
            await prisma.ownerPricingOverride.updateMany({
              where: { ownerProfileId: ownerId, isActive: true },
              data: { isActive: false },
            });
          }
        }

        // B. Check if order belongs to a PropertyBoost
        const boost = await prisma.propertyBoost.findUnique({
          where: { razorpayOrderId: orderId },
        });

        if (boost) {
          const now = new Date();
          const boostEnd = new Date(now.getTime() + boost.durationDays * 24 * 60 * 60 * 1000);

          await prisma.propertyBoost.update({
            where: { id: boost.id },
            data: {
              status: "ACTIVE",
              startDate: now,
              endDate: boostEnd,
              razorpayPaymentId: paymentEntity?.id || boost.razorpayPaymentId,
            },
          });

          if (paymentEntity?.id) {
            const existingPayment = await prisma.payment.findUnique({
              where: { razorpayPaymentId: paymentEntity.id },
            });

            if (!existingPayment) {
              const owner = await prisma.ownerProfile.findUnique({
                where: { id: boost.ownerId },
              });

              if (owner) {
                await prisma.payment.create({
                  data: {
                    userId: owner.userId,
                    amount: Math.round(paymentEntity.amount / 100),
                    currency: paymentEntity.currency || "INR",
                    purpose: "PROPERTY_BOOST",
                    status: "CAPTURED",
                    paymentType: "PROPERTY_BOOST",
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentEntity.id,
                    paymentMethod: paymentEntity.method,
                    verifiedAt: new Date(),
                    propertyBoostId: boost.id,
                    metadata: {
                      event: eventType,
                      razorpayEventId: event.id,
                      propertyId: boost.propertyId,
                      boostType: boost.boostType,
                      source: "WEBHOOK",
                    },
                  },
                });
              }
            }
          }
        }
      }
    }

    // --------------------------------------------------------------------------
    // 2. Payment Failure Events
    // --------------------------------------------------------------------------

    if (eventType === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      if (paymentEntity?.id) {
        const orderId = paymentEntity.order_id;
        const notes = paymentEntity.notes || {};

        let userId: string | null = null;
        if (notes.staykroUserId) {
          userId = notes.staykroUserId;
        } else if (orderId) {
          const boost = await prisma.propertyBoost.findUnique({
            where: { razorpayOrderId: orderId },
            include: { owner: true },
          });
          if (boost) userId = boost.owner.userId;
        }

        if (userId) {
          await prisma.payment.create({
            data: {
              userId,
              amount: Math.round((paymentEntity.amount || 0) / 100),
              currency: paymentEntity.currency || "INR",
              purpose: notes.paymentType === "PROPERTY_BOOST" ? "PROPERTY_BOOST" : "OWNER_LISTING_PASS",
              status: "FAILED",
              paymentType: "ONE_TIME",
              razorpayOrderId: paymentEntity.order_id || null,
              razorpayPaymentId: paymentEntity.id,
              errorMessage: paymentEntity.error_description || "Payment failed at gateway",
              metadata: {
                event: "payment.failed",
                errorCode: paymentEntity.error_code,
                errorReason: paymentEntity.error_reason,
                razorpayEventId: event.id,
                source: "WEBHOOK",
              },
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error: any) {
    console.error("Razorpay webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing error", details: error?.message },
      { status: 500 }
    );
  }
}
