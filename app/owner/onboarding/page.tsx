import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogAmenitiesAction } from "@/actions/owner";
import { OnboardingWizard } from "@/components/owner/OnboardingWizard";
import { OnboardingPaywallGate } from "@/components/owner/OnboardingPaywallGate";
import { getOwnerPublishingEntitlement } from "@/lib/billing-entitlements";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = {
  title: "PG Owner Onboarding | StayKro",
  description: "Onboard your PG property, configure room types, and manage live bed availability.",
};

async function OnboardingDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/onboarding");
  }

  // Fetch existing owner profile if available
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: user.id },
  });

  // If owner already exists, enforce plan property quota
  if (ownerProfile) {
    const entitlement = await getOwnerPublishingEntitlement(ownerProfile.id);
    if (!entitlement.canPublish) {
      return <OnboardingPaywallGate entitlement={entitlement} />;
    }
  }

  const [amenitiesRes, locationsRes] = await Promise.all([
    getCatalogAmenitiesAction(),
    prisma.state.findMany({
      where: { isActive: true },
      include: {
        cities: {
          where: { isActive: true },
          include: {
            localities: {
              where: { isActive: true },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const amenities = amenitiesRes.success ? amenitiesRes.amenities : [];

  return (
    <OnboardingWizard
      initialOwnerProfile={ownerProfile}
      amenities={amenities}
      userEmail={user.email}
      locationMaster={locationsRes}
    />
  );
}

export default function OwnerOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-zinc-500">Loading onboarding setup...</p>
        </div>
      }
    >
      <OnboardingDataLoader />
    </Suspense>
  );
}
