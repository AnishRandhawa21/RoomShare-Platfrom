"use client";

import { useState } from "react";
import { X, Phone, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 p-6 sm:p-8">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-extrabold text-zinc-900">
            Welcome to RoomNest
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Log in to contact verified PG owners & post roommate requirements
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="phone-input"
              className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5"
            >
              Enter Mobile Number
            </label>
            <div className="flex rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:bg-white transition-all">
              <span className="text-sm font-bold text-zinc-700 mr-2 border-r border-zinc-200 pr-2 flex items-center">
                +91
              </span>
              <input
                id="phone-input"
                type="tel"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="98765 43210"
                className="w-full bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              alert(
                "Phone OTP authentication with Supabase Auth will be wired up in the upcoming Authentication milestone per development plan."
              );
              onClose();
            }}
            className="w-full rounded-2xl bg-indigo-600 py-3 text-center text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue with OTP</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="relative my-4 text-center">
            <span className="bg-white px-3 text-xs text-zinc-400 font-medium">
              or continue with
            </span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-zinc-100" />
          </div>

          <button
            type="button"
            onClick={() => {
              alert(
                "Google OAuth via Supabase will be configured in the next phase."
              );
              onClose();
            }}
            className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 text-center text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Account</span>
          </button>
        </div>

        <div className="mt-5 text-center text-[11px] text-zinc-400 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Your contact info is never shared without your permission</span>
        </div>
      </div>
    </div>
  );
}
