"use client";

import Link from "next/link";
import {
  Users,
  Briefcase,
  Building2,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  CreditCard,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

interface OverviewData {
  stats: {
    totalUsers: number;
    totalOwners: number;
    totalProperties: number;
    activeProperties: number;
    roommateRequests: number;
    pendingReports: number;
    revenueInr: number;
    activeSubscriptions: number;
  };
  recentActivities: {
    recentOwners: any[];
    recentProperties: any[];
    recentRoommates: any[];
    recentReports: any[];
    recentPayments: any[];
    recentAuditLogs: any[];
  };
}

export function AdminOverviewClient({ data }: { data: OverviewData }) {
  const { stats, recentActivities } = data;

  const statCards = [
    {
      title: "Total Registered Users",
      value: stats.totalUsers.toLocaleString("en-IN"),
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      href: "/admin/users",
    },
    {
      title: "Verified Owners",
      value: stats.totalOwners.toLocaleString("en-IN"),
      icon: Briefcase,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      href: "/admin/owners",
    },
    {
      title: "Total Properties",
      value: stats.totalProperties.toLocaleString("en-IN"),
      icon: Building2,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      href: "/admin/properties",
    },
    {
      title: "Active Listed PGs",
      value: stats.activeProperties.toLocaleString("en-IN"),
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      href: "/admin/properties?status=PUBLISHED",
    },
    {
      title: "Roommate Requests",
      value: stats.roommateRequests.toLocaleString("en-IN"),
      icon: UserCheck,
      color: "text-violet-600 bg-violet-50 border-violet-200",
      href: "/admin/roommates",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports.toLocaleString("en-IN"),
      icon: AlertTriangle,
      color:
        stats.pendingReports > 0
          ? "text-rose-600 bg-rose-50 border-rose-200 animate-pulse"
          : "text-zinc-600 bg-zinc-50 border-zinc-200",
      href: "/admin/reports",
    },
    {
      title: "Platform Revenue",
      value: `₹${stats.revenueInr.toLocaleString("en-IN")}`,
      icon: CreditCard,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      href: "/admin/payments",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions.toLocaleString("en-IN"),
      icon: Layers,
      color: "text-teal-600 bg-teal-50 border-teal-200",
      href: "/admin/subscriptions",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            Administrator Overview
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time platform metrics, operational queue, and recent activities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/owners/invitations"
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-all shadow-xs"
          >
            <span>+ Send Owner Invite</span>
          </Link>
          <Link
            href="/admin/locations"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-2xs"
          >
            <span>Manage Locations</span>
          </Link>
        </div>
      </div>

      {/* 8 Real Database-Backed Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 truncate">
                  {card.title}
                </span>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${card.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                  {card.value}
                </span>
                <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Split Grid: Recent Properties, Recent Reports, Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Recent Properties */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-600" />
              <span>Recent Properties</span>
            </h2>
            <Link
              href="/admin/properties"
              className="text-[11px] font-bold text-violet-600 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentActivities.recentProperties.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No properties registered yet.</p>
            ) : (
              recentActivities.recentProperties.map((p: any) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900 block truncate">{p.name}</span>
                    <span className="text-[11px] text-zinc-500">
                      {p.locality}, {p.city}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                      p.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : p.status === "PENDING_APPROVAL"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Recent Reports */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Moderation Reports</span>
            </h2>
            <Link
              href="/admin/reports"
              className="text-[11px] font-bold text-rose-600 hover:underline"
            >
              View queue
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentActivities.recentReports.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No reports pending. Safe & clean!</p>
            ) : (
              recentActivities.recentReports.map((r: any) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900 block truncate">{r.reason}</span>
                    <span className="text-[11px] text-zinc-500">
                      Target: {r.targetType}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                      r.status === "PENDING"
                        ? "bg-rose-100 text-rose-700 font-bold"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Recent Audit Activity */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-600" />
              <span>Recent Audit Logs</span>
            </h2>
            <Link
              href="/admin/audit-logs"
              className="text-[11px] font-bold text-zinc-600 hover:underline"
            >
              Full trail
            </Link>
          </div>

          <div className="space-y-2">
            {recentActivities.recentAuditLogs.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No administrator actions logged yet.</p>
            ) : (
              recentActivities.recentAuditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="text-xs py-1.5 border-b border-zinc-100 last:border-0 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-800 font-mono text-[11px] block truncate">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {log.user?.profile?.fullName || log.user?.email || "System"} • {log.targetType}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
