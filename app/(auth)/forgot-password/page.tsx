"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type AuthActionResult } from "@/actions/auth";
import { Building2, ArrowLeft, Mail, AlertCircle, CheckCircle2, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    forgotPasswordAction,
    null
  );

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100 transition-transform group-hover:scale-105">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900">
            StayKro<span className="text-indigo-600 font-black">.</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-zinc-500">
          Enter your registered email and we&apos;ll send you a password reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
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

          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Registered Email Address
              </label>
              <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 focus-within:border-indigo-500 focus-within:bg-white transition-all">
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
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 cursor-pointer"
              >
                {isPending ? (
                  <span>Sending Link...</span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
