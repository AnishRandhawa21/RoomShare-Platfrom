"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminNavbar } from "./AdminNavbar";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  adminUser: {
    id: string;
    email: string | null;
    profile?: {
      fullName: string;
    } | null;
  };
  pendingReportsCount?: number;
  pendingInvitationsCount?: number;
  pendingLocalitiesCount?: number;
}

export function AdminLayoutClient({
  children,
  adminUser,
  pendingReportsCount = 0,
  pendingInvitationsCount = 0,
  pendingLocalitiesCount = 0,
}: AdminLayoutClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingReportsCount={pendingReportsCount}
        pendingInvitationsCount={pendingInvitationsCount}
        pendingLocalitiesCount={pendingLocalitiesCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          adminUser={adminUser}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
