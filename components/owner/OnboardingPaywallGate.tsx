"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, ArrowLeft, ShieldAlert } from "lucide-react";
import { SubscriptionPaywallModal } from "@/components/owner/SubscriptionPaywallModal";
import type { OwnerPublishingEntitlement } from "@/lib/billing-entitlements";

interface OnboardingPaywallGateProps {
  entitlement: OwnerPublishingEntitlement;
}

export function OnboardingPaywallGate({ entitlement }: OnboardingPaywallGateProps) {
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-[#E8EAE5] bg-white p-8 sm:p-12 shadow-sm text-center relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#96BF8A]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#00412E]/5 blur-3xl pointer-events-none" />

        {/* Brand Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00412E]/5 border border-[#96BF8A]/30 p-2 mb-6">
          <Image
            src="/logo.png"
            alt="StayKro Logo"
            width={48}
            height={48}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-800 mb-4">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          <span>Property Limit Reached</span>
        </div>

        {/* Heading & Copy */}
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
          Upgrade to StayKro Plus to List More Properties
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-600 max-w-xl mx-auto leading-relaxed">
          Your current plan{" "}
          <strong className="text-zinc-900 font-bold">
            ({entitlement.activePlan?.name || "StayKro Solo"})
          </strong>{" "}
          allows{" "}
          <span className="font-bold text-[#00412E]">
            {entitlement.allowedCount} active {entitlement.allowedCount === 1 ? "property" : "properties"}
          </span>
          . You have already published{" "}
          <span className="font-bold text-zinc-900">
            {entitlement.publishedCount} / {entitlement.allowedCount}
          </span>{" "}
          properties.
        </p>

        {/* Features Comparison Highlights */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5">
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
              Current Plan
            </span>
            <div className="text-sm font-bold text-zinc-900">
              {entitlement.activePlan?.name || "StayKro Solo"} (₹499/mo)
            </div>
            <div className="text-xs text-zinc-500">1 published property quota</div>
          </div>
          <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-zinc-200 pt-3 sm:pt-0 sm:pl-5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#00412E]">
              Recommended Upgrade
            </span>
            <div className="text-sm font-bold text-[#00412E] flex items-center gap-1.5">
              <span>StayKro Plus (₹999/mo)</span>
              <Sparkles className="h-3.5 w-3.5 text-[#96BF8A]" />
            </div>
            <div className="text-xs text-zinc-600 font-medium">Multiple properties portfolio</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsPaywallOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#00412E] hover:bg-[#002f21] px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-[#00412E]/15 transition-all cursor-pointer group"
          >
            <span>Upgrade to StayKro Plus</span>
            <ArrowRight className="h-4 w-4 text-[#96BF8A] group-hover:translate-x-0.5 transition-transform" />
          </button>

          <Link
            href="/owner/properties"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 px-6 py-3.5 text-sm font-bold text-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-zinc-400" />
            <span>Back to Properties</span>
          </Link>
        </div>
      </div>

      {/* Paywall Checkout Modal */}
      <SubscriptionPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        entitlement={entitlement}
        onSuccess={() => {
          setIsPaywallOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
