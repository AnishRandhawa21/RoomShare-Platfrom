"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  CreditCard,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";
import { STAYKRO_BILLING_CONFIG, type ListingPassPlanCode } from "@/config/billing";
import {
  createListingPassOrderAction,
  verifyListingPassPaymentAction,
} from "@/actions/billing";
import { useRazorpay } from "@/lib/useRazorpay";
import { PromotePropertyModal } from "@/components/property/PromotePropertyModal";

interface PlanConfigItem {
  code: string;
  name: string;
  priceInr: number;
  durationDays: number;
  maxProperties: number;
  tagline: string;
  description: string;
  badge: string;
  features: string[];
}

interface ActiveSubItem {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  cancelledAt?: string | null;
  plan: {
    id: string;
    code: string;
    name: string;
    priceInr: number;
    maxProperties: number;
  };
}

interface BoostItem {
  id: string;
  boostType: string;
  durationDays: number;
  amountInr: number;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  property: {
    id: string;
    name: string;
    slug: string;
    locality: string;
    city: string;
  };
}

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  purpose: string;
  paymentType?: string | null;
  status: string;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  createdAt: string;
  ownerListingPass?: {
    planType?: string;
  } | null;
  ownerSubscription?: {
    plan?: { name: string };
  } | null;
  propertyBoost?: {
    property?: { name: string };
  } | null;
}

interface PropertySummary {
  id: string;
  name: string;
  status: string;
  locality: string;
  city: string;
}

interface OwnerSubscriptionClientProps {
  activeSubscription?: ActiveSubItem | null;
  subscriptionsHistory: ActiveSubItem[];
  activeBoosts: BoostItem[];
  payments: PaymentItem[];
  properties: PropertySummary[];
  publishedPropertiesCount: number;
  allowedPropertiesCount: number;
  plansConfig: Record<string, PlanConfigItem>;
  passesConfig?: Record<string, PlanConfigItem>;
  boostsConfig: typeof STAYKRO_BILLING_CONFIG.boosts;
  plusMaxProperties: number;
}

