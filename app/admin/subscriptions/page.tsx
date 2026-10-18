import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSubscriptionsAction } from "@/actions/admin";
import { AdminSubscriptionsClient } from "@/components/admin/AdminSubscriptionsClient";

export const metadata = {
  title: "Owner Subscriptions | Admin Portal",
  description: "Monitor platform subscription memberships, recurring cycles, and owner tiers.",
};

interface AdminSubscriptionsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

async function SubscriptionsLoader({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin("/admin/subscriptions");
  const params = await searchParams;

  const res = await getAdminSubscriptionsAction({
    page: parseInt(params.page || "1", 10),
    limit: 15,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load owner subscriptions."}
      </div>
    );
  }

  return (
    <AdminSubscriptionsClient
      initialSubscriptions={res.data.subscriptions as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
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
