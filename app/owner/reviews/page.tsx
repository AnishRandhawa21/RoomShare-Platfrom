import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerReviewsAction } from "@/actions/owner";
import { OwnerReviewsClient } from "@/components/owner/OwnerReviewsClient";

export const metadata = {
  title: "Resident Ratings & Reviews | StayKro Owner",
  description: "Monitor resident satisfaction, cleanliness scores, and feedback across all your PG properties.",
};

async function GlobalReviewsDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/reviews");
  }

  const reviewsRes = await getOwnerReviewsAction();

  const reviews = reviewsRes.success && reviewsRes.data ? reviewsRes.data.reviews : [];
  const stats = reviewsRes.success && reviewsRes.data ? reviewsRes.data.stats : {
    totalReviews: 0,
    averageRating: null,
    avgCleanliness: null,
    avgSafety: null,
    avgFood: null,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };
  const properties = reviewsRes.success && reviewsRes.data ? reviewsRes.data.properties : [];

  return (
    <OwnerReviewsClient
      initialReviews={reviews}
      stats={stats}
      propertiesList={properties}
    />
  );
}

export default function OwnerGlobalReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading resident ratings & reviews portfolio...</p>
        </div>
      }
    >
      <GlobalReviewsDataLoader />
    </Suspense>
  );
}
