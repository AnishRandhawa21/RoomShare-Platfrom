/**
 * SEO helper utilities for structured data (JSON-LD), canonical URLs,
 * and search engine indexing.
 */

export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://staykro.in";

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generates Schema.org LodgingBusiness / ApartmentComplex JSON-LD structured data.
 */
export function generatePropertyJsonLd(property: {
  name: string;
  description?: string | null;
  slug: string;
  addressLine1?: string | null;
  locality: string;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startingPrice?: number | null;
  images?: Array<{ url: string }>;
  amenities?: Array<{ amenity?: { name: string } | null; name?: string }>;
  averageRating?: number | null;
  reviewCount?: number;
}) {
  const images = (property.images || []).map((img) => img.url);
  const amenitiesList = (property.amenities || []).map((a) =>
    a.amenity?.name || a.name || ""
  ).filter(Boolean);

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: property.name,
    description: property.description || `${property.name} in ${property.locality}, ${property.city}.`,
    url: `${APP_BASE_URL}/property/${property.slug}`,
    image: images.length > 0 ? images : [`${APP_BASE_URL}/opengraph-image.png`],
    address: {
      "@type": "PostalAddress",
      streetAddress: property.addressLine1 || property.locality,
      addressLocality: property.locality,
      addressRegion: property.city,
      postalCode: property.postalCode || "144001",
      addressCountry: "IN",
    },
  };

  if (property.latitude && property.longitude) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }

  if (property.startingPrice) {
    jsonLd.priceRange = `₹${property.startingPrice.toLocaleString("en-IN")}/month`;
  }

  if (amenitiesList.length > 0) {
    jsonLd.amenityFeature = amenitiesList.map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity,
      value: true,
    }));
  }

  if (property.averageRating && property.reviewCount && property.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: property.averageRating,
      reviewCount: property.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return jsonLd;
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD.
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${APP_BASE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

/**
 * Generates Schema.org FAQPage JSON-LD for rich snippet FAQs in Google search.
 */
export function generateFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
