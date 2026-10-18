import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireOwnerContext } from "@/actions/owner";
import { OwnerProfileClient } from "@/components/owner/OwnerProfileClient";

export const metadata = {
  title: "Owner Profile | StayKro Owner",
  description: "Manage partner profile and contact routing numbers.",
};

async function ProfileDataLoader() {
  const { user, ownerProfile } = await requireOwnerContext();

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  const initialData = {
    fullName: profile?.fullName || "",
    email: user.email || "",
    businessName: ownerProfile.businessName || "",
    contactPhone: ownerProfile.contactPhone || "",
    whatsappNumber: ownerProfile.whatsappNumber || "",
    altPhone: ownerProfile.altPhone || "",
    isVerified: ownerProfile.verificationStatus === "VERIFIED",
  };

  return <OwnerProfileClient initialData={initialData} />;
}

export default function OwnerProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading owner profile...</p>
        </div>
      }
    >
      <ProfileDataLoader />
    </Suspense>
  );
}
