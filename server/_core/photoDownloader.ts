/**
 * Download vehicle photos from AutoTrader / Cars.co.za URLs and store in S3.
 * Called during CSV import to ensure photos don't break when the source listing expires.
 */

import { storagePut } from "../storage";

const AUTOTRADER_DOMAIN = "autotrader.co.za";
const CARS_DOMAIN = "cars.co.za";

export async function downloadAndStorePhoto(
  externalUrl: string | null,
  vehicleTitle: string,
  externalRef: string | null,
): Promise<string | null> {
  if (!externalUrl || !externalUrl.startsWith("http")) {
    return null;
  }

  try {
    // Only download from known SA marketplaces to avoid abuse
    const isAutoTrader = externalUrl.includes(AUTOTRADER_DOMAIN);
    const isCars = externalUrl.includes(CARS_DOMAIN);
    if (!isAutoTrader && !isCars) {
      return null;
    }

    // Fetch the image with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10s timeout
    const response = await fetch(externalUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GrayArx/1.0; +https://grayarx.com)",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok || !response.body) {
      return null;
    }

    // Read the image bytes
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > 10_000_000) {
      // Reject empty or >10MB files
      return null;
    }

    // Determine MIME type from Content-Type header or URL extension
    let mimeType = response.headers.get("content-type") || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      mimeType = "image/jpeg";
    }

    // Generate a unique S3 key: vehicles/{externalRef or title slug}/{timestamp}.{ext}
    const timestamp = Date.now();
    const slug = (externalRef || vehicleTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50);
    const ext = mimeType.split("/")[1] || "jpg";
    const key = `vehicles/${slug}/${timestamp}.${ext}`;

    // Upload to S3
    const { url } = await storagePut(key, new Uint8Array(buffer), mimeType);
    return url;
  } catch (err) {
    // Silently fail on network errors, timeouts, or parsing issues
    // The vehicle will be created without a photo
    console.error(
      `[photoDownloader] Failed to download ${externalUrl}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}
