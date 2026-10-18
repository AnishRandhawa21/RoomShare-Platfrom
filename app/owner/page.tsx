import { Suspense } from "react";
import { requireOwner } from "@/lib/auth/session";
import { getOwnerDashboardMetricsAction } from "@/actions/owner";
import { OwnerDashboardClient } from "@/components/owner/OwnerDashboardClient";

export const metadata = {
  title: "Owner Dashboard | StayKro",
  description: "Real-time occupancy metrics, live bed availability, and resident lead management.",
};

async function DashboardDataLoader() {
  await requireOwner("/owner");
  const res = await getOwnerDashboardMetricsAction();

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load owner dashboard statistics."}
      </div>
    );
  }

  return <OwnerDashboardClient metrics={res.data as any} />;
}

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      }
    >
      <DashboardDataLoader />
    </Suspense>
  );
}
