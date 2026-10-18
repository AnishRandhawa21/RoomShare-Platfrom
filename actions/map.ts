"use server";

import { prisma } from "@/lib/prisma";
import { GenderPolicy, type Prisma } from "@/lib/prisma";
import type { PropertyListingSummary } from "@/lib/discovery";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapPropertyItem {
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
  latitude: number;
  longitude: number;
  roomTypeSummaries: string[];
}

/**
 * Spatial query to fetch verified properties within the viewport bounding box
 */
export async function getPropertiesInBoundsAction(
  bounds: MapBounds,
  filters?: {
    genderPolicy?: string;
    city?: string;
  }
): Promise<{ success: boolean; properties: MapPropertyItem[]; error?: string }> {
  try {
    const whereClause: Prisma.PropertyWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
      latitude: {
        gte: Math.min(bounds.south, bounds.north),
        lte: Math.max(bounds.south, bounds.north),
      },
      longitude: {
        gte: Math.min(bounds.west, bounds.east),
        lte: Math.max(bounds.west, bounds.east),
      },
    };

    if (filters?.city && filters.city !== "All") {
      whereClause.city = { equals: filters.city, mode: "insensitive" };
    }

    if (filters?.genderPolicy && filters.genderPolicy !== "all") {
      const upper = filters.genderPolicy.toUpperCase();
      if (["BOYS", "GIRLS", "UNISEX"].includes(upper)) {
        whereClause.genderPolicy = upper as GenderPolicy;
      }
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        roomTypes: {
          where: { isActive: true },
          select: { name: true, monthlyRent: true, occupancy: true },
        },
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
          select: { url: true },
          take: 6,
        },
      },
      take: 50,
    });

    const items: MapPropertyItem[] = properties.map((p) => {
      let minPerPersonRent = Infinity;
      let originalPrice: number | null = null;
      let bestSharingOccupancy: number | null = null;

      if (p.roomTypes.length > 0) {
        for (const rt of p.roomTypes) {
          const splitRent = rt.occupancy > 1 ? Math.round(rt.monthlyRent / rt.occupancy) : rt.monthlyRent;
          if (splitRent < minPerPersonRent) {
            minPerPersonRent = splitRent;
            bestSharingOccupancy = rt.occupancy;
            if (rt.occupancy > 1 && rt.monthlyRent > splitRent) {
              originalPrice = rt.monthlyRent;
            }
          }
        }

        const maxRoomRent = Math.max(...p.roomTypes.map((r) => r.monthlyRent));
        if (maxRoomRent > minPerPersonRent && (!originalPrice || maxRoomRent > originalPrice)) {
          originalPrice = maxRoomRent;
        }
      }

      if (p.startingPrice && p.startingPrice > 0) {
        if (minPerPersonRent === Infinity) {
          minPerPersonRent = p.startingPrice;
        } else if (p.startingPrice > minPerPersonRent && (!originalPrice || p.startingPrice > originalPrice)) {
          originalPrice = p.startingPrice;
        } else if (p.startingPrice < minPerPersonRent) {
          minPerPersonRent = p.startingPrice;
        }
      }

      if (minPerPersonRent === Infinity) {
        minPerPersonRent = 0;
      }

      const uniqueRoomTypes = Array.from(
        new Set(p.roomTypes.map((r) => r.name))
      );

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        locality: p.locality,
        city: p.city,
        genderPolicy: p.genderPolicy,
        startingPrice: minPerPersonRent,
        originalPrice: originalPrice && originalPrice > minPerPersonRent ? originalPrice : null,
        bestSharingOccupancy: bestSharingOccupancy && bestSharingOccupancy > 1 ? bestSharingOccupancy : null,
        foodIncluded: p.foodOffering === "NO_FOOD" ? false : Boolean(p.foodIncluded),
        coverImageUrl: p.images[0]?.url || null,
        images: p.images.map((img) => img.url),
        latitude: p.latitude,
        longitude: p.longitude,
        roomTypeSummaries: uniqueRoomTypes,
      };
    });

    return { success: true, properties: items };
  } catch (error) {
    console.error("Error in getPropertiesInBoundsAction:", error);
    return { success: false, properties: [], error: "Failed to fetch map properties" };
  }
}

/**
 * Spatial proximity query to find properties near a given lat/lng within radiusKm (using Haversine)
 */
export async function getNearbyPropertiesAction(
  targetLat: number,
  targetLng: number,
  radiusKm: number = 10,
  excludeId?: string
): Promise<{ success: boolean; properties: (MapPropertyItem & { distanceKm: number })[]; error?: string }> {
  try {
    // 1 deg latitude is approx 111 km
    const latDelta = radiusKm / 111.0;
    // 1 deg longitude varies with latitude
    const lngDelta = radiusKm / (111.0 * Math.cos((targetLat * Math.PI) / 180));

    const whereClause: Prisma.PropertyWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
      latitude: {
        gte: targetLat - latDelta,
        lte: targetLat + latDelta,
      },
      longitude: {
        gte: targetLng - lngDelta,
        lte: targetLng + lngDelta,
      },
    };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        roomTypes: {
          where: { isActive: true },
          select: { name: true, monthlyRent: true, occupancy: true },
        },
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
          select: { url: true },
          take: 1,
        },
      },
      take: 20,
    });

    // Compute Haversine distance in km
    const items = properties
      .map((p) => {
        const minRent =
          p.startingPrice ||
          (p.roomTypes.length > 0
            ? Math.min(...p.roomTypes.map((r) => r.monthlyRent))
            : 0);

        const uniqueRoomTypes = Array.from(
          new Set(p.roomTypes.map((r) => r.name))
        );

        const dLat = ((p.latitude - targetLat) * Math.PI) / 180;
        const dLng = ((p.longitude - targetLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((targetLat * Math.PI) / 180) *
            Math.cos((p.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = Math.round(6371 * c * 10) / 10;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          locality: p.locality,
          city: p.city,
          genderPolicy: p.genderPolicy,
          startingPrice: minRent,
          foodIncluded: p.foodOffering === "NO_FOOD" ? false : Boolean(p.foodIncluded),
          coverImageUrl: p.images[0]?.url || null,
          latitude: p.latitude,
          longitude: p.longitude,
          roomTypeSummaries: uniqueRoomTypes,
          distanceKm,
        };
      })
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return { success: true, properties: items };
  } catch (error) {
    console.error("Error in getNearbyPropertiesAction:", error);
    return { success: false, properties: [], error: "Failed to fetch nearby properties" };
  }
}
