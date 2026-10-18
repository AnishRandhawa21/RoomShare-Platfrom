"use client";

import { useState, type ReactNode } from "react";
import { OwnerSidebar } from "./OwnerSidebar";
import { OwnerNavbar } from "./OwnerNavbar";

interface OwnerLayoutClientProps {
  children: ReactNode;
  pendingEnquiriesCount?: number;
  activeRoommatesCount?: number;
  userName?: string | null;
  userEmail?: string | null;
}

export function OwnerLayoutClient({
  children,
  pendingEnquiriesCount = 0,
  activeRoommatesCount = 0,
  userName,
  userEmail,
}: OwnerLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <OwnerSidebar
        isOpenOnMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingEnquiriesCount={pendingEnquiriesCount}
        activeRoommatesCount={activeRoommatesCount}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <OwnerNavbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          userName={userName}
          userEmail={userEmail}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
