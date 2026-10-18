import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertyDetailAction, getOwnerEnquiriesAction } from "@/actions/owner";
import { OwnerEnquiriesClient } from "@/components/owner/OwnerEnquiriesClient";

interface PropertyEnquiriesPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Property Enquiries | StayKro Owner",
  description: "View visitor enquiries and contact leads for this property.",
};

async function EnquiriesLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}/enquiries`);
  }

  const [propRes, enquiriesRes] = await Promise.all([
    getOwnerPropertyDetailAction(id),
    getOwnerEnquiriesAction({ propertyId: id }),
  ]);

  if (!propRes.success || !propRes.property) {
    notFound();
  }

  const enquiries = enquiriesRes.success && enquiriesRes.data ? enquiriesRes.data.enquiries : [];
  const total = enquiriesRes.success && enquiriesRes.data ? enquiriesRes.data.total : 0;

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

export default function PropertyEnquiriesPage({ params }: PropertyEnquiriesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading property enquiries...</p>
        </div>
      }
    >
      <EnquiriesLoader params={params} />
    </Suspense>
  );
}
