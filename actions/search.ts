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
// High-performance in-memory suggestion cache with 60s TTL
const suggestionsCache = new Map<string, { timestamp: number; data: SearchSuggestionsResult }>();
const CACHE_TTL_MS = 60 * 1000;

export async function getSearchSuggestionsAction(
  rawQuery: string,
  selectedCity?: string
): Promise<SearchSuggestionsResult> {
  const query = rawQuery.trim();
  if (!query || query.length < 2) {
    return { localities: [], properties: [], roommates: [], totalMatches: 0 };
  }

  const cacheKey = `${(selectedCity || "ALL").toLowerCase()}:${query.toLowerCase()}`;
  const cached = suggestionsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const cityFilter =
      selectedCity && selectedCity !== "All"
        ? { equals: selectedCity, mode: "insensitive" as const }
        : undefined;

    // Run all 3 sub-queries concurrently with Promise.all for lowest latency
    const [localities, properties, roommates] = await Promise.all([
      // 1. Search Matching Localities
      prisma.locality.findMany({
        where: {
          isActive: true,
          ...(cityFilter ? { city: { name: cityFilter } } : {}),
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { city: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          city: { select: { name: true } },
        },
        take: 4,
      }),

      // 2. Search Matching Properties
      prisma.property.findMany({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          ...(cityFilter ? { city: cityFilter } : {}),
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { locality: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
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
      }),

      // 3. Search Matching Roommate Requests
      prisma.roommateRequest.findMany({
        where: {
          status: "ACTIVE",
          ...(cityFilter ? { city: cityFilter } : {}),
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { locality: { contains: query, mode: "insensitive" } },
            { propertyName: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
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
      }),
    ]);

    const localityItems: SearchSuggestionItem[] = localities.map((loc) => ({
      type: "locality",
      id: loc.id,
      title: loc.name,
      subtitle: `${loc.city.name} Locality`,
      url: `/?city=${encodeURIComponent(loc.city.name)}&q=${encodeURIComponent(loc.name)}`,
      badge: "Locality",
    }));

    const propertyItems: SearchSuggestionItem[] = properties.map((p) => ({
      type: "property",
      id: p.id,
      title: p.name,
      subtitle: `${p.locality}, ${p.city}`,
      url: `/property/${p.slug}`,
      price: p.startingPrice || undefined,
      badge: p.isVerified ? "Verified PG" : "PG",
    }));

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

    const result: SearchSuggestionsResult = {
      localities: localityItems,
      properties: propertyItems,
      roommates: roommateItems,
      totalMatches,
    };

    // Cache the result
    suggestionsCache.set(cacheKey, { timestamp: Date.now(), data: result });
    // Limit cache size to 500 entries
    if (suggestionsCache.size > 500) {
      const firstKey = suggestionsCache.keys().next().value;
      if (firstKey) suggestionsCache.delete(firstKey);
    }

    return result;
  } catch (err) {
    console.error("Search suggestions error:", err);
    return { localities: [], properties: [], roommates: [], totalMatches: 0 };
  }
}
