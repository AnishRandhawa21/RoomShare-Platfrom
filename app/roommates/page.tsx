import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RoommateDiscoveryClient } from "@/components/roommate/RoommateDiscoveryClient";
import { getRoommateRequests } from "@/lib/roommate";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";

export const metadata: Metadata = {
  title: "Find a Flatmate & Roommate Share | StayKro",
  description:
    "Connect directly with working professionals and students looking for roommates and flatshares without paying broker commission.",
};

interface RoommatesPageProps {
  searchParams?: Promise<{
    city?: string;
  }>;
}

async function RoommateFeedLoader({
  availableCities,
  currentUserId,
  initialCity,
}: {
  availableCities: string[];
  currentUserId: string | null;
  initialCity?: string;
}) {
  const requests = await getRoommateRequests();

  const mapped = requests.map((req) => ({
    id: req.id,
    title: req.title,
    locality: req.locality,
    city: req.city,
    propertyName: req.propertyName || req.property?.name || null,
    propertySlug: req.property?.slug || null,
    roomTypeName: req.roomTypeName || null,
    requiredRoommateCount: req.requiredRoommateCount ?? 1,
    rentPerPerson: req.rentPerPerson,
    securityDeposit: req.securityDeposit,
    preferredGender: req.preferredGender,
    moveInDate: req.moveInDate.toISOString(),
    isFurnished: req.isFurnished,
    hasAttachedBathroom: req.hasAttachedBathroom,
    currentUserId: currentUserId,
    creator: {
      id: req.creator.id,
      profile: req.creator.profile
        ? {
            fullName: req.creator.profile.fullName,
            avatarUrl: req.creator.profile.avatarUrl,
            profession: req.creator.profile.profession,
            verificationStatus: req.creator.profile.verificationStatus,
          }
        : null,
    },
    preferences: req.preferences
      ? {
          dietary: req.preferences.dietary,
          smoking: req.preferences.smoking,
          drinking: req.preferences.drinking,
          sleepSchedule: req.preferences.sleepSchedule,
          petsAllowed: req.preferences.petsAllowed,
          customTags: req.preferences.customTags,
        }
      : null,
    images: req.images.map((img) => ({ url: img.url })),
  }));

  return (
    <RoommateDiscoveryClient
      initialRequests={mapped}
      currentUserId={currentUserId}
      availableCities={availableCities}
      initialCity={initialCity}
    />
  );
}

export default async function RoommatesPage({ searchParams }: RoommatesPageProps) {
  const [currentUser, locationsData, resolvedParams] = await Promise.all([
    getCurrentUser(),
    getDiscoveryLocations(),
    searchParams ? searchParams : Promise.resolve({} as { city?: string }),
  ]);

  const sanitizedUser = currentUser
    ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        profile: currentUser.profile
          ? {
              fullName: currentUser.profile.fullName,
              avatarUrl: currentUser.profile.avatarUrl,
            }
          : null,
      }
    : null;

  const cityNames = locationsData.cities.map((c) => c.name);

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      <Header currentUser={sanitizedUser} cities={cityNames} />
      <main className="flex-1 bg-zinc-50/30">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center text-zinc-500">
              <div className="flex justify-center mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
              </div>
              <p className="text-xs font-semibold">Loading roommate share opportunities...</p>
            </div>
          }
        >
          <RoommateFeedLoader
            availableCities={cityNames}
            currentUserId={sanitizedUser?.id || null}
            initialCity={resolvedParams?.city}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