export function OwnerSubscriptionClient({
  activeSubscription,
  subscriptionsHistory,
  activeBoosts,
  payments,
  properties,
  publishedPropertiesCount,
  allowedPropertiesCount,
  plansConfig,
  boostsConfig,
  plusMaxProperties,
}: OwnerSubscriptionClientProps) {
  const router = useRouter();
  const { openOrderCheckout } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Property Boost Modal State
  const [promoteProperty, setPromoteProperty] = useState<PropertySummary | null>(null);

  const handlePurchasePass = async (planCode: ListingPassPlanCode) => {
    setIsProcessing(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      // 1. Create one-time 30-day listing pass order
      const res = await createListingPassOrderAction(planCode);

      if (!res.success || !res.orderId) {
        setActionError(res.error || "Failed to create listing pass order. Please try again.");
        setIsProcessing(false);
        return;
      }

      // 2. Open standard Razorpay Checkout (UPI, Cards, Netbanking)
      await openOrderCheckout({
        key: res.keyId!,
        order_id: res.orderId,
        amount: Number(res.amountPaise),
        currency: "INR",
        name: "StayKro",
        description: `${res.planName} (30-Day Listing Pass)`,
        image: "/logo.png",
        prefill: {
          name: res.user?.name,
          email: res.user?.email || undefined,
          contact: res.user?.phone || undefined,
        },
        theme: {
          color: "#00412E",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        handler: async (paymentResponse) => {
          try {
            const verifyRes = await verifyListingPassPaymentAction({
              planCode,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.success) {
              setSuccessMessage(verifyRes.message || "Listing Pass activated for 30 days!");
              router.refresh();
            } else {
              setActionError(verifyRes.error || "Payment verification failed.");
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            setActionError(err?.message || "Verification failed.");
          } finally {
            setIsProcessing(false);
          }
        },
      });
    } catch (err: any) {
      console.error("Checkout launch error:", err);
      setActionError(err?.message || "Failed to launch Razorpay checkout.");
      setIsProcessing(false);
    }
  };

  const currentPlanCode = activeSubscription?.plan?.code?.toUpperCase();
  const isSoloActive = currentPlanCode === "SOLO" || currentPlanCode === "OWNER_SINGLE_PROPERTY";
  const isPlusActive = currentPlanCode === "PLUS" || currentPlanCode === "OWNER_MULTI_PROPERTY";
  const isPassActive = activeSubscription && activeSubscription.status === "ACTIVE";

  const now = new Date();
  const endDate = activeSubscription?.endDate ? new Date(activeSubscription.endDate) : null;
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isExpiringSoon = isPassActive && daysRemaining <= 7;

  const percentUsed =
    allowedPropertiesCount > 0
      ? Math.min(100, Math.round((publishedPropertiesCount / allowedPropertiesCount) * 100))
      : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#E8EAE5] bg-white p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#00412E]">
              Owner Hub • Listing Passes
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 mt-1">
            StayKro 30-Day Listing Passes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Pay-as-you-go 30-day listing licenses. Zero automatic monthly debits — renew only when you have live properties.
          </p>
        </div>

        {properties.length > 0 && (
          <button
            type="button"
            onClick={() => setPromoteProperty(properties[0])}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#002d20] shadow-sm transition-all self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-[#96BF8A]" />
            <span>Promote a Property</span>
          </button>
        )}
      </div>

      {/* Global Alerts */}
      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-start gap-2 shadow-2xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-start gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Expiring Soon Reminder Banner */}
      {isExpiringSoon && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-amber-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Your Listing Pass expires in {daysRemaining} {daysRemaining === 1 ? "day" : "days"}!
              </p>
              <p className="text-[11px] text-amber-800">
                Renew now to seamlessly extend your visibility by 30 days without interruption.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handlePurchasePass((currentPlanCode as any) || "SOLO")}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#00412E] hover:bg-[#002f21] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <span>Renew for 30 Days</span>
            <ArrowRight className="h-3 w-3 text-[#96BF8A]" />
          </button>
        </div>
      )}

      {/* Overview Grid: Active Pass & Property Quota */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Active Pass */}
        <div className="lg:col-span-7 rounded-3xl border border-[#E8EAE5] bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EAE5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Listing License Status
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isPassActive
                    ? "bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/40"
                    : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                }`}
              >
                {isPassActive ? "Listing Pass Active" : "No Active Pass"}
              </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black text-zinc-950">
                  {isPassActive
                    ? activeSubscription?.plan?.name || "StayKro 30-Day Pass"
                    : "Pass Expired or Inactive"}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isPlusActive
                    ? `${publishedPropertiesCount} properties active (up to ${allowedPropertiesCount} allowed)`
                    : isSoloActive
                    ? "1 of 1 property used"
                    : "Purchase a 30-day listing pass to publish and keep your PG active on search."}
                </p>
              </div>

              {isPassActive && activeSubscription && (
                <div className="text-right">
                  <div className="text-2xl font-black text-[#00412E]">
                    ₹{activeSubscription.plan.priceInr}
                    <span className="text-xs font-normal text-zinc-400"> / 30d</span>
                  </div>
                </div>
              )}
            </div>

            {/* Dates & Pass details */}
            {isPassActive && activeSubscription && (
              <div className="mt-4 pt-4 border-t border-[#E8EAE5] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase">
                    Expires On
                  </span>
                  <span className="font-bold text-zinc-800">
                    {new Date(activeSubscription.endDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase">
                    Days Remaining
                  </span>
                  <span className={`font-bold ${daysRemaining <= 5 ? "text-amber-600" : "text-zinc-800"}`}>
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase">
                    Renewal Model
                  </span>
                  <span className="font-bold text-[#00412E]">Manual (No Auto-Debit)</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-4 border-t border-[#E8EAE5] flex flex-wrap items-center justify-between gap-3">
            {isSoloActive ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePurchasePass("PLUS")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00412E] px-4 py-2 text-xs font-bold text-white hover:bg-[#002d20] shadow-2xs transition-all cursor-pointer"
                >
                  <span>Upgrade to StayKro Plus (₹999)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePurchasePass("SOLO")}
                  className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                >
                  <span>Renew Solo (+30 Days)</span>
                </button>
              </div>
            ) : isPlusActive ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#00412E] inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Multi-Property Plus Pass Active
                </span>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePurchasePass("PLUS")}
                  className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                >
                  <span>Extend Plus (+30 Days)</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePurchasePass("SOLO")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00412E] px-4 py-2 text-xs font-bold text-white hover:bg-[#002d20] shadow-2xs transition-all cursor-pointer"
                >
                  <span>Get StayKro Solo (₹499)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePurchasePass("PLUS")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#00412E] bg-white text-[#00412E] hover:bg-[#eff4ec] px-4 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <span>Get StayKro Plus (₹999)</span>
                </button>
              </div>
            )}

            <div className="text-[11px] text-zinc-400">
              One-time payment • Never auto-charges
            </div>
          </div>
        </div>

        {/* Right: Property Usage Gauge */}
        <div className="lg:col-span-5 rounded-3xl border border-[#E8EAE5] bg-[#FAFAF8] p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EAE5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Property Allowance
              </span>
              <Building2 className="h-4 w-4 text-zinc-400" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-zinc-950">
                    {publishedPropertiesCount}
                  </span>
                  <span className="text-sm font-semibold text-zinc-400">
                    {" "}
                    / {allowedPropertiesCount} Allowed
                  </span>
                </div>
                <span className="text-xs font-bold text-zinc-600">
                  {percentUsed}% Quota Used
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentUsed >= 100 ? "bg-amber-500" : "bg-[#00412E]"
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed pt-1">
                {publishedPropertiesCount >= allowedPropertiesCount
                  ? "You have reached your published property limit. Upgrade to StayKro Plus to publish more accommodations."
                  : `You can publish ${
                      Math.max(0, allowedPropertiesCount - publishedPropertiesCount)
                    } more property under your current listing pass.`}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E8EAE5]">
            <Link
              href="/owner/properties"
              className="text-xs font-bold text-[#00412E] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage property listings ({properties.length} total)</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 30-Day Passes Options Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-zinc-900 tracking-tight">
            Select a 30-Day Listing Pass
          </h2>
          <p className="text-xs text-zinc-500">
            Choose the tier that fits your portfolio. Pay once for 30 days of visibility with zero automatic charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Solo Card */}
          <div className="rounded-3xl border border-[#E8EAE5] bg-white p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    Single Property
                  </span>
                  <h3 className="text-xl font-black text-zinc-950">StayKro Solo</h3>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                  1 PG • 30 Days
                </span>
              </div>

              <div>
                <div className="text-3xl font-black text-zinc-950">
                  ₹499
                  <span className="text-xs font-medium text-zinc-400"> / 30 days</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Valid for 30 days • One-time payment via UPI / Card
                </div>
              </div>

              <ul className="space-y-2 text-xs text-zinc-600 pt-3 border-t border-zinc-100">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Publish 1 live PG accommodation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Direct WhatsApp & phone tenant enquiries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Full room & bed inventory management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Zero commission on tenant bookings</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePurchasePass("SOLO")}
                className="w-full rounded-full bg-[#00412E] hover:bg-[#002f21] py-3 text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Get Solo Pass (₹499)</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#96BF8A]" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Plus Card */}
          <div className="rounded-3xl border border-[#96BF8A]/50 bg-[#eff4ec]/25 p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#00412E] text-white px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#96BF8A]" />
              <span>Multi-PG</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#00412E]">
                  Multi-Property Portfolio
                </span>
                <h3 className="text-xl font-black text-zinc-950">StayKro Plus</h3>
              </div>

              <div>
                <div className="text-3xl font-black text-zinc-950">
                  ₹999
                  <span className="text-xs font-medium text-zinc-400"> / 30 days</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Valid for 30 days • Up to {plusMaxProperties} published PGs
                </div>
              </div>

              <ul className="space-y-2 text-xs text-zinc-600 pt-3 border-t border-[#96BF8A]/20">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Publish up to {plusMaxProperties} live PG accommodations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Priority search algorithm boost</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Centralized portfolio occupancy dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Direct WhatsApp & phone tenant leads</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#96BF8A]/20">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePurchasePass("PLUS")}
                className="w-full rounded-full bg-[#00412E] hover:bg-[#002f21] py-3 text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Get Plus Pass (₹999)</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#96BF8A]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Boosts Section */}
      {activeBoosts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Active Property Boosts</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeBoosts.map((boost) => (
              <div
                key={boost.id}
                className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 truncate">
                    {boost.property.name}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Promoted
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  {boost.durationDays}-Day Boost • ₹{boost.amountInr}
                </div>
                {boost.endDate && (
                  <div className="text-[11px] text-amber-900 font-semibold flex items-center gap-1 pt-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Expires {new Date(boost.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History Ledger */}
      <div className="space-y-3">
        <h2 className="text-base font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-zinc-500" />
          <span>Payment History</span>
        </h2>

        {payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-500">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#E8EAE5] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E8EAE5] text-[10px] uppercase font-bold text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Razorpay Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EAE5]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-4 text-zinc-600">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900">
                        {p.purpose === "OWNER_LISTING_PASS"
                          ? "30-Day Listing Pass"
                          : p.purpose === "PROPERTY_BOOST"
                          ? `Property Boost • ${p.propertyBoost?.property?.name || "PG"}`
                          : p.purpose === "OWNER_SUBSCRIPTION"
                          ? "StayKro Listing Pass"
                          : p.purpose}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#00412E]">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.status === "CAPTURED" || p.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "CREATED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-zinc-400">
                        {p.razorpayPaymentId || p.razorpayOrderId || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Property Boost Modal */}
      {promoteProperty && (
        <PromotePropertyModal
          propertyId={promoteProperty.id}
          propertyName={promoteProperty.name}
          isOpen={true}
          onClose={() => setPromoteProperty(null)}
          onSuccess={() => {
            setPromoteProperty(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
