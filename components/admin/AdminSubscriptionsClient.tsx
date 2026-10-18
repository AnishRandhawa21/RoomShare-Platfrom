"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Calendar, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
import { AdminPagination } from "./AdminPagination";

interface SubscriptionRow {
  id: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  autoRenew: boolean;
  cancelledAt: Date | string | null;
  createdAt: Date | string;
  plan: {
    id: string;
    name: string;
    tier: string;
    billingCycle: string;
    priceInr: number;
  };
  owner: {
    id: string;
    businessName: string | null;
    user: {
      email: string | null;
      profile: { fullName: string } | null;
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date | string;
  }>;
}

interface AdminSubscriptionsClientProps {
  initialSubscriptions: SubscriptionRow[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function AdminSubscriptionsClient({
  initialSubscriptions,
  total,
  currentPage,
  totalPages,
}: AdminSubscriptionsClientProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Owner Subscriptions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Subscription plans, recurring cycles, validity dates, and owner memberships.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Subscriptions</p>
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
                <th className="py-3 px-4">Owner / Account</th>
                <th className="py-3 px-4">Plan & Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Term Validity</th>
                <th className="py-3 px-4">Auto-Renewal</th>
                <th className="py-3 px-4">Last Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {initialSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">No data yet</p>
                      <p className="text-xs text-slate-400">
                        No owner subscriptions have been activated yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialSubscriptions.map((sub) => {
                  const startStr = new Date(sub.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const endStr = new Date(sub.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const lastPayment = sub.payments?.[0];

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {sub.owner.businessName || sub.owner.user.profile?.fullName || "Unspecified"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {sub.owner.user.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-indigo-700">{sub.plan.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {sub.plan.billingCycle.toLowerCase()} • ₹{sub.plan.priceInr.toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(sub.status)}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {startStr} &rarr; {endStr}
                        </div>
                        {sub.cancelledAt && (
                          <div className="text-[10px] text-rose-500 mt-0.5">
                            Cancelled on {new Date(sub.cancelledAt).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.autoRenew ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {lastPayment ? (
                          <div>
                            <span className="font-semibold text-slate-900">
                              ₹{lastPayment.amount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(lastPayment.createdAt).toLocaleDateString("en-IN")}
                            </span>
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
          onPageChange={(page) => router.push(`/admin/subscriptions?page=${page}`)}
        />
      </div>
    </div>
  );
}
