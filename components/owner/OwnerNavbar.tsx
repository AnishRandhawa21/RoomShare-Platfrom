"use client";

import Link from "next/link";
import { Menu, PlusCircle, Home, User as UserIcon } from "lucide-react";

interface OwnerNavbarProps {
  onOpenMobileMenu: () => void;
  userName?: string | null;
  userEmail?: string | null;
}

export function OwnerNavbar({
  onOpenMobileMenu,
  userName,
  userEmail,
}: OwnerNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Management Hub
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/owner/onboarding"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Property</span>
        </Link>

        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Home className="h-3.5 w-3.5 text-slate-500" />
          <span>Seeker View</span>
        </Link>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold ring-2 ring-indigo-50">
            {userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : "O"}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
              {userName || userEmail?.split("@")[0]}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold leading-none">
              Verified Owner
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
