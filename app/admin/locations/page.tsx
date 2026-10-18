import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminLocationsAction } from "@/actions/admin";
import { AdminLocationsClient } from "@/components/admin/AdminLocationsClient";

export const metadata = {
  title: "Location Master Data | Admin Portal",
  description: "Manage hierarchical states, cities, and localities for property onboarding.",
};

async function LocationsDataLoader() {
  await requireAdmin("/admin/locations");
  const res = await getAdminLocationsAction();

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load location master data."}
      </div>
    );
  }

  return (
    <AdminLocationsClient
      states={res.data.states as any}
      pendingLocalityRequests={res.data.pendingLocalityRequests as any}
    />
  );
}

export default function AdminLocationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-zinc-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-96 rounded-2xl bg-zinc-100" />
            <div className="h-96 rounded-2xl bg-zinc-100" />
            <div className="h-96 rounded-2xl bg-zinc-100" />
          </div>
        </div>
      }
    >
      <LocationsDataLoader />
    </Suspense>
  );
}
