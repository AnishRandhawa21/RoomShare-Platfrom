"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  isR2Configured,
  generatePresignedUploadUrl,
  deleteR2Object,
  uploadR2ObjectDirect,
} from "@/lib/storage/r2";
import { ImageType } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type UploadRequestResult = {
  success: boolean;
  uploadUrl?: string;
  storageKey?: string;
  publicUrl?: string;
  isMockMode?: boolean;
  error?: string;
};

export type ImageActionResult = {
  success: boolean;
  image?: {
    id: string;
    propertyId?: string;
    requestId?: string;
    storageKey: string;
    url: string;
    imageType?: ImageType;
    isCover?: boolean;
    sortOrder: number;
  };
  error?: string;
};

/**
 * Generates a presigned URL for direct client-to-R2 property image upload.
 */
export async function requestPropertyImageUploadAction({
  propertyId,
  fileName,
  contentType,
  fileSizeBytes,
  imageType = "BEDROOM",
}: {
  propertyId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  imageType?: ImageType;
}): Promise<UploadRequestResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  // Verify property ownership or admin privileges
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { owner: true },
  });

  if (!property) {
    return { success: false, error: "Property not found." };
  }

  const isOwner = property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "You do not have permission to upload photos for this property." };
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return {
      success: false,
      error: `Unsupported file format. Please upload JPEG, PNG, WebP, or AVIF images.`,
    };
  }

  // Validate file size
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `File size exceeds the 10MB limit.`,
    };
  }

  // Derive file extension
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueId = crypto.randomUUID();
  const storageKey = `properties/${propertyId}/${uniqueId}-${imageType.toLowerCase()}.${ext}`;

  // If R2 credentials are not configured yet, provide local dev mode simulation
  if (!isR2Configured()) {
    console.warn(
      "[R2 Upload] Cloudflare R2 is not configured in .env. Falling back to dev simulated upload."
    );
    const mockPublicUrl = `/placeholder-property.jpg`;
    return {
      success: true,
      uploadUrl: "",
      storageKey,
      publicUrl: mockPublicUrl,
      isMockMode: true,
    };
  }

  try {
    const presigned = await generatePresignedUploadUrl(storageKey, contentType);
    return {
      success: true,
      uploadUrl: presigned.uploadUrl,
      storageKey: presigned.storageKey,
      publicUrl: presigned.publicUrl,
      isMockMode: false,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate presigned upload URL.";
    console.error("Error generating presigned R2 upload URL:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Persists property image metadata into PostgreSQL after successful R2 upload.
 */
export async function confirmPropertyImageUploadAction({
  propertyId,
  storageKey,
  url,
  imageType = "BEDROOM",
  altText,
  isCover = false,
}: {
  propertyId: string;
  storageKey: string;
  url: string;
  imageType?: ImageType;
  altText?: string;
  isCover?: boolean;
}): Promise<ImageActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { owner: true, images: true },
  });

  if (!property) {
    return { success: false, error: "Property not found." };
  }

  const isOwner = property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized operation." };
  }

  try {
    // If this is the first image or marked as cover, make sure it's the only cover
    const isFirstImage = property.images.length === 0;
    const shouldBeCover = isCover || isFirstImage;

    if (shouldBeCover) {
      await prisma.propertyImage.updateMany({
        where: { propertyId },
        data: { isCover: false },
      });
    }

    const nextSortOrder = property.images.length;

    const newImage = await prisma.propertyImage.create({
      data: {
        propertyId,
        storageKey,
        url,
        imageType,
        altText: altText || `${property.name} ${imageType.toLowerCase()}`,
        isCover: shouldBeCover,
        sortOrder: nextSortOrder,
      },
    });

    revalidatePath(`/owner/properties`);
    revalidatePath(`/owner/properties/${propertyId}/rooms`);
    revalidatePath(`/owner/properties/${propertyId}/photos`);
    revalidatePath(`/owner/photos`);
    revalidatePath(`/owner`);
    revalidatePath(`/property/${property.slug}`);

    return {
      success: true,
      image: {
        id: newImage.id,
        propertyId: newImage.propertyId,
        storageKey: newImage.storageKey,
        url: newImage.url,
        imageType: newImage.imageType,
        isCover: newImage.isCover,
        sortOrder: newImage.sortOrder,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record image in database.";
    console.error("Error confirming property image upload:", error);
    return { success: false, error: message };
  }
}

/**
 * Deletes a property image from Cloudflare R2 and PostgreSQL.
 */
export async function deletePropertyImageAction(imageId: string): Promise<ImageActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const image = await prisma.propertyImage.findUnique({
    where: { id: imageId },
    include: {
      property: {
        include: { owner: true },
      },
    },
  });

  if (!image) {
    return { success: false, error: "Image not found." };
  }

  const isOwner = image.property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized operation." };
  }

  try {
    // 1. Delete from Cloudflare R2
    await deleteR2Object(image.storageKey);

    // 2. Delete from database
    await prisma.propertyImage.delete({
      where: { id: imageId },
    });

    // 3. If deleted image was cover, assign another image as cover if one exists
    if (image.isCover) {
      const nextCover = await prisma.propertyImage.findFirst({
        where: { propertyId: image.propertyId },
        orderBy: { sortOrder: "asc" },
      });

      if (nextCover) {
        await prisma.propertyImage.update({
          where: { id: nextCover.id },
          data: { isCover: true },
        });
      }
    }

    revalidatePath(`/owner/properties`);
    revalidatePath(`/owner/properties/${image.propertyId}/rooms`);
    revalidatePath(`/owner/properties/${image.propertyId}/photos`);
    revalidatePath(`/owner/photos`);
    revalidatePath(`/owner`);
    revalidatePath(`/property/${image.property.slug}`);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete image.";
    console.error("Error deleting property image:", error);
    return { success: false, error: message };
  }
}

