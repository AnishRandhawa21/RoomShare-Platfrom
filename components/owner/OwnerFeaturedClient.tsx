"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface FeaturedCampaign {
  id: string;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string;
  endDate: string;
  property?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  roomType?: {
    id: string;
    name: string;
  } | null;
  pricingPlan: {
    name: string;
    priceInr: number;
    durationDays: number;
  };
}

interface PricingPlan {
  id: string;
  name: string;
  durationDays: number;
  priceInr: number;
  description?: string | null;
}

interface OwnerFeaturedClientProps {
  campaigns: FeaturedCampaign[];
  pricingPlans: PricingPlan[];
}

export function OwnerFeaturedClient({ campaigns, pricingPlans }: OwnerFeaturedClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Featured Listings & Promotion</h1>
          <p className="text-xs text-slate-500 mt-1">
            Boost listing visibility on the homepage and top search results across your target city.
          </p>
        </div>

        <Link
          href="/owner/properties"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Feature My Property</span>
        </Link>
      </div>

      {/* Available Promotional Boost Packages */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Featured Boost Packages</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Get up to 5x more lead inquiries with priority badge and top search placement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                  <Sparkles className="h-4 w-4" />
                  <span>{plan.name}</span>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{plan.priceInr.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {plan.durationDays} Days High-Priority Boost
                  </div>
                </div>

                {plan.description && (
                  <p className="text-xs text-slate-600 border-t border-slate-100 pt-2">
                    {plan.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  href="/owner/properties"
                  className="w-full flex items-center justify-center gap-1 rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  <span>Select Property to Boost</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active & Past Campaigns */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Promotional Campaigns ({campaigns.length})
        </h2>

        {campaigns.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No active featured campaigns. Boost your properties to appear on top of student and
            professional searches.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {campaigns.map((c) => (
              <div key={c.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {c.property?.name || "Featured Promotion"}
                    </span>
                    {c.roomType && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {c.roomType.name}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1 flex items-center gap-2">
                    <span>Package: {c.pricingPlan.name}</span>
                    <span>•</span>
                    <span>
                      {new Date(c.startDate).toLocaleDateString()} -{" "}
                      {new Date(c.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="font-extrabold text-slate-900 text-sm">
                  ₹{c.pricingPlan.priceInr.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
