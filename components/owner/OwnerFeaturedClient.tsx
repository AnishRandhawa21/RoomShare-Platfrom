"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Zap, Check } from "lucide-react";
import { STAYKRO_BILLING_CONFIG } from "@/config/billing";

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

export function OwnerFeaturedClient({ campaigns }: OwnerFeaturedClientProps) {
  const boostTiers = [
    STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS,
    STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS,
    STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS,
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#E8EAE5] bg-white p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#00412E]">
              Visibility Boost
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 mt-1">
            Featured Listings & Property Promotion
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Boost listing visibility on the homepage and top search results across your target city.
          </p>
        </div>

        <Link
          href="/owner/properties"
          className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#002d20] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-[#96BF8A]" />
          <span>Promote a Property</span>
        </Link>
      </div>

      {/* Available Promotional Boost Packages */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-zinc-950">Property Visibility Boost Tiers</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            One-time payments via Razorpay • 100% zero brokerage on tenant enquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boostTiers.map((plan) => (
            <div
              key={plan.type}
              className="rounded-3xl border border-[#E8EAE5] bg-white p-6 shadow-2xs flex flex-col justify-between hover:border-[#96BF8A]/60 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#00412E]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#00412E]" />
                    <span>{plan.name}</span>
                  </div>
                  <span className="rounded-full bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/40 px-2 py-0.5 text-[10px]">
                    {plan.badge}
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-black text-[#00412E]">
                    ₹{plan.priceInr.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-zinc-400"> / one-time</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{plan.description}</div>
                </div>

                <div className="border-t border-[#E8EAE5] pt-3 space-y-1.5 text-xs text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#00412E]" />
                    <span>Top search placement for {plan.days} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#00412E]" />
                    <span>Subtle Promoted badge with verified tag</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#00412E]" />
                    <span>Direct tenant phone & WhatsApp leads</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E8EAE5]">
                <Link
                  href="/owner/properties"
                  className="w-full flex items-center justify-center gap-1 rounded-xl bg-[#00412E] text-white px-3 py-2 text-xs font-bold hover:bg-[#002d20] shadow-2xs transition-colors"
                >
                  <span>Choose Property to Boost</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active & Past Campaigns */}
      <div className="rounded-3xl border border-[#E8EAE5] bg-white p-6 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
          Promotional Campaigns ({campaigns.length})
        </h2>

        {campaigns.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No active featured campaigns. Boost your properties from the Properties tab to appear on top of student and professional searches.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 text-xs">
            {campaigns.map((c) => (
              <div key={c.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-900">
                    {c.property?.name || "Accommodations"}
                  </div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">
                    {c.pricingPlan.name} • Valid: {new Date(c.startDate).toLocaleDateString()} to{" "}
                    {new Date(c.endDate).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      c.status === "ACTIVE"
                        ? "bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/40"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
