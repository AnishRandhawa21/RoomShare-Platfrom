import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminFeaturedListingsAction } from "@/actions/admin";
import { AdminFeaturedClient } from "@/components/admin/AdminFeaturedClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Featured Listings & Boosts | Admin Portal",
  description: "Manage sponsored listings, homepage features, and promotional visibility ranks.",
};

interface AdminFeaturedPageProps {
  searchParams: Promise<{
    page?: string;
    filter?: string;
    q?: string;
  }>;
}

async function FeaturedLoader({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>;
}) {
  await requireAdmin("/admin/featured");
  const params = await searchParams;

  const res = await getAdminFeaturedListingsAction({
    page: parseInt(params.page || "1", 10),
    limit: 15,
    filter: params.filter as any,
    search: params.q,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load featured listings."}
      </div>
    );
  }

  return (
    <AdminFeaturedClient
      initialFeatured={res.data.featured as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      counts={res.data.counts}
    />
  );
}

export default function AdminFeaturedPage({ searchParams }: AdminFeaturedPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      }
    >
      <FeaturedLoader searchParams={searchParams} />
    </Suspense>
  );
}
