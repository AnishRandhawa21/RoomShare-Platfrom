"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Users,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { ReportStatus, ReportTargetType } from "@/lib/enums";
import { updateAdminReportStatusAction } from "@/actions/admin";
import { AdminPagination } from "./AdminPagination";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

interface ReportRow {
  id: string;
  targetType: ReportTargetType;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: Date | string;
  reporter: {
    id: string;
    email: string | null;
    profile: { fullName: string } | null;
  };
  property: { id: string; name: string; slug: string; city: string } | null;
  roommateRequest: { id: string; title: string; city: string } | null;
  reportedUser: { id: string; email: string | null; profile: { fullName: string } | null } | null;
}

interface AdminReportsClientProps {
  initialReports: ReportRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  initialFilters: {
    status?: string;
    targetType?: string;
  };
}

export function AdminReportsClient({
  initialReports,
  total,
  currentPage,
  totalPages,
  initialFilters,
}: AdminReportsClientProps) {
  const router = useRouter();

  const [status, setStatus] = useState(initialFilters.status || "ALL");
  const [targetType, setTargetType] = useState(initialFilters.targetType || "ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [targetStatus, setTargetStatus] = useState<ReportStatus | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const applyFilters = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "" || v === "ALL") {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    router.push(`/admin/reports?${params.toString()}`);
  };

  const openActionDialog = (report: ReportRow, newStatus: ReportStatus) => {
    setSelectedReport(report);
    setTargetStatus(newStatus);
    setModerationNotes("");
    setDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedReport || !targetStatus) return;
    setIsProcessing(true);

    await updateAdminReportStatusAction({
      reportId: selectedReport.id,
      status: targetStatus,
      moderationNotes: moderationNotes.trim() || undefined,
    });

    setIsProcessing(false);
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            Trust & Safety Moderation Queue
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review reported properties, suspicious roommate requests, and reported accounts.
          </p>
        </div>

        <div className="text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 px-3.5 py-1.5 rounded-full shadow-2xs">
          Total reports: <strong className="text-zinc-900">{total}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <span className="text-zinc-500 font-medium">Filter by:</span>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            applyFilters({ status: e.target.value, page: 1 });
          }}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending (Action Required)</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>

        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            applyFilters({ targetType: e.target.value, page: 1 });
          }}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
        >
          <option value="ALL">All Target Types</option>
          <option value="PROPERTY">Properties</option>
          <option value="ROOMMATE_REQUEST">Roommate Requests</option>
          <option value="USER">User Accounts</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Violation Reason</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-medium">
                    No reports in this queue. Clean and safe!
                  </td>
                </tr>
              ) : (
                initialReports.map((report) => {
                  let targetName = "Unknown Target";
                  let targetUrl = "#";

                  if (report.targetType === "PROPERTY" && report.property) {
                    targetName = report.property.name;
                    targetUrl = `/admin/properties/${report.property.id}`;
                  } else if (report.targetType === "ROOMMATE_REQUEST" && report.roommateRequest) {
                    targetName = report.roommateRequest.title;
                    targetUrl = `/roommates/${report.roommateRequest.id}`;
                  } else if (report.targetType === "USER" && report.reportedUser) {
                    targetName =
                      report.reportedUser.profile?.fullName ||
                      report.reportedUser.email ||
                      "User Account";
                    targetUrl = "/admin/users";
                  }

                  return (
                    <tr key={report.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          {report.targetType}
                        </span>
                        <Link
                          href={targetUrl}
                          className="font-bold text-zinc-950 hover:text-violet-600 block line-clamp-1"
                        >
                          {targetName}
                        </Link>
                        {report.details && (
                          <p className="text-[11px] text-zinc-500 italic mt-0.5 line-clamp-2">
                            &ldquo;{report.details}&rdquo;
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md text-[11px] border border-rose-200">
                          {report.reason}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-900 block truncate max-w-[130px]">
                          {report.reporter.profile?.fullName || report.reporter.email}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500">
                        {new Date(report.createdAt).toLocaleDateString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            report.status === "PENDING"
                              ? "bg-rose-100 text-rose-700 font-bold animate-pulse"
                              : report.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {report.status !== "RESOLVED" && (
                            <button
                              type="button"
                              onClick={() => openActionDialog(report, ReportStatus.RESOLVED)}
                              title="Resolve Report"
                              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}

                          {report.status !== "DISMISSED" && (
                            <button
                              type="button"
                              onClick={() => openActionDialog(report, ReportStatus.DISMISSED)}
                              title="Dismiss Report"
                              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
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
          itemsPerPage={15}
          onPageChange={(page) => applyFilters({ page })}
        />
      </div>

      <AdminConfirmDialog
        isOpen={dialogOpen}
        title={`Set Report Status to "${targetStatus}"?`}
        description="Marking a report as Resolved or Dismissed logs an immutable administrator AuditLog."
        confirmLabel="Confirm Moderation Action"
        variant={targetStatus === "RESOLVED" ? "default" : "warning"}
        isLoading={isProcessing}
        onConfirm={executeAction}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
