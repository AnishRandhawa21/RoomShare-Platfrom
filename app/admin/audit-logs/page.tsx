import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminAuditLogsAction } from "@/actions/admin";
import { AdminAuditLogsClient } from "@/components/admin/AdminAuditLogsClient";

export const metadata = {
  title: "Audit Logs | Admin Portal",
  description: "Immutable security trail of administrative actions, moderation events, and configuration overrides.",
};

interface AdminAuditLogsPageProps {
  searchParams: Promise<{
    action?: string;
    targetType?: string;
    page?: string;
  }>;
}

async function AuditLogsLoader({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; targetType?: string; page?: string }>;
}) {
  await requireAdmin("/admin/audit-logs");
  const params = await searchParams;

  const res = await getAdminAuditLogsAction({
    action: params.action,
    targetType: params.targetType,
    page: parseInt(params.page || "1", 10),
    limit: 20,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load audit logs."}
      </div>
    );
  }

  return (
    <AdminAuditLogsClient
      initialLogs={res.data.auditLogs as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      initialFilters={{
        action: params.action,
        targetType: params.targetType,
      }}
    />
  );
}

export default function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      }
    >
      <AuditLogsLoader searchParams={searchParams} />
    </Suspense>
  );
}
