/**
 * GrayArx image pipeline — responsive URLs, srcset, and primary photo resolution.
 * Keeps showroom photography sharp on retina displays without a separate CDN vendor.
 */

export const IMAGE_WIDTHS = [320, 480, 768, 1200] as const;

export const LUXURY_HERO_FALLBACK = "/corvette-exterior.jpg";

/** GrayArx futuristic hypercar showcase */
export const HERO_SHOWCASE_CORVETTE = "/corvette-exterior.jpg";
export const HERO_SHOWCASE_CORVETTE_FALLBACK = HERO_SHOWCASE_CORVETTE;

/**
 * Rotating car image pool — verified Unsplash IDs confirmed to be car photos.
 * IDs sourced from DEV_SAMPLE_VEHICLES in Showroom.tsx (ground truth) plus
 * additional verified car shots. Never add portrait/person photos here.
 */
export const CAR_IMAGE_POOL = [
  // ── Confirmed from Showroom.tsx DEV_SAMPLE_VEHICLES ──────────────────
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=85&auto=format&fit=crop", // BMW 3 Series M Sport
  "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=85&auto=format&fit=crop", // Mercedes-Benz C200
  "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=85&auto=format&fit=crop", // Toyota Hilux / VW Golf
  "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=1200&q=85&auto=format&fit=crop", // Land Rover Discovery
  "https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=1200&q=85&auto=format&fit=crop", // BMW X5
  "https://images.unsplash.com/photo-1611651338412-8403fa6e3599?w=1200&q=85&auto=format&fit=crop", // Audi A4
  // ── Additional verified car shots ────────────────────────────────────
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85&auto=format&fit=crop", // Porsche 911 silver
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=85&auto=format&fit=crop", // sports car rear
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=85&auto=format&fit=crop", // supercar rear
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=85&auto=format&fit=crop", // luxury coupe
  "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&q=85&auto=format&fit=crop", // BMW 8 Series
  "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&q=85&auto=format&fit=crop", // sports car side
] as const;

/** First 4 from the pool — backward-compatible alias */
export const LOCAL_EDITORIAL_IMAGES: readonly string[] = CAR_IMAGE_POOL.slice(0, 4);

export const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect fill='%231a1a1a' width='800' height='500'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23c9a24a' font-family='Georgia,serif' font-size='20'%3EPhoto coming soon%3C/text%3E%3C/svg%3E";

export type VehiclePhotoSource = {
  primaryPhotoUrl?: string | null;
  imageUrl?: string | null;
};

export function vehiclePrimaryUrl(v: VehiclePhotoSource): string | null {
  const url = (v.primaryPhotoUrl || v.imageUrl || "").trim();
  if (!url) return null;
  if (isWatermarkedRenderUrl(url) || isStockPhotoUrl(url)) return null;
  return url;
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

/** Configurator / stock renders that carry vendor watermarks — not for public hero use */
export function isWatermarkedRenderUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("imagin.studio") ||
    u.includes("imaginauto") ||
    u.includes("magr") ||
    u.includes("watermark") ||
    u.includes("getty") ||
    u.includes("shutterstock") ||
    u.includes("depositphotos")
  );
}

export function isHeroSafePhotoUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (isLocalAsset(url)) return true;
  return !isStockPhotoUrl(url) && !isWatermarkedRenderUrl(url);
}

export function isLocalAsset(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/** Build an optimized fetch URL for known hosts (Unsplash, Cloudinary, Wikimedia). */
export function optimizeImageUrl(
  url: string,
  width: number,
  quality = 85,
): string {
  if (!url || isLocalAsset(url) || url.startsWith("data:")) return url;

  try {
    const parsed = new URL(url);
    const w = Math.max(160, Math.round(width));

    // Wikimedia Commons — rewrite to a real thumbnail width (query params are ignored).
    if (
      parsed.hostname.includes("wikimedia.org") ||
      parsed.hostname.includes("wikipedia.org")
    ) {
      return rewriteWikimediaThumb(parsed, w);
    }

    if (parsed.hostname.includes("unsplash.com")) {
      parsed.searchParams.set("w", String(w));
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
      parsed.searchParams.set("w", String(w));
      parsed.searchParams.set("q", String(quality));
      return parsed.toString();
    }

    // Unknown hosts: leave URL alone — fake ?w= params just break caching.
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * MediaWiki Commons only serves a fixed set of thumbnail widths.
 * Arbitrary sizes (e.g. 320 / 480 / 768 / 1200) return HTTP 400 and break cards.
 * @see https://www.mediawiki.org/wiki/Manual:$wgThumbLimits
 */
export const WIKIMEDIA_THUMB_WIDTHS = [
  20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920,
] as const;

/** Snap to the smallest allowed Commons thumb width ≥ requested (or max). */
export function snapWikimediaThumbWidth(width: number): number {
  const w = Math.max(1, Math.round(width));
  for (const allowed of WIKIMEDIA_THUMB_WIDTHS) {
    if (allowed >= w) return allowed;
  }
  return WIKIMEDIA_THUMB_WIDTHS[WIKIMEDIA_THUMB_WIDTHS.length - 1];
}

/**
 * Convert Commons original / oversized thumbs to a sized thumb URL.
 * Examples:
 *  /wikipedia/commons/a/ab/File.jpg → /wikipedia/commons/thumb/a/ab/File.jpg/960px-File.jpg
 *  /wikipedia/commons/thumb/a/ab/File.jpg/1280px-File.jpg → .../960px-File.jpg (when requesting ~768)
 */
export function rewriteWikimediaThumb(parsed: URL, width: number): string {
  const w = snapWikimediaThumbWidth(width);
  const path = parsed.pathname;
  const thumbMatch = path.match(
    /^(\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+\/)(\d+)px-(.+)$/i,
  );
  if (thumbMatch) {
    const existing = Number(thumbMatch[2]);
    // Already the exact allowed size we want — leave path alone.
    if (existing === w) {
      parsed.search = "";
      return parsed.toString();
    }
    parsed.pathname = `${thumbMatch[1]}${w}px-${thumbMatch[3]}`;
    parsed.search = "";
    return parsed.toString();
  }
  const originalMatch = path.match(
    /^(\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/i,
  );
  if (originalMatch) {
    const [, root, a, ab, file] = originalMatch;
    parsed.pathname = `${root}/thumb/${a}/${ab}/${file}/${w}px-${file}`;
    parsed.search = "";
    return parsed.toString();
  }
  return parsed.toString();
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
