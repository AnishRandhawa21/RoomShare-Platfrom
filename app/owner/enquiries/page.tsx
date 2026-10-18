import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerEnquiriesAction, getOwnerPropertiesAction } from "@/actions/owner";
import { OwnerEnquiriesClient } from "@/components/owner/OwnerEnquiriesClient";

export const metadata = {
  title: "Tenant Enquiries | StayKro Owner",
  description: "Manage phone leads, WhatsApp enquiries, and bookings across all your properties.",
};

async function EnquiriesDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/enquiries");
  }

  const [enquiriesRes, propertiesRes] = await Promise.all([
    getOwnerEnquiriesAction({ page: 1, limit: 50 }),
    getOwnerPropertiesAction(),
  ]);

  const enquiries = enquiriesRes.success && enquiriesRes.data ? enquiriesRes.data.enquiries : [];
  const total = enquiriesRes.success && enquiriesRes.data ? enquiriesRes.data.total : 0;
  const totalPages = enquiriesRes.success && enquiriesRes.data ? enquiriesRes.data.totalPages : 1;

  const propertiesList = (propertiesRes.properties || []).map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

  const serializedEnquiries = enquiries.map((e: any) => ({
    id: e.id,
    propertyId: e.propertyId,
    visitorName: e.visitorName,
    visitorPhone: e.visitorPhone,
    visitorEmail: e.visitorEmail,
    channel: e.channel,
    moveInDate: e.moveInDate ? e.moveInDate.toISOString() : null,
    message: e.message,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    property: e.property,
    roomType: e.roomType,
    user: e.user,
  }));

  return (
    <OwnerEnquiriesClient
      initialEnquiries={serializedEnquiries}
      total={total}
      page={1}
      totalPages={totalPages}
      propertiesList={propertiesList}
    />
  );
}

export default function OwnerEnquiriesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading discovery leads & enquiries...</p>
        </div>
      }
    >
      <EnquiriesDataLoader />
    </Suspense>
  );
}
