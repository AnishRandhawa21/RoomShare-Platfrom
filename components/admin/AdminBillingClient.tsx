"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Tag,
} from "lucide-react";

interface AdminBillingClientProps {
  data: {
    activePassesCount?: number;
    expiredPassesCount?: number;
    upcomingExpirationsCount?: number;
    activeSubscriptionsCount: number;
    cancelledSubscriptionsCount: number;
    failedPaymentsCount: number;
    totalRevenueInr: number;
    planDistribution: {
      solo: number;
      plus: number;
    };
    activeBoostsCount: number;
    recentTransactions: any[];
    recentBoosts: any[];
    subscriptionsList: any[];
  };
}

export function AdminBillingClient({ data }: AdminBillingClientProps) {
  const [activeTab, setActiveTab] = useState<"TRANSACTIONS" | "PASSES" | "BOOSTS">("TRANSACTIONS");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = data.recentTransactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const email = tx.user?.email?.toLowerCase() || "";
    const name = tx.user?.profile?.fullName?.toLowerCase() || "";
    const pid = tx.razorpayPaymentId?.toLowerCase() || tx.razorpayOrderId?.toLowerCase() || "";
    return email.includes(q) || name.includes(q) || pid.includes(q);
  });

  const filteredPasses = data.subscriptionsList.filter((sub) => {
    const q = searchQuery.toLowerCase();
    const email = sub.owner?.user?.email?.toLowerCase() || "";
    const name = sub.owner?.user?.profile?.fullName?.toLowerCase() || sub.owner?.businessName?.toLowerCase() || "";
    return email.includes(q) || name.includes(q);
  });

  const activeCount = data.activePassesCount ?? data.activeSubscriptionsCount;
  const expiredCount = data.expiredPassesCount ?? data.cancelledSubscriptionsCount;
  const upcomingCount = data.upcomingExpirationsCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Billing & Revenue Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Razorpay 30-day listing passes, one-time boost purchases, and payments ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/pricing"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition-all shadow-2xs"
          >
            <Tag className="h-4 w-4 text-[#00412E]" />
            <span>Manage Pricing &rarr;</span>
          </Link>
          <Link
            href="/admin/subscriptions"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs"
          >
            <Layers className="h-4 w-4" />
            <span>Manage Listing Passes &rarr;</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Revenue</span>
            <TrendingUp className="h-4 w-4 text-[#00412E]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#00412E]">
            ₹{data.totalRevenueInr.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Captured volume</div>
        </div>

        {/* Active Passes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Passes</span>
            <Layers className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {activeCount}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
            Solo: {data.planDistribution.solo} • Plus: {data.planDistribution.plus}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Expiring Soon</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {upcomingCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Next 7 days</div>
        </div>

        {/* Expired Passes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Expired Passes</span>
            <XCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-700">
            {expiredCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Awaiting renewal</div>
        </div>

        {/* Active Boosts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Boosts</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {data.activeBoostsCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Promoted properties</div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("TRANSACTIONS")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "TRANSACTIONS"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Recent Transactions ({data.recentTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PASSES")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PASSES"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Listing Passes ({data.subscriptionsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("BOOSTS")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "BOOSTS"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Property Boosts ({data.recentBoosts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search email, name, payment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#00412E]"
          />
        </div>
      </div>

      {/* Tab 1: Transactions Table */}
      {activeTab === "TRANSACTIONS" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Owner / Customer</th>
                  <th className="py-3.5 px-4">Product / Item</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Razorpay ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {tx.user?.profile?.fullName || "Owner"}
                      </div>
                      <div className="text-[11px] text-slate-400">{tx.user?.email || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {tx.ownerListingPass
                        ? `Listing Pass: ${tx.ownerListingPass.planType} (₹${tx.amount})`
                        : tx.ownerSubscription?.plan?.name
                        ? `Listing Pass: ${tx.ownerSubscription.plan.name}`
                        : tx.propertyBoost?.property?.name
                        ? `Boost: ${tx.propertyBoost.property.name}`
                        : tx.purpose.replace(/_/g, " ")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {tx.paymentType || "UPI/Card"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          tx.status === "CAPTURED"
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === "FAILED"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                      {tx.razorpayPaymentId || tx.razorpayOrderId || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Listing Passes Table */}
      {activeTab === "PASSES" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Pass Plan</th>
                  <th className="py-3.5 px-4">Property Limit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4 text-right">Pass ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPasses.map((sub) => {
                  const end = new Date(sub.endDate);
                  const now = new Date();
                  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpired = diffDays <= 0 || sub.status === "EXPIRED";

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {sub.owner?.user?.profile?.fullName || sub.owner?.businessName || "Owner"}
                        </div>
                        <div className="text-[11px] text-slate-400">{sub.owner?.user?.email || "—"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {sub.plan.name} (₹{sub.plan.priceInr} / 30d)
                        <span className="block text-[10px] text-slate-400 font-normal">
                          One-time license • No auto-debit
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {sub.plan.maxProperties === 999 || sub.plan.maxProperties > 1
                            ? `${sub.plan.maxProperties || "Multiple"} Properties`
                            : "1 Property"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            !isExpired && sub.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isExpired ? "EXPIRED" : sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {new Date(sub.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isExpired ? "Expired" : `${diffDays} days left`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                        {sub.id.slice(0, 8)}...
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Boosts Table */}
      {activeTab === "BOOSTS" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Expires On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data.recentBoosts.map((boost) => (
                  <tr key={boost.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {boost.property?.name || "Property"}
                    </td>
                    <td className="py-3.5 px-4">
                      {boost.owner?.user?.profile?.fullName || boost.owner?.user?.email || "Owner"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {boost.durationDays} Days
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{boost.amountInr}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          boost.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {boost.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap">
                      {boost.endDate
                        ? new Date(boost.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
