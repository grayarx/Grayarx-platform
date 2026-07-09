/**
 * Mirror external vehicle photos into GrayArx storage.
 * AutoTrader / Cars.co.za links expire — we copy them on import so listings stay live.
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
): Promise<string | null> {
  if (!externalUrl || !isExternalPhotoUrl(externalUrl)) {
    return null;
  }
  if (isBlockedUrl(externalUrl)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
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
    const key = `vehicles/${slug}/${timestamp}.${ext}`;

    const { url } = await storagePut(key, new Uint8Array(buffer), mimeType);
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

export function shouldMirrorPhoto(url: string | null | undefined): boolean {
  return isExternalPhotoUrl(url ?? null);
}
