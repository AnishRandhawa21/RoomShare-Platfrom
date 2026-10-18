import { type ReactNode } from "react";
import { headers } from "next/headers";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { OwnerLayoutClient } from "@/components/owner/OwnerLayoutClient";

export const metadata = {
  title: "Owner Portal | StayKro",
  description: "PG and Coliving property management, room inventory, and resident enquiries.",
};

export const instant = false;

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isInviteRoute = pathname.includes("/owner/invite");

  // Invite acceptance flow is accessible to unverified/new users with a valid invite token
  if (isInviteRoute) {
    return <>{children}</>;
  }

  // 1. Strict Server-Side Owner Authorization
  const user = await requireOwner("/owner");

  // 2. Fetch live notification counts for sidebar badges
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: user.id },
  });

  let pendingEnquiriesCount = 0;
  let activeRoommatesCount = 0;

  if (ownerProfile) {
    const [enquiries, roommates] = await Promise.all([
      prisma.pGEnquiry
        .count({
          where: {
            status: "NEW",
            property: { ownerId: ownerProfile.id, deletedAt: null },
          },
        })
        .catch(() => 0),
      prisma.roommateRequest
        .count({
          where: {
            status: "ACTIVE",
            property: { ownerId: ownerProfile.id, deletedAt: null },
          },
        })
        .catch(() => 0),
    ]);
    pendingEnquiriesCount = enquiries;
    activeRoommatesCount = roommates;
  }

  return (
    <OwnerLayoutClient
      pendingEnquiriesCount={pendingEnquiriesCount}
      activeRoommatesCount={activeRoommatesCount}
      userName={user.profile?.fullName || null}
      userEmail={user.email}
    >
      {children}
    </OwnerLayoutClient>
  );
}
