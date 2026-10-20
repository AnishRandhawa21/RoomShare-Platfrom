import { calculateDistanceKm, type Coordinates } from "@/lib/geo";
import type { GenderPolicy } from "@/lib/prisma";

export interface RankableProperty {
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
  // Quality & Trust signals
  isVerified?: boolean;
  isOwnerVerified?: boolean;
  isFeatured?: boolean;
  isBoosted?: boolean;
  rating?: number;
  reviewCount?: number;
  amenitiesCount?: number;
  availableRoomsCount?: number;
  createdAt?: string | Date;
}

export interface RankableRoommateRequest {
  id: string;
  title: string;
  locality: string;
  city: string;
  rentPerPerson: number;
  preferredGender: GenderPolicy;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorProfession?: string | null;
  moveInDate: string | Date;
  isCreatorVerified?: boolean;
  creator?: {
    id?: string;
    profile?: {
      fullName?: string;
      avatarUrl?: string | null;
      profession?: string | null;
      verificationStatus?: string;
    } | null;
  } | null;
  compatibilityScore?: number;
  createdAt?: string | Date;
}

export interface SearchRankingContext {
  query?: string;
  selectedCity?: string;
  selectedLocality?: string;
  userLocation?: Coordinates | null;
  targetGender?: string;
  maxBudget?: number;
}

/**
 * Calculates a composite quality and relevance score (0 - 100+) for a property.
 *
 * Ranking Heuristics:
 * 1. Location Relevance (0 - 35 pts): Exact locality match, city match, GPS proximity
 * 2. Listing Completeness & Media Depth (0 - 25 pts): High-res photos, cover image, amenities, food details
 * 3. Inventory & Availability (0 - 20 pts): Active room types with available rooms, active roommate requests
 * 4. Trust & Verification (0 - 15 pts): Property verified by admin, owner verified
 * 5. Social Proof & Reviews (0 - 10 pts): Star rating and review volume
 * 6. Featured Placement (Bonus +15 pts): Sponsored / featured listing boost
 */
export function calculatePropertyRankingScore(
  property: RankableProperty,
  context?: SearchRankingContext
): number {
  let score = 0;

  const query = context?.query?.toLowerCase().trim() || "";
  const propName = property.name.toLowerCase();
  const propLocality = property.locality.toLowerCase();
  const propCity = property.city.toLowerCase();

  // -------------------------------------------------------------
  // 1. LOCATION & TEXT RELEVANCE (Up to 35 pts)
  // -------------------------------------------------------------
  if (query.length > 0) {
    if (propLocality === query) {
      score += 35; // Exact locality match
    } else if (propName.includes(query)) {
      score += 28; // Direct PG title match
    } else if (propLocality.includes(query)) {
      score += 24; // Locality substring
    } else if (propCity === query) {
      score += 15; // City match
    }
  } else if (context?.selectedLocality) {
    if (propLocality === context.selectedLocality.toLowerCase()) {
      score += 30;
    }
  } else {
    // Default baseline for city browsing
    score += 15;
  }

  // GPS Proximity bonus (if user shared location)
  if (property.distanceKm !== undefined && property.distanceKm <= 25) {
    // Exponential decay score: 1km -> ~15pts, 5km -> ~10pts, 15km -> ~4pts
    const proximityBonus = Math.max(0, 15 * Math.exp(-property.distanceKm / 8));
    score += Math.round(proximityBonus);
  }

  // -------------------------------------------------------------
  // 2. LISTING COMPLETENESS & MEDIA DEPTH (Up to 25 pts)
  // -------------------------------------------------------------
  // Photos quality
  const photoCount = property.images?.length || (property.coverImageUrl ? 1 : 0);
  if (photoCount >= 5) {
    score += 12;
  } else if (photoCount >= 3) {
    score += 8;
  } else if (photoCount >= 1) {
    score += 4;
  }

  // Room type inventory defined
  if (property.roomTypeSummaries && property.roomTypeSummaries.length > 0) {
    score += 6;
  }

  // Amenities depth
  if (property.amenitiesCount && property.amenitiesCount >= 6) {
    score += 5;
  } else if (property.amenitiesCount && property.amenitiesCount >= 3) {
    score += 3;
  }

  // Food policy transparency
  if (property.foodIncluded) {
    score += 2;
  }

  // -------------------------------------------------------------
  // 3. INVENTORY & AVAILABILITY STATUS (Up to 20 pts)
  // -------------------------------------------------------------
  // Real-time room availability
  if (property.availableRoomsCount !== undefined && property.availableRoomsCount > 0) {
    score += 14;
  } else if (property.startingPrice > 0) {
    score += 8;
  }

  // Community / Roommate activity (high demand)
  if (property.hasActiveRoommateRequest) {
    score += 6;
  }

  // -------------------------------------------------------------
  // 4. TRUST & VERIFICATION (Up to 15 pts)
  // -------------------------------------------------------------
  if (property.isVerified) {
    score += 10;
  }
  if (property.isOwnerVerified) {
    score += 5;
  }

  // -------------------------------------------------------------
  // 5. SOCIAL PROOF & REVIEWS (Up to 10 pts)
  // -------------------------------------------------------------
  if (property.rating && property.rating >= 4.0) {
    score += Math.min(8, Math.round(property.rating * 1.6));
  }
  if (property.reviewCount && property.reviewCount >= 3) {
    score += 2;
  }

  // -------------------------------------------------------------
  // 6. SPONSORED / FEATURED BOOST (High Priority Bonus)
  // -------------------------------------------------------------
  if (property.isFeatured || property.isBoosted) {
    score += 50;
  }

  return score;
}

