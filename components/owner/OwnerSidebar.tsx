"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Image as ImageIcon,
  MessageSquare,
  Users,
  CreditCard,
  Layers,
  Sparkles,
  User,
  Settings,
  ExternalLink,
  X,
  Mail,
  Home,
  Star,
} from "lucide-react";

interface OwnerSidebarProps {
  pendingEnquiriesCount?: number;
  activeRoommatesCount?: number;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
  userEmail?: string | null;
  userName?: string | null;
}

interface SidebarNavItem {
  name: string;
  href: string;
  icon: any;
  exact?: boolean;
  badge?: number;
  badgeColor?: string;
}

interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}

export function OwnerSidebar({
  pendingEnquiriesCount = 0,
  activeRoommatesCount = 0,
  isOpenOnMobile = false,
  onCloseMobile,
  userEmail,
  userName,
}: OwnerSidebarProps) {
  const pathname = usePathname();

  const navSections: SidebarNavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          href: "/owner",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: "PROPERTY",
      items: [
        {
          name: "Properties",
          href: "/owner/properties",
          icon: Building2,
        },
        {
          name: "Room Inventory",
          href: "/owner/rooms",
          icon: BedDouble,
        },
        {
          name: "Photos Gallery",
          href: "/owner/photos",
          icon: ImageIcon,
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          name: "Reviews & Ratings",
          href: "/owner/reviews",
          icon: Star,
        },
        {
          name: "PG Enquiries",
          href: "/owner/enquiries",
          icon: Mail,
          badge: pendingEnquiriesCount > 0 ? pendingEnquiriesCount : undefined,
          badgeColor: "bg-indigo-600 text-white",
        },
        {
          name: "Roommate Requests",
          href: "/owner/roommate-requests",
          icon: Users,
          badge: activeRoommatesCount > 0 ? activeRoommatesCount : undefined,
          badgeColor: "bg-emerald-600 text-white",
        },
        {
          name: "Messages",
          href: "/owner/messages",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "BUSINESS",
      items: [
        {
          name: "Subscription",
          href: "/owner/subscription",
          icon: Layers,
        },
        {
          name: "Payments",
          href: "/owner/payments",
          icon: CreditCard,
        },
        {
          name: "Featured Listings",
          href: "/owner/featured",
          icon: Sparkles,
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          name: "Profile",
          href: "/owner/profile",
          icon: User,
        },
        {
          name: "Settings",
          href: "/owner/settings",
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenOnMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/owner" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white shadow-xs border border-[#E8EAE5] transition-transform group-hover:scale-105 p-0.5">
              <Image
                src="/logo.png"
                alt="StayKro Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-[#00412E] transition-colors leading-tight">
                StayKro<span className="text-[#96BF8A]">.</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00412E] -mt-0.5">
                Owner Portal
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </h3>
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
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            active
                              ? "text-indigo-600"
                              : "text-slate-400 group-hover:text-slate-700"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${
                            item.badgeColor || "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info & Public site switch */}
        <div className="shrink-0 border-t border-slate-100 p-3.5 space-y-2 bg-slate-50/50">
          <Link
            href="/"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Home className="h-3.5 w-3.5 text-slate-500" />
              <span>Public Discovery Site</span>
            </div>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Link>

          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold ring-2 ring-indigo-50">
              {userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : "O"}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-800 truncate">
                {userName || "Property Owner"}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {userEmail || "owner@staykro.in"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
