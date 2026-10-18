"use client";

import { ShieldCheck, Database, Key, Server, CheckCircle2, Lock, Bell, Sliders } from "lucide-react";

interface AdminSettingsClientProps {
  adminEmail: string;
  adminName: string;
}

export function AdminSettingsClient({ adminEmail, adminName }: AdminSettingsClientProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Settings & Health</h1>
        <p className="text-xs text-slate-500 mt-1">
          System policies, administrative access controls, and operational infrastructure status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Profile Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Admin Session</h2>
              <p className="text-xs text-slate-500">Security Clearance: Platform Administrator</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Admin Account:</span>
              <span className="font-semibold text-slate-800">{adminName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-mono text-slate-700">{adminEmail}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Authorization Level:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                <CheckCircle2 className="h-3 w-3" />
                ROLE_ADMIN
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Audit Logging:</span>
              <span className="text-emerald-600 font-semibold">Active & Immutable</span>
            </div>
          </div>
        </div>

        {/* System Health & Integrations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Infrastructure & Microservices</h2>
              <p className="text-xs text-slate-500">Connected services and operational telemetry</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600">Supabase PostgreSQL</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600">Authentication Service (Supabase Auth)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600">Payment Gateway (Razorpay)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Webhook Ready
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600">Media Storage (Cloudflare R2)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Business Policies */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Enforced Platform Policies</h2>
            <p className="text-xs text-slate-500">Global platform constraints enforced by backend rules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Owner Onboarding</p>
            <p className="text-sm font-bold text-slate-900 mt-1">Strict Invitation Only</p>
            <p className="text-xs text-slate-500 mt-1">
              Public self-promotion to OWNER role is disabled. Must redeem admin token.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Invite Validity</p>
            <p className="text-sm font-bold text-slate-900 mt-1">7 Days Default</p>
            <p className="text-xs text-slate-500 mt-1">
              Unclaimed owner invites expire automatically after 7 calendar days.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Master Locations</p>
            <p className="text-sm font-bold text-slate-900 mt-1">Admin Controlled</p>
            <p className="text-xs text-slate-500 mt-1">
              Only platform admins can create or modify states, cities, and localities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