/**
 * Sets an existing image as the primary cover photo for a property.
 */
export async function setPropertyCoverImageAction(imageId: string): Promise<ImageActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  const image = await prisma.propertyImage.findUnique({
    where: { id: imageId },
    include: {
      property: {
        include: { owner: true },
      },
    },
  });

  if (!image) {
    return { success: false, error: "Image not found." };
  }

  const isOwner = image.property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized operation." };
  }

  try {
    // Unset all covers for this property
    await prisma.propertyImage.updateMany({
      where: { propertyId: image.propertyId },
      data: { isCover: false },
    });

    // Set this image as cover
    const updated = await prisma.propertyImage.update({
      where: { id: imageId },
      data: { isCover: true },
    });

    revalidatePath(`/owner/properties`);
    revalidatePath(`/owner/properties/${image.propertyId}/photos`);
    revalidatePath(`/owner/photos`);
    revalidatePath(`/owner`);
    revalidatePath(`/property/${image.property.slug}`);

    return {
      success: true,
      image: {
        id: updated.id,
        propertyId: updated.propertyId,
        storageKey: updated.storageKey,
        url: updated.url,
        imageType: updated.imageType,
        isCover: updated.isCover,
        sortOrder: updated.sortOrder,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to set cover image.";
    return { success: false, error: message };
  }
}

/**
 * Generates a presigned URL for direct client-to-R2 roommate request image upload.
 */
export async function requestRoommateImageUploadAction({
  requestId,
  fileName,
  contentType,
  fileSizeBytes,
}: {
  requestId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}): Promise<UploadRequestResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const request = await prisma.roommateRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return { success: false, error: "Roommate request not found." };
  }

  if (request.creatorId !== user.id && user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized operation." };
  }

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { success: false, error: "Unsupported image format." };
  }

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File size exceeds 10MB limit." };
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueId = crypto.randomUUID();
  const storageKey = `roommates/${requestId}/${uniqueId}.${ext}`;

  if (!isR2Configured()) {
    return {
      success: true,
      uploadUrl: "",
      storageKey,
      publicUrl: `/placeholder-room.jpg`,
      isMockMode: true,
    };
  }

  try {
    const presigned = await generatePresignedUploadUrl(storageKey, contentType);
    return {
      success: true,
      uploadUrl: presigned.uploadUrl,
      storageKey: presigned.storageKey,
      publicUrl: presigned.publicUrl,
      isMockMode: false,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload request failed.";
    return { success: false, error: message };
  }
}

/**
 * Persists roommate request image metadata into PostgreSQL after successful R2 upload.
 */
