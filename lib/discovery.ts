import { prisma } from "@/lib/prisma";
import { GenderPolicy, type Prisma } from "@/lib/prisma";

export interface PropertyListingSummary {
  id: string;
  name: string;
  slug: string;
  locality: string;
  city: string;
  genderPolicy: GenderPolicy;
  startingPrice: number;
  originalPrice?: number | null;
  bestSharingOccupancy?: number | null;
  foodIncluded: boolean;
  coverImageUrl: string | null;
  images?: string[];
  roomTypeSummaries: string[];
  latitude: number;
  longitude: number;
  distanceKm?: number;
  hasActiveRoommateRequest?: boolean;
  activeRoommateRequestCount?: number;
  // Search Quality & Ranking Signals
  isVerified?: boolean;
  isOwnerVerified?: boolean;
  isFeatured?: boolean;
  rating?: number;
  reviewCount?: number;
  amenitiesCount?: number;
  availableRoomsCount?: number;
  createdAt?: string | Date;
}

export interface RoommateRequestSummary {
  id: string;
  title: string;
  locality: string;
  city: string;
  propertyName?: string | null;
  propertySlug?: string | null;
  roomTypeName?: string | null;
  requiredRoommateCount?: number;
  rentPerPerson: number;
  preferredGender: GenderPolicy;
  creatorName: string;
  creatorAvatar: string | null;
  creatorProfession?: string | null;
  moveInDate: string;
  isCreatorVerified?: boolean;
  createdAt?: string | Date;
}

/**
 * Fetch verified published properties from Prisma DB for discovery
 */
export async function getLiveProperties(params?: {
  city?: string;
  searchQuery?: string;
  genderPolicy?: string;
  availabilityFilter?: "all" | "available" | "roommate";
  sortBy?: "recommended" | "nearest" | "price-asc" | "price-desc" | "rating" | "newest";
}): Promise<PropertyListingSummary[]> {
  try {
    const whereClause: Prisma.PropertyWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
    };

    if (params?.city && params.city !== "All") {
      whereClause.city = { equals: params.city, mode: "insensitive" };
    }

    if (params?.searchQuery && params.searchQuery.trim().length > 0) {
      whereClause.OR = [
        { name: { contains: params.searchQuery.trim(), mode: "insensitive" } },
        { locality: { contains: params.searchQuery.trim(), mode: "insensitive" } },
        { city: { contains: params.searchQuery.trim(), mode: "insensitive" } },
      ];
    }

    if (params?.genderPolicy && params.genderPolicy !== "all") {
      const upper = params.genderPolicy.toUpperCase();
      if (["BOYS", "GIRLS", "UNISEX"].includes(upper)) {
        whereClause.genderPolicy = upper as GenderPolicy;
      }
    }

    // Availability filter
    if (params?.availabilityFilter === "roommate") {
      whereClause.roommateRequests = {
        some: { status: "ACTIVE" },
      };
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { verificationStatus: true },
        },
        featuredListings: {
          where: { endDate: { gt: new Date() }, status: "ACTIVE" },
          select: { id: true },
          take: 1,
        },
        amenities: {
          select: { id: true },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
        roomTypes: {
          where: { isActive: true },
          select: {
            name: true,
            monthlyRent: true,
            occupancy: true,
            rooms: {
              where: { status: "AVAILABLE" },
              select: { id: true },
            },
          },
        },
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
          select: { url: true },
          take: 6,
        },
        roommateRequests: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 48,
    });

    const mappedListings: PropertyListingSummary[] = properties.map((p) => {
      let chosenRoomType: { name: string; monthlyRent: number; occupancy: number } | null = null;
      let lowestPerPerson = Infinity;

      if (p.roomTypes.length > 0) {
        for (const rt of p.roomTypes) {
          const perPerson =
            rt.occupancy > 1 ? Math.round(rt.monthlyRent / rt.occupancy) : rt.monthlyRent;
          if (perPerson < lowestPerPerson) {
            lowestPerPerson = perPerson;
            chosenRoomType = rt;
          }
        }
      }

      let minRent = 0;
      let originalPrice: number | null = null;
      let bestSharingOccupancy: number | null = null;

      if (chosenRoomType) {
        if (chosenRoomType.occupancy > 1) {
          minRent = Math.round(chosenRoomType.monthlyRent / chosenRoomType.occupancy);
          originalPrice = chosenRoomType.monthlyRent;
          bestSharingOccupancy = chosenRoomType.occupancy;
        } else {
          minRent = chosenRoomType.monthlyRent;
        }
      } else {
        minRent = p.startingPrice || 0;
      }

      const uniqueRoomTypes = Array.from(
        new Set(p.roomTypes.map((r) => r.name))
      );

      // Reviews average
      let avgRating: number | undefined = undefined;
      if (p.reviews && p.reviews.length > 0) {
        const sum = p.reviews.reduce((acc, r) => acc + r.rating, 0);
        avgRating = Math.round((sum / p.reviews.length) * 10) / 10;
      }

      // Available room inventory
      const availableRoomsCount = p.roomTypes.reduce(
        (acc, rt) => acc + (rt.rooms?.length || 0),
        0
      );

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        locality: p.locality,
        city: p.city,
        genderPolicy: p.genderPolicy,
        startingPrice: minRent,
        originalPrice: originalPrice && originalPrice > minRent ? originalPrice : null,
        bestSharingOccupancy: bestSharingOccupancy && bestSharingOccupancy > 1 ? bestSharingOccupancy : null,
        foodIncluded: p.foodOffering === "NO_FOOD" ? false : Boolean(p.foodIncluded),
        coverImageUrl: p.images[0]?.url || null,
        images: p.images.map((img) => img.url),
        roomTypeSummaries: uniqueRoomTypes,
        latitude: p.latitude,
        longitude: p.longitude,
        hasActiveRoommateRequest: p.roommateRequests.length > 0,
        activeRoommateRequestCount: p.roommateRequests.length,
        // Quality signals
        isVerified: p.isVerified,
        isOwnerVerified: p.owner?.verificationStatus === "VERIFIED",
        isFeatured: p.featuredListings && p.featuredListings.length > 0,
        rating: avgRating,
        reviewCount: p.reviews.length,
        amenitiesCount: p.amenities.length,
        availableRoomsCount,
        createdAt: p.createdAt,
      };
    });

    return mappedListings;
  } catch (err) {
    console.error("Error fetching live properties:", err);
    return [];
  }
}

