"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Mail,
  Users,
  UserCheck,
  MapPin,
  AlertTriangle,
  Star,
  CreditCard,
  Layers,
  Sparkles,
  History,
  ShieldCheck,
  ChevronRight,
  Settings,
} from "lucide-react";

interface AdminSidebarProps {
  pendingReportsCount?: number;
  pendingInvitationsCount?: number;
  pendingLocalitiesCount?: number;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  pendingReportsCount = 0,
  pendingInvitationsCount = 0,
  pendingLocalitiesCount = 0,
  isOpenOnMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navigationSections = [
    {
      title: "Core Platform",
      items: [
        {
          name: "Overview",
          href: "/admin",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: "Properties",
          href: "/admin/properties",
          icon: Building2,
        },
        {
          name: "Owners",
          href: "/admin/owners",
          icon: Briefcase,
        },
        {
          name: "Owner Invitations",
          href: "/admin/owners/invitations",
          icon: Mail,
          badge: pendingInvitationsCount > 0 ? pendingInvitationsCount : undefined,
          badgeColor: "bg-rose-100 text-rose-700",
        },
        {
          name: "Users",
          href: "/admin/users",
          icon: Users,
        },
        {
          name: "Roommate Requests",
          href: "/admin/roommates",
          icon: UserCheck,
        },
        {
          name: "Locations Master",
          href: "/admin/locations",
          icon: MapPin,
          badge: pendingLocalitiesCount > 0 ? pendingLocalitiesCount : undefined,
          badgeColor: "bg-amber-100 text-amber-800",
        },
      ],
    },
    {
      title: "Trust & Safety",
      items: [
        {
          name: "Reports Inbox",
          href: "/admin/reports",
          icon: AlertTriangle,
          badge: pendingReportsCount > 0 ? pendingReportsCount : undefined,
          badgeColor: "bg-rose-500 text-white animate-pulse",
        },
        {
          name: "Reviews Moderation",
          href: "/admin/reviews",
          icon: Star,
        },
        {
          name: "Audit Trail",
          href: "/admin/audit-logs",
          icon: History,
        },
      ],
    },
    {
      title: "Monetization & Growth",
      items: [
        {
          name: "Payments Ledger",
          href: "/admin/payments",
          icon: CreditCard,
        },
        {
          name: "Subscriptions",
          href: "/admin/subscriptions",
          icon: Layers,
        },
        {
          name: "Featured Listings",
          href: "/admin/featured",
          icon: Sparkles,
        },
        {
          name: "Settings",
          href: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ];

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpenOnMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-zinc-200/80 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white shadow-xs border border-zinc-200 transition-transform group-hover:scale-105 p-0.5">
              <Image
                src="/logo.png"
                alt="StayKro Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base font-black tracking-tight text-zinc-950 truncate group-hover:text-[#00412E] transition-colors leading-tight">
                StayKro<span className="text-[#96BF8A]">.</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 leading-none">
                Admin Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation items scrollable list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                {section.title}
              </div>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const active = isLinkActive(item.href, item.exact);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        active
                          ? "bg-rose-50 text-rose-700 font-bold shadow-2xs"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            active ? "text-rose-600" : "text-zinc-400 group-hover:text-zinc-700"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge !== undefined && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.badgeColor || "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {active && <ChevronRight className="h-3 w-3 text-rose-500 shrink-0" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom environment badge */}
        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production API</span>
            </span>
            <span className="font-mono text-[10px] text-zinc-400">v1.0-admin</span>
          </div>
        </div>
      </aside>
    </>
  );
}
