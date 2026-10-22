"use client";

import { useState } from "react";
import {
  Tag,
  Sparkles,
  Layers,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  TrendingDown,
  Info,
  Calendar,
  Building2,
  History,
  Check,
  Percent,
} from "lucide-react";
import {
  updateAdminPricingPlanAction,
  resetPricingPlanToDefaultAction,
  type UpdatePricingPlanInput,
} from "@/actions/pricing";
import {
  AdminOwnerDiscountsTab,
  type OwnerPricingOverrideItem,
} from "@/components/admin/AdminOwnerDiscountsTab";

interface PlanItem {
  id: string;
  category: string;
  code: string;
  name: string;
  subtitle?: string | null;
  tagline?: string | null;
  description?: string | null;
  badge?: string | null;
  priceInr: number;
  originalPriceInr?: number | null;
  durationDays: number;
  maxProperties: number;
  features: string[];
  isActive: boolean;
  updatedAt: string | Date;
  updatedByUser?: {
    id: string;
    email?: string | null;
    profile?: { fullName?: string | null } | null;
  } | null;
}

interface AuditLogItem {
  id: string;
  action: string;
  createdAt: string | Date;
  details?: any;
  user?: {
    email?: string | null;
    profile?: { fullName?: string | null } | null;
  } | null;
}

interface AdminPricingClientProps {
  initialPlans: PlanItem[];
  auditLogs: AuditLogItem[];
  initialOverrides?: OwnerPricingOverrideItem[];
}

