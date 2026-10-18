import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOverviewStatsAction } from "@/actions/admin";
import { AdminOverviewClient } from "@/components/admin/AdminOverviewClient";

export const metadata = {
  title: "Admin Overview | StayKro",
  description: "Live operational overview and platform metrics.",
};

async function OverviewDataLoader() {
  await requireAdmin("/admin");
  const res = await getAdminOverviewStatsAction();

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load admin overview metrics."}
      </div>
    );
  }

  return <AdminOverviewClient data={res.data} />;
}

export default function AdminOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-48 bg-zinc-200 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-zinc-100" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 rounded-2xl bg-zinc-100" />
            <div className="h-64 rounded-2xl bg-zinc-100" />
            <div className="h-64 rounded-2xl bg-zinc-100" />
          </div>
        </div>
      }
    >
      <OverviewDataLoader />
    </Suspense>
  );
}
