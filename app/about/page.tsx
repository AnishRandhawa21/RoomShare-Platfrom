import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AboutClient } from "@/components/about/AboutClient";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";
import { APP_BASE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Us | StayKro - India's Zero Brokerage PG & Roommate Platform",
  description:
    "Learn about StayKro's mission to eliminate brokerages, verify student accommodations, and match compatible roommates across Punjab, Chandigarh, Delhi NCR, and student hubs in India.",
  alternates: {
    canonical: `${APP_BASE_URL}/about`,
  },
  openGraph: {
    title: "About StayKro | Zero Brokerage PG & Roommate Platform",
    description:
      "Direct owner connect, 100% verified listings, and smart lifestyle roommate matching for students and young professionals.",
    url: `${APP_BASE_URL}/about`,
    type: "website",
  },
};

export const revalidate = 60;

export default async function AboutPage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* FAQ Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Is StayKro really 100% free with zero brokerage?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, absolutely. Students and tenants never pay any brokerage, convenience, or visiting fees on StayKro.",
                },
              },
              {
                "@type": "Question",
                name: "How do I contact a PG owner to schedule a visit?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Every listing features verified owner contact details. You can call or chat on WhatsApp directly with the host.",
                },
              },
              {
                "@type": "Question",
                name: "Who built StayKro?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "StayKro is designed, engineered, and maintained by solo developer Anish Randhawa based in Punjab.",
                },
              },
            ],
          }),
        }}
      />
      <Header
        selectedCity="Jalandhar"
        currentUser={sanitizedUser}
      />
      <main className="flex-1">
        <AboutClient />
      </main>
      <Footer />
    </div>
  );
}
