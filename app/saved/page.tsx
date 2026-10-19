import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SavedDashboardClient } from "@/components/saved/SavedDashboardClient";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";
import { getUserSavedItemsAction } from "@/actions/saved";

export const metadata: Metadata = {
  title: "Saved Listings & Roommates | StayKro",
  description: "View and manage your saved PG accommodations and flatmate requirements.",
};

async function SavedDataLoader({ user }: { user: any }) {
  if (!user) {
    redirect("/login?returnUrl=/saved");
  }

  const { properties, roommates } = await getUserSavedItemsAction();

  return (
    <SavedDashboardClient
      initialProperties={properties}
      initialRoommates={roommates}
    />
  );
}

export default async function SavedPage() {
  const [currentUser, locationsData] = await Promise.all([
    getCurrentUser(),
    getDiscoveryLocations(),
  ]);

  if (!currentUser) {
    redirect("/login?returnUrl=/saved");
  }

  const sanitizedUser = {
    id: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
    profile: currentUser.profile
      ? {
          fullName: currentUser.profile.fullName,
          avatarUrl: currentUser.profile.avatarUrl,
        }
      : null,
  };

  const cityNames = locationsData.cities.map((c) => c.name);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/40 text-zinc-900">
      <Header currentUser={sanitizedUser} cities={cityNames} />

      <main className="flex-1 py-6 sm:py-10">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center text-zinc-400">
              <div className="flex justify-center mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
              </div>
              <p className="text-xs font-semibold">Loading saved bookmarks...</p>
            </div>
          }
        >
          <SavedDataLoader user={currentUser} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
