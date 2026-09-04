/**
 * Pull real emails (and contact-ish URLs) out of dealer-site HTML.
 * SA yards often hide inboxes behind Cloudflare, [at] obfuscation, or JSON-LD.
 */

const BLOCKED_EMAIL_SUBSTRINGS = [
  "example.com",
  "email.com",
  "domain.com",
  "sentry.io",
  "wixpress.com",
  "wordpress.com",
  "schema.org",
  "w3.org",
  "googleapis.com",
  "gstatic.com",
  "cloudflare.com",
  "jquery.com",
  "jsdelivr",
  "placeholder",
  "yourdomain",
  "email@",
  "name@",
  "user@",
  ".png",
  ".jpg",
  ".gif",
  ".svg",
  ".webp",
];

const PLAIN_EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const CONTACTISH_HREF =
  /contact|about|team|people|staff|leadership|directors|management|meet-us|who-we/i;

export type JsonLdPersonHit = {
  fullName: string;
  role: string | null;
  email: string | null;
};

export function isBlockedExtractedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return BLOCKED_EMAIL_SUBSTRINGS.some((b) => lower.includes(b));
}

/** Cloudflare email obfuscation: XOR each byte after the first with the first byte. */
export function decodeCloudflareEmail(encoded: string): string | null {
  const hex = encoded.replace(/^#/, "").trim();
  if (hex.length < 6 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  try {
    const key = parseInt(hex.slice(0, 2), 16);
    let out = "";
    for (let n = 2; n < hex.length; n += 2) {
      out += String.fromCharCode(parseInt(hex.slice(n, n + 2), 16) ^ key);
    }
    const email = out.trim().toLowerCase();
    if (!email.includes("@") || isBlockedExtractedEmail(email)) return null;
    return email;
  } catch {
    return null;
  }
}

export function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&commat;/gi, "@")
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&");
}

function collectValid(found: Set<string>, raw: string): void {
  const email = raw.trim().toLowerCase().replace(/^mailto:/, "");
  if (!email.includes("@")) return;
  if (isBlockedExtractedEmail(email)) return;
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(email)) return;
  found.add(email);
}

/** name [at] domain [dot] co.za — common on SA dealer contact pages. */
export function extractObfuscatedEmails(text: string): string[] {
  const found = new Set<string>();
  const re =
    /\b([a-z0-9._%+\-]{2,40})\s*(?:\[\s*at\s*\]|\(\s*at\s*\)|\s+at\s+)\s*([a-z0-9\-]+(?:\s*(?:\[\s*dot\s*\]|\(\s*dot\s*\)|\s+dot\s+|\.)\s*[a-z0-9\-]+)+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const local = m[1]!;
    const domain = m[2]!
      .replace(/\s*[\[(]\s*(?:dot|DOT)\s*[\])]\s*/g, ".")
      .replace(/\s+dot\s+/gi, ".")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9.\-]/gi, "");
    const host = domain.match(/^[a-z0-9.\-]+\.[a-z]{2,}$/i)?.[0];
    if (!host) continue;
    collectValid(found, `${local}@${host}`);
  }
  return [...found];
}

function extractCloudflareEmails(html: string): string[] {
  const found = new Set<string>();
  const attrRe = /data-cfemail=["']([0-9a-f]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(html)) !== null) {
    const decoded = decodeCloudflareEmail(m[1]!);
    if (decoded) collectValid(found, decoded);
  }
  const pathRe = /cdn-cgi\/l\/email-protection(?:#|%23)([0-9a-f]+)/gi;
  while ((m = pathRe.exec(html)) !== null) {
    const decoded = decodeCloudflareEmail(m[1]!);
    if (decoded) collectValid(found, decoded);
  }
  return [...found];
}

function flattenJsonLd(node: unknown, out: unknown[]): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) flattenJsonLd(item, out);
    return;
  }
  if (typeof node !== "object") return;
  out.push(node);
  const rec = node as Record<string, unknown>;
  if (rec["@graph"]) flattenJsonLd(rec["@graph"], out);
  for (const v of Object.values(rec)) {
    if (v && typeof v === "object") flattenJsonLd(v, out);
  }
}

