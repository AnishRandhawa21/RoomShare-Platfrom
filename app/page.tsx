import { Suspense } from "react";
import {
  getLiveProperties,
  getDiscoveryLocations,
} from "@/lib/discovery";
import { getCurrentUser } from "@/lib/auth/session";
import { CleanHomeClient } from "@/components/home/CleanHomeClient";

export const dynamic = "force-dynamic";

async function HomeContent() {
  const [properties, user, locationsData] = await Promise.all([
    getLiveProperties(),
    getCurrentUser(),
    getDiscoveryLocations(),
  ]);

  const sanitizedUser = user
    ? {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
          ? {
              fullName: user.profile.fullName,
              avatarUrl: user.profile.avatarUrl,
            }
          : null,
      }
    : null;

  return (
    <CleanHomeClient
      initialProperties={properties}
      availableCities={locationsData.cities}
      currentUser={sanitizedUser}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-xs text-zinc-400 font-medium">Loading platform...</div>}>
      <HomeContent />
    </Suspense>
  );
}
