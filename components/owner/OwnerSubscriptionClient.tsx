"use client";

import {
  CheckCircle2,
  Calendar,
  ArrowRight,
} from "lucide-react";

interface PlanItem {
  id: string;
  name: string;
  priceInr: number;
  interval: "MONTHLY" | "QUARTERLY" | "YEARLY";
  propertyLimit: number;
  features: string[];
  description?: string | null;
}

interface SubscriptionItem {
  id: string;
  status: "ACTIVE" | "PENDING_PAYMENT" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  plan: PlanItem;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

interface OwnerSubscriptionClientProps {
  activeSubscription?: SubscriptionItem | null;
  plans: PlanItem[];
  history: SubscriptionItem[];
}

export function OwnerSubscriptionClient({
  activeSubscription,
  plans,
  history,
}: OwnerSubscriptionClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Owner Membership & Plans</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your StayKro partner subscription, view active entitlements, and review billing intervals.
        </p>
      </div>

      {/* Active Subscription Summary */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Current Active Entitlement
        </h2>

        {activeSubscription ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white p-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">
                  {activeSubscription.plan.name} Plan
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {activeSubscription.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                <span className="font-extrabold text-slate-900">
                  ₹{activeSubscription.plan.priceInr.toLocaleString("en-IN")}/
                  {activeSubscription.plan.interval.toLowerCase()}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Valid:{" "}
                    {new Date(activeSubscription.currentPeriodStart).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {new Date(activeSubscription.currentPeriodEnd).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
                <span>•</span>
                <span>
                  {activeSubscription.autoRenew ? "Auto-renew active" : "Non-renewing"}
                </span>
              </div>

              <div className="text-xs text-slate-500 pt-1">
                Max Properties:{" "}
                <span className="font-bold text-slate-700">
                  {activeSubscription.plan.propertyLimit === 999
                    ? "Unlimited"
                    : activeSubscription.plan.propertyLimit}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
                Manage Invoices
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-xs text-amber-900">Partner Starter Access</div>
              <p className="text-xs text-amber-700 mt-0.5">
                You are currently on a complimentary partner onboarding period. Choose a plan to
                guarantee high-priority discovery placement.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Available Plans from Database */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Available Subscription Tiers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent pricing based on your property inventory size.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = activeSubscription?.plan?.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "border-indigo-600 bg-white shadow-md ring-2 ring-indigo-600/20"
                    : "border-slate-200/80 bg-white shadow-2xs hover:border-slate-300"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    {isCurrent && (
                      <span className="rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      ₹{plan.priceInr.toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-slate-400">
                        /{plan.interval.toLowerCase()}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        {plan.propertyLimit === 999
                          ? "Unlimited PG listings"
                          : `Up to ${plan.propertyLimit} PG ${
                              plan.propertyLimit === 1 ? "listing" : "listings"
                            }`}
                      </span>
                    </div>

                    {plan.features?.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    disabled={isCurrent}
                    className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                    }`}
                  >
                    <span>{isCurrent ? "Active Plan" : "Upgrade to " + plan.name}</span>
                    {!isCurrent && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription History */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Subscription History
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {history.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{item.plan.name} Tier</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {new Date(item.currentPeriodStart).toLocaleDateString()} -{" "}
                    {new Date(item.currentPeriodEnd).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      item.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