export async function confirmRoommateImageUploadAction({
  requestId,
  storageKey,
  url,
}: {
  requestId: string;
  storageKey: string;
  url: string;
}): Promise<ImageActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  const request = await prisma.roommateRequest.findUnique({
    where: { id: requestId },
    include: { images: true },
  });

  if (!request || (request.creatorId !== user.id && user.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized operation." };
  }

  try {
    const newImage = await prisma.roommateRequestImage.create({
      data: {
        requestId,
        storageKey,
        url,
        sortOrder: request.images.length,
      },
    });

    revalidatePath(`/roommates/${requestId}`);
    return {
      success: true,
      image: {
        id: newImage.id,
        requestId: newImage.requestId,
        storageKey: newImage.storageKey,
        url: newImage.url,
        sortOrder: newImage.sortOrder,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record image.";
    return { success: false, error: message };
  }
}

/**
 * Generates a presigned URL for direct client-to-R2 RoomType image upload.
 */
export async function requestRoomTypeImageUploadAction({
  roomTypeId,
  fileName,
  contentType,
  fileSizeBytes,
}: {
  roomTypeId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}): Promise<UploadRequestResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      property: {
        include: { owner: true },
      },
    },
  });

  if (!roomType) {
    return { success: false, error: "Room type not found." };
  }

  const isOwner = roomType.property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized operation." };
  }

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { success: false, error: "Unsupported image format. Please upload JPEG, PNG, WebP, or AVIF." };
  }

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File size exceeds 10MB limit." };
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueId = crypto.randomUUID();
  const storageKey = `properties/${roomType.propertyId}/roomtypes/${roomTypeId}/${uniqueId}.${ext}`;

  if (!isR2Configured()) {
    return {
      success: true,
      uploadUrl: "",
      storageKey,
      publicUrl: `/placeholder-room.jpg`,
      isMockMode: true,
    };
  }

  try {
    const presigned = await generatePresignedUploadUrl(storageKey, contentType);
    return {
      success: true,
      uploadUrl: presigned.uploadUrl,
      storageKey: presigned.storageKey,
      publicUrl: presigned.publicUrl,
      isMockMode: false,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload request failed.";
    return { success: false, error: message };
  }
}

/**
 * Persists RoomImage metadata into PostgreSQL after successful R2 upload.
 */
export async function confirmRoomTypeImageUploadAction({
  roomTypeId,
  storageKey,
  url,
  altText,
}: {
  roomTypeId: string;
  storageKey: string;
  url: string;
  altText?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      property: {
        include: { owner: true },
      },
      images: true,
    },
  });

  if (!roomType) {
    return { success: false, error: "Room type not found." };
  }

  const isOwner = roomType.property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized operation." };
  }

  try {
    const newImage = await prisma.roomImage.create({
      data: {
        roomTypeId,
        storageKey,
        url,
        sortOrder: roomType.images.length,
        altText: altText || `${roomType.name} image`,
      },
    });

    revalidatePath(`/owner/properties/${roomType.propertyId}/room-types`);
    revalidatePath(`/property/${roomType.property.slug}`);

    return {
      success: true,
      image: newImage,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record room type image.";
    return { success: false, error: message };
  }
}

/**
 * Deletes a RoomImage from Cloudflare R2 and PostgreSQL.
 */
export async function deleteRoomTypeImageAction(imageId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  const image = await prisma.roomImage.findUnique({
    where: { id: imageId },
    include: {
      roomType: {
        include: {
          property: {
            include: { owner: true },
          },
        },
      },
    },
  });

  if (!image) {
    return { success: false, error: "Image not found." };
  }

  const isOwner = image.roomType.property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized operation." };
  }

  try {
    await deleteR2Object(image.storageKey);
    await prisma.roomImage.delete({
      where: { id: imageId },
    });

    revalidatePath(`/owner/properties/${image.roomType.propertyId}/room-types`);
    revalidatePath(`/property/${image.roomType.property.slug}`);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete room image.";
    return { success: false, error: message };
  }
}

/**
 * Direct Server-Side Upload for Property Images.
 * Bypasses browser CORS restrictions by streaming from Next.js server directly to Cloudflare R2.
 */
