"use client";

import Link from "next/link";
import { ArrowLeft, Building2, ShieldCheck, Mail, Phone, Calendar, Layers } from "lucide-react";

export function AdminOwnerDetailClient({ owner }: { owner: any }) {
  const name = owner.user.profile?.fullName || owner.businessName || "PG Owner";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/owners"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-950">{name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                owner.verificationStatus === "VERIFIED"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : owner.verificationStatus === "PENDING"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {owner.verificationStatus}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Business: {owner.businessName || "Individual Landlord"} • Joined{" "}
            {new Date(owner.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Properties Portfolio & Subscriptions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Properties List */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-600" />
              <span>Managed Properties ({owner.properties.length})</span>
            </h2>

            <div className="space-y-3">
              {owner.properties.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No properties created by this owner yet.
                </div>
              ) : (
                owner.properties.map((p: any) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <Link
                        href={`/admin/properties/${p.id}`}
                        className="font-bold text-zinc-900 hover:text-violet-600 text-sm block"
                      >
                        {p.name}
                      </Link>
                      <span className="text-[11px] text-zinc-500">
                        {p.locality}, {p.city} • {p.roomTypes.length} Room Types
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {p.status}
                      </span>
                      <Link
                        href={`/admin/properties/${p.id}`}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subscriptions */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Subscription History</span>
            </h2>

            {owner.subscriptions.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No active subscription plan.</p>
            ) : (
              <div className="space-y-2">
                {owner.subscriptions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 block">{sub.plan.name}</span>
                      <span className="text-[11px] text-zinc-500">
                        Valid until {new Date(sub.endDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact & Auth Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Account Credentials
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-zinc-700">
                <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="truncate">{owner.user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-700">
                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>{owner.contactPhone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-700">
                <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>Joined: {new Date(owner.user.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-500">User Status:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  owner.user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {owner.user.isActive ? "Active Account" : "Suspended"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
