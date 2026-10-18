import { prisma } from "@/lib/prisma";
import {
  GenderPolicy,
  DietaryPreference,
  SmokingPreference,
  DrinkingPreference,
  SleepSchedule,
  type Prisma,
} from "@/lib/prisma";

export interface RoommateFilters {
  city?: string;
  locality?: string;
  searchQuery?: string;
  minRent?: number;
  maxRent?: number;
  preferredGender?: string;
  dietary?: string;
  smoking?: string;
  drinking?: string;
  sleepSchedule?: string;
}

/**
 * Rich roommate request item for discovery grid
 */
export async function getRoommateRequests(filters?: RoommateFilters) {
  try {
    const where: Prisma.RoommateRequestWhereInput = {
      status: "ACTIVE",
    };

    if (filters?.city && filters.city !== "All") {
      where.city = { equals: filters.city, mode: "insensitive" };
    }

    if (filters?.locality && filters.locality.trim().length > 0) {
      where.locality = { contains: filters.locality.trim(), mode: "insensitive" };
    }

    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { locality: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { propertyName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filters?.preferredGender && filters.preferredGender !== "all") {
      const upper = filters.preferredGender.toUpperCase();
      if (["BOYS", "GIRLS", "UNISEX"].includes(upper)) {
        where.preferredGender = upper as GenderPolicy;
      }
    }

    if (filters?.minRent !== undefined || filters?.maxRent !== undefined) {
      where.rentPerPerson = {};
      if (filters.minRent !== undefined && filters.minRent > 0) {
        where.rentPerPerson.gte = filters.minRent;
      }
      if (filters.maxRent !== undefined && filters.maxRent > 0) {
        where.rentPerPerson.lte = filters.maxRent;
      }
    }

    // Lifestyle filters inside preferences relation
    if (
      filters?.dietary ||
      filters?.smoking ||
      filters?.drinking ||
      filters?.sleepSchedule
    ) {
      where.preferences = {};

      if (filters.dietary && filters.dietary !== "all") {
        where.preferences.dietary = filters.dietary as DietaryPreference;
      }
      if (filters.smoking && filters.smoking !== "all") {
        where.preferences.smoking = filters.smoking as SmokingPreference;
      }
      if (filters.drinking && filters.drinking !== "all") {
        where.preferences.drinking = filters.drinking as DrinkingPreference;
      }
      if (filters.sleepSchedule && filters.sleepSchedule !== "all") {
        where.preferences.sleepSchedule = filters.sleepSchedule as SleepSchedule;
      }
    }

    const items = await prisma.roommateRequest.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
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
        preferences: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 3,
        },
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return items;
  } catch (error) {
    console.error("Error querying roommate requests:", error);
    return [];
  }
}

/**
 * Detailed single roommate request for detail view
 */
export async function getRoommateRequestById(id: string) {
  try {
    const item = await prisma.roommateRequest.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                bio: true,
                profession: true,
                companyOrCollege: true,
                gender: true,
                age: true,
                verificationStatus: true,
              },
            },
          },
        },
        preferences: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            locality: true,
            city: true,
            addressLine1: true,
          },
        },
        roomType: {
          select: {
            id: true,
            name: true,
            monthlyRent: true,
            occupancy: true,
          },
        },
        interests: {
          include: {
            applicant: {
              select: {
                id: true,
                profile: {
                  select: {
                    fullName: true,
                    avatarUrl: true,
                    profession: true,
                    companyOrCollege: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return item;
  } catch (error) {
    console.error(`Error querying roommate request ${id}:`, error);
    return null;
  }
}
