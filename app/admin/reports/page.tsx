import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminReportsAction } from "@/actions/admin";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";

export const metadata = {
  title: "Trust & Safety Reports | Admin Portal",
  description: "Moderation queue for reported properties, flatmate requests, and accounts.",
};

interface AdminReportsPageProps {
  searchParams: Promise<{
    status?: string;
    targetType?: string;
    page?: string;
  }>;
}

async function ReportsLoader({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; targetType?: string; page?: string }>;
}) {
  await requireAdmin("/admin/reports");
  const params = await searchParams;

  const res = await getAdminReportsAction({
    status: (params.status as any) || "ALL",
    targetType: (params.targetType as any) || "ALL",
    page: parseInt(params.page || "1", 10),
    limit: 15,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load moderation reports."}
      </div>
    );
  }

  return (
    <AdminReportsClient
      initialReports={res.data.reports as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      initialFilters={{
        status: params.status,
        targetType: params.targetType,
      }}
    />
  );
}

export default function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-zinc-200 rounded-xl" />
          <div className="h-20 bg-zinc-100 rounded-2xl" />
          <div className="h-96 bg-zinc-100 rounded-2xl" />
        </div>
      }
    >
      <ReportsLoader searchParams={searchParams} />
    </Suspense>
  );
}
