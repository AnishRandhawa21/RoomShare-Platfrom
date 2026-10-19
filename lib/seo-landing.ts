import { prisma } from "@/lib/prisma";
import { getLiveProperties, PropertyListingSummary } from "@/lib/discovery";
import { toSlug, fromSlug, APP_BASE_URL, generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/lib/seo";

export interface LocationFaq {
  question: string;
  answer: string;
}

export interface NearbyLocalityLink {
  name: string;
  slug: string;
  citySlug: string;
  count: number;
}

export interface LocationLandingData {
  cityName: string;
  citySlug: string;
  localityName?: string;
  localitySlug?: string;
  properties: PropertyListingSummary[];
  totalProperties: number;
  minPrice: number;
  maxPrice: number;
  boysCount: number;
  girlsCount: number;
  colivingCount: number;
  foodIncludedCount: number;
  averageRating: number | null;
  popularLocalities: NearbyLocalityLink[];
  faqs: LocationFaq[];
  breadcrumbs: Array<{ name: string; path: string }>;
  breadcrumbJsonLd: Record<string, any>;
  faqJsonLd: Record<string, any>;
  itemListJsonLd: Record<string, any>;
}

export async function getLocationLandingData(
  citySlug: string,
  localitySlug?: string
): Promise<LocationLandingData | null> {
  // 1. Resolve City
  const normalizedCitySlug = toSlug(citySlug);
  let cityName: string = fromSlug(normalizedCitySlug);

  const cityRecord = await prisma.city.findFirst({
    where: {
      OR: [
        { slug: normalizedCitySlug },
        { name: { equals: cityName, mode: "insensitive" } },
      ],
      isActive: true,
    },
    include: {
      localities: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (cityRecord) {
    cityName = cityRecord.name;
  }

  // 2. Resolve Locality if requested
  let localityName: string | undefined = undefined;
  let normalizedLocalitySlug: string | undefined = undefined;

  if (localitySlug) {
    normalizedLocalitySlug = toSlug(localitySlug);
    localityName = fromSlug(normalizedLocalitySlug);

    const localityRecord = await prisma.locality.findFirst({
      where: {
        OR: [
          { slug: normalizedLocalitySlug },
          { name: { equals: localityName, mode: "insensitive" } },
        ],
        isActive: true,
        ...(cityRecord ? { cityId: cityRecord.id } : {}),
      },
    });

    if (localityRecord) {
      localityName = localityRecord.name;
    }
  }

  // 3. Fetch properties
  const properties = await getLiveProperties({
    city: cityName,
    locality: localityName,
  });

  // If no properties found and cityRecord was not found either, check if any property exists with this city
  if (properties.length === 0 && !cityRecord) {
    const anyCityProp = await prisma.property.findFirst({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
      },
      select: { city: true },
    });
    // If no matching published properties at all, return null for 404
    if (!anyCityProp) {
      return null;
    }
  }

  // Calculate Aggregates
  const totalProperties = properties.length;
  let minPrice = Infinity;
  let maxPrice = 0;
  let boysCount = 0;
  let girlsCount = 0;
  let colivingCount = 0;
  let foodIncludedCount = 0;
  let totalRating = 0;
  let ratingCount = 0;

  for (const p of properties) {
    if (p.startingPrice > 0) {
      if (p.startingPrice < minPrice) minPrice = p.startingPrice;
      if (p.startingPrice > maxPrice) maxPrice = p.startingPrice;
    }
    if (p.genderPolicy === "BOYS") boysCount++;
    else if (p.genderPolicy === "GIRLS") girlsCount++;
    else colivingCount++;

    if (p.foodIncluded) foodIncludedCount++;

    if (p.rating) {
      totalRating += p.rating;
      ratingCount++;
    }
  }

  if (minPrice === Infinity) minPrice = 3500;
  if (maxPrice === 0) maxPrice = 15000;
  const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : null;

  // 4. Fetch / aggregate popular localities in this city
  const allCityProps = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      city: { equals: cityName, mode: "insensitive" },
    },
    select: { locality: true },
  });

  const localityCountMap = new Map<string, { name: string; count: number }>();
  allCityProps.forEach((p) => {
    const slug = toSlug(p.locality);
    const existing = localityCountMap.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      localityCountMap.set(slug, { name: p.locality, count: 1 });
    }
  });

  // Also include master localities if any
  if (cityRecord?.localities) {
    cityRecord.localities.forEach((l) => {
      if (!localityCountMap.has(l.slug)) {
        localityCountMap.set(l.slug, { name: l.name, count: 0 });
      }
    });
  }

  const popularLocalities: NearbyLocalityLink[] = Array.from(localityCountMap.entries())
    .map(([slug, data]) => ({
      name: data.name,
      slug,
      citySlug: normalizedCitySlug,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 5. Build dynamic breadcrumbs
  const locationLabel = localityName ? `${localityName}, ${cityName}` : cityName;
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: `PG in ${cityName}`, path: `/pg/${normalizedCitySlug}` },
  ];
  if (localityName && normalizedLocalitySlug) {
    breadcrumbs.push({
      name: `PG in ${localityName}`,
      path: `/pg/${normalizedCitySlug}/${normalizedLocalitySlug}`,
    });
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  // 6. Generate contextual FAQs
  const locationName = localityName || cityName;
  const faqs: LocationFaq[] = [
    {
      question: `What is the average rent for PGs and hostels in ${locationName}?`,
      answer: `Monthly PG rent in ${locationName} starts at approximately ₹${minPrice.toLocaleString("en-IN")}/month for shared rooms, ranging up to ₹${maxPrice.toLocaleString("en-IN")}/month for private AC rooms with attached washrooms.`,
    },
    {
      question: `Are meal facilities available in ${locationName} accommodations?`,
      answer: foodIncludedCount > 0
        ? `Yes, ${foodIncludedCount} verified accommodations in ${locationName} provide breakfast, lunch, and dinner included in the rent or as an optional add-on.`
        : `Many accommodations in ${locationName} offer home-style meal plans, equipped kitchens, and proximity to student dining hubs.`,
    },
    {
      question: `Do I need to pay any brokerage to book a PG in ${locationName}?`,
      answer: `Zero! StayKro connects you directly with verified property hosts and owners in ${locationName} with 100% zero brokerage and transparent terms.`,
    },
    {
      question: `Are there separate boys and girls PGs in ${locationName}?`,
      answer: `Yes, StayKro offers ${boysCount} verified Boys PGs, ${girlsCount} Girls PGs, and ${colivingCount} Unisex/Coliving spaces across ${locationName} with biometric security, CCTV, and verified wardens.`,
    },
    {
      question: `How can I schedule a visit to a PG in ${locationName}?`,
      answer: `You can click "Details" on any property to view real room photos, 360 virtual tours, verified amenities, and instantly chat or call the owner directly via WhatsApp.`,
    },
  ];

  const faqJsonLd = generateFaqJsonLd(faqs);

  // 7. Schema.org ItemList JSON-LD
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best PGs and Hostels in ${locationLabel}`,
    description: `Verified Paying Guest accommodations and student hostels in ${locationLabel} with zero brokerage.`,
    numberOfItems: properties.length,
    itemListElement: properties.slice(0, 10).map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LodgingBusiness",
        name: p.name,
        url: `${APP_BASE_URL}/property/${p.slug}`,
        image: p.coverImageUrl || `${APP_BASE_URL}/opengraph-image.png`,
        address: {
          "@type": "PostalAddress",
          addressLocality: p.locality,
          addressRegion: p.city,
          addressCountry: "IN",
        },
        priceRange: `₹${p.startingPrice.toLocaleString("en-IN")}/mo`,
      },
    })),
  };

  return {
    cityName,
    citySlug: normalizedCitySlug,
    localityName,
    localitySlug: normalizedLocalitySlug,
    properties,
    totalProperties,
    minPrice,
    maxPrice,
    boysCount,
    girlsCount,
    colivingCount,
    foodIncludedCount,
    averageRating,
    popularLocalities,
    faqs,
    breadcrumbs,
    breadcrumbJsonLd,
    faqJsonLd,
    itemListJsonLd,
  };
}
