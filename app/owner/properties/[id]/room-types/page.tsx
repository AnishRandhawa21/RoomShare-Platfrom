import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertyDetailAction } from "@/actions/owner";
import { RoomTypesManager } from "@/components/owner/RoomTypesManager";

interface RoomTypesPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Manage Room Types & Pricing | StayKro Owner",
  description: "Configure room types, pricing, amenities, and room images.",
};

async function RoomTypesLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}/room-types`);
  }

  const res = await getOwnerPropertyDetailAction(id);
  if (!res.success || !res.property) {
    notFound();
  }

  const serialized = {
    id: res.property.id,
    name: res.property.name,
    slug: res.property.slug,
    status: res.property.status,
    roomTypes: res.property.roomTypes.map((rt: any) => ({
      id: rt.id,
      propertyId: rt.propertyId,
      name: rt.name,
      occupancy: rt.occupancy,
      monthlyRent: rt.monthlyRent,
      securityDeposit: rt.securityDeposit,
      maintenanceCharges: rt.maintenanceCharges,
      foodCharges: rt.foodCharges,
      hasAttachedBathroom: rt.hasAttachedBathroom,
      hasBalcony: rt.hasBalcony,
      hasAirConditioning: rt.hasAirConditioning,
      genderRestriction: rt.genderRestriction,
      isActive: rt.isActive,
      rooms: rt.rooms?.map((r: any) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        occupiedBeds: r.occupiedBeds,
        status: r.status,
      })),
      images: rt.images?.map((img: any) => ({
        id: img.id,
        url: img.url,
        storageKey: img.storageKey,
        altText: img.altText,
      })),
    })),
  };

  return <RoomTypesManager property={serialized} />;
}

export default function PropertyRoomTypesPage({ params }: RoomTypesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading room types & pricing...</p>
        </div>
      }
    >
      <RoomTypesLoader params={params} />
    </Suspense>
  );
}
