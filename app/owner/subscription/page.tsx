import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerSubscriptionAction } from "@/actions/owner";
import { OwnerSubscriptionClient } from "@/components/owner/OwnerSubscriptionClient";

export const metadata = {
  title: "Owner Subscription & Plans | StayKro Owner",
  description: "View current subscription status, partner plans, and billing history.",
};

async function SubscriptionDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/subscription");
  }

  const res = await getOwnerSubscriptionAction();
  const data = res.success && res.data ? res.data : { activeSubscription: null, plans: [], history: [] };

  const serializePlan = (p: any) => ({
    id: p.id,
    name: p.name,
    priceInr: p.priceInr,
    interval: p.interval,
    propertyLimit: p.propertyLimit,
    features: (p.features as string[]) || [],
    description: p.description,
  });

  const serializeSub = (s: any) => {
    if (!s) return null;
    return {
      id: s.id,
      status: s.status,
      currentPeriodStart: s.currentPeriodStart.toISOString(),
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
      autoRenew: s.autoRenew,
      plan: serializePlan(s.plan),
      payments: s.payments?.map((pm: any) => ({
        id: pm.id,
        amount: pm.amount,
        status: pm.status,
        createdAt: pm.createdAt.toISOString(),
      })),
    };
  };

  return (
    <OwnerSubscriptionClient
      activeSubscription={serializeSub(data.activeSubscription)}
      plans={data.plans.map(serializePlan)}
      history={data.history.map(serializeSub).filter(Boolean) as any}
    />
  );
}

export default function OwnerSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading partner subscription data...</p>
        </div>
      }
    >
      <SubscriptionDataLoader />
    </Suspense>
  );
}
