"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { FeaturedStatus } from "@/lib/enums";
import { updateAdminFeaturedStatusAction } from "@/actions/admin";
import { AdminPagination } from "./AdminPagination";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

interface FeaturedRow {
  id: string;
  targetType: string;
  startDate: Date | string;
  endDate: Date | string;
  status: FeaturedStatus;
  pricePaidInr: number;
  createdAt: Date | string;
  pricingPlan: {
    id: string;
    name: string;
    durationDays: number;
    priceInr: number;
  };
  property: {
    id: string;
    name: string;
    slug: string;
    city: string;
  } | null;
  roomType: {
    id: string;
    name: string;
  } | null;
}

interface AdminFeaturedClientProps {
  initialFeatured: FeaturedRow[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function AdminFeaturedClient({
  initialFeatured,
  total,
  currentPage,
  totalPages,
}: AdminFeaturedClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    featuredId: string;
    targetName: string;
    action: FeaturedStatus;
  }>({
    isOpen: false,
    featuredId: "",
    targetName: "",
    action: FeaturedStatus.CANCELLED,
  });

  const getStatusBadge = (status: FeaturedStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </span>
        );
      case "PENDING_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Pending Payment
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Expired
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleStatusChange = async (featuredId: string, newStatus: FeaturedStatus) => {
    setIsProcessing(true);
    await updateAdminFeaturedStatusAction({
      featuredId,
      status: newStatus,
    });
    setIsProcessing(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Featured Listings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sponsored hero and priority rank placements for verified PGs and room types.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active Placements</p>
            <p className="text-lg font-bold text-slate-900">{total}</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Placement Target</th>
                <th className="py-3 px-4">Plan / Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Validity Window</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {initialFeatured.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Zap className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">No data yet</p>
                      <p className="text-xs text-slate-400">
                        No properties or room types have purchased featured sponsorship yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialFeatured.map((item) => {
                  const startStr = new Date(item.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const endStr = new Date(item.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        {item.property ? (
                          <div>
                            <Link
                              href={`/admin/properties/${item.property.id}`}
                              className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
                            >
                              {item.property.name}
                              <ArrowUpRight className="h-3 w-3 text-slate-400" />
                            </Link>
                            <div className="text-[11px] text-slate-400">
                              {item.property.city} • Type: {item.targetType}
                            </div>
                            {item.roomType && (
                              <div className="text-[10px] text-purple-600 font-medium mt-0.5">
                                Unit: {item.roomType.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Target unlinked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-purple-700">{item.pricingPlan.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.pricingPlan.durationDays} Days Duration
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {startStr} &rarr; {endStr}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm">
                          ₹{item.pricePaidInr.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {item.status !== "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(item.id, FeaturedStatus.ACTIVE)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                            >
                              Activate
                            </button>
                          )}
                          {item.status === "ACTIVE" && (
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  featuredId: item.id,
                                  targetName: item.property?.name || "Featured Placement",
                                  action: FeaturedStatus.CANCELLED,
                                })
                              }
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                            >
                              Deactivate
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
          onPageChange={(page) => router.push(`/admin/featured?page=${page}`)}
        />
      </div>

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Deactivate Featured Placement"
        description={`Are you sure you want to cancel the featured sponsorship for "${confirmDialog.targetName}"? It will immediately stop receiving elevated visibility in search results.`}
        confirmLabel="Confirm Deactivation"
        variant="danger"
        isLoading={isProcessing}
        onConfirm={() => handleStatusChange(confirmDialog.featuredId, confirmDialog.action)}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
