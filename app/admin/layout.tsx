import { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export const metadata: Metadata = {
  title: "Admin Portal | StayKro",
  description: "Production Administration Console for StayKro Platform.",
};

export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 1. Strict Server-Side Admin Authentication Guard
  const user = await requireAdmin("/admin");

  // 2. Fetch notification badge counts for sidebar safely
  const [pendingReportsCount, pendingInvitationsCount, pendingLocalitiesCount] =
    await Promise.all([
      prisma.report ? prisma.report.count({ where: { status: "PENDING" } }).catch(() => 0) : 0,
      prisma.ownerInvitation ? prisma.ownerInvitation.count({ where: { status: "PENDING" } }).catch(() => 0) : 0,
      (prisma as any).localityRequest ? (prisma as any).localityRequest.count({ where: { status: "PENDING" } }).catch(() => 0) : 0,
    ]);

  return (
    <AdminLayoutClient
      adminUser={{
        id: user.id,
        email: user.email,
        profile: user.profile ? { fullName: user.profile.fullName } : null,
      }}
      pendingReportsCount={pendingReportsCount}
      pendingInvitationsCount={pendingInvitationsCount}
      pendingLocalitiesCount={pendingLocalitiesCount}
    >
      {children}
    </AdminLayoutClient>
  );
}
