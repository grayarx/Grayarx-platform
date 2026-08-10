/**
 * Mirror external vehicle photos into GrayArx storage.
 * AutoTrader / Cars.co.za links expire — we copy them on import so listings stay live.
 *
 * Bulk CSV import uses parallel downloads + a soft deadline so Cloudflare/Railway
 * proxies do not return HTML timeouts ("Unexpected token '<'").
 */

import { isExternalPhotoUrl } from "../../shared/photoHosting";
import { storagePut } from "../storage";

const BLOCKED_HOST_SNIPPETS = [
  "localhost",
  "127.0.0.1",
  "169.254.",
  "192.168.",
  "10.",
  "172.16.",
  "0.0.0.0",
];

const TRUSTED_MARKETPLACE_SNIPPETS = [
  "autotrader.co.za",
  "img.autotrader",
  "cars.co.za",
  "cloudfront.net",
  "amazonaws.com",
];

function isBlockedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKED_HOST_SNIPPETS.some((b) => host.includes(b));
  } catch {
    return true;
  }
}

function isTrustedMarketplace(url: string): boolean {
  const lower = url.toLowerCase();
  return TRUSTED_MARKETPLACE_SNIPPETS.some((s) => lower.includes(s));
}

/** True when S3/R2 (or Forge) is configured — durable hosting, not base64-in-DB. */
export function isDurablePhotoStorageConfigured(): boolean {
  if (process.env.S3_BUCKET_NAME?.trim()) return true;
  // Matches server/storage.ts ENV.forgeApiUrl / forgeApiKey
  if (
    process.env.BUILT_IN_FORGE_API_URL?.trim() &&
    process.env.BUILT_IN_FORGE_API_KEY?.trim()
  ) {
    return true;
  }
  return false;
}

/** @deprecated use mirrorExternalPhoto */
export async function downloadAndStorePhoto(
  externalUrl: string | null,
  vehicleTitle: string,
  externalRef: string | null,
): Promise<string | null> {
  return mirrorExternalPhoto(externalUrl, vehicleTitle, externalRef);
}

export async function mirrorExternalPhoto(
  externalUrl: string | null,
  vehicleTitle: string,
  externalRef: string | null,
  opts?: { timeoutMs?: number },
): Promise<string | null> {
  const s3PublicUrl = process.env.S3_PUBLIC_URL ?? undefined;
  if (!externalUrl || !isExternalPhotoUrl(externalUrl, s3PublicUrl)) {
    return null;
  }
  if (isBlockedUrl(externalUrl)) {
    return null;
  }

  const timeoutMs = opts?.timeoutMs ?? 8_000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(externalUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GrayArx/1.0; +https://grayarx.com)",
        Accept: "image/*",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!response.ok || !response.body) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > 12 * 1024 * 1024) {
      return null;
    }

    let mimeType = response.headers.get("content-type") || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      if (externalUrl.toLowerCase().includes(".png")) mimeType = "image/png";
      else if (externalUrl.toLowerCase().includes(".webp")) mimeType = "image/webp";
      else mimeType = "image/jpeg";
    }

    const timestamp = Date.now();
    const slug = (externalRef || vehicleTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50);
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const key = `vehicles/${slug}/${timestamp}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { url } = await storagePut(key, new Uint8Array(buffer), mimeType);
    // Refuse to "succeed" with giant data-URL embeds during bulk import — those
    // blow up DB rows and hang the request. Callers keep the external URL.
    if (url.startsWith("data:")) {
      console.warn(
        "[photoDownloader] Durable storage not configured — keeping external URL instead of base64 data URL",
      );
      return null;
    }
    return url;
  } catch (err) {
    const tag = isTrustedMarketplace(externalUrl ?? "") ? "marketplace" : "external";
    console.error(
      `[photoDownloader] Failed to mirror (${tag}) ${externalUrl}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/**
 * Resolve a list of photo URLs for CSV import: mirror in parallel when possible,
 * otherwise keep the original link. Respects a soft deadline so the HTTP request
 * finishes before proxy timeouts.
 */
export async function resolveImportPhotoUrls(
  urls: string[],
  meta: { title: string; externalRef: string | null },
  opts?: {
    skipMirror?: boolean;
    concurrency?: number;
    perPhotoMs?: number;
    deadlineMs?: number;
    startedAt?: number;
  },
): Promise<{ urls: string[]; mirrored: number; linked: number; skippedMirror: boolean }> {
  const list = urls.filter(Boolean);
  if (list.length === 0) {
    return { urls: [], mirrored: 0, linked: 0, skippedMirror: false };
  }

  if (opts?.skipMirror) {
    return { urls: list, mirrored: 0, linked: list.length, skippedMirror: true };
  }

  // Without durable object storage, mirroring becomes base64-in-DB and times out.
  if (!isDurablePhotoStorageConfigured()) {
    console.warn(
      "[photoDownloader] Save-to-GrayArx skipped — set S3_BUCKET_NAME (+ S3_ENDPOINT/keys/S3_PUBLIC_URL) on Railway",
    );
    return { urls: list, mirrored: 0, linked: list.length, skippedMirror: true };
  }

  const concurrency = Math.max(1, opts?.concurrency ?? 4);
  const perPhotoMs = opts?.perPhotoMs ?? 8_000;
  const deadlineMs = opts?.deadlineMs ?? 50_000;
  const startedAt = opts?.startedAt ?? Date.now();

  const out = new Array<string>(list.length);
  let mirrored = 0;
  let linked = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < list.length) {
      const i = cursor++;
      const raw = list[i];
      if (Date.now() - startedAt > deadlineMs) {
        out[i] = raw;
        linked++;
        continue;
      }
      const stored = await mirrorExternalPhoto(raw, meta.title, meta.externalRef, {
        timeoutMs: perPhotoMs,
      });
      if (stored) {
        out[i] = stored;
        mirrored++;
      } else {
        out[i] = raw;
        linked++;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, () => worker()));
  return { urls: out, mirrored, linked, skippedMirror: false };
}

export function shouldMirrorPhoto(url: string | null | undefined): boolean {
  const s3PublicUrl = process.env.S3_PUBLIC_URL ?? undefined;
  return isExternalPhotoUrl(url ?? null, s3PublicUrl);
}
