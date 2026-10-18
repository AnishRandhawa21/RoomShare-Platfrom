"use client";

import { Receipt } from "lucide-react";

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  purpose: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
  ownerSubscription?: {
    plan?: {
      name: string;
    };
  } | null;
  featuredListing?: {
    pricingPlan?: {
      name: string;
    };
  } | null;
}

interface OwnerPaymentsClientProps {
  payments: PaymentItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function OwnerPaymentsClient({
  payments,
  total,
  page,
  totalPages,
}: OwnerPaymentsClientProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "FAILED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "REFUNDED":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getPurposeLabel = (p: PaymentItem) => {
    if (p.ownerSubscription?.plan?.name) {
      return `Subscription: ${p.ownerSubscription.plan.name}`;
    }
    if (p.featuredListing?.pricingPlan?.name) {
      return `Featured Listing: ${p.featuredListing.pricingPlan.name}`;
    }
    return p.purpose.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Billing & Payment History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete ledger of partner subscription charges and featured promotional listing receipts.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Payments Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When you subscribe to a partner plan or boost your listings with featured placement,
            invoices will be saved here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description / Purpose</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{getPurposeLabel(p)}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ref: {p.id.substring(0, 12)}...
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-slate-900">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer">
                        View
                      </span>
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
