import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPaymentsAction } from "@/actions/owner";
import { OwnerPaymentsClient } from "@/components/owner/OwnerPaymentsClient";

export const metadata = {
  title: "Owner Payments & Billing | StayKro Owner",
  description: "Payment history, transaction records, and invoice receipts.",
};

async function PaymentsDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/payments");
  }

  const res = await getOwnerPaymentsAction({ page: 1, limit: 50 });
  const data = res.success && res.data ? res.data : { payments: [], total: 0, totalPages: 1 };

  const serializedPayments = data.payments.map((p: any) => ({
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    purpose: p.purpose,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    ownerSubscription: p.ownerSubscription
      ? { plan: { name: p.ownerSubscription.plan.name } }
      : null,
    featuredListing: p.featuredListing
      ? { pricingPlan: { name: p.featuredListing.pricingPlan.name } }
      : null,
  }));

  return (
    <OwnerPaymentsClient
      payments={serializedPayments}
      total={data.total}
      page={1}
      totalPages={data.totalPages}
    />
  );
}

export default function OwnerPaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading payment ledger...</p>
        </div>
      }
    >
      <PaymentsDataLoader />
    </Suspense>
  );
}
