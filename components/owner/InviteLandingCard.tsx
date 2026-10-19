"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  LogOut,
  BedDouble,
  Users,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { acceptOwnerInvitationAction } from "@/actions/invitation";
import { logoutAction } from "@/actions/auth";

export interface PublicInvitationDetails {
  id: string;
  email: string;
  inviteeName: string | null;
  status: string;
  expiresAt: Date;
}

export interface InviteLandingCardProps {
  token: string;
  invitation: PublicInvitationDetails | null;
  validationError?: string | null;
  currentUser?: {
    id: string;
    email: string | null;
    fullName?: string | null;
  } | null;
}

export function InviteLandingCard({
  token,
  invitation,
  validationError,
  currentUser,
}: InviteLandingCardProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(validationError || null);

  const handleAccept = async () => {
    setIsAccepting(true);
    setErrorMsg(null);

    const res = await acceptOwnerInvitationAction(token);
    setIsAccepting(false);

    if (res.success && res.redirectUrl) {
      router.push(res.redirectUrl);
    } else {
      setErrorMsg(res.error || "Failed to accept invitation.");
    }
  };

  const handleSwitchAccount = async () => {
    await logoutAction();
    router.push(`/login?returnUrl=/owner/invite/${token}`);
  };

  // 1. Invalid, Expired or Revoked Invitation View
  if (!invitation || validationError) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black text-zinc-900">
          Invitation Link Expired or Invalid
        </h1>
        <p className="text-sm text-zinc-600">
          {errorMsg ||
            "This invitation link could not be verified. Owner onboarding on StayKro is by administrative invitation only."}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
          >
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  // Email comparison (case-insensitive)
  const isEmailMatching =
    currentUser &&
    currentUser.email &&
    currentUser.email.trim().toLowerCase() === invitation.email.trim().toLowerCase();

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10 shadow-lg space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#E8EAE5] shadow-xs p-1 mb-2">
          <Image
            src="/logo.png"
            alt="StayKro Logo"
            width={48}
            height={48}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-3.5 py-1 text-xs font-bold text-[#00412E]">
          <Sparkles className="h-3.5 w-3.5 text-[#00412E]" />
          <span>Exclusive Administrator Invitation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
          You&apos;re Invited to List Your PG on StayKro
        </h1>
        <p className="text-sm text-zinc-600 max-w-md mx-auto">
          {invitation.inviteeName ? `Hello ${invitation.inviteeName}, ` : "Welcome! "}
          Complete your owner setup to publish your property, configure room inventory, and manage
          tenant leads.
        </p>
      </div>

      {/* Target Invitation Pill */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold text-zinc-700">Invited Email:</span>{" "}
            <span className="font-black text-indigo-900">{invitation.email}</span>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Valid for 7 days
        </span>
      </div>

      {/* Onboarding Overview Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5 space-y-1">
          <Building2 className="h-4 w-4 text-indigo-600" />
          <div className="text-xs font-bold text-zinc-900">1. Property Setup</div>
          <div className="text-[11px] text-zinc-600">Address, rules, food options, & amenities.</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5 space-y-1">
          <BedDouble className="h-4 w-4 text-violet-600" />
          <div className="text-xs font-bold text-zinc-900">2. Room Inventory</div>
          <div className="text-[11px] text-zinc-600">Set room numbers, bed pricing, & capacity.</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5 space-y-1">
          <Users className="h-4 w-4 text-emerald-600" />
          <div className="text-xs font-bold text-zinc-900">3. Direct Enquiries</div>
          <div className="text-[11px] text-zinc-600">Receive calls & WhatsApp chats from seekers.</div>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Auth Status & Call-To-Action */}
      <div className="border-t border-zinc-100 pt-6 space-y-4">
        {!currentUser ? (
          /* User Not Logged In */
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center space-y-3">
            <p className="text-xs font-semibold text-zinc-700">
              Sign in with <strong className="text-zinc-900">{invitation.email}</strong> to accept
              this invitation and activate your owner portal.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/login?invite=${token}&returnUrl=/owner/invite/${token}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00412E] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#002d20] shadow-md shadow-[#00412E]/20 transition-all cursor-pointer"
              >
                <span>Sign In with {invitation.email}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#96BF8A]" />
              </Link>
              <Link
                href={`/signup?invite=${token}&email=${encodeURIComponent(invitation.email)}&returnUrl=/owner/invite/${token}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#E8EAE5] bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-[#E8EAE5]/40 transition-all cursor-pointer"
              >
                <span>Create New Account</span>
              </Link>
            </div>
          </div>
        ) : isEmailMatching ? (
          /* User Logged In with MATCHING email */
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Signed in as {currentUser.email} (Email Verified)</span>
            </div>

            <div>
              <button
                type="button"
                disabled={isAccepting}
                onClick={handleAccept}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3 text-sm font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer disabled:opacity-50 transition-all"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isAccepting ? "Activating Owner Account..." : "Accept Invitation & Begin Setup"}</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        ) : (
          /* User Logged In with WRONG email */
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3 text-center sm:text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900">
                  Signed in with a different email address
                </h4>
                <p className="text-xs text-amber-800">
                  This invitation was sent specifically to <strong>{invitation.email}</strong>. You are
                  currently logged in as <strong>{currentUser.email}</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out & Sign In with {invitation.email}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