/**
 * Fetch active roommate requests from Prisma DB for discovery
 */
export async function getLiveRoommateRequests(params?: {
  city?: string;
  searchQuery?: string;
  genderPolicy?: string;
}): Promise<RoommateRequestSummary[]> {
  try {
    const whereClause: Prisma.RoommateRequestWhereInput = {
      status: "ACTIVE",
    };

    if (params?.city && params.city !== "All") {
      whereClause.city = { equals: params.city, mode: "insensitive" };
    }

    if (params?.searchQuery && params.searchQuery.trim().length > 0) {
      whereClause.OR = [
        { title: { contains: params.searchQuery.trim(), mode: "insensitive" } },
        { locality: { contains: params.searchQuery.trim(), mode: "insensitive" } },
        { city: { contains: params.searchQuery.trim(), mode: "insensitive" } },
        { propertyName: { contains: params.searchQuery.trim(), mode: "insensitive" } },
      ];
    }

    if (params?.genderPolicy && params.genderPolicy !== "all") {
      const upper = params.genderPolicy.toUpperCase();
      if (["BOYS", "GIRLS", "UNISEX"].includes(upper)) {
        whereClause.preferredGender = upper as GenderPolicy;
      }
    }

    const requests = await prisma.roommateRequest.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                profession: true,
                verificationStatus: true,
              },
            },
          },
        },
        property: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 24,
    });

    return requests.map((r) => ({
      id: r.id,
      title: r.title,
      locality: r.locality,
      city: r.city,
      propertyName: r.propertyName || r.property?.name || null,
      propertySlug: r.property?.slug || null,
      roomTypeName: r.roomTypeName || null,
      requiredRoommateCount: r.requiredRoommateCount ?? 1,
      rentPerPerson: r.rentPerPerson,
      preferredGender: r.preferredGender,
      creatorName: r.creator.profile?.fullName || "Verified User",
      creatorAvatar: r.creator.profile?.avatarUrl || null,
      creatorProfession: r.creator.profile?.profession || "Working Professional",
      moveInDate: r.moveInDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      isCreatorVerified: r.creator.profile?.verificationStatus === "VERIFIED",
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error("Error fetching live roommate requests:", err);
    return [];
  }
}

export interface DiscoveryLocationCity {
  name: string;
  localities: string[];
  propertyCount?: number;
}

/**
 * Fetch dynamic active cities and their localities from Prisma DB (Location Master + Live Properties)
 */
export async function getDiscoveryLocations(): Promise<{
  cities: DiscoveryLocationCity[];
}> {
  try {
    // 1. Fetch active cities from Location Master
    const dbCities = await prisma.city.findMany({
      where: { isActive: true },
      include: {
        localities: {
          where: { isActive: true },
          select: { name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // 2. Fetch distinct cities & localities that have published properties
    const propertyGroups = await prisma.property.groupBy({
      by: ["city", "locality"],
      where: {
        status: "PUBLISHED",
        deletedAt: null,
      },
      _count: { id: true },
    });

    // 3. Aggregate into a unified map
    const cityMap = new Map<string, { localities: Set<string>; count: number }>();

    // First populate from active DB cities
    for (const c of dbCities) {
      cityMap.set(c.name, {
        localities: new Set(c.localities.map((l) => l.name)),
        count: 0,
      });
    }

    // Next merge property cities & localities
    for (const group of propertyGroups) {
      const cityName = group.city.trim();
      const localityName = group.locality.trim();
      if (!cityName) continue;

      let entry = cityMap.get(cityName);
      if (!entry) {
        // Look for case-insensitive match
        for (const [existingName, val] of cityMap.entries()) {
          if (existingName.toLowerCase() === cityName.toLowerCase()) {
            entry = val;
            break;
          }
        }
      }

      if (!entry) {
        entry = { localities: new Set<string>(), count: 0 };
        cityMap.set(cityName, entry);
      }

      if (localityName) {
        entry.localities.add(localityName);
      }
      entry.count += group._count.id;
    }

    // Convert map to array, prioritizing cities that have published properties first, then alphabetically
    const cities: DiscoveryLocationCity[] = Array.from(cityMap.entries()).map(
      ([name, data]) => ({
        name,
        localities: Array.from(data.localities),
        propertyCount: data.count,
      })
    );

    cities.sort((a, b) => {
      // Prioritize cities with published properties
      if ((b.propertyCount || 0) !== (a.propertyCount || 0)) {
        return (b.propertyCount || 0) - (a.propertyCount || 0);
      }
      return a.name.localeCompare(b.name);
    });

    return { cities };
  } catch (err) {
    console.error("Error fetching discovery locations:", err);
    return { cities: [] };
  }
}

