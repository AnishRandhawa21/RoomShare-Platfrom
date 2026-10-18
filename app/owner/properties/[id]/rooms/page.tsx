import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getPropertyInventoryAction } from "@/actions/owner";
import { RoomInventoryManager } from "@/components/owner/RoomInventoryManager";
import { getCurrentUser } from "@/lib/auth/session";

interface RoomInventoryPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Room Inventory & Occupancy | StayKro Owner",
  description: "Live occupancy tracking and bed inventory management.",
};

async function InventoryDataLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}/rooms`);
  }

  const res = await getPropertyInventoryAction(id);

  if (!res.success || !res.property || !res.stats) {
    notFound();
  }

  return (
    <RoomInventoryManager
      initialProperty={res.property}
      initialStats={res.stats}
    />
  );
}

export default function PropertyRoomsPage({ params }: RoomInventoryPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-zinc-500">Loading room inventory & beds...</p>
        </div>
      }
    >
      <InventoryDataLoader params={params} />
    </Suspense>
  );
}
