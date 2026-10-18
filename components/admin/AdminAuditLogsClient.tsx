"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Terminal, Clock, Filter, Eye, X } from "lucide-react";
import { AdminPagination } from "./AdminPagination";

interface AuditLogRow {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    email: string | null;
    profile: { fullName: string } | null;
  } | null;
}

interface AdminAuditLogsClientProps {
  initialLogs: AuditLogRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  initialFilters: {
    action?: string;
    targetType?: string;
  };
}

export function AdminAuditLogsClient({
  initialLogs,
  total,
  currentPage,
  totalPages,
  initialFilters,
}: AdminAuditLogsClientProps) {
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const applyFilters = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "" || v === "ALL") {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const getActionBadge = (action: string) => {
    if (action.includes("BAN") || action.includes("REJECT") || action.includes("DELETE") || action.includes("REVOKE")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {action}
        </span>
      );
    }
    if (action.includes("APPROVE") || action.includes("VERIFY") || action.includes("CREATE") || action.includes("UNBAN")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {action}
        </span>
      );
    }
    if (action.includes("RESOLVE") || action.includes("STATUS")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, append-only record of all administrative decisions, security overrides, and moderation actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Audited Events</p>
            <p className="text-lg font-bold text-slate-900">{total}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 pl-1">
          <Filter className="h-4 w-4 text-slate-400" />
          Filter Log:
        </div>

        <select
          value={initialFilters.targetType || "ALL"}
          onChange={(e) => applyFilters({ targetType: e.target.value, page: 1 })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="ALL">All Target Types</option>
          <option value="PROPERTY">Properties</option>
          <option value="OWNER">Owners</option>
          <option value="USER">Users</option>
          <option value="ROOMMATE_REQUEST">Roommate Requests</option>
          <option value="REPORT">Reports</option>
          <option value="REVIEW">Reviews</option>
          <option value="LOCATION">Locations</option>
          <option value="OWNER_INVITATION">Invitations</option>
          <option value="FEATURED_LISTING">Featured Listings</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {initialLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Terminal className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">No data yet</p>
                      <p className="text-xs text-slate-400">
                        No admin actions have been recorded in the audit trail yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {log.user?.profile?.fullName || log.user?.email || "System Engine"}
                        </div>
                        {log.user?.email && (
                          <div className="text-[10px] text-slate-400">{log.user.email}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-semibold text-slate-800 uppercase">
                          {log.targetType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {log.targetId ? `${log.targetId.slice(0, 12)}...` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {log.details ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            Inspect
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={20}
          onPageChange={(page) => applyFilters({ page })}
        />
      </div>

      {/* JSON Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Audit Payload Details</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedLog.action}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Type</span>
                  <span className="font-medium text-slate-800">{selectedLog.targetType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target ID</span>
                  <span className="font-mono text-slate-800">{selectedLog.targetId || "None"}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Metadata / Reason</span>
                <pre className="rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details || "{}"), null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
