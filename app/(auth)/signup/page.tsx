"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { signUpAction, type AuthActionResult } from "@/actions/auth";
import { Building2, ArrowRight, Lock, Mail, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";

function SignUpForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/profile";

  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    signUpAction,
    null
  );

  return (
    <div className="bg-white py-8 px-6 shadow-xl shadow-zinc-200/50 rounded-3xl border border-zinc-200/80 sm:px-10">
      {state?.error && (
        <div className="mb-6 rounded-2xl bg-rose-50 p-4 border border-rose-100 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="mb-6 rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Full Name
          </label>
          <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Mobile Number <span className="font-normal text-zinc-400">(Optional)</span>
          </label>
          <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Phone className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Password <span className="font-normal text-zinc-400">(Min. 6 chars)</span>
          </label>
          <div className="relative rounded-2xl border border-[#E8EAE5] bg-[#E8EAE5]/30 focus-within:border-[#00412E] focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#00412E] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00412E]/20 hover:bg-[#002d20] active:scale-95 transition-all disabled:opacity-70 cursor-pointer"
          >
            {isPending ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4 text-[#96BF8A]" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link
          href={returnUrl !== "/profile" ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login"}
          className="font-bold text-[#00412E] hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#E8EAE5]/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 group">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-sm border border-[#E8EAE5] transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="StayKro Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain p-1"
              priority
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900 group-hover:text-[#00412E] transition-colors">
            StayKro<span className="text-[#96BF8A] font-black">.</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
          Create your account
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-zinc-500">
          Join thousands finding verified PGs and roommates with zero brokerage.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="bg-white py-12 rounded-3xl border border-zinc-200 text-center text-xs text-zinc-400">Loading form...</div>}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
