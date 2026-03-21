import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { profileReviewConfig } from "@/lib/profile-review/config";

export async function uploadProfileReviewPhoto(params: {
  sessionId: string;
  file: File;
  sortOrder: number;
}) {
  const arrayBuffer = await params.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = params.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const key = `${params.sessionId}/${params.sortOrder}-${randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(profileReviewConfig.storageBucket)
    .upload(key, buffer, {
      contentType: params.file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload review image: ${error.message}`);
  }

  return {
    storagePath: key,
    mimeType: params.file.type || "image/jpeg",
    fileName: params.file.name,
  };
}

export async function createSignedProfileReviewUrl(
  storagePath: string,
  expiresIn = 60 * 60
) {
  const { data, error } = await supabaseAdmin.storage
    .from(profileReviewConfig.storageBucket)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(
      `Failed to create signed URL: ${error?.message || "Unknown error"}`
    );
  }

  return data.signedUrl;
}

export async function removeProfileReviewFolder(sessionId: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(profileReviewConfig.storageBucket)
    .list(sessionId, {
      limit: 100,
      offset: 0,
    });

  if (error) {
    throw new Error(`Failed to list review images: ${error.message}`);
  }

  const paths = (data || [])
    .filter((item) => item.name)
    .map((item) => `${sessionId}/${item.name}`);

  if (!paths.length) {
    return;
  }

  const { error: removeError } = await supabaseAdmin.storage
    .from(profileReviewConfig.storageBucket)
    .remove(paths);

  if (removeError) {
    throw new Error(`Failed to remove review images: ${removeError.message}`);
  }
}
