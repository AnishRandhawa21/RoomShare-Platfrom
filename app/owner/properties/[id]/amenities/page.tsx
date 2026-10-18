import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertyDetailAction, getCatalogAmenitiesAction } from "@/actions/owner";
import { PropertyAmenitiesClient } from "@/components/owner/PropertyAmenitiesClient";

interface PropertyAmenitiesPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Property Amenities | StayKro Owner",
  description: "Select and configure amenities and facilities for this property.",
};

async function AmenitiesLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}/amenities`);
  }

  const [propRes, catalogAmenities] = await Promise.all([
    getOwnerPropertyDetailAction(id),
    getCatalogAmenitiesAction(),
  ]);

  if (!propRes.success || !propRes.property) {
    notFound();
  }

  const selectedAmenityIds = propRes.property.amenities.map((pa: any) => pa.amenityId);

  return (
    <PropertyAmenitiesClient
      property={{
        id: propRes.property.id,
        name: propRes.property.name,
        slug: propRes.property.slug,
        status: propRes.property.status,
        selectedAmenityIds,
      }}
      catalogAmenities={catalogAmenities.success ? catalogAmenities.amenities : []}
    />
  );
}

export default function PropertyAmenitiesPage({ params }: PropertyAmenitiesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading amenities catalog...</p>
        </div>
      }
    >
      <AmenitiesLoader params={params} />
    </Suspense>
  );
}
