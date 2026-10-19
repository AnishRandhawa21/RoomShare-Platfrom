import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertyDetailAction, getOwnerReviewsAction } from "@/actions/owner";
import { OwnerReviewsClient } from "@/components/owner/OwnerReviewsClient";

interface PropertyReviewsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Property Ratings & Reviews | StayKro Owner",
  description: "View verified resident feedback, star ratings, cleanliness, and food quality scores.",
};

async function PropertyReviewsLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}/reviews`);
  }

  const [propRes, reviewsRes] = await Promise.all([
    getOwnerPropertyDetailAction(id),
    getOwnerReviewsAction({ propertyId: id }),
  ]);

  if (!propRes.success || !propRes.property) {
    notFound();
  }

  const reviews = reviewsRes.success && reviewsRes.data ? reviewsRes.data.reviews : [];
  const stats = reviewsRes.success && reviewsRes.data ? reviewsRes.data.stats : {
    totalReviews: 0,
    averageRating: null,
    avgCleanliness: null,
    avgSafety: null,
    avgFood: null,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  return (
    <OwnerReviewsClient
      initialReviews={reviews}
      stats={stats}
      propertyContext={{
        id: propRes.property.id,
        name: propRes.property.name,
        slug: propRes.property.slug,
        status: propRes.property.status,
      }}
    />
  );
}

export default function PropertyReviewsPage({ params }: PropertyReviewsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading property ratings & reviews...</p>
        </div>
      }
    >
      <PropertyReviewsLoader params={params} />
    </Suspense>
  );
}