/**
 * Sorts an array of properties using the multi-factor ranking algorithm.
 */
export function rankProperties<T extends RankableProperty>(
  properties: T[],
  context?: SearchRankingContext,
  sortBy: "recommended" | "nearest" | "price-asc" | "price-desc" | "rating" | "newest" = "recommended"
): T[] {
  const scored = properties.map((p) => {
    // If distance not yet computed, compute if userLocation given
    let distanceKm = p.distanceKm;
    if (
      distanceKm === undefined &&
      context?.userLocation &&
      typeof p.latitude === "number" &&
      typeof p.longitude === "number" &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
    ) {
      distanceKm = calculateDistanceKm(
        context.userLocation.latitude,
        context.userLocation.longitude,
        p.latitude,
        p.longitude
      );
    }

    const rankable = { ...p, distanceKm };
    const rankingScore = calculatePropertyRankingScore(rankable, context);

    return {
      property: rankable,
      rankingScore,
    };
  });

  scored.sort((a, b) => {
    const isFeaturedA = Boolean(a.property.isFeatured || a.property.isBoosted);
    const isFeaturedB = Boolean(b.property.isFeatured || b.property.isBoosted);

    if (sortBy === "nearest") {
      // 1. Featured / promoted PGs always stay on top
      if (isFeaturedA && !isFeaturedB) return -1;
      if (!isFeaturedA && isFeaturedB) return 1;

      // 2. Within the same group (both featured or both regular), sort by distance (closest first)
      const distA = a.property.distanceKm ?? Infinity;
      const distB = b.property.distanceKm ?? Infinity;
      return distA - distB;
    }

    if (sortBy === "price-asc") {
      return a.property.startingPrice - b.property.startingPrice;
    }

    if (sortBy === "price-desc") {
      return b.property.startingPrice - a.property.startingPrice;
    }

    if (sortBy === "rating") {
      const ratingDiff = (b.property.rating || 0) - (a.property.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.property.reviewCount || 0) - (a.property.reviewCount || 0);
    }

    if (sortBy === "newest") {
      const dateA = a.property.createdAt ? new Date(a.property.createdAt).getTime() : 0;
      const dateB = b.property.createdAt ? new Date(b.property.createdAt).getTime() : 0;
      return dateB - dateA;
    }

    // Default: "recommended" (Best Match Ranking Heuristic)
    if (isFeaturedA && !isFeaturedB) return -1;
    if (!isFeaturedA && isFeaturedB) return 1;
    return b.rankingScore - a.rankingScore;
  });

  return scored.map((s) => s.property as T);
}

/**
 * Ranks roommate requests using verified profile completeness and move-in date immediacy.
 */
export function rankRoommateRequests<T extends RankableRoommateRequest>(
  requests: T[],
  context?: SearchRankingContext
): T[] {
  const scored = requests.map((req) => {
    let score = 0;
    const query = context?.query?.toLowerCase().trim() || "";

    // Text match
    if (query) {
      if (req.locality.toLowerCase().includes(query)) score += 25;
      if (req.title.toLowerCase().includes(query)) score += 20;
      if (req.city.toLowerCase() === query) score += 15;
    }

    // Verified creator profile
    const isVerified = req.isCreatorVerified || req.creator?.profile?.verificationStatus === "VERIFIED";
    const hasAvatar = !!(req.creatorAvatar || req.creator?.profile?.avatarUrl);
    const hasProfession = !!(req.creatorProfession || req.creator?.profile?.profession);

    if (isVerified) score += 15;
    if (hasAvatar) score += 8;
    if (hasProfession) score += 5;

    // Move-in immediacy (upcoming move-ins within 30 days score higher)
    const moveIn = new Date(req.moveInDate).getTime();
    const now = Date.now();
    const daysUntil = (moveIn - now) / (1000 * 60 * 60 * 24);
    if (daysUntil >= 0 && daysUntil <= 15) {
      score += 15;
    } else if (daysUntil > 15 && daysUntil <= 45) {
      score += 10;
    }

    return { request: req, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.request);
}
