import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocationLandingData } from "@/lib/seo-landing";
import { APP_BASE_URL } from "@/lib/seo";
import { LocationLandingClient } from "@/components/seo/LocationLandingClient";

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const data = await getLocationLandingData(city);

  if (!data) {
    return {
      title: "City Accommodations | StayKro",
      description: "Find verified PGs and hostels on StayKro.",
    };
  }

  const title = `Best PGs & Hostels in ${data.cityName} | From ₹${data.minPrice.toLocaleString("en-IN")}/mo — StayKro`;
  const description = `Find ${data.totalProperties > 0 ? `${data.totalProperties}+` : ""} verified paying guest (PG) accommodations in ${data.cityName}. Zero brokerage, direct owner contact, boys/girls/coliving stays with meal plans and WiFi.`;
  const canonicalUrl = `${APP_BASE_URL}/pg/${data.citySlug}`;

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

export default async function CityLandingPage({ params }: CityPageProps) {
  const { city } = await params;
  const [data, user] = await Promise.all([
    getLocationLandingData(city),
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
