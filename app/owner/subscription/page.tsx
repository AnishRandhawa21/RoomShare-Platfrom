import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerBillingSummaryAction } from "@/actions/billing";
import { OwnerSubscriptionClient } from "@/components/owner/OwnerSubscriptionClient";

export const metadata = {
  title: "Subscription & Billing | StayKro Owner",
  description: "View current subscription status, partner plans, property quota, and billing history.",
};

async function SubscriptionDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/subscription");
  }

  const res = await getOwnerBillingSummaryAction();
  if (!res.success || !res.data) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-800">
        {res.error || "Unable to load billing data. Please try again later."}
      </div>
    );
  }

  const data = res.data;

  const serializeSub = (s: any) => {
    if (!s) return null;
    const planObj = s.plan || s;
    return {
      id: s.id,
      status: s.status,
      startDate: s.startDate instanceof Date ? s.startDate.toISOString() : s.startDate || "",
      endDate: s.endDate instanceof Date ? s.endDate.toISOString() : s.endDate || "",
      autoRenew: Boolean(s.autoRenew),
      cancelledAt: s.cancelledAt
        ? s.cancelledAt instanceof Date
          ? s.cancelledAt.toISOString()
          : s.cancelledAt
        : null,
      razorpaySubscriptionId: s.razorpaySubscriptionId || s.razorpayOrderId || null,
      plan: {
        id: planObj.id || s.id,
        code: planObj.code || planObj.planType || "SOLO",
        name: planObj.name || "StayKro Listing Pass",
        priceInr: planObj.priceInr || planObj.amount || 499,
        maxProperties: planObj.maxProperties || planObj.propertyLimit || 1,
      },
    };
  };

  const serializeBoost = (b: any) => ({
    id: b.id,
    boostType: b.boostType,
    durationDays: b.durationDays,
    amountInr: b.amountInr,
    startDate: b.startDate ? b.startDate.toISOString() : null,
    endDate: b.endDate ? b.endDate.toISOString() : null,
    status: b.status,
    property: {
      id: b.property.id,
      name: b.property.name,
      slug: b.property.slug,
      locality: b.property.locality,
      city: b.property.city,
    },
  });

  const serializePayment = (p: any) => ({
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    purpose: p.purpose,
    paymentType: p.paymentType,
    status: p.status,
    razorpayPaymentId: p.razorpayPaymentId,
    razorpayOrderId: p.razorpayOrderId,
    createdAt: p.createdAt.toISOString(),
    ownerSubscription: p.ownerSubscription
      ? { plan: { name: p.ownerSubscription.plan.name } }
      : null,
    propertyBoost: p.propertyBoost
      ? { property: { name: p.propertyBoost.property.name } }
      : null,
  });

  return (
    <OwnerSubscriptionClient
      activeSubscription={serializeSub(data.activeSubscription)}
      subscriptionsHistory={
        data.subscriptionsHistory
          .map(serializeSub)
          .filter((s): s is NonNullable<ReturnType<typeof serializeSub>> => s !== null)
      }
      activeBoosts={data.activeBoosts.map(serializeBoost)}
      payments={data.payments.map(serializePayment)}
      properties={data.properties}
      publishedPropertiesCount={data.publishedPropertiesCount}
      allowedPropertiesCount={data.allowedPropertiesCount}
      plansConfig={data.plansConfig as any}
      boostsConfig={data.boostsConfig}
      plusMaxProperties={data.plusMaxProperties}
    />
  );
}

export default function OwnerSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00412E] border-t-transparent mx-auto mb-4" />
          <p className="text-xs font-semibold text-zinc-500">Loading partner subscription data...</p>
        </div>
      }
    >
      <SubscriptionDataLoader />
    </Suspense>
  );
}
