"use client";

import { useState } from "react";
import {
  Sparkles,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
} from "lucide-react";
import { STAYKRO_BILLING_CONFIG, type PropertyBoostType } from "@/config/billing";
import {
  createPropertyBoostOrderAction,
  verifyPropertyBoostPaymentAction,
} from "@/actions/billing";
import { useRazorpay } from "@/lib/useRazorpay";

interface PromotePropertyModalProps {
  propertyId: string;
  propertyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  boostsConfig?: {
    SEVEN_DAYS?: any;
    FIFTEEN_DAYS?: any;
    THIRTY_DAYS?: any;
  };
}

export function PromotePropertyModal({
  propertyId,
  propertyName,
  isOpen,
  onClose,
  onSuccess,
  boostsConfig,
}: PromotePropertyModalProps) {
  const [selectedTier, setSelectedTier] = useState<PropertyBoostType>("FIFTEEN_DAYS");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    days: number;
    expiryDate: string;
  } | null>(null);

  const { openOrderCheckout } = useRazorpay();

  if (!isOpen) return null;

  const resolvedBoosts = {
    SEVEN_DAYS: boostsConfig?.SEVEN_DAYS || STAYKRO_BILLING_CONFIG.boosts.SEVEN_DAYS,
    FIFTEEN_DAYS: boostsConfig?.FIFTEEN_DAYS || STAYKRO_BILLING_CONFIG.boosts.FIFTEEN_DAYS,
    THIRTY_DAYS: boostsConfig?.THIRTY_DAYS || STAYKRO_BILLING_CONFIG.boosts.THIRTY_DAYS,
  };

  const boostList = [
    resolvedBoosts.SEVEN_DAYS,
    resolvedBoosts.FIFTEEN_DAYS,
    resolvedBoosts.THIRTY_DAYS,
  ];

  const currentBoost = resolvedBoosts[selectedTier];

  const handlePromote = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create order server-side
      const res = await createPropertyBoostOrderAction({
        propertyId,
        boostType: selectedTier,
      });

      if (!res.success || !res.orderId) {
        setError(res.error || "Failed to initiate boost order. Please try again.");
        setIsProcessing(false);
        return;
      }

      // 2. Open Razorpay checkout
      await openOrderCheckout({
        key: res.keyId!,
        order_id: res.orderId,
        amount: Number(res.amountPaise),
        currency: "INR",
        name: "StayKro",
        description: `${res.propertyName} • ${res.boostName}`,
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
        onFailure: (failureResponse) => {
          setIsProcessing(false);
          setError(
            failureResponse?.error?.description ||
              "Payment was unsuccessful or cancelled. Please check your UPI app or payment method."
          );
        },
        handler: async (paymentResponse) => {
          try {
            // 3. Verify payment cryptographically server-side
            const verifyRes = await verifyPropertyBoostPaymentAction({
              propertyId,
              boostType: selectedTier,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.success) {
              setSuccessInfo({
                days: currentBoost.days,
                expiryDate: verifyRes.endDate || "",
              });
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
      console.error("Boost checkout error:", err);
      setError(err?.message || "Failed to launch Razorpay checkout.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#E8EAE5] bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8EAE5] px-6 py-4 bg-[#FAFAF8]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/40">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Promote Property</h3>
              <p className="text-[11px] text-zinc-500 line-clamp-1">{propertyName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successInfo ? (
            /* Success State */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/50 shadow-xs">
                <CheckCircle2 className="h-8 w-8 text-[#00412E]" />
              </div>
              <div>
                <h4 className="text-lg font-black text-zinc-950">Property Promoted!</h4>
                <p className="mt-1 text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                  Your property has received top search priority and a subtle verified{" "}
                  <strong>Promoted</strong> indicator for the next{" "}
                  <strong>{successInfo.days} days</strong>.
                </p>
                {successInfo.expiryDate && (
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Active through:{" "}
                    {new Date(successInfo.expiryDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-[#00412E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#002d20] shadow-sm transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Purchase Flow */
            <div className="space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Select Visibility Duration
                </span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  One-time payment • Boost automatically expires after duration with no recurring charges.
                </p>
              </div>

              {/* Boost Tier Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {boostList.map((tier) => {
                  const isSelected = selectedTier === tier.type;
                  return (
                    <div
                      key={tier.type}
                      onClick={() => setSelectedTier(tier.type as PropertyBoostType)}
                      className={`relative flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#00412E] bg-[#eff4ec]/40 ring-2 ring-[#96BF8A]/30 shadow-xs"
                          : "border-[#E8EAE5] bg-white hover:border-[#96BF8A]/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? "border-[#00412E] bg-[#00412E] text-white"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-950">
                              {tier.days} Days Boost
                            </span>
                            <span className="rounded-full bg-white border border-[#E8EAE5] px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                              {tier.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {tier.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-base font-black text-[#00412E]">
                            ₹{tier.priceInr}
                          </span>
                          {tier.originalPriceInr && tier.originalPriceInr > tier.priceInr && (
                            <span className="text-[11px] font-semibold text-zinc-400 line-through">
                              ₹{tier.originalPriceInr}
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-zinc-400 font-medium">
                          one-time
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* What Owner Gets */}
              <div className="rounded-2xl bg-[#FAFAF8] border border-[#E8EAE5] p-3.5 space-y-2 text-[11px] text-zinc-600">
                <div className="flex items-center gap-2 font-bold text-zinc-800">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>Promoted Placement Benefits:</span>
                </div>
                <ul className="space-y-1.5 pl-5 list-disc text-zinc-600">
                  <li>Placed at top of city & locality search results ahead of standard listings</li>
                  <li>Subtle, non-intrusive &ldquo;Promoted&rdquo; badge with verified credentials</li>
                  <li>Direct phone call & WhatsApp click-to-chat connections from prospective tenants</li>
                  <li>100% zero brokerage on all tenant move-ins</li>
                </ul>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E8EAE5]">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePromote}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#002d20] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Opening Secure Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{currentBoost.priceInr} & Promote</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
