import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminBillingDashboardAction } from "@/actions/admin";
import { AdminBillingClient } from "@/components/admin/AdminBillingClient";

export const metadata = {
  title: "Billing & Revenue | Admin Portal",
  description: "Monitor subscriptions, Razorpay transactions, boost purchases, and plan distribution.",
};

async function BillingDataLoader() {
  await requireAdmin("/admin/billing");

  const res = await getAdminBillingDashboardAction();

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load admin billing data."}
      </div>
    );
  }

  return <AdminBillingClient data={res.data} />;
}

export default function AdminBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      }
    >
      <BillingDataLoader />
    </Suspense>
  );
}
