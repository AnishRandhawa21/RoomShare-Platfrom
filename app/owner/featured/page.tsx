import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerFeaturedListingsAction } from "@/actions/owner";
import { OwnerFeaturedClient } from "@/components/owner/OwnerFeaturedClient";

export const metadata = {
  title: "Featured Listings | StayKro Owner",
  description: "Promote your PG listings and boost search rank across your locality.",
};

async function FeaturedDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/featured");
  }

  const res = await getOwnerFeaturedListingsAction();
  const data =
    res.success && res.data
      ? res.data
      : { featuredListings: [], pricingConfig: null, properties: [] };

  const campaigns = (data.featuredListings || []).map((c: any) => ({
    id: c.id,
    status: c.status,
    startDate:
      c.startDate instanceof Date
        ? c.startDate.toISOString()
        : new Date(c.startDate).toISOString(),
    endDate: c.endDate
      ? c.endDate instanceof Date
        ? c.endDate.toISOString()
        : new Date(c.endDate).toISOString()
      : "",
    property: c.property,
    roomType: c.roomType,
    pricingPlan: {
      name: c.pricingPlan.name,
      priceInr: c.pricingPlan.priceInr,
      durationDays: c.pricingPlan.durationDays,
    },
  }));

  const properties = (data.properties || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    locality: p.locality,
    city: p.city,
  }));

  return (
    <OwnerFeaturedClient
      campaigns={campaigns}
      properties={properties}
      boostsConfig={data.pricingConfig?.boosts}
    />
  );
}

export default function OwnerFeaturedPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading promotion campaigns...</p>
        </div>
      }
    >
      <FeaturedDataLoader />
    </Suspense>
  );
}
