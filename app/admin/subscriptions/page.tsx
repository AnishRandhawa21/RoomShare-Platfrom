import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSubscriptionsAction } from "@/actions/admin";
import { AdminSubscriptionsClient } from "@/components/admin/AdminSubscriptionsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Listing Passes & Licenses | Admin Portal",
  description: "Monitor 30-day listing passes, property publishing allowances, and license expirations.",
};

interface AdminSubscriptionsPageProps {
  searchParams: Promise<{
    page?: string;
    filter?: string;
    q?: string;
  }>;
}

async function SubscriptionsLoader({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>;
}) {
  await requireAdmin("/admin/subscriptions");
  const params = await searchParams;

  const res = await getAdminSubscriptionsAction({
    page: parseInt(params.page || "1", 10),
    limit: 15,
    filter: params.filter as any,
    search: params.q,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load owner listing passes."}
      </div>
    );
  }

  return (
    <AdminSubscriptionsClient
      initialSubscriptions={res.data.subscriptions as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      counts={res.data.counts}
    />
  );
}

export default function AdminSubscriptionsPage({ searchParams }: AdminSubscriptionsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      }
    >
      <SubscriptionsLoader searchParams={searchParams} />
    </Suspense>
  );
}
