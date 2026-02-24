import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

/**
 * Cloudflare R2 Storage Client
 * R2 is S3-compatible, so we use AWS SDK
 */

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN!;

// S3 Client configured for Cloudflare R2
const r2Client = new S3Client({
  region: "auto", // R2 uses "auto" region
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Supported file types for upload
 */
export type FileType = "image" | "video";

/**
 * Get MIME type based on file type and extension
 */
function getMimeType(fileType: FileType, extension?: string): string {
  if (fileType === "image") {
    switch (extension?.toLowerCase()) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      default:
        return "image/png"; // Default to PNG
    }
  } else if (fileType === "video") {
    switch (extension?.toLowerCase()) {
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "mov":
        return "video/quicktime";
      default:
        return "video/mp4"; // Default to MP4
    }
  }
  return "application/octet-stream";
}

/**
 * Generate a unique filename with timestamp and random hash
 */
function generateFilename(fileType: FileType, extension?: string): string {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString("hex");
  const ext = extension || (fileType === "image" ? "png" : "mp4");
  return `${fileType}s/${timestamp}-${randomHash}.${ext}`;
}

/**
 * Upload file to Cloudflare R2
 *
 * @param buffer - File buffer to upload
 * @param fileType - Type of file (image or video)
 * @param extension - File extension (optional, auto-detected if not provided)
 * @returns Promise with public URL
 */
export async function uploadToR2(
  buffer: Buffer,
  fileType: FileType,
  extension?: string
): Promise<string> {
  try {
    // Generate unique filename
    const filename = generateFilename(fileType, extension);
    const mimeType = getMimeType(fileType, extension);

    console.log(`Uploading to R2: ${filename} (${mimeType})`);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: mimeType,
      // Make the object publicly accessible
      // Note: R2 bucket must be configured to allow public access
    });

    await r2Client.send(command);

    // Construct public URL
    // Format: https://pub-xxxxx.r2.dev/images/timestamp-hash.png
    const publicUrl = `${R2_PUBLIC_DOMAIN}/${filename}`;

    console.log(`Upload successful: ${publicUrl}`);

    return publicUrl;
  } catch (error: any) {
    console.error("R2 upload error:", error);
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
}

/**
 * Upload image to R2
 * Convenience wrapper for uploadToR2 with image type
 */
export async function uploadImage(
  buffer: Buffer,
  extension?: string
): Promise<string> {
  return uploadToR2(buffer, "image", extension);
}

/**
 * Upload video to R2
 * Convenience wrapper for uploadToR2 with video type
 */
export async function uploadVideo(
  buffer: Buffer,
  extension?: string
): Promise<string> {
  return uploadToR2(buffer, "video", extension);
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME &&
    R2_PUBLIC_DOMAIN
  );
}

/**
 * Get R2 bucket info (for debugging)
 */
export function getR2Info() {
  return {
    accountId: R2_ACCOUNT_ID ? "***" + R2_ACCOUNT_ID.slice(-4) : "not set",
    bucketName: R2_BUCKET_NAME || "not set",
    publicDomain: R2_PUBLIC_DOMAIN || "not set",
    configured: isR2Configured(),
  };
}
