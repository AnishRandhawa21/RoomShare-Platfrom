"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
} from "lucide-react";
import { AuthSegmentedSwitch } from "./AuthSegmentedSwitch";
import { loginAction, signUpAction, type AuthActionResult } from "@/actions/auth";

interface AuthFormPanelProps {
  initialMode: "login" | "signup";
  returnUrl?: string;
  urlError?: string | null;
  urlMessage?: string | null;
  inviteToken?: string | null;
}

export function AuthFormPanel({
  initialMode,
  returnUrl = "/",
  urlError = null,
  urlMessage = null,
  inviteToken = null,
}: AuthFormPanelProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Server Action hooks
  const [loginState, loginFormAction, isLoginPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(loginAction, null);

  const [signupState, signupFormAction, isSignupPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(signUpAction, null);

  const handleTabChange = (newMode: "login" | "signup") => {
    setMode(newMode);
    setClientError(null);
    // Smooth URL update without full navigation
    const params = new URLSearchParams();
    if (returnUrl && returnUrl !== "/") params.set("returnUrl", returnUrl);
    if (inviteToken) params.set("invite", inviteToken);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    window.history.replaceState(null, "", `/${newMode}${queryString}`);
  };

  const handleSignupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Passwords do not match. Please verify both passwords.");
      return;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between py-8 px-6 sm:px-9 rounded-3xl bg-white/95 backdrop-blur-md border border-[#E8EAE5] shadow-xl shadow-zinc-950/[0.03]">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00412E] rounded-2xl"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-xs border border-[#E8EAE5] transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="StayKro Logo"
                width={44}
                height={44}
                className="h-full w-full object-contain p-1"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-zinc-950 group-hover:text-[#00412E] transition-colors">
                StayKro<span className="text-[#96BF8A]">.</span>
              </span>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Coliving & Roommates
              </p>
            </div>
          </Link>
        </div>

        {/* Owner Invitation Banner */}
        {inviteToken && (
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 p-3.5 border border-emerald-200/80 shadow-xs flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#00412E] text-white mt-0.5">
              <Crown className="h-4 w-4 text-[#96BF8A]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#00412E]">
                Host Invitation Active
              </p>
              <p className="text-[11px] text-zinc-600 leading-relaxed mt-0.5">
                Sign in or create an account with your invited email to activate your verified owner dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Segmented Switch */}
        <div className="mb-6">
          <AuthSegmentedSwitch activeTab={mode} onChange={handleTabChange} />
        </div>

        {/* Header Text */}
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-[26px]">
            {mode === "login" ? "Welcome back" : "Create your StayKro account"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 font-normal">
            {mode === "login"
              ? "Continue to find your stay and your people."
              : "Find your next stay and connect with the right people."}
          </p>
        </div>

        {/* Status & Error Messages */}
        {urlMessage === "password-updated" && (
          <div className="mb-4 rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Password updated successfully! Please sign in with your new password.</span>
          </div>
        )}

        {urlError && (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{urlError}</span>
          </div>
        )}

        {clientError && (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{clientError}</span>
          </div>
        )}

        {mode === "login" && loginState?.error && (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{loginState.error}</span>
          </div>
        )}

        {mode === "signup" && signupState?.error && (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{signupState.error}</span>
          </div>
        )}

        {mode === "signup" && signupState?.success && (
          <div className="mb-4 rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{signupState.message}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form
            id="auth-panel-login"
            role="tabpanel"
            aria-labelledby="tab-login"
            action={loginFormAction}
            className="space-y-4"
          >
            <input type="hidden" name="returnUrl" value={returnUrl} />
            {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}

            <div>
              <label
                htmlFor="login-identifier"
                className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Email
              </label>
              <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00412E] transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="login-identifier"
                  name="emailOrPhone"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="name@example.com"
                  className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-[#00412E] hover:underline focus:outline-none"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00412E] transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-11 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoginPending}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#00412E] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00412E]/20 hover:bg-[#002d20] active:scale-[0.98] transition-all disabled:opacity-70 cursor-pointer"
              >
                {isLoginPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#96BF8A]" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4 text-[#96BF8A]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === "signup" && (
          <form
            id="auth-panel-signup"
            role="tabpanel"
            aria-labelledby="tab-signup"
            action={signupFormAction}
            onSubmit={handleSignupSubmit}
            className="space-y-3.5"
          >
            <input type="hidden" name="returnUrl" value={returnUrl} />
            {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}

            <div>
              <label
                htmlFor="signup-name"
                className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00412E] transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="signup-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="block w-full rounded-2xl bg-transparent py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00412E] transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  className="block w-full rounded-2xl bg-transparent py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-phone"
                className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Phone Number <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00412E] transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Phone className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="9876543210"
                  className="block w-full rounded-2xl bg-transparent py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Password <span className="font-normal text-zinc-400">(Min. 6 chars)</span>
              </label>
              <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00412E] transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-2xl bg-transparent py-2.5 pl-10 pr-11 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00412E] transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-2xl bg-transparent py-2.5 pl-10 pr-11 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSignupPending}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#00412E] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00412E]/20 hover:bg-[#002d20] active:scale-[0.98] transition-all disabled:opacity-70 cursor-pointer"
              >
                {isSignupPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#96BF8A]" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4 text-[#96BF8A]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Switch Bottom Link */}
      <div className="mt-8 text-center text-xs text-zinc-500">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className="font-bold text-[#00412E] hover:underline cursor-pointer"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className="font-bold text-[#00412E] hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
