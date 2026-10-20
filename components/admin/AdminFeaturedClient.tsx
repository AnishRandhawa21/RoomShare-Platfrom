"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Building2,
  CreditCard,
  Search,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { FeaturedStatus } from "@/lib/enums";
import { updateAdminFeaturedStatusAction } from "@/actions/admin";
import { AdminPagination } from "./AdminPagination";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

interface FeaturedRow {
  id: string;
  isBoost?: boolean;
  targetType: string;
  startDate: Date | string;
  endDate: Date | string;
  status: FeaturedStatus | string;
  pricePaidInr: number;
  createdAt: Date | string;
  razorpayPaymentId?: string | null;
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
    locality?: string;
  } | null;
  roomType: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    businessName: string | null;
    user: {
      email: string | null;
      profile: { fullName: string } | null;
    };
  } | null;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    razorpayPaymentId?: string | null;
  }>;
}

interface AdminFeaturedClientProps {
  initialFeatured: FeaturedRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  counts?: {
    total: number;
    active: number;
    expired: number;
    cancelled: number;
    revenueInr: number;
  };
}

export function AdminFeaturedClient({
  initialFeatured,
  total,
  currentPage,
  totalPages,
  counts = { total: 0, active: 0, expired: 0, cancelled: 0, revenueInr: 0 },
}: AdminFeaturedClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);

  const currentFilter = searchParams.get("filter") || "ALL";
  const currentSearch = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);

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

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "ALL") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/featured?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set("q", searchInput.trim());
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/featured?${params.toString()}`);
    });
  };

  const getStatusBadge = (status: string, endDate?: Date | string) => {
    const now = new Date();
    const end = endDate ? new Date(endDate) : null;
    const diffDays = end ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    if (status === "ACTIVE") {
      if (diffDays <= 0) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="h-3.5 w-3.5 text-slate-400" />
            Expired
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Active ({diffDays}d left)
        </span>
      );
    }

    if (status === "PENDING_PAYMENT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3.5 w-3.5" />
          Pending Payment
        </span>
      );
    }

    if (status === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="h-3.5 w-3.5" />
          Cancelled
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <XCircle className="h-3.5 w-3.5 text-slate-400" />
        Expired
      </span>
    );
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Featured Listings & Boosts</span>
            <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sponsored hero placement and high-priority ranking for properties promoted by owners.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800">
            <Zap className="h-4 w-4 text-amber-600" />
            Elevated Search Visibility
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => handleFilterChange("ALL")}
          className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
            currentFilter === "ALL"
              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-75">
            <span>Total Placements</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black">{counts.total ?? total}</div>
          <div className="mt-1 text-[11px] opacity-70">All recorded boosts</div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("ACTIVE")}
          className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
            currentFilter === "ACTIVE"
              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-75">
            <span>Active Promoted</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black">{counts.active}</div>
          <div className="mt-1 text-[11px] opacity-70">Top of search rank</div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("EXPIRED")}
          className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
            currentFilter === "EXPIRED"
              ? "border-slate-700 bg-slate-700 text-white shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-75">
            <span>Expired</span>
            <XCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black">{counts.expired}</div>
          <div className="mt-1 text-[11px] opacity-70">Promotion ended</div>
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Boost Revenue</span>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            ₹{counts.revenueInr.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Total promotion earnings</div>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: "All Placements", count: counts.total ?? total },
            { key: "ACTIVE", label: "Active", count: counts.active },
            { key: "EXPIRED", label: "Expired", count: counts.expired },
            { key: "CANCELLED", label: "Cancelled", count: counts.cancelled },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleFilterChange(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                currentFilter === tab.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none ${
                  currentFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
          {isPending && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search property, city, or owner..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#00412E]"
          />
        </form>
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
                      <p className="text-sm font-semibold text-slate-800">No data found</p>
                      <p className="text-xs text-slate-400">
                        {currentFilter !== "ALL" || currentSearch
                          ? "Try clearing filters or search query."
                          : "No properties have purchased featured boosts yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialFeatured.map((item) => {
                  const startDate = new Date(item.startDate);
                  const endDate = new Date(item.endDate);
                  const now = new Date();
                  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  const startStr = startDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const endStr = endDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  const ownerName = item.owner?.user?.profile?.fullName || item.owner?.businessName;
                  const ownerEmail = item.owner?.user?.email;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        {item.property ? (
                          <div>
                            <Link
                              href={`/admin/properties/${item.property.id}`}
                              className="font-bold text-slate-900 hover:text-emerald-700 transition-colors inline-flex items-center gap-1 text-sm"
                            >
                              <span>{item.property.name}</span>
                              <ArrowUpRight className="h-3 w-3 text-slate-400" />
                            </Link>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {item.property.locality ? `${item.property.locality}, ` : ""}{item.property.city}
                            </div>
                            {ownerEmail && (
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                                Owner: {ownerName ? `${ownerName} (${ownerEmail})` : ownerEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Target unlinked</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-amber-700 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          <span>{item.pricingPlan.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.pricingPlan.durationDays} Days High-Priority Placement
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(item.status as any, item.endDate)}</td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                          <span>{startStr}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span>{endStr}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {diffDays > 0 && item.status === "ACTIVE" ? (
                            <span className="text-emerald-700 font-semibold">{diffDays} days remaining</span>
                          ) : (
                            <span>{totalDays}-day campaign window</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 text-sm">
                          ₹{item.pricePaidInr.toLocaleString("en-IN")}
                        </span>
                        {item.razorpayPaymentId && (
                          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[130px]">
                            {item.razorpayPaymentId}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {item.status !== "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(item.id, FeaturedStatus.ACTIVE)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
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
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200 cursor-pointer"
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
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", page.toString());
            router.push(`/admin/featured?${params.toString()}`);
          }}
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
