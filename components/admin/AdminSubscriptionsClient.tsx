"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  Search,
  Filter,
  Layers,
  Clock,
  ShieldCheck,
  Building2,
  CreditCard,
  Loader2,
} from "lucide-react";
import { AdminPagination } from "./AdminPagination";

interface SubscriptionRow {
  id: string;
  status: string;
  isUpgraded?: boolean;
  startDate: Date | string;
  endDate: Date | string;
  autoRenew: boolean;
  cancelledAt: Date | string | null;
  createdAt: Date | string;
  propertyLimit?: number;
  planType?: "SOLO" | "PLUS";
  plan: {
    id: string;
    name: string;
    tier?: string;
    billingCycle?: string;
    interval?: string;
    priceInr: number;
    maxProperties?: number;
  };
  owner: {
    id: string;
    businessName: string | null;
    user: {
      email: string | null;
      profile: { fullName: string } | null;
    };
    _count?: {
      properties?: number;
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    razorpayPaymentId?: string | null;
    createdAt: Date | string;
  }>;
}

interface AdminSubscriptionsClientProps {
  initialSubscriptions: SubscriptionRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  counts?: {
    total?: number;
    active: number;
    expired: number;
    expiringSoon: number;
    solo: number;
    plus: number;
  };
}

export function AdminSubscriptionsClient({
  initialSubscriptions,
  total,
  currentPage,
  totalPages,
  counts = { total: 0, active: 0, expired: 0, expiringSoon: 0, solo: 0, plus: 0 },
}: AdminSubscriptionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilter = searchParams.get("filter") || "ALL";
  const currentSearch = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "ALL") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/subscriptions?${params.toString()}`);
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
      router.push(`/admin/subscriptions?${params.toString()}`);
    });
  };

  const getStatusBadge = (status: string, endDate: Date | string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "UPGRADED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          Upgraded to Plus
        </span>
      );
    }

    if (diffDays <= 0 || status === "EXPIRED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <XCircle className="h-3.5 w-3.5 text-slate-400" />
          Expired
        </span>
      );
    }

    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          Expiring in {diffDays}d
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        Active ({diffDays}d left)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Listing Licenses & Passes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            30-day pay-as-you-go listing licenses. No auto-renewal or recurring charges.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            30-Day Pay-per-License Model
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
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
            <span>Total Passes</span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black">{counts.total ?? total}</div>
          <div className="mt-1 text-[11px] opacity-70">All issued passes</div>
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
            <span>Active</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black">{counts.active}</div>
          <div className="mt-1 text-[11px] opacity-70">Properties published</div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("EXPIRING_SOON")}
          className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
            currentFilter === "EXPIRING_SOON"
              ? "border-amber-600 bg-amber-600 text-white shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-75">
            <span>Expiring Soon</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black">{counts.expiringSoon}</div>
          <div className="mt-1 text-[11px] opacity-70">Next 7 days</div>
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
            <span>Expired / Inactive</span>
            <XCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black">{counts.expired}</div>
          <div className="mt-1 text-[11px] opacity-70">Awaiting manual renewal</div>
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Tier Split</span>
            <Sparkles className="h-4 w-4 text-[#00412E]" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">
            Solo: <span className="font-black text-[#00412E]">{counts.solo}</span> • Plus:{" "}
            <span className="font-black text-indigo-700">{counts.plus}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">₹499 vs ₹999 passes</div>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: "All Passes", count: counts.total ?? total },
            { key: "ACTIVE", label: "Active", count: counts.active },
            { key: "EXPIRING_SOON", label: "Expiring Soon", count: counts.expiringSoon },
            { key: "EXPIRED", label: "Expired", count: counts.expired },
            { key: "SOLO", label: "Solo (₹499)", count: counts.solo },
            { key: "PLUS", label: "Plus (₹999)", count: counts.plus },
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
            placeholder="Search owner, email, order ID..."
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
                <th className="py-3 px-4">Owner / Account</th>
                <th className="py-3 px-4">Listing Pass Plan</th>
                <th className="py-3 px-4">Property Quota</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">License Validity</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {initialSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">No listing passes found</p>
                      <p className="text-xs text-slate-400">
                        {currentFilter !== "ALL" || currentSearch
                          ? "Try clearing filters or search query."
                          : "No owner has purchased a listing pass yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialSubscriptions.map((sub) => {
                  const startDate = new Date(sub.startDate);
                  const endDate = new Date(sub.endDate);
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
                  const lastPayment = sub.payments?.[0];
                  const usedCount = sub.owner._count?.properties ?? 0;
                  const propertyLimit = sub.propertyLimit ?? sub.plan.maxProperties ?? 1;
                  const isPlus = sub.planType === "PLUS" || propertyLimit > 1;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {sub.owner.businessName || sub.owner.user.profile?.fullName || "Owner"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {sub.owner.user.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {isPlus ? (
                            <span className="text-indigo-700 font-black">StayKro Plus</span>
                          ) : (
                            <span className="text-[#00412E] font-black">StayKro Solo</span>
                          )}
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                            ₹{sub.plan.priceInr.toLocaleString("en-IN")} / 30d
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          One-time license • No auto-debit
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">
                            {usedCount} of {propertyLimit}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isPlus ? "Multi-property allowance" : "Single property allowance"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(sub.status, sub.endDate)}</td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                          <span>{startStr}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span>{endStr}</span>
                        </div>
                        <div className="text-[10px] mt-0.5 font-medium">
                          {sub.status === "UPGRADED" ? (
                            <span className="text-indigo-600 font-semibold">
                              Superseded • Days rolled into Plus pass
                            </span>
                          ) : diffDays <= 0 || sub.status === "EXPIRED" ? (
                            <span className="text-slate-400">License window closed</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">
                              {totalDays > 30 ? `${totalDays}-day license (Renewed)` : "30-day license"} ({diffDays}d left)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {lastPayment ? (
                          <div>
                            <span className="font-bold text-slate-900">
                              ₹{lastPayment.amount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-emerald-700 block font-semibold">
                              {lastPayment.status}
                            </span>
                            {lastPayment.razorpayPaymentId && (
                              <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[130px]">
                                {lastPayment.razorpayPaymentId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None recorded</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/owners/${sub.owner.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
                        >
                          View Owner
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
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
            router.push(`/admin/subscriptions?${params.toString()}`);
          }}
        />
      </div>
    </div>
  );
}
