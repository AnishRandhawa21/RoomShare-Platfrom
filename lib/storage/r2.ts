import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 Environment Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "roomshare-platform";
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || "";

let r2ClientInstance: S3Client | null = null;

/**
 * Returns true if Cloudflare R2 credentials are fully configured.
 */
export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME
  );
}

/**
 * Returns the singleton S3 client configured for Cloudflare R2.
 */
export function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    if (!isR2Configured()) {
      throw new Error(
        "Cloudflare R2 is not configured. Please supply R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in your environment."
      );
    }

    r2ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2ClientInstance;
}

/**
 * Formats the public CDN delivery URL for an object stored in R2.
 * If R2_PUBLIC_DOMAIN is unconfigured or a placeholder, routes through /api/storage proxy.
 */
export function getR2PublicUrl(storageKey: string): string {
  const cleanKey = storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;

  if (
    R2_PUBLIC_DOMAIN &&
    !R2_PUBLIC_DOMAIN.includes("your-bucket-id") &&
    !R2_PUBLIC_DOMAIN.includes("example.com")
  ) {
    const base = R2_PUBLIC_DOMAIN.endsWith("/")
      ? R2_PUBLIC_DOMAIN.slice(0, -1)
      : R2_PUBLIC_DOMAIN;
    return `${base}/${cleanKey}`;
  }

  // Fallback to internal streaming proxy route
  return `/api/storage/${cleanKey}`;
}

/**
 * Directly uploads a binary buffer/Uint8Array to Cloudflare R2 from the server (bypassing browser CORS).
 */
export async function uploadR2ObjectDirect({
  storageKey,
  buffer,
  contentType,
}: {
  storageKey: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ success: boolean; storageKey: string; publicUrl: string; error?: string }> {
  try {
    const client = getR2Client();
    const cleanKey = storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: cleanKey,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const publicUrl = getR2PublicUrl(cleanKey);

    return {
      success: true,
      storageKey: cleanKey,
      publicUrl,
    };
  } catch (error: any) {
    console.error("Direct R2 upload failed:", error);
    return {
      success: false,
      storageKey,
      publicUrl: "",
      error: error?.message || "Failed to upload file to Cloudflare R2.",
    };
  }
}

/**
 * Fetches an object stream from Cloudflare R2.
 */
export async function getR2ObjectStream(storageKey: string) {
  const client = getR2Client();
  const cleanKey = storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
  });

  return await client.send(command);
}

export interface PresignedUrlResult {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  expiresInSeconds: number;
}

/**
 * Generates a presigned PUT URL allowing clients to upload directly to Cloudflare R2.
 * @param storageKey Unique S3/R2 object key (e.g. `properties/prop-id/uuid.webp`)
 * @param contentType File MIME type (e.g. `image/webp`, `image/jpeg`, `image/png`)
 * @param expiresInSeconds Duration the presigned URL remains valid (default 600 seconds / 10 minutes)
 */
export async function generatePresignedUploadUrl(
  storageKey: string,
  contentType: string,
  expiresInSeconds: number = 600
): Promise<PresignedUrlResult> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storageKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  const publicUrl = getR2PublicUrl(storageKey);

  return {
    uploadUrl,
    storageKey,
    publicUrl,
    expiresInSeconds,
  };
}

/**
 * Deletes an object from Cloudflare R2.
 */
export async function deleteR2Object(storageKey: string): Promise<boolean> {
  if (!isR2Configured()) {
    console.warn("Skipping R2 deletion: Cloudflare R2 credentials not configured.");
    return false;
  }

  try {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to delete object "${storageKey}" from Cloudflare R2:`, error);
    return false;
  }
}