export async function uploadPropertyImageDirectAction(formData: FormData): Promise<ImageActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const propertyId = formData.get("propertyId") as string;
  const file = formData.get("file") as File | null;
  const imageType = (formData.get("imageType") as ImageType) || "BEDROOM";
  const altText = (formData.get("altText") as string) || "";
  const isCoverStr = formData.get("isCover") as string;
  const isCover = isCoverStr === "true";

  if (!propertyId || !file) {
    return { success: false, error: "Missing required property or image file." };
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { owner: true, images: true },
  });

  if (!property) {
    return { success: false, error: "Property not found." };
  }

  const isOwner = property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized to upload photos for this property." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File exceeds 10MB limit." };
  }

  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueId = crypto.randomUUID();
    const storageKey = `properties/${propertyId}/${uniqueId}-${imageType.toLowerCase()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    let publicUrl = `/placeholder-property.jpg`;

    if (isR2Configured()) {
      const uploadRes = await uploadR2ObjectDirect({
        storageKey,
        buffer,
        contentType: file.type || "image/jpeg",
      });

      if (!uploadRes.success) {
        throw new Error(uploadRes.error || "R2 Direct Upload Failed");
      }
      publicUrl = uploadRes.publicUrl;
    }

    const shouldBeCover = isCover || property.images.length === 0;

    if (shouldBeCover) {
      await prisma.propertyImage.updateMany({
        where: { propertyId },
        data: { isCover: false },
      });
    }

    const nextSortOrder = property.images.length;

    const newImage = await prisma.propertyImage.create({
      data: {
        propertyId,
        storageKey,
        url: publicUrl,
        imageType,
        altText: altText || `${property.name} ${imageType.toLowerCase()}`,
        isCover: shouldBeCover,
        sortOrder: nextSortOrder,
      },
    });

    revalidatePath(`/owner/properties`);
    revalidatePath(`/owner/properties/${propertyId}/rooms`);
    revalidatePath(`/owner/properties/${propertyId}/photos`);
    revalidatePath(`/owner/photos`);
    revalidatePath(`/owner`);
    revalidatePath(`/property/${property.slug}`);

    return {
      success: true,
      image: {
        id: newImage.id,
        propertyId: newImage.propertyId,
        storageKey: newImage.storageKey,
        url: newImage.url,
        imageType: newImage.imageType,
        isCover: newImage.isCover,
        sortOrder: newImage.sortOrder,
      },
    };
  } catch (error: any) {
    console.error("uploadPropertyImageDirectAction error:", error);
    return { success: false, error: error?.message || "Failed to upload image." };
  }
}

/**
 * Direct Server-Side Upload for RoomType Images.
 * Bypasses browser CORS restrictions by streaming from Next.js server directly to Cloudflare R2.
 */
export async function uploadRoomTypeImageDirectAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const roomTypeId = formData.get("roomTypeId") as string;
  const file = formData.get("file") as File | null;
  const altText = (formData.get("altText") as string) || "";

  if (!roomTypeId || !file) {
    return { success: false, error: "Missing required room type or image file." };
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      property: {
        include: { owner: true },
      },
      images: true,
    },
  });

  if (!roomType) {
    return { success: false, error: "Room type not found." };
  }

  const isOwner = roomType.property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized to upload photos for this room type." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File exceeds 10MB limit." };
  }

  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueId = crypto.randomUUID();
    const storageKey = `properties/${roomType.propertyId}/roomtypes/${roomTypeId}/${uniqueId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    let publicUrl = `/placeholder-room.jpg`;

    if (isR2Configured()) {
      const uploadRes = await uploadR2ObjectDirect({
        storageKey,
        buffer,
        contentType: file.type || "image/jpeg",
      });

      if (!uploadRes.success) {
        throw new Error(uploadRes.error || "R2 Direct Upload Failed");
      }
      publicUrl = uploadRes.publicUrl;
    }

    const newImage = await prisma.roomImage.create({
      data: {
        roomTypeId,
        storageKey,
        url: publicUrl,
        sortOrder: roomType.images.length,
        altText: altText || `${roomType.name} image`,
      },
    });

    revalidatePath(`/owner/properties/${roomType.propertyId}/room-types`);
    revalidatePath(`/property/${roomType.property.slug}`);

    return {
      success: true,
      image: newImage,
    };
  } catch (error: any) {
    console.error("uploadRoomTypeImageDirectAction error:", error);
    return { success: false, error: error?.message || "Failed to upload room type image." };
  }
}


