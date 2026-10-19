import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CreateRoommateRequestForm,
  type SelectedPGContext,
  type PropertyOptionWithRooms,
} from "@/components/roommate/CreateRoommateRequestForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Find a Roommate | StayKro",
  description:
    "Post your roommate requirement for your PG or room type and connect with verified flatmates with zero brokerage.",
};

export const instant = false;

interface NewRoommatePageProps {
  searchParams: Promise<{
    propertyId?: string;
    roomTypeId?: string;
  }>;
}

async function NewRoommateFormLoader({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; roomTypeId?: string }>;
}) {
  const { propertyId, roomTypeId } = await searchParams;

  // Build the returnUrl for redirecting back after login
  const queryParams = new URLSearchParams();
  if (propertyId) queryParams.set("propertyId", propertyId);
  if (roomTypeId) queryParams.set("roomTypeId", roomTypeId);
  const queryString = queryParams.toString();
  const returnUrl = `/roommates/new${queryString ? `?${queryString}` : ""}`;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  let initialPGContext: SelectedPGContext | null = null;

  // 1. If propertyId and roomTypeId are passed in the query params, query DB authoritatively
  if (propertyId && roomTypeId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId, status: "PUBLISHED", deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        locality: true,
        city: true,
        state: true,
        genderPolicy: true,
      },
    });

    if (property) {
      const roomType = await prisma.roomType.findFirst({
        where: { id: roomTypeId, propertyId: property.id, isActive: true },
        include: {
          rooms: {
            where: { status: "AVAILABLE" },
            select: { id: true, occupiedBeds: true },
          },
        },
      });

      if (roomType && roomType.occupancy > 1) {
        const activeRooms = roomType.rooms;
        const totalBeds =
          activeRooms.length > 0 ? activeRooms.length * roomType.occupancy : roomType.occupancy;
        const occupiedBeds = activeRooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
        const vacantBeds = Math.max(1, totalBeds - occupiedBeds);
        const roommateNeededCount = Math.max(1, Math.min(vacantBeds, roomType.occupancy - 1 || 1));

        const splitCount = Math.max(1, roomType.occupancy);
        const rentPerPerson = Math.round(roomType.monthlyRent / splitCount);
        const depositPerPerson = Math.round(roomType.securityDeposit / splitCount);

        initialPGContext = {
          propertyId: property.id,
          propertyName: property.name,
          propertySlug: property.slug,
          locality: property.locality,
          city: property.city,
          state: property.state,
          roomTypeId: roomType.id,
          roomTypeName: roomType.name,
          monthlyRent: rentPerPerson,
          totalRoomRent: roomType.monthlyRent,
          securityDeposit: depositPerPerson,
          totalSecurityDeposit: roomType.securityDeposit,
          roommateNeededCount,
          occupancy: roomType.occupancy,
          genderPolicy: property.genderPolicy,
          hasAttachedBathroom: roomType.hasAttachedBathroom,
        };
      }
    }
  }

  // 2. Fetch properties with their room types for fallback selection
  const publishedProperties = await prisma.property.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      name: true,
      locality: true,
      city: true,
      state: true,
      genderPolicy: true,
      roomTypes: {
        where: { isActive: true, occupancy: { gt: 1 } },
        select: {
          id: true,
          name: true,
          monthlyRent: true,
          securityDeposit: true,
          occupancy: true,
          hasAttachedBathroom: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const propertiesWithRooms: PropertyOptionWithRooms[] = publishedProperties
    .filter((p) => p.roomTypes.length > 0)
    .map((p) => ({
    id: p.id,
    name: p.name,
    locality: p.locality,
    city: p.city,
    state: p.state,
    genderPolicy: p.genderPolicy,
    roomTypes: p.roomTypes.map((rt) => ({
      id: rt.id,
      name: rt.name,
      monthlyRent: rt.monthlyRent,
      securityDeposit: rt.securityDeposit,
      occupancy: rt.occupancy,
      hasAttachedBathroom: rt.hasAttachedBathroom,
    })),
  }));

  return (
    <CreateRoommateRequestForm
      initialPGContext={initialPGContext}
      properties={propertiesWithRooms}
      userFullName={user.profile?.fullName || user.email || "Room Seeker"}
    />
  );
}

export default async function NewRoommateRequestPage({
  searchParams,
}: NewRoommatePageProps) {
  const [currentUser, locationsData] = await Promise.all([
    getCurrentUser(),
    getDiscoveryLocations(),
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
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-900">
      <Header currentUser={sanitizedUser} cities={cityNames} />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-block rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-3 py-1 text-xs font-bold text-[#00412E] mb-2">
              Zero Brokerage Matching
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">
              Find a Roommate
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
              Tell prospective flatmates about your habits, schedule, and move-in readiness.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-12 text-center text-xs font-semibold text-zinc-400">
                Loading roommate requirement form...
              </div>
            }
          >
            <NewRoommateFormLoader searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
