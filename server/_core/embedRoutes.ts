/**
 * Drop-in embed for dealer websites.
 * GET /embed/:shortcode — minimal booking iframe page + install snippet.
 * GET /embed/:shortcode?format=json — machine-readable snippet for copy/paste.
 * GET /embed/:shortcode.js — tiny script that injects the iframe.
 */
import type { Express, Request, Response } from "express";
import { getDealershipByShortcode } from "../db";
import { resolveAgentDisplayName } from "../../shared/agentIdentity";

function originFromReq(req: Request): string {
  const proto = (req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim();
  const host = (req.get("x-forwarded-host") || req.get("host") || "www.grayarx.com").split(",")[0].trim();
  return `${proto}://${host}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeShortcode(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\.js$/i, "")
    .replace(/[^a-z0-9]/g, "");
}

export function registerEmbedRoutes(app: Express): void {
  app.get("/embed/:shortcode.js", async (req: Request, res: Response) => {
    const raw = normalizeShortcode(String(req.params.shortcode || ""));
    if (!raw) {
      res.status(400).type("text/javascript").send("/* invalid shortcode */");
      return;
    }
    const dealership = await getDealershipByShortcode(raw);
    if (!dealership) {
      res.status(404).type("text/javascript").send("/* unknown shortcode */");
      return;
    }
    const origin = originFromReq(req);
    const shortcode = dealership.publicShortcode || raw;
    const js = `(function(){var d=document,s=d.currentScript,c=d.createElement('iframe');c.src=${JSON.stringify(`${origin}/embed/${shortcode}`)};c.title=${JSON.stringify(dealership.name)};c.width='100%';c.height='640';c.style.cssText='border:0;border-radius:12px;max-width:420px;display:block';c.loading='lazy';(s&&s.parentNode?s.parentNode:d.body).insertBefore(c,s||null);})();`;
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).send(js);
  });

  app.get("/embed/:shortcode", async (req: Request, res: Response) => {
    const raw = normalizeShortcode(String(req.params.shortcode || ""));
    if (!raw || raw.length < 2) {
      return res.status(400).json({ ok: false, error: "Invalid shortcode" });
    }

    const dealership = await getDealershipByShortcode(raw);
    if (!dealership) {
      return res.status(404).json({
        ok: false,
        error: "Unknown shortcode — set publicShortcode on the dealership",
      });
    }

    const origin = originFromReq(req);
    const shortcode = dealership.publicShortcode || raw;
    const agentName = resolveAgentDisplayName(dealership.agentDisplayName);
    const bookUrl = `${origin}/book/${encodeURIComponent(shortcode)}`;
    const applyUrl = `${origin}/apply/${encodeURIComponent(shortcode)}`;
    const embedUrl = `${origin}/embed/${encodeURIComponent(shortcode)}`;
    const iframeSnippet = `<iframe src="${embedUrl}" title="${escapeHtml(dealership.name)} booking" width="100%" height="640" style="border:0;border-radius:12px;max-width:420px;" loading="lazy" allow="clipboard-write"></iframe>`;
    const scriptSnippet = `<script async src="${origin}/embed/${encodeURIComponent(shortcode)}.js"></script>`;

    if (String(req.query.format || "").toLowerCase() === "json") {
      return res.status(200).json({
        ok: true,
        shortcode,
        dealershipName: dealership.name,
        agentDisplayName: agentName,
        urls: { book: bookUrl, apply: applyUrl, embed: embedUrl },
        snippets: {
          iframe: iframeSnippet,
          script: scriptSnippet,
          wordpressShortcode: `[grayarx_book code="${shortcode}"]`,
        },
        note: "Paste the iframe on any dealer page. WordPress shortcode needs a one-line plugin that echoes the iframe.",
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(agentName)} · ${escapeHtml(dealership.name)}</title>
  <style>
    :root { color-scheme: dark; --gold:#C9A24A; --bg:#0c0c10; --fg:#f4f4f5; --muted:#a1a1aa; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, sans-serif; background:linear-gradient(160deg,#0c0c10,#16161e 55%,#1a1510); color:var(--fg); min-height:100vh; }
    .wrap { max-width:420px; margin:0 auto; padding:20px 16px 28px; }
    h1 { font-size:1.25rem; margin:0 0 4px; letter-spacing:-0.02em; }
    p { color:var(--muted); font-size:0.9rem; line-height:1.45; margin:0 0 16px; }
    iframe { width:100%; height:560px; border:0; border-radius:12px; background:#111; box-shadow:0 8px 32px rgba(0,0,0,.35); }
    .snip { margin-top:18px; padding:12px; border:1px solid rgba(201,162,74,.25); border-radius:10px; background:rgba(0,0,0,.35); }
    .snip label { display:block; font-size:0.7rem; text-transform:uppercase; letter-spacing:.08em; color:var(--gold); margin-bottom:6px; }
    code { display:block; white-space:pre-wrap; word-break:break-all; font-size:0.72rem; color:#e4e4e7; }
    a.cta { display:inline-block; margin:8px 8px 0 0; padding:10px 14px; border-radius:8px; background:var(--gold); color:#111; font-weight:600; text-decoration:none; font-size:0.85rem; }
    a.ghost { background:transparent; color:var(--gold); border:1px solid rgba(201,162,74,.45); }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(agentName)} at ${escapeHtml(dealership.name)}</h1>
    <p>Book a test drive or apply for finance — powered by GrayArx.</p>
    <iframe src="${escapeHtml(bookUrl)}?embed=1" title="Book with ${escapeHtml(dealership.name)}" loading="lazy"></iframe>
    <div style="margin-top:12px">
      <a class="cta" href="${escapeHtml(bookUrl)}" target="_blank" rel="noopener">Open booking</a>
      <a class="cta ghost" href="${escapeHtml(applyUrl)}" target="_blank" rel="noopener">Finance apply</a>
    </div>
    <div class="snip">
      <label>Install on your website</label>
      <code>${escapeHtml(iframeSnippet)}</code>
      <p style="margin-top:10px;font-size:0.75rem">JSON docs: <a href="?format=json" style="color:var(--gold)">?format=json</a></p>
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Security-Policy", "frame-ancestors *;");
    return res.status(200).send(html);
  });
}
