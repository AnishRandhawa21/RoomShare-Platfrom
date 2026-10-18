import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerRoommateRequestsAction, getOwnerPropertiesAction } from "@/actions/owner";
import { OwnerRoommatesClient } from "@/components/owner/OwnerRoommatesClient";

export const metadata = {
  title: "Roommate Requests | StayKro Owner",
  description: "Manage and monitor tenant roommate posts across your properties.",
};

async function RoommatesDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/roommate-requests");
  }

  const [requestsRes, propertiesRes] = await Promise.all([
    getOwnerRoommateRequestsAction({ page: 1, limit: 50 }),
    getOwnerPropertiesAction(),
  ]);

  const requests = requestsRes.success && requestsRes.data ? requestsRes.data.requests : [];
  const total = requestsRes.success && requestsRes.data ? requestsRes.data.total : 0;
  const totalPages = requestsRes.success && requestsRes.data ? requestsRes.data.totalPages : 1;

  const propertiesList = (propertiesRes.properties || []).map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

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
        id: r.propertyId || "",
        name: r.propertyName || "Property",
        slug: r.property?.slug || "",
        locality: r.locality || "",
        city: r.city || "",
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
      totalPages={totalPages}
      propertiesList={propertiesList}
    />
  );
}

export default function OwnerRoommateRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading roommate requests...</p>
        </div>
      }
    >
      <RoommatesDataLoader />
    </Suspense>
  );
}
