"use server";

import { prisma } from "@/lib/prisma";

export interface SearchSuggestionItem {
  type: "locality" | "property" | "roommate";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
  price?: number;
}

export interface SearchSuggestionsResult {
  localities: SearchSuggestionItem[];
  properties: SearchSuggestionItem[];
  roommates: SearchSuggestionItem[];
  totalMatches: number;
}

/**
 * Server action to provide fast, typo-tolerant search suggestions across localities, properties, and roommates.
 */
export async function getSearchSuggestionsAction(
  rawQuery: string,
  selectedCity?: string
): Promise<SearchSuggestionsResult> {
  const query = rawQuery.trim();
  if (!query || query.length < 2) {
    return { localities: [], properties: [], roommates: [], totalMatches: 0 };
  }

  try {
    const cityFilter =
      selectedCity && selectedCity !== "All"
        ? { equals: selectedCity, mode: "insensitive" as const }
        : undefined;

    // 1. Search Matching Localities
    const localities = await prisma.locality.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        isActive: true,
        ...(cityFilter ? { city: { name: cityFilter } } : {}),
      },
      include: {
        city: { select: { name: true } },
      },
      take: 4,
    });

    const localityItems: SearchSuggestionItem[] = localities.map((loc) => ({
      type: "locality",
      id: loc.id,
      title: loc.name,
      subtitle: `${loc.city.name} Locality`,
      url: `/?city=${encodeURIComponent(loc.city.name)}&q=${encodeURIComponent(loc.name)}`,
      badge: "Locality",
    }));

    // 2. Search Matching Properties
    const properties = await prisma.property.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        ...(cityFilter ? { city: cityFilter } : {}),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { locality: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        locality: true,
        city: true,
        startingPrice: true,
        isVerified: true,
      },
      take: 5,
    });

    const propertyItems: SearchSuggestionItem[] = properties.map((p) => ({
      type: "property",
      id: p.id,
      title: p.name,
      subtitle: `${p.locality}, ${p.city}`,
      url: `/property/${p.slug}`,
      price: p.startingPrice || undefined,
      badge: p.isVerified ? "Verified PG" : "PG",
    }));

    // 3. Search Matching Roommate Requests
    const roommates = await prisma.roommateRequest.findMany({
      where: {
        status: "ACTIVE",
        ...(cityFilter ? { city: cityFilter } : {}),
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { locality: { contains: query, mode: "insensitive" } },
          { propertyName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        locality: true,
        city: true,
        rentPerPerson: true,
        preferredGender: true,
      },
      take: 3,
    });

    const roommateItems: SearchSuggestionItem[] = roommates.map((r) => ({
      type: "roommate",
      id: r.id,
      title: r.title,
      subtitle: `${r.locality}, ${r.city}`,
      url: `/roommates/${r.id}`,
      price: r.rentPerPerson,
      badge: `${r.preferredGender} Roommate`,
    }));

    const totalMatches =
      localityItems.length + propertyItems.length + roommateItems.length;

    return {
      localities: localityItems,
      properties: propertyItems,
      roommates: roommateItems,
      totalMatches,
    };
  } catch (err) {
    console.error("Search suggestions error:", err);
    return { localities: [], properties: [], roommates: [], totalMatches: 0 };
  }
}
