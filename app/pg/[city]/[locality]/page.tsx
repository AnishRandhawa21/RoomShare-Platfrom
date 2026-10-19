import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocationLandingData } from "@/lib/seo-landing";
import { APP_BASE_URL } from "@/lib/seo";
import { LocationLandingClient } from "@/components/seo/LocationLandingClient";

interface LocalityPageProps {
  params: Promise<{ city: string; locality: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LocalityPageProps): Promise<Metadata> {
  const { city, locality } = await params;
  const data = await getLocationLandingData(city, locality);

  if (!data || !data.localityName) {
    return {
      title: "Locality Accommodations | StayKro",
      description: "Find verified PGs and hostels on StayKro.",
    };
  }

  const title = `Best PGs & Hostels in ${data.localityName}, ${data.cityName} | From ₹${data.minPrice.toLocaleString("en-IN")}/mo — StayKro`;
  const description = `Discover verified PGs and coliving stays in ${data.localityName}, ${data.cityName}. Direct owner contact, food included, furnished rooms, and zero brokerage.`;
  const canonicalUrl = `${APP_BASE_URL}/pg/${data.citySlug}/${data.localitySlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LocalityLandingPage({ params }: LocalityPageProps) {
  const { city, locality } = await params;
  const [data, user] = await Promise.all([
    getLocationLandingData(city, locality),
    getCurrentUser(),
  ]);

  if (!data) {
    notFound();
  }

  const serializedUser = user
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.itemListJsonLd) }}
      />
      <LocationLandingClient data={data} currentUser={serializedUser} />
    </>
  );
}
