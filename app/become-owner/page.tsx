import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BecomeOwnerClient } from "@/components/owner/BecomeOwnerClient";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";

export const metadata: Metadata = {
  title: "Become a Verified PG Host & Owner | StayKro",
  description:
    "List your Paying Guest (PG) accommodation, student hostel, or coliving space on StayKro. Zero brokerage, direct phone & WhatsApp leads from verified tenants.",
};

export const revalidate = 60;

export default async function BecomeOwnerPage() {
  const [user, locationsData] = await Promise.all([
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

  const cityNames = locationsData.cities.map((c) => c.name);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      <Header
        cities={cityNames}
        currentUser={sanitizedUser}
      />
      <main className="flex-1">
        <BecomeOwnerClient />
      </main>
      <Footer />
    </div>
  );
}
