import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import {
  getAdminPricingPlansAction,
  getAdminOwnerPricingOverridesAction,
} from "@/actions/pricing";
import { AdminPricingClient } from "@/components/admin/AdminPricingClient";

export const metadata = {
  title: "Pricing Plans & Monetization | StayKro Admin Portal",
  description: "Configure active prices, strikethrough discounts, and duration for Listing Passes and Visibility Boosts.",
};

async function PricingDataLoader() {
  await requireAdmin("/admin/pricing");

  const [res, overridesRes] = await Promise.all([
    getAdminPricingPlansAction(),
    getAdminOwnerPricingOverridesAction(),
  ]);

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load pricing plans."}
      </div>
    );
  }

  return (
    <AdminPricingClient
      initialPlans={res.data.plans as any}
      auditLogs={res.data.auditLogs as any}
      initialOverrides={(overridesRes.success ? overridesRes.data : []) as any}
    />
  );
}

export default function AdminPricingPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
          <div className="h-28 bg-slate-100 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-96 bg-slate-100 rounded-3xl" />
            <div className="h-96 bg-slate-100 rounded-3xl" />
            <div className="h-96 bg-slate-100 rounded-3xl" />
          </div>
        </div>
      }
    >
      <PricingDataLoader />
    </Suspense>
  );
}
