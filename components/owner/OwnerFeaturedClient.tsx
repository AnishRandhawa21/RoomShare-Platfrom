"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Check,
  Building2,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react";
import { STAYKRO_BILLING_CONFIG } from "@/config/billing";
import { PromotePropertyModal } from "@/components/property/PromotePropertyModal";

interface FeaturedCampaign {
  id: string;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string;
  endDate: string;
  property?: {
    id: string;
    name: string;
    slug?: string;
    locality?: string;
    city?: string;
  } | null;
  pricingPlan: {
    name: string;
    priceInr: number;
    durationDays: number;
  };
}

interface PropertyOption {
  id: string;
  name: string;
  slug?: string;
  locality: string;
  city: string;
}

interface OwnerFeaturedClientProps {
  campaigns: FeaturedCampaign[];
  properties?: PropertyOption[];
  boostsConfig?: {
    SEVEN_DAYS?: any;
    FIFTEEN_DAYS?: any;
    THIRTY_DAYS?: any;
  };
}

export function OwnerFeaturedClient({
  campaigns,
  properties = [],
  boostsConfig,
}: OwnerFeaturedClientProps) {
  const router = useRouter();

  // Boost Modal State
  const [targetProperty, setTargetProperty] = useState<{ id: string; name: string } | null>(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);

  const resolvedBoosts = {
    SEVEN_DAYS: boostsConfig?.SEVEN_DAYS || STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS,
    FIFTEEN_DAYS: boostsConfig?.FIFTEEN_DAYS || STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS,
    THIRTY_DAYS: boostsConfig?.THIRTY_DAYS || STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS,
  };

  const boostTiers = [
    resolvedBoosts.SEVEN_DAYS,
    resolvedBoosts.FIFTEEN_DAYS,
    resolvedBoosts.THIRTY_DAYS,
  ];

  const handleStartBoost = () => {

    if (properties.length === 0) {
      router.push("/owner/onboarding");
      return;
    }

    if (properties.length === 1) {
      setTargetProperty({ id: properties[0].id, name: properties[0].name });
      setIsPromoteModalOpen(true);
      return;
    }

    // Multiple properties: prompt user to pick property
    setIsPropertyPickerOpen(true);
  };

  const handleSelectProperty = (prop: PropertyOption) => {
    setTargetProperty({ id: prop.id, name: prop.name });
    setIsPropertyPickerOpen(false);
    setIsPromoteModalOpen(true);
  };

  const now = new Date();

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

        <button
          type="button"
          onClick={() => handleStartBoost()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#002d20] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-[#96BF8A]" />
          <span>Promote a Property</span>
        </button>
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
              className="rounded-3xl border border-[#E8EAE5] bg-white p-6 shadow-2xs flex flex-col justify-between hover:border-[#96BF8A]/60 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#00412E]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#00412E]" />
                    <span>{plan.name}</span>
                  </div>
                  <span className="rounded-full bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/40 px-2 py-0.5 text-[10px]">
                    {plan.badge || `${plan.days} Days`}
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-black text-[#00412E]">
                    ₹{plan.priceInr.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-zinc-400"> / one-time</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {plan.description || `Top search placement for ${plan.days} days.`}
                  </div>
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
                <button
                  type="button"
                  onClick={() => handleStartBoost()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#00412E] text-white px-3 py-2.5 text-xs font-bold hover:bg-[#002d20] shadow-2xs transition-colors cursor-pointer group-hover:bg-[#002d20]"
                >
                  <span>Choose Property to Boost</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#96BF8A]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active & Past Campaigns */}
      <div className="rounded-3xl border border-[#E8EAE5] bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Promotional Campaigns ({campaigns.length})
          </h2>
          {campaigns.length > 0 && (
            <span className="text-[11px] text-zinc-400">
              {campaigns.filter((c) => c.status === "ACTIVE").length} Currently Live
            </span>
          )}
        </div>

        {campaigns.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#00412E]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-900">No active featured campaigns</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Promote your PG properties with priority search placement to gain up to 5x more tenant enquiries.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleStartBoost()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] px-4 py-2 text-xs font-bold text-white hover:bg-[#002d20] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#96BF8A]" />
              <span>Boost Your First Property</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 text-xs">
            {campaigns.map((c) => {
              const endDate = c.endDate ? new Date(c.endDate) : null;
              const isLive = c.status === "ACTIVE" && endDate && endDate > now;
              const daysRemaining = endDate
                ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                : 0;

              return (
                <div
                  key={c.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 px-2 rounded-2xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-950 text-sm">
                        {c.property?.name || "Accommodations"}
                      </span>
                      {c.property?.slug && (
                        <Link
                          href={`/properties/${c.property.slug}`}
                          target="_blank"
                          className="text-zinc-400 hover:text-[#00412E] transition-colors"
                          title="View live property page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-zinc-500 text-[11px]">
                      {c.property?.locality && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-400" />
                          <span>
                            {c.property.locality}
                            {c.property.city ? `, ${c.property.city}` : ""}
                          </span>
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-semibold text-zinc-700">{c.pricingPlan.name}</span>
                      <span>•</span>
                      <span>
                        Valid: {new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {endDate
                          ? ` – ${endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="font-black text-zinc-900 text-sm">
                        ₹{c.pricingPlan.priceInr.toLocaleString("en-IN")}
                      </div>
                      {isLive && (
                        <div className="text-[10px] text-emerald-700 font-bold">
                          {daysRemaining} {daysRemaining === 1 ? "day left" : "days left"}
                        </div>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                        isLive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : c.status === "ACTIVE"
                          ? "bg-zinc-100 text-zinc-600"
                          : c.status === "PENDING_PAYMENT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />}
                      <span>{isLive ? "Active Boost" : c.status}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Property Selector Modal (when owner has multiple properties) */}
      {isPropertyPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E8EAE5] bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#00412E]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">Select Property to Promote</h3>
                  <p className="text-[11px] text-zinc-500">
                    Choose which PG accommodation to apply this visibility boost to
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPropertyPickerOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
              {properties.map((prop) => (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => handleSelectProperty(prop)}
                  className="w-full text-left py-3 px-3 hover:bg-zinc-50 rounded-2xl transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 group-hover:text-[#00412E]">
                      {prop.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-zinc-400" />
                      <span>{prop.locality}, {prop.city}</span>
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-[#00412E] transition-colors" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-100 text-center">
              <button
                type="button"
                onClick={() => setIsPropertyPickerOpen(false)}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Promote Modal */}
      {targetProperty && (
        <PromotePropertyModal
          propertyId={targetProperty.id}
          propertyName={targetProperty.name}
          isOpen={isPromoteModalOpen}
          onClose={() => {
            setIsPromoteModalOpen(false);
            setTargetProperty(null);
          }}
          onSuccess={() => {
            setIsPromoteModalOpen(false);
            setTargetProperty(null);
            router.refresh();
          }}
          boostsConfig={resolvedBoosts}
        />
      )}
    </div>
  );
}
