"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle2, Clock, XCircle, AlertCircle, ArrowUpRight } from "lucide-react";
import { AdminPagination } from "./AdminPagination";

interface PaymentRow {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  purpose: string;
  status: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paymentMethod: string | null;
  verifiedAt: Date | string | null;
  createdAt: Date | string;
  user: {
    id: string;
    email: string | null;
    profile: { fullName: string } | null;
  };
  ownerSubscription: {
    id: string;
    plan: { name: string; billingCycle?: string; interval?: string };
  } | null;
  featuredListing: {
    id: string;
    targetType: string;
  } | null;
}

interface AdminPaymentsClientProps {
  initialPayments: PaymentRow[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function AdminPaymentsClient({
  initialPayments,
  total,
  currentPage,
  totalPages,
}: AdminPaymentsClientProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Success
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <AlertCircle className="h-3.5 w-3.5" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            {status}
          </span>
        );
    }
  };

  const getPurposeBadge = (purpose: string) => {
    switch (purpose) {
      case "OWNER_SUBSCRIPTION":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Subscription
          </span>
        );
      case "FEATURED_LISTING":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Featured Slot
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
            {purpose}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time transaction history backed by Razorpay. Secrets and credentials remain protected server-side.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Transactions</p>
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
                <th className="py-3 px-4">Payment ID & Date</th>
                <th className="py-3 px-4">Customer / Account</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Provider References</th>
                <th className="py-3 px-4">Associated Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {initialPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">No data yet</p>
                      <p className="text-xs text-slate-400">
                        No transactions have been processed by the platform yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialPayments.map((p) => {
                  const dateStr = new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-semibold text-slate-900">
                          {p.id.slice(0, 13)}...
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{dateStr}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {p.user?.profile?.fullName || "Unspecified"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {p.user?.email || "No email"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getPurposeBadge(p.purpose)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 uppercase">{p.currency}</span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {p.razorpayPaymentId ? (
                          <div className="text-slate-800 font-semibold">{p.razorpayPaymentId}</div>
                        ) : (
                          <div className="text-slate-400 italic">No payment ID</div>
                        )}
                        {p.razorpayOrderId && (
                          <div className="text-[10px] text-slate-400">Ord: {p.razorpayOrderId.slice(0, 16)}...</div>
                        )}
                        {p.paymentMethod && (
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-sans font-medium">
                            {p.paymentMethod}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.ownerSubscription ? (
                          <div className="text-xs">
                            <span className="font-medium text-slate-800">
                              {p.ownerSubscription.plan.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              Cycle: {p.ownerSubscription.plan.interval || p.ownerSubscription.plan.billingCycle || "Monthly"}
                            </span>
                          </div>
                        ) : p.featuredListing ? (
                          <div className="text-xs">
                            <span className="font-medium text-purple-700">
                              Slot: {p.featuredListing.targetType}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
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
          itemsPerPage={15}
          onPageChange={(page) => router.push(`/admin/payments?page=${page}`)}
        />
      </div>
    </div>
  );
}
