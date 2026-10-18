import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertyDetailAction, getOwnerRoommateRequestsAction } from "@/actions/owner";
import { OwnerRoommatesClient } from "@/components/owner/OwnerRoommatesClient";

interface PropertyRoommatesPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Property Roommate Requests | StayKro Owner",
  description: "View roommate requests created under this property.",
};

async function RoommatesLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}/roommates`);
  }

  const [propRes, roommatesRes] = await Promise.all([
    getOwnerPropertyDetailAction(id),
    getOwnerRoommateRequestsAction({ propertyId: id }),
  ]);

  if (!propRes.success || !propRes.property) {
    notFound();
  }

  const requests = roommatesRes.success && roommatesRes.data ? roommatesRes.data.requests : [];
  const total = roommatesRes.success && roommatesRes.data ? roommatesRes.data.total : 0;

  const serializedRequests = requests.map((r: any) => {
    const moveIn = r.moveInDate || r.targetMoveInDate;
    const moveInIso = moveIn instanceof Date ? moveIn.toISOString() : (moveIn ? new Date(moveIn).toISOString() : new Date().toISOString());
    const createdIso = r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString());

    return {
      id: r.id,
      propertyId: r.propertyId || r.property?.id || "",
      roomTypeId: r.roomTypeId || r.roomType?.id || "",
      headline: r.title || r.headline || "Roommate Requirement",
      description: r.description || "",
      monthlyRent: r.rentPerPerson ?? r.monthlyRent ?? 0,
      securityDeposit: r.securityDeposit ?? 0,
      targetMoveInDate: moveInIso,
      roomSharingType: r.roomType?.name || r.roomTypeName || r.roomSharingType || "Room Sharing",
      flatmatesNeeded: r.requiredRoommateCount ?? r.flatmatesNeeded ?? 1,
      status: r.status,
      createdAt: createdIso,
      property: r.property || {
        id: propRes.property.id,
        name: propRes.property.name,
        slug: propRes.property.slug,
        locality: propRes.property.locality,
        city: propRes.property.city,
      },
      roomType: r.roomType || {
        id: r.roomTypeId || "",
        name: r.roomTypeName || "Room",
        occupancy: 2,
        rooms: [],
      },
      creator: r.creator || {
        id: "",
        email: "",
        profile: null,
      },
      preferences: r.preferences || null,
    };
  });

  return (
    <OwnerRoommatesClient
      initialRequests={serializedRequests}
      total={total}
      page={1}
      totalPages={1}
      propertyContext={{
        id: propRes.property.id,
        name: propRes.property.name,
        slug: propRes.property.slug,
        status: propRes.property.status,
      }}
    />
  );
}

export default function PropertyRoommatesPage({ params }: PropertyRoommatesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading roommate requests...</p>
        </div>
      }
    >
      <RoommatesLoader params={params} />
    </Suspense>
  );
}
