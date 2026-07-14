/**
 * Server-side Open Graph / Twitter Card HTML for vehicle deep links.
 * Social crawlers (WhatsApp, Facebook, etc.) do not run JS — they must
 * receive vehicle-specific meta in the initial HTML, not the SPA shell.
 */

import { getVehicle } from "../db";

const DEFAULT_OG_IMAGE = "https://www.grayarx.com/hero-car.jpg";
const SITE_ORIGIN = () =>
  (process.env.APP_URL || "https://www.grayarx.com").replace(/\/+$/, "");

/** Known social / messaging crawler User-Agents */
const CRAWLER_UA =
  /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Pinterest|vkShare|SkypeUriPreview|Iframely|Embedly|Quora Link Preview|redditbot|Applebot|Googlebot|bingbot|DuckDuckBot|Slurp|Baiduspider|YandexBot/i;

export function isSocialCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return CRAWLER_UA.test(userAgent);
}

/** Match /showroom/:id (optional trailing slash or query). */
export function parseShowroomVehicleId(path: string): number | null {
  const clean = path.split("?")[0].replace(/\/+$/, "");
  const m = clean.match(/^\/showroom\/(\d+)$/i);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function publicImageUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const u = raw.trim();
  if (u.startsWith("data:") || u.startsWith("blob:")) return null;
  if (u.startsWith("https://") || u.startsWith("http://")) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("/")) return `${SITE_ORIGIN()}${u}`;
  return null;
}

function formatPriceZar(price: string | number | null | undefined): string | null {
  if (price == null || price === "") return null;
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `R${Math.round(n).toLocaleString("en-ZA")}`;
}

function upsertMeta(
  html: string,
  attr: "property" | "name",
  key: string,
  content: string,
): string {
  const re = new RegExp(
    `<meta\\s+${attr}=["']${key}["']\\s+content=["'][^"']*["']\\s*/?>`,
    "i",
  );
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  // Insert before </head>
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertTitle(html: string, title: string): string {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `    <title>${escapeHtml(title)}</title>\n  </head>`);
}

function upsertCanonical(html: string, url: string): string {
  const re = /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(url)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertDescription(html: string, description: string): string {
  const re = /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i;
  const tag = `<meta name="description" content="${escapeHtml(description)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

/**
 * Inject vehicle OG/Twitter meta into an HTML document string.
 * Returns null if the vehicle is missing (caller should serve normal SPA).
 */
export async function injectVehicleOgHtml(
  html: string,
  vehicleId: number,
): Promise<string | null> {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return null;

  const canonical = `${SITE_ORIGIN()}/showroom/${vehicleId}`;
  const title =
    vehicle.title?.trim() ||
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
    "Vehicle · GrayArx";
  const priceLabel = formatPriceZar(vehicle.price);
  const bits = [
    vehicle.description?.trim()?.slice(0, 160),
    priceLabel ? `${priceLabel}` : null,
    vehicle.location ? `Located in ${vehicle.location}` : null,
    "View on GrayArx",
  ].filter(Boolean);
  const description = bits.join(" · ").slice(0, 200) || "Vehicle listing on GrayArx";

  const image =
    publicImageUrl(vehicle.primaryPhotoUrl) ||
    publicImageUrl(vehicle.imageUrl) ||
    DEFAULT_OG_IMAGE;

  let out = html;
  out = upsertTitle(out, `${title} | GrayArx`);
  out = upsertDescription(out, description);
  out = upsertCanonical(out, canonical);
  out = upsertMeta(out, "property", "og:title", title);
  out = upsertMeta(out, "property", "og:description", description);
  out = upsertMeta(out, "property", "og:image", image);
  out = upsertMeta(out, "property", "og:url", canonical);
  out = upsertMeta(out, "property", "og:type", "website");
  out = upsertMeta(out, "property", "og:site_name", "GrayArx");
  if (priceLabel) {
    out = upsertMeta(out, "property", "product:price:amount", String(Number(vehicle.price)));
    out = upsertMeta(out, "property", "product:price:currency", "ZAR");
  }
  out = upsertMeta(out, "name", "twitter:card", "summary_large_image");
  out = upsertMeta(out, "name", "twitter:title", title);
  out = upsertMeta(out, "name", "twitter:description", description);
  out = upsertMeta(out, "name", "twitter:image", image);

  return out;
}

/**
 * If this request is a crawler hitting /showroom/:id, return OG HTML;
 * otherwise return null so the SPA path continues.
 */
export async function maybeServeVehicleOg(
  path: string,
  userAgent: string | undefined,
  baseHtml: string,
): Promise<string | null> {
  if (!isSocialCrawler(userAgent)) return null;
  const vehicleId = parseShowroomVehicleId(path);
  if (!vehicleId) return null;
  try {
    return await injectVehicleOgHtml(baseHtml, vehicleId);
  } catch (err) {
    console.warn(
      "[vehicleOg] inject failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}
