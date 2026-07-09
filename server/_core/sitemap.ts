/**
 * Public SEO routes for the GrayArx showroom.
 *
 * /robots.txt        — minimal allow-all + sitemap pointer
 * /sitemap.xml       — static marketing routes + every public showroom vehicle
 *
 * Both routes are intentionally cheap: they hit the DB at most once per call,
 * cap at 5 000 vehicles (Google's per-sitemap limit is 50 000 but we don't
 * need to flirt with it), and respond as `text/plain` / `application/xml`.
 *
 * Origin discovery: derives the canonical site URL from the inbound request
 * (X-Forwarded-Host / Host), so the same code works for the dev sandbox,
 * staging, and grayarx.com without env coupling.
 */
import type { Express, Request } from "express";
import { listVehicles } from "../db";

const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/showroom", changefreq: "daily", priority: "0.9" },
  { path: "/trade-in", changefreq: "weekly", priority: "0.85" },
  { path: "/finance", changefreq: "weekly", priority: "0.8" },
  { path: "/compare", changefreq: "weekly", priority: "0.75" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
];

function originFromRequest(req: Request): string {
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : (protoHeader as string | undefined) ?? (req.secure ? "https" : "http");
  const hostHeader =
    (req.headers["x-forwarded-host"] as string | undefined) ??
    (req.headers.host as string | undefined) ??
    "grayarx.com";
  return `${proto}://${hostHeader}`.replace(/\/+$/, "");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build the sitemap XML body. Pure function — accepts the data it needs so
 * it stays unit-testable.
 */
export function buildSitemapXml(
  origin: string,
  vehicles: Array<{ id: number; updatedAt: Date | string | null }>,
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
  for (const v of vehicles.slice(0, 5000)) {
    const updated = v.updatedAt
      ? new Date(v.updatedAt).toISOString().slice(0, 10)
      : today;
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(`${origin}/showroom/${v.id}`)}</loc>`);
    lines.push(`    <lastmod>${updated}</lastmod>`);
    lines.push("    <changefreq>weekly</changefreq>");
    lines.push("    <priority>0.6</priority>");
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return lines.join("\n");
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
      const all = await listVehicles(5000);
      // Only expose available, public vehicles — sold/reserved/draft are excluded.
      const vehicles = all.filter((v) => v.status === "available");
      const xml = buildSitemapXml(originFromRequest(req), vehicles);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=900"); // 15 minutes
      res.send(xml);
    } catch (err) {
      console.error("[Sitemap] Failed to build sitemap.xml", err);
      // Still return a valid sitemap with just the static routes so search
      // engines don't see a 500 (which damages crawl budget).
      const xml = buildSitemapXml(originFromRequest(req), []);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
    }
  });
}
