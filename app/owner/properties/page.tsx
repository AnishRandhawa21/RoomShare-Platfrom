import { Suspense } from "react";
import { getOwnerPropertiesAction } from "@/actions/owner";
import { OwnerPropertiesList } from "@/components/owner/OwnerPropertiesList";
import { requireOwner } from "@/lib/auth/session";

export const metadata = {
  title: "Owner Properties & Occupancy | StayKro",
  description: "Manage your PG properties, room types, bed inventory, and live tenant occupancy.",
};

async function PropertiesDataLoader() {
  await requireOwner("/owner/properties");
  const res = await getOwnerPropertiesAction();
  const properties = res.success ? res.properties : [];
  const hasOwnerProfile = res.hasOwnerProfile ?? false;

  return (
    <OwnerPropertiesList
      initialProperties={properties}
      hasOwnerProfile={hasOwnerProfile}
    />
  );
}

export default function OwnerPropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-zinc-500">Loading your property portfolio...</p>
        </div>
      }
    >
      <PropertiesDataLoader />
    </Suspense>
  );
}
