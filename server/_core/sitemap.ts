/**
 * Public SEO routes for the GrayArx showroom.
 *
 * /robots.txt        — minimal allow-all + sitemap pointer
 * /sitemap.xml       — static marketing routes + every public showroom vehicle
 *
 * Both routes are intentionally cheap: lean id/updatedAt query only (no photos),
 * cap at 5 000 vehicles, and respond as text/plain / application/xml.
 *
 * Origin: prefers APP_URL, then inbound Host headers, then https://www.grayarx.com
 * so production always emits a stable canonical host even behind proxies.
 */
import type { Express, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { vehicles } from "../../drizzle/schema";
import { getDb } from "../db";

const CANONICAL_ORIGIN = "https://www.grayarx.com";

const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/showroom", changefreq: "daily", priority: "0.9" },
  { path: "/trade-in", changefreq: "weekly", priority: "0.85" },
  { path: "/finance", changefreq: "weekly", priority: "0.8" },
  { path: "/compare", changefreq: "weekly", priority: "0.75" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
];

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value !== "string") return undefined;
  // Proxies may send "https,http" — take the first token.
  return value.split(",")[0]?.trim() || undefined;
}

function originFromRequest(req: Request): string {
  const fromEnv = (process.env.APP_URL || "").replace(/\/+$/, "");
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      /* fall through */
    }
  }

  const proto =
    firstHeaderValue(req.headers["x-forwarded-proto"]) ??
    (req.secure ? "https" : "http");
  const host =
    firstHeaderValue(req.headers["x-forwarded-host"]) ??
    firstHeaderValue(req.headers.host);

  if (host) {
    return `${proto}://${host}`.replace(/\/+$/, "");
  }
  return CANONICAL_ORIGIN;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeLastmod(value: Date | string | null | undefined, fallback: string): string {
  if (value == null || value === "") return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return fallback;
    return d.toISOString().slice(0, 10);
  } catch {
    return fallback;
  }
}

/**
 * Build the sitemap XML body. Pure function — accepts the data it needs so
 * it stays unit-testable.
 */
export function buildSitemapXml(
  origin: string,
  vehicleRows: Array<{ id: number; updatedAt: Date | string | null }>,
  now: Date = new Date(),
): string {
  const today = now.toISOString().slice(0, 10);
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const r of STATIC_ROUTES) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(origin + r.path)}</loc>`);
    lines.push(`    <lastmod>${today}</lastmod>`);
    lines.push(`    <changefreq>${r.changefreq}</changefreq>`);
    lines.push(`    <priority>${r.priority}</priority>`);
    lines.push("  </url>");
  }
  for (const v of vehicleRows.slice(0, 5000)) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(`${origin}/showroom/${v.id}`)}</loc>`);
    lines.push(`    <lastmod>${safeLastmod(v.updatedAt, today)}</lastmod>`);
    lines.push("    <changefreq>weekly</changefreq>");
    lines.push("    <priority>0.6</priority>");
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return lines.join("\n");
}

/** Static-only sitemap that never depends on request/DB — last-resort 200 body. */
function staticFallbackXml(origin: string = CANONICAL_ORIGIN): string {
  return buildSitemapXml(origin, []);
}

/**
 * Lean inventory listing for SEO — id + updatedAt only, no photo joins.
 * Avoids the heavy listVehicles() path that was timing out / OOMing in prod.
 */
async function listAvailableVehiclesForSitemap(
  limit = 5000,
): Promise<Array<{ id: number; updatedAt: Date | string | null }>> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: vehicles.id,
      updatedAt: vehicles.updatedAt,
    })
    .from(vehicles)
    .where(eq(vehicles.status, "available"))
    .orderBy(desc(vehicles.updatedAt))
    .limit(limit);
}

function sendXml(res: Response, xml: string): void {
  if (res.headersSent) return;
  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=900");
  res.send(xml);
}

export function registerSitemapRoutes(app: Express): void {
  app.get("/robots.txt", (req, res) => {
    const origin = originFromRequest(req);
    const body = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /dealer",
      "Disallow: /dashboard",
      `Sitemap: ${origin}/sitemap.xml`,
      "",
    ].join("\n");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(body);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const origin = originFromRequest(req);
      const vehicleRows = await listAvailableVehiclesForSitemap(5000);
      const xml = buildSitemapXml(origin, vehicleRows);
      sendXml(res, xml);
    } catch (err) {
      console.error("[Sitemap] Failed to build sitemap.xml", err);
      // Nested try/catch: never let a secondary failure become a 500 —
      // search engines treat sitemap 500s as crawl-budget damage.
      try {
        const origin = originFromRequest(req);
        sendXml(res, staticFallbackXml(origin));
      } catch (fallbackErr) {
        console.error("[Sitemap] Fallback also failed", fallbackErr);
        try {
          sendXml(res, staticFallbackXml(CANONICAL_ORIGIN));
        } catch (lastErr) {
          console.error("[Sitemap] Hardcoded fallback failed", lastErr);
          if (!res.headersSent) {
            res.status(200).type("application/xml").send(staticFallbackXml());
          }
        }
      }
    }
  });
}
