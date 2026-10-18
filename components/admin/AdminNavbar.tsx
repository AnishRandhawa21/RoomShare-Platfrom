"use client";

import Link from "next/link";
import { ArrowLeft, Menu, ShieldCheck } from "lucide-react";

interface AdminNavbarProps {
  onToggleMobileSidebar: () => void;
  adminUser: {
    id: string;
    email: string | null;
    profile?: {
      fullName: string;
    } | null;
  };
}

export function AdminNavbar({ onToggleMobileSidebar, adminUser }: AdminNavbarProps) {
  const adminName = adminUser.profile?.fullName || adminUser.email?.split("@")[0] || "Admin";

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open sidebar"
          className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-400">Admin</span>
          <span>/</span>
          <span className="font-bold text-zinc-900">Control Center</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Back to Public Site link */}
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Back to Public Site</span>
          <span className="sm:hidden">Site</span>
        </Link>

        {/* Admin profile badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-bold ring-2 ring-rose-50">
            {adminName[0]?.toUpperCase() || "A"}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-900 truncate max-w-[130px]">
              {adminName}
            </span>
            <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-0.5">
              <ShieldCheck className="h-3 w-3" /> Administrator
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