export function AdminPricingClient({
  initialPlans,
  auditLogs,
  initialOverrides = [],
}: AdminPricingClientProps) {
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans);
  const [mainSection, setMainSection] = useState<"GLOBAL_PRICING" | "OWNER_DISCOUNTS">("GLOBAL_PRICING");
  const [activeTab, setActiveTab] = useState<"ALL" | "LISTING_PASS" | "PROPERTY_BOOST">("ALL");

  // Track editable fields per plan
  const [formData, setFormData] = useState<
    Record<
      string,
      {
        name: string;
        priceInr: number;
        originalPriceInr: number | "";
        badge: string;
        tagline: string;
        description: string;
        durationDays: number;
        maxProperties: number;
        isActive: boolean;
      }
    >
  >(() => {
    const map: Record<string, any> = {};
    for (const p of initialPlans) {
      map[p.id] = {
        name: p.name,
        priceInr: p.priceInr,
        originalPriceInr: p.originalPriceInr ?? "",
        badge: p.badge || "",
        tagline: p.tagline || "",
        description: p.description || "",
        durationDays: p.durationDays,
        maxProperties: p.maxProperties,
        isActive: p.isActive,
      };
    }
    return map;
  });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [resettingCode, setResettingCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id?: string; type: "success" | "error"; message: string } | null>(null);

  const filteredPlans = plans.filter((p) => {
    if (activeTab === "ALL") return true;
    return p.category === activeTab;
  });

  const handleFieldChange = (planId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (plan: PlanItem) => {
    const current = formData[plan.id];
    if (!current) return;

    setSavingId(plan.id);
    setFeedback(null);

    const price = Number(current.priceInr);
    if (isNaN(price) || price < 1) {
      setFeedback({
        id: plan.id,
        type: "error",
        message: "Price must be a valid positive amount in ₹ (minimum ₹1).",
      });
      setSavingId(null);
      return;
    }

    let origPrice: number | null = null;
    if (current.originalPriceInr !== "" && current.originalPriceInr !== undefined) {
      origPrice = Number(current.originalPriceInr);
      if (isNaN(origPrice) || origPrice < price) {
        setFeedback({
          id: plan.id,
          type: "error",
          message: "Original / strikethrough price must be greater than or equal to selling price.",
        });
        setSavingId(null);
        return;
      }
    }

    const payload: UpdatePricingPlanInput = {
      id: plan.id,
      name: current.name,
      badge: current.badge || null,
      tagline: current.tagline || null,
      description: current.description || null,
      priceInr: price,
      originalPriceInr: origPrice,
      durationDays: Number(current.durationDays) || plan.durationDays,
      maxProperties: Number(current.maxProperties) || plan.maxProperties,
      isActive: current.isActive,
    };

    const res = await updateAdminPricingPlanAction(payload);

    if (res.success && res.data) {
      setPlans((prev) =>
        prev.map((item) => (item.id === plan.id ? { ...item, ...res.data, updatedAt: new Date() } : item))
      );
      setFeedback({
        id: plan.id,
        type: "success",
        message: `Pricing for ${plan.name} updated successfully! Active across checkout immediately.`,
      });
    } else {
      setFeedback({
        id: plan.id,
        type: "error",
        message: res.error || "Failed to save pricing changes.",
      });
    }

    setSavingId(null);
  };

  const handleResetToDefault = async (plan: PlanItem) => {
    if (!confirm(`Reset "${plan.name}" back to canonical StayKro default price and settings?`)) {
      return;
    }

    setResettingCode(plan.code);
    setFeedback(null);

    const res = await resetPricingPlanToDefaultAction(plan.code);

    if (res.success && res.data) {
      const updated = res.data;
      setPlans((prev) =>
        prev.map((item) => (item.id === plan.id ? { ...item, ...updated, updatedAt: new Date() } : item))
      );
      setFormData((prev) => ({
        ...prev,
        [plan.id]: {
          name: updated.name,
          priceInr: updated.priceInr,
          originalPriceInr: updated.originalPriceInr ?? "",
          badge: updated.badge || "",
          tagline: updated.tagline || "",
          description: updated.description || "",
          durationDays: updated.durationDays,
          maxProperties: updated.maxProperties,
          isActive: updated.isActive,
        },
      }));
      setFeedback({
        id: plan.id,
        type: "success",
        message: `Reset ${plan.name} to canonical defaults successfully!`,
      });
    } else {
      setFeedback({
        id: plan.id,
        type: "error",
        message: res.error || "Failed to reset plan.",
      });
    }

    setResettingCode(null);
  };

  const soloBasePrice = plans.find((p) => p.code === "PASS_SOLO")?.priceInr || 449;
  const plusBasePrice = plans.find((p) => p.code === "PASS_PLUS")?.priceInr || 799;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#00412E]">
              <Tag className="h-3 w-3" />
              Dynamic Pricing Engine
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
              Live in Checkout
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 mt-1.5">
            Monetization & Pricing Plans
          </h1>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Configure live pricing for 30-Day Owner Listing Passes and Property Visibility Boosts.
            Changes update Razorpay orders, owner paywalls, and listings instantaneously.
          </p>
        </div>

        {/* Main Section Navigation Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100/80 border border-zinc-200 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setMainSection("GLOBAL_PRICING")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainSection === "GLOBAL_PRICING"
                ? "bg-[#00412E] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Global Plans</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                mainSection === "GLOBAL_PRICING" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {plans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainSection("OWNER_DISCOUNTS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainSection === "OWNER_DISCOUNTS"
                ? "bg-[#00412E] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60"
            }`}
          >
            <Percent className="h-3.5 w-3.5" />
            <span>Owner Custom Discounts</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                mainSection === "OWNER_DISCOUNTS" ? "bg-white/20 text-white" : "bg-emerald-100 text-[#00412E]"
              }`}
            >
              {initialOverrides.length}
            </span>
          </button>
        </div>
      </div>

      {/* Conditionally Render Owner Discounts Tab OR Global Pricing Grid */}
      {mainSection === "OWNER_DISCOUNTS" ? (
        <AdminOwnerDiscountsTab
          initialOverrides={initialOverrides}
          soloBasePrice={soloBasePrice}
          plusBasePrice={plusBasePrice}
        />
      ) : (
        <>
          {/* Category Filter Pills (Global Plans) */}
          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-zinc-200 shadow-2xs">
            <span className="text-xs font-bold text-zinc-500 pl-2">Filter Catalog:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-[#00412E] text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                All Plans ({plans.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("LISTING_PASS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "LISTING_PASS"
                    ? "bg-[#00412E] text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Listing Passes (2)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("PROPERTY_BOOST")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "PROPERTY_BOOST"
                    ? "bg-[#00412E] text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Visibility Boosts (3)
              </button>
            </div>
          </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const form = formData[plan.id] || {
            name: plan.name,
            priceInr: plan.priceInr,
            originalPriceInr: plan.originalPriceInr ?? "",
            badge: plan.badge || "",
            tagline: plan.tagline || "",
            description: plan.description || "",
            durationDays: plan.durationDays,
            maxProperties: plan.maxProperties,
            isActive: plan.isActive,
          };

          const isListingPass = plan.category === "LISTING_PASS";
          const isSaving = savingId === plan.id;
          const isResetting = resettingCode === plan.code;

          const numPrice = Number(form.priceInr) || 0;
          const numOriginal = Number(form.originalPriceInr) || 0;
          const discountPct =
            numOriginal > numPrice && numOriginal > 0
              ? Math.round(((numOriginal - numPrice) / numOriginal) * 100)
              : null;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl border bg-white flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                isListingPass
                  ? "border-emerald-200/80 ring-1 ring-emerald-500/10"
                  : "border-zinc-200/90"
              }`}
            >
              {/* Card Top */}
              <div className="p-6 space-y-5">
                {/* Header Category & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isListingPass
                        ? "bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/30"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {isListingPass ? <Layers className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    {isListingPass ? "30-Day Listing Pass" : "Property Boost"}
                  </span>

                  <span className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-100 rounded-md px-1.5 py-0.5">
                    {plan.code}
                  </span>
                </div>

                {/* Plan Name & Badge */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 h-4 leading-4 truncate mb-1">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleFieldChange(plan.id, "name", e.target.value)}
                      className="w-full h-10 text-base font-black text-zinc-950 bg-zinc-50/60 focus:bg-white border border-zinc-200 rounded-xl px-3 focus:border-[#00412E] focus:outline-hidden transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 h-4 leading-4 truncate mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={form.badge}
                      placeholder="e.g. Single PG • 30 Days"
                      onChange={(e) => handleFieldChange(plan.id, "badge", e.target.value)}
                      className="w-full h-9 text-xs font-semibold text-zinc-700 bg-zinc-50/60 focus:bg-white border border-zinc-200 rounded-xl px-3 focus:border-[#00412E] focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Pricing Fields (Selling Price & Strikethrough Price) */}
                <div className="rounded-2xl bg-zinc-50/90 border border-zinc-200/80 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Live Selling Price */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#00412E] h-4 leading-4 truncate mb-1.5" title="Active Price (₹)">
                        Active Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 inset-y-0 flex items-center text-sm font-black text-zinc-500 pointer-events-none select-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="500000"
                          value={form.priceInr}
                          onChange={(e) =>
                            handleFieldChange(plan.id, "priceInr", parseInt(e.target.value) || 0)
                          }
                          className="w-full h-10 pl-7 pr-3 text-base font-black text-zinc-950 bg-white border border-emerald-300 focus:border-[#00412E] focus:ring-2 focus:ring-[#00412E]/10 rounded-xl focus:outline-hidden shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Strikethrough Original Price */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 h-4 leading-4 truncate mb-1.5" title="Original Price (₹)">
                        Original Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 inset-y-0 flex items-center text-sm font-bold text-zinc-400 pointer-events-none select-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="500000"
                          placeholder="Optional"
                          value={form.originalPriceInr}
                          onChange={(e) =>
                            handleFieldChange(
                              plan.id,
                              "originalPriceInr",
                              e.target.value === "" ? "" : parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full h-10 pl-7 pr-3 text-base font-bold text-zinc-700 bg-white border border-zinc-200 focus:border-zinc-400 rounded-xl focus:outline-hidden shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Discount Percentage Pill */}
                  <div className="min-h-[26px] flex items-center">
                    {discountPct !== null ? (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1 border border-emerald-200/60 truncate">
                        <TrendingDown className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          Saves ₹{numOriginal - numPrice} ({discountPct}% discount badge on website)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-400/90 italic pl-0.5">
                        No strikethrough discount
                      </span>
                    )}
                  </div>
                </div>

                {/* Duration & Allowed Properties Parameters */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 h-4 leading-4 truncate mb-1.5">
                      Duration (Days)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={form.durationDays}
                        onChange={(e) =>
                          handleFieldChange(plan.id, "durationDays", parseInt(e.target.value) || 1)
                        }
                        className="w-full h-9 text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl px-3 focus:border-[#00412E] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 h-4 leading-4 truncate mb-1.5">
                      PG Limit
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        disabled={!isListingPass}
                        value={form.maxProperties}
                        onChange={(e) =>
                          handleFieldChange(plan.id, "maxProperties", parseInt(e.target.value) || 1)
                        }
                        className="w-full h-9 text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl px-3 focus:border-[#00412E] focus:outline-hidden disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 h-4 leading-4 truncate mb-1">
                    Tagline / Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => handleFieldChange(plan.id, "description", e.target.value)}
                    className="w-full h-16 text-xs text-zinc-700 bg-zinc-50/60 focus:bg-white border border-zinc-200 rounded-xl p-2.5 focus:border-[#00412E] focus:outline-hidden resize-none"
                  />
                </div>

                {/* Features Pill Summary */}
                {plan.features.length > 0 && (
                  <div className="space-y-1.5 pt-1 min-h-[72px]">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 h-4 leading-4">
                      Features ({plan.features.length})
                    </span>
                    <ul className="space-y-1 text-[11px] text-zinc-600">
                      {plan.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 truncate">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card Footer: Last updated metadata + Action buttons */}
              <div className="p-5 border-t border-zinc-100 bg-zinc-50/60 rounded-b-3xl space-y-3">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1 truncate">
                    <ShieldCheck className="h-3 w-3 text-zinc-400 shrink-0" />
                    <span>
                      {plan.updatedByUser?.profile?.fullName || plan.updatedByUser?.email
                        ? `By ${plan.updatedByUser.profile?.fullName || plan.updatedByUser.email}`
                        : "System Default"}
                    </span>
                  </span>
                  <span>
                    {new Date(plan.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSave(plan)}
                    disabled={isSaving || isResetting}
                    className="flex-1 rounded-xl bg-[#00412E] hover:bg-[#002f21] text-white py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 text-[#96BF8A]" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    title="Reset to canonical StayKro defaults"
                    onClick={() => handleResetToDefault(plan)}
                    disabled={isSaving || isResetting}
                    className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 p-2 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isResetting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit History Timeline */}
      {auditLogs.length > 0 && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#00412E]" />
              <h2 className="text-sm font-bold text-zinc-950">Recent Pricing Audit Trail</h2>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">Immutable Log</span>
          </div>

          <div className="divide-y divide-zinc-100 text-xs">
            {auditLogs.map((log) => {
              const details = log.details as any;
              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-100 rounded px-1.5 py-0.5 shrink-0">
                      {details?.planCode || "PLAN"}
                    </span>
                    <span className="font-semibold text-zinc-800 truncate">
                      {details?.name || "Pricing plan"}: ₹{details?.previousPriceInr} → ₹{details?.newPriceInr}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 shrink-0">
                    <span>
                      {log.user?.profile?.fullName || log.user?.email || "Admin"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
