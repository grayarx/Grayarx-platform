/**
 * GrayArx image pipeline — responsive URLs, srcset, and primary photo resolution.
 * Keeps showroom photography sharp on retina displays without a separate CDN vendor.
 */

export const IMAGE_WIDTHS = [480, 768, 1200, 1600, 1920] as const;

export const LUXURY_HERO_FALLBACK = "/hero-car.jpg";

export const LOCAL_EDITORIAL_IMAGES = [
  LUXURY_HERO_FALLBACK,
  "/corvette-exterior.jpg",
  "/corvette-interior.jpg",
  "/dashboard-preview.png",
] as const;

export const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect fill='%231a1a1a' width='800' height='500'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23c9a24a' font-family='Georgia,serif' font-size='20'%3EPhoto coming soon%3C/text%3E%3C/svg%3E";

export type VehiclePhotoSource = {
  primaryPhotoUrl?: string | null;
  imageUrl?: string | null;
};

export function vehiclePrimaryUrl(v: VehiclePhotoSource): string | null {
  const url = (v.primaryPhotoUrl || v.imageUrl || "").trim();
  return url || null;
}

export function isStockPhotoUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("unsplash.com") ||
    u.includes("pexels.com") ||
    u.includes("placeholder") ||
    u.includes("picsum.photos")
  );
}

export function isLocalAsset(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/** Build an optimized fetch URL for known hosts (Unsplash, Cloudinary-style params). */
export function optimizeImageUrl(
  url: string,
  width: number,
  quality = 85,
): string {
  if (!url || isLocalAsset(url) || url.startsWith("data:")) return url;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("unsplash.com")) {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("fm", "webp");
      return parsed.toString();
    }

    if (
      parsed.hostname.includes("cloudinary.com") ||
      parsed.searchParams.has("w") ||
      parsed.searchParams.has("width")
    ) {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
      return parsed.toString();
    }

    if (!parsed.searchParams.has("w")) {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildSrcSet(
  url: string,
  widths: readonly number[] = IMAGE_WIDTHS,
  quality = 85,
): string {
  if (!url || isLocalAsset(url) || url.startsWith("data:")) return "";
  return widths
    .map((w) => `${optimizeImageUrl(url, w, quality)} ${w}w`)
    .join(", ");
}

export function defaultSizes(fullBleed = false): string {
  return fullBleed
    ? "100vw"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
}

export function parseMultiPhotoField(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[|;]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

export function mergeVehicleGallery(
  primary: string | null | undefined,
  gallery: Array<{ url: string }>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (url: string | null | undefined) => {
    const u = url?.trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  add(primary ?? null);
  for (const p of gallery) add(p.url);
  return out;
}
