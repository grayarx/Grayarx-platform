import { ENV } from "./_core/env";
import * as fs from "fs/promises";
import * as path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure directory exists
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Client = s3Bucket ? new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
}) : null;

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  
  if (s3Client && s3Bucket) {
    const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    await s3Client.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Optional: Set to public-read if your bucket policy allows it, or rely on public bucket config
    }));
    
    // If public bucket URL is provided, return that, otherwise fallback to serving via presigned/proxy
    const publicUrlBase = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");
    const url = publicUrlBase ? `${publicUrlBase}/${key}` : `/manus-storage/${key}`;
    return { key, url };

  } else if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    // Legacy Forge storage fallback only (not used for LLM/chat). Prefer S3_* env when set.
    // 1. Get presigned PUT URL from Forge
    const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
    presignUrl.searchParams.set("path", key);

    const presignResp = await fetch(presignUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!presignResp.ok) {
      const msg = await presignResp.text().catch(() => presignResp.statusText);
      throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
    }

    const { url: s3Url } = (await presignResp.json()) as { url: string };
    if (!s3Url) throw new Error("Forge returned empty presign URL");

    const blob =
      typeof data === "string"
        ? new Blob([data], { type: contentType })
        : new Blob([data as any], { type: contentType });

    const uploadResp = await fetch(s3Url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    if (!uploadResp.ok) {
      throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
    }

    return { key, url: `/manus-storage/${key}` };
  } else {
    // Local fallback — Railway's filesystem is ephemeral, so store as a base64 data URL
    // in the database instead of writing to disk. Works natively as <img src>.
    const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    // DB photo URL columns are MEDIUMTEXT (up to 16 MB). Client enforces ≤12 MB per
    // file before base64-encoding, so the encoded data URL stays within column limits.
    const base64 = buffer.toString("base64");
    const mime = contentType.startsWith("image/") ? contentType : "image/jpeg";
    return { key, url: `data:${mime};base64,${base64}` };
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  if (s3Client && s3Bucket) {
    const publicUrlBase = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");
    return { key, url: publicUrlBase ? `${publicUrlBase}/${key}` : `/manus-storage/${key}` };
  }
  
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    return { key, url: `/manus-storage/${key}` };
  }
  return { key, url: `/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  
  if (s3Client && s3Bucket) {
    // If public bucket URL is provided, just return the direct URL
    const publicUrlBase = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");
    if (publicUrlBase) return `${publicUrlBase}/${key}`;
    
    // Otherwise, generate a presigned URL valid for 1 hour
    return await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: s3Bucket,
      Key: key,
    }), { expiresIn: 3600 });
  }
  
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
    getUrl.searchParams.set("path", key);

    const resp = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText);
      throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
    }

    const { url } = (await resp.json()) as { url: string };
    return url;
  }
  
  return `/uploads/${key}`;
}
