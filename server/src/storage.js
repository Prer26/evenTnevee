import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

/**
 * Retrieves storage configuration dynamically from process.env at runtime.
 */
export function getConfig() {
  return {
    endpoint: process.env.STORAGE_ENDPOINT || "",
    region: process.env.STORAGE_REGION || "us-east-1",
    bucket: process.env.STORAGE_BUCKET || "",
    accessKey: process.env.STORAGE_ACCESS_KEY || "",
    secretKey: process.env.STORAGE_SECRET_KEY || "",
    publicUrl: process.env.STORAGE_PUBLIC_URL || "",
  };
}

export function isStorageConfigured() {
  const { bucket, accessKey, secretKey } = getConfig();
  return !!(bucket && accessKey && secretKey);
}

/**
 * Creates or retrieves the S3Client instance based on current runtime configuration.
 */
export function getS3Client() {
  if (!isStorageConfigured()) {
    return null;
  }

  const { region, accessKey, secretKey, endpoint } = getConfig();
  const config = {
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  };

  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle = true; // Required for MinIO, Supabase, and local S3 emulators
  }

  return new S3Client(config);
}

/**
 * Computes the public asset URL for an object key.
 * Prioritizes STORAGE_PUBLIC_URL (CDN / custom domain) if configured.
 */
export function getPublicUrl(key) {
  if (!key) return "";

  const cleanKey = key.replace(/^\/+/, "");
  const { publicUrl, endpoint, bucket, region } = getConfig();

  if (publicUrl) {
    return `${publicUrl.replace(/\/+$/, "")}/${cleanKey}`;
  }

  if (endpoint) {
    const cleanEndpoint = endpoint.replace(/\/+$/, "");
    return `${cleanEndpoint}/${bucket}/${cleanKey}`;
  }

  // Default standard AWS S3 format
  return `https://${bucket}.s3.${region}.amazonaws.com/${cleanKey}`;
}

/**
 * Uploads a file buffer to persistent object storage.
 * Enforces server-side object key generation and never trusts client filenames.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - In-memory file buffer
 * @param {string} params.mimeType - Validated MIME type (from magic bytes)
 * @param {string} params.extension - Validated safe extension (e.g. 'jpg', 'png', 'webp')
 * @param {string} [params.userId] - ID of the authenticated user
 * @param {string} [params.category] - Category folder (e.g. 'photos', 'profiles')
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function uploadFile({ buffer, mimeType, extension, userId, category = "photos" }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw Object.assign(new Error("Valid file buffer is required for upload"), { statusCode: 400 });
  }

  if (!extension || typeof extension !== "string") {
    throw Object.assign(new Error("File extension is required"), { statusCode: 400 });
  }

  // Sanitize inputs to prevent any possibility of path traversal
  const safeExt = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeUser = (userId || "general").replace(/[^a-zA-Z0-9_-]/g, "");

  // Generate safe, unguessable, unique object key
  // Structure: vendors/{userId}/{category}/{timestamp}_{nanoid}.{ext}
  const uniqueId = `${Date.now()}_${nanoid(12)}`;
  const key = `vendors/${safeUser}/${safeCategory}/${uniqueId}.${safeExt}`;

  const client = getS3Client();
  if (!client) {
    throw Object.assign(
      new Error(
        "Storage service is not configured. Please configure STORAGE_BUCKET, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY in server/.env."
      ),
      { statusCode: 503, code: "STORAGE_NOT_CONFIGURED" }
    );
  }

  const { bucket } = getConfig();

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType || "application/octet-stream",
    });

    await client.send(command);

    const url = getPublicUrl(key);
    return { key, url };
  } catch (err) {
    // Scrub credentials, bucket details, and internal SDK details from error
    console.error("Storage upload error:", err?.message || err);
    throw Object.assign(
      new Error("Failed to upload file to storage service. Please try again later."),
      { statusCode: 502, code: "STORAGE_UPLOAD_FAILED" }
    );
  }
}

/**
 * Deletes an object from object storage.
 *
 * @param {string} key - Object key to delete
 * @returns {Promise<boolean>}
 */
export async function deleteFile(key) {
  if (!key) return false;

  const client = getS3Client();
  if (!client) return false;

  const { bucket } = getConfig();

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.warn("Storage deletion failed for key:", key, err?.message || err);
    return false;
  }
}

export default {
  getConfig,
  isStorageConfigured,
  getS3Client,
  getPublicUrl,
  uploadFile,
  deleteFile,
};
