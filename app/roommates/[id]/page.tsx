import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RoommateDetailClient, type RoommateDetailClientProps } from "@/components/roommate/RoommateDetailClient";
import { getRoommateRequestById } from "@/lib/roommate";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getRoommateRequestById(id);

  if (!item) {
    return {
      title: "Roommate Requirement Not Found | StayKro",
    };
  }

  const title = `${item.title} in ${item.locality}, ${item.city} | StayKro`;
  const description = `Looking for ${item.preferredGender.toLowerCase()} flatmate in ${item.locality}, ${item.city}. Rent: ₹${item.rentPerPerson}/mo. Zero brokerage.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

async function RoommateDetailLoader({
  params,
  currentUser,
}: {
  params: Promise<{ id: string }>;
  currentUser: any;
}) {
  const { id } = await params;
  const request = await getRoommateRequestById(id);

  if (!request) {
    notFound();
  }

  return (
    <RoommateDetailClient
      request={request as unknown as RoommateDetailClientProps["request"]}
      currentUser={currentUser}
    />
  );
}

export default async function RoommateDetailPage({ params }: PageProps) {
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
    <div className="min-h-screen flex flex-col bg-zinc-50/30 text-zinc-900">
      <Header currentUser={sanitizedUser} cities={cityNames} />

      <main className="flex-1 py-6 sm:py-10">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center text-zinc-400">
              <div className="flex justify-center mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
              </div>
              <p className="text-xs font-semibold">Loading roommate requirement...</p>
            </div>
          }
        >
          <RoommateDetailLoader params={params} currentUser={currentUser} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
