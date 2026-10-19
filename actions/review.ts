"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export interface SubmitReviewInput {
  propertyId: string;
  rating: number;
  title?: string;
  comment: string;
  cleanliness?: number;
  foodQuality?: number;
  safety?: number;
}

export interface ReviewActionResult {
  success: boolean;
  message?: string;
  error?: string;
  review?: {
    id: string;
    userId: string;
    rating: number;
    title: string | null;
    comment: string;
    cleanliness: number | null;
    foodQuality: number | null;
    safety: number | null;
    createdAt: Date;
    user: {
      fullName: string;
      avatarUrl: string | null;
    };
  };
}

/**
 * Server action to submit or update a star rating and review for a property.
 */
export async function submitPropertyReviewAction(
  input: SubmitReviewInput
): Promise<ReviewActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "You must be signed in to rate and review this property.",
    };
  }

  const { propertyId, rating, title, comment, cleanliness, foodQuality, safety } = input;

  if (!propertyId) {
    return { success: false, error: "Property ID is required." };
  }

  if (!rating || rating < 1 || rating > 5) {
    return { success: false, error: "Please provide a star rating between 1 and 5." };
  }

  if (!comment || comment.trim().length < 5) {
    return { success: false, error: "Please write at least a short review (5+ characters)." };
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, slug: true, name: true },
    });

    if (!property) {
      return { success: false, error: "Property not found." };
    }

    // Check if the user already reviewed this property
    const existing = await prisma.review.findFirst({
      where: {
        propertyId,
        userId: user.id,
      },
    });

    let savedReview;

    if (existing) {
      // Update existing review
      savedReview = await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: Math.round(rating),
          title: title?.trim() || null,
          comment: comment.trim(),
          cleanliness: cleanliness ? Math.round(cleanliness) : null,
          foodQuality: foodQuality ? Math.round(foodQuality) : null,
          safety: safety ? Math.round(safety) : null,
          status: "APPROVED",
        },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
    } else {
      // Create new review
      savedReview = await prisma.review.create({
        data: {
          propertyId,
          userId: user.id,
          rating: Math.round(rating),
          title: title?.trim() || null,
          comment: comment.trim(),
          cleanliness: cleanliness ? Math.round(cleanliness) : null,
          foodQuality: foodQuality ? Math.round(foodQuality) : null,
          safety: safety ? Math.round(safety) : null,
          status: "APPROVED",
        },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
    }

    // Revalidate paths for immediate update
    revalidatePath(`/property/${property.slug}`);
    revalidatePath("/");

    return {
      success: true,
      message: existing ? "Your rating and review has been updated!" : "Thank you! Your rating has been submitted.",
      review: {
        id: savedReview.id,
        userId: savedReview.userId,
        rating: savedReview.rating,
        title: savedReview.title,
        comment: savedReview.comment,
        cleanliness: savedReview.cleanliness,
        foodQuality: savedReview.foodQuality,
        safety: savedReview.safety,
        createdAt: savedReview.createdAt,
        user: {
          fullName: savedReview.user.profile?.fullName || "Verified Resident",
          avatarUrl: savedReview.user.profile?.avatarUrl || null,
        },
      },
    };
  } catch (err) {
    console.error("Error submitting property review:", err);
    return {
      success: false,
      error: "Failed to submit your rating. Please try again.",
    };
  }
}