function jsonLdEmail(value: unknown): string | null {
  if (typeof value === "string") {
    const v = value.replace(/^mailto:/i, "").trim().toLowerCase();
    return v.includes("@") ? v : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const e = jsonLdEmail(item);
      if (e) return e;
    }
  }
  return null;
}

export function extractJsonLdPeople(html: string): JsonLdPersonHit[] {
  const people: JsonLdPersonHit[] = [];
  const seen = new Set<string>();
  const scriptRe =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html)) !== null) {
    const raw = m[1]!.trim();
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      const nodes: unknown[] = [];
      flattenJsonLd(parsed, nodes);
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const rec = node as Record<string, unknown>;
        const typeRaw = rec["@type"];
        const types = (Array.isArray(typeRaw) ? typeRaw : [typeRaw]).map((t) =>
          String(t ?? "").toLowerCase(),
        );
        if (!types.some((t) => t.includes("person"))) continue;
        const fullName = String(rec.name ?? "").replace(/\s+/g, " ").trim();
        if (fullName.length < 3) continue;
        const key = fullName.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        people.push({
          fullName,
          role: rec.jobTitle ? String(rec.jobTitle).trim() : null,
          email: jsonLdEmail(rec.email),
        });
      }
    } catch {
      /* malformed JSON-LD */
    }
  }
  return people.slice(0, 12);
}

export function extractJsonLdEmails(html: string): string[] {
  const found = new Set<string>();
  for (const p of extractJsonLdPeople(html)) {
    if (p.email) collectValid(found, p.email);
  }
  const emailPropRe = /"email"\s*:\s*"([^"]+)"/gi;
  let m: RegExpExecArray | null;
  const decoded = decodeHtmlEntities(html);
  while ((m = emailPropRe.exec(decoded)) !== null) {
    collectValid(found, m[1]!.replace(/^mailto:/i, ""));
  }
  return [...found];
}

/** Same-host contact / about / team links the homepage actually uses (not a static path list). */
export function extractContactishUrls(html: string, baseUrl: string): string[] {
  let origin: URL;
  try {
    origin = new URL(baseUrl);
  } catch {
    return [];
  }
  const urls = new Set<string>();
  const hrefRe = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1]!.trim();
    const text = m[2]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    let resolved: URL;
    try {
      resolved = new URL(href, origin);
    } catch {
      continue;
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;
    const hostA = resolved.hostname.replace(/^www\./i, "").toLowerCase();
    const hostB = origin.hostname.replace(/^www\./i, "").toLowerCase();
    if (hostA !== hostB) continue;
    const path = resolved.pathname;
    if (path === "/" || path === "") continue;
    if (CONTACTISH_HREF.test(path) || CONTACTISH_HREF.test(text)) {
      urls.add(`${resolved.origin}${path}`.replace(/\/+$/, "") || resolved.origin);
    }
  }
  return [...urls].slice(0, 12);
}

/**
 * mailto, plain text, HTML entities, Cloudflare, [at]/[dot], JSON-LD, data-email.
 */
export function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>();
  const decoded = decodeHtmlEntities(html);

  const mailtoRe = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(decoded)) !== null) {
    collectValid(found, m[1]!);
  }

  const dataRe = /data-(?:email|mail|contact-email)=["']([^"']+)["']/gi;
  while ((m = dataRe.exec(decoded)) !== null) {
    collectValid(found, m[1]!);
  }

  for (const e of decoded.match(PLAIN_EMAIL_RE) ?? []) {
    collectValid(found, e);
  }
  for (const e of extractCloudflareEmails(html)) collectValid(found, e);
  for (const e of extractObfuscatedEmails(decoded)) collectValid(found, e);
  for (const e of extractJsonLdEmails(html)) collectValid(found, e);

  return [...found];
}

/** Names + roles from JSON-LD, for principal guess when the team page has no mailto. */
export function jsonLdPeopleAsText(html: string): string {
  return extractJsonLdPeople(html)
    .map((p) => `${p.fullName}${p.role ? `, ${p.role}` : ""}`)
    .join(". ");
}
