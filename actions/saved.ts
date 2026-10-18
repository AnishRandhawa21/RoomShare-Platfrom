"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export interface SavedActionResult<T = unknown> {
  success: boolean;
  isSaved?: boolean;
  data?: T;
  error?: string;
}

/**
 * Toggles bookmark status for a property.
 */
export async function toggleSavePropertyAction(
  propertyId: string
): Promise<SavedActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please sign in to save this property." };
  }

  try {
    const existing = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId,
        },
      },
    });

    if (existing) {
      await prisma.savedProperty.delete({
        where: { id: existing.id },
      });

      try {
        revalidatePath("/saved");
      } catch {
        // safe fallback
      }

      return { success: true, isSaved: false };
    } else {
      await prisma.savedProperty.create({
        data: {
          userId: user.id,
          propertyId,
        },
      });

      try {
        revalidatePath("/saved");
      } catch {
        // safe fallback
      }

      return { success: true, isSaved: true };
    }
  } catch (error) {
    console.error("Error toggling saved property:", error);
    return { success: false, error: "Failed to update bookmark." };
  }
}

/**
 * Toggles bookmark status for a roommate request.
 */
export async function toggleSaveRoommateAction(
  requestId: string
): Promise<SavedActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please sign in to save this flatmate post." };
  }

  try {
    const existing = await prisma.savedRoommateRequest.findUnique({
      where: {
        userId_requestId: {
          userId: user.id,
          requestId,
        },
      },
    });

    if (existing) {
      await prisma.savedRoommateRequest.delete({
        where: { id: existing.id },
      });

      try {
        revalidatePath("/saved");
      } catch {
        // safe fallback
      }

      return { success: true, isSaved: false };
    } else {
      await prisma.savedRoommateRequest.create({
        data: {
          userId: user.id,
          requestId,
        },
      });

      try {
        revalidatePath("/saved");
      } catch {
        // safe fallback
      }

      return { success: true, isSaved: true };
    }
  } catch (error) {
    console.error("Error toggling saved roommate request:", error);
    return { success: false, error: "Failed to update bookmark." };
  }
}

/**
 * Returns an array of saved property IDs and roommate request IDs for the current user.
 */
export async function getUserSavedIdsAction(): Promise<{
  savedPropertyIds: string[];
  savedRoommateIds: string[];
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { savedPropertyIds: [], savedRoommateIds: [] };
  }

  try {
    const [savedProps, savedRoommates] = await Promise.all([
      prisma.savedProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      }),
      prisma.savedRoommateRequest.findMany({
        where: { userId: user.id },
        select: { requestId: true },
      }),
    ]);

    return {
      savedPropertyIds: savedProps.map((p) => p.propertyId),
      savedRoommateIds: savedRoommates.map((r) => r.requestId),
    };
  } catch (error) {
    console.error("Error fetching saved IDs:", error);
    return { savedPropertyIds: [], savedRoommateIds: [] };
  }
}

/**
 * Fetches all saved items with full details for the /saved dashboard.
 */
export async function getUserSavedItemsAction() {
  const user = await getCurrentUser();
  if (!user) {
    return { properties: [], roommates: [] };
  }

  try {
    const [savedProperties, savedRoommates] = await Promise.all([
      prisma.savedProperty.findMany({
        where: { userId: user.id },
        include: {
          property: {
            include: {
              images: {
                where: { isCover: true },
                select: { url: true },
                take: 1,
              },
              roomTypes: {
                where: { isActive: true },
                select: { name: true, monthlyRent: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.savedRoommateRequest.findMany({
        where: { userId: user.id },
        include: {
          request: {
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
                take: 2,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const properties = savedProperties
      .filter((sp) => sp.property && !sp.property.deletedAt)
      .map((sp) => {
        const p = sp.property;
        const minRent =
          p.startingPrice ||
          (p.roomTypes.length > 0
            ? Math.min(...p.roomTypes.map((r) => r.monthlyRent))
            : 0);
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
          savedAt: sp.createdAt.toISOString(),
        };
      });

    const roommates = savedRoommates
      .filter((sr) => sr.request && !sr.request.deletedAt)
      .map((sr) => {
        const r = sr.request;
        return {
          id: r.id,
          title: r.title,
          locality: r.locality,
          city: r.city,
          propertyName: r.propertyName,
          rentPerPerson: r.rentPerPerson,
          securityDeposit: r.securityDeposit,
          preferredGender: r.preferredGender,
          moveInDate: r.moveInDate.toISOString(),
          isFurnished: r.isFurnished,
          hasAttachedBathroom: r.hasAttachedBathroom,
          creator: {
            id: r.creator.id,
            profile: r.creator.profile,
          },
          preferences: r.preferences,
          images: r.images,
          savedAt: sr.createdAt.toISOString(),
        };
      });

    return { properties, roommates };
  } catch (error) {
    console.error("Error fetching saved items:", error);
    return { properties: [], roommates: [] };
  }
}
