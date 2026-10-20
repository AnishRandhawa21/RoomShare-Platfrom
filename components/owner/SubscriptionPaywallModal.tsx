"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { STAYKRO_BILLING_CONFIG, type ListingPassPlanCode } from "@/config/billing";
import {
  createListingPassOrderAction,
  verifyListingPassPaymentAction,
} from "@/actions/billing";
import { useRazorpay } from "@/lib/useRazorpay";
import type { OwnerPublishingEntitlement } from "@/lib/billing-entitlements";

interface SubscriptionPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  entitlement?: OwnerPublishingEntitlement | null;
  onSuccess?: () => void;
}

export function SubscriptionPaywallModal({
  isOpen,
  onClose,
  entitlement,
  onSuccess,
}: SubscriptionPaywallModalProps) {
  const router = useRouter();
  const { openOrderCheckout } = useRazorpay();
  const [selectedPlan, setSelectedPlan] = useState<ListingPassPlanCode>(
    entitlement?.suggestedUpgrade || "PLUS"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPlanName, setSuccessPlanName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (planCode: ListingPassPlanCode) => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create one-time 30-day listing pass order server-side
      const res = await createListingPassOrderAction(planCode);

      if (!res.success || !res.orderId) {
        setError(res.error || "Failed to initiate listing pass order. Please try again.");
        setIsProcessing(false);
        return;
      }

      // 2. Open standard one-time Razorpay Checkout (UPI, Cards, Netbanking)
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
            // 3. Cryptographically verify signature server-side
            const verifyRes = await verifyListingPassPaymentAction({
              planCode,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.success) {
              setSuccessPlanName(verifyRes.planName || res.planName || null);
              if (onSuccess) onSuccess();
            } else {
              setError(verifyRes.error || "Payment verification failed.");
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            setError(err?.message || "Failed to verify transaction.");
          } finally {
            setIsProcessing(false);
          }
        },
      });
    } catch (err: any) {
      console.error("Listing pass checkout error:", err);
      setError(err?.message || "Failed to launch payment checkout.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#E8EAE5] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8EAE5] px-6 py-4 bg-[#FAFAF8]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                {entitlement?.hasExpiredPass
                  ? "Renew Your StayKro Listing Pass"
                  : "StayKro 30-Day Listing Pass"}
              </h3>
              <p className="text-[11px] text-zinc-500">
                One-time payment for 30 days of active visibility • No recurring charges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success View */}
        {successPlanName ? (
          <div className="p-8 sm:p-10 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eff4ec] text-[#00412E]">
              <CheckCircle2 className="h-8 w-8 text-[#00412E]" />
            </div>
            <h2 className="text-2xl font-black text-zinc-950">
              Your 30-Day Listing Pass is Active!
            </h2>
            <p className="text-sm text-zinc-600 max-w-md mx-auto">
              Your PG is now live and published on StayKro for the next 30 days. You will not be automatically charged when your pass expires.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.refresh();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#00412E] hover:bg-[#002f21] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                <span>Continue to Properties</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#96BF8A]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Context Notice */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3">
              <Calendar className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {entitlement?.reason ||
                    "You have reached your active property limit. Purchase a 30-day listing pass to list and publish your property."}
                </p>
                <p className="text-[11px] text-amber-800/80 mt-1">
                  StayKro operates on a transparent 30-day pass model. You only pay when you have an active property.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Passes Comparison Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* StayKro Solo */}
              <div
                onClick={() => setSelectedPlan("SOLO")}
                className={`relative rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedPlan === "SOLO"
                    ? "border-[#00412E] ring-2 ring-[#00412E]/15 bg-white shadow-md"
                    : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                      StayKro Solo
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                      1 PG • 30 Days
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-zinc-950">₹499</div>
                    <div className="text-[11px] text-zinc-500 font-medium">
                      One-time payment • Valid for 30 days
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-200/60">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                      <span>Publish 1 Live PG Property</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                      <span>Direct WhatsApp & Call Leads</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                      <span>No Auto-Debit Mandate Required</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout("SOLO");
                    }}
                    disabled={isProcessing}
                    className={`w-full rounded-full py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPlan === "SOLO"
                        ? "bg-[#00412E] hover:bg-[#002f21] text-white shadow-xs"
                        : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                    }`}
                  >
                    {isProcessing && selectedPlan === "SOLO" ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Opening Checkout...</span>
                      </>
                    ) : (
                      <span>Get Solo Pass (₹499)</span>
                    )}
                  </button>
                </div>
              </div>

              {/* StayKro Plus */}
              <div
                onClick={() => setSelectedPlan("PLUS")}
                className={`relative rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedPlan === "PLUS"
                    ? "border-[#00412E] ring-2 ring-[#00412E]/15 bg-[#eff4ec]/30 shadow-md"
                    : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300"
                }`}
              >
                <div className="absolute -top-2.5 right-4 rounded-full bg-[#00412E] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#96BF8A]" />
                  <span>Multi-PG</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#00412E]">
                      StayKro Plus
                    </span>
                    <span className="rounded-full bg-[#96BF8A]/30 text-[#00412E] px-2 py-0.5 text-[10px] font-bold">
                      Up to {STAYKRO_BILLING_CONFIG.plusMaxProperties} PGs
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-zinc-950">₹999</div>
                    <div className="text-[11px] text-zinc-500 font-medium">
                      One-time payment • Valid for 30 days
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-200/60">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                      <span>Multiple Active Properties</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                      <span>Priority Search Algorithm Boost</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                      <span>Centralized Multi-PG Occupancy Hub</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout("PLUS");
                    }}
                    disabled={isProcessing}
                    className={`w-full rounded-full py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPlan === "PLUS"
                        ? "bg-[#00412E] hover:bg-[#002f21] text-white shadow-xs"
                        : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                    }`}
                  >
                    {isProcessing && selectedPlan === "PLUS" ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Opening Checkout...</span>
                      </>
                    ) : (
                      <span>Get Plus Pass (₹999)</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Footer */}
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
              <span className="flex items-center gap-1">
                <span>🛡️</span> 100% Secure Razorpay Checkout (UPI, Cards, Netbanking)
              </span>
              <span>Valid for 30 Days</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
