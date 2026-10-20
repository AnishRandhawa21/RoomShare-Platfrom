import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Server-side Razorpay Client Instance
 * Securely uses RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
 * Never exposed to browser.
 */
let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment."
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }

  return razorpayInstance;
}

/**
 * Validates Razorpay one-time order payment signature.
 * Expected format: HMAC_SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyRazorpayOrderSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  try {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (err) {
    console.error("verifyRazorpayOrderSignature error:", err);
    return false;
  }
}

/**
 * Validates Razorpay recurring subscription signature.
 * Expected format: HMAC_SHA256(payment_id + "|" + subscription_id, secret)
 */
export function verifyRazorpaySubscriptionSignature({
  paymentId,
  subscriptionId,
  signature,
}: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  try {
    const body = `${paymentId}|${subscriptionId}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (err) {
    console.error("verifyRazorpaySubscriptionSignature error:", err);
    return false;
  }
}

/**
 * Validates incoming Razorpay Webhook signature against raw request body.
 * Expected format: HMAC_SHA256(rawBody, webhookSecret)
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured in environment.");
    return false;
  }

  try {
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (err) {
    console.error("verifyRazorpayWebhookSignature error:", err);
    return false;
  }
}

/**
 * Creates a recurring Razorpay subscription for an owner.
 */
export async function createRazorpaySubscription({
  planId,
  totalCount = 60, // 5 years monthly default
  quantity = 1,
  customerNotify = 1,
  notes = {},
}: {
  planId: string;
  totalCount?: number;
  quantity?: number;
  customerNotify?: 0 | 1;
  notes?: Record<string, string>;
}) {
  const rzp = getRazorpayClient();
  const subscription = await rzp.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    quantity,
    customer_notify: customerNotify,
    notes,
  } as any);

  return subscription;
}

/**
 * Cancels an active Razorpay subscription.
 */
export async function cancelRazorpaySubscription({
  subscriptionId,
  cancelAtCycleEnd = false,
}: {
  subscriptionId: string;
  cancelAtCycleEnd?: boolean;
}) {
  const rzp = getRazorpayClient();
  const res = await rzp.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  return res;
}

/**
 * Creates a one-time Razorpay Order for Property Boosts.
 * Amount is converted from INR to paise (e.g. ₹99 -> 9900 paise).
 */
export async function createRazorpayOrder({
  amountInr,
  receipt,
  notes = {},
}: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const rzp = getRazorpayClient();
  const order = await rzp.orders.create({
    amount: Math.round(amountInr * 100), // in paise
    currency: "INR",
    receipt: receipt.slice(0, 40),
    payment_capture: true,
    notes,
  });

  return order;
}

/**
 * Fetches verified payment details from Razorpay API.
 */
export async function fetchRazorpayPayment(paymentId: string) {
  const rzp = getRazorpayClient();
  return await rzp.payments.fetch(paymentId);
}

/**
 * Fetches subscription details from Razorpay API.
 */
export async function fetchRazorpaySubscription(subscriptionId: string) {
  const rzp = getRazorpayClient();
  return await rzp.subscriptions.fetch(subscriptionId);
}
