import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminReviewsAction } from "@/actions/admin";
import { AdminReviewsClient } from "@/components/admin/AdminReviewsClient";

export const metadata = {
  title: "Review Moderation | Admin Portal",
  description: "Monitor and moderate resident ratings, reviews, and community feedback.",
};

interface AdminReviewsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

async function ReviewsLoader({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdmin("/admin/reviews");
  const params = await searchParams;

  const res = await getAdminReviewsAction({
    status: (params.status as any) || "ALL",
    page: parseInt(params.page || "1", 10),
    limit: 15,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load reviews."}
      </div>
    );
  }

  return (
    <AdminReviewsClient
      initialReviews={res.data.reviews as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      initialFilters={{
        status: params.status,
      }}
    />
  );
}

export default function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      }
    >
      <ReviewsLoader searchParams={searchParams} />
    </Suspense>
  );
}
