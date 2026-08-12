/**
 * Find dealer-principal *names* (like you would on LinkedIn), then find a
 * real firstname@dealer-domain inbox without inventing filler.
 *
 * Why websites alone fail: most SA dealer sites only publish info@/sales@.
 * LinkedIn shows people/titles but rarely emails — so we discover names,
 * then (in order):
 *   1) Optional Hunter.io if HUNTER_API_KEY works (many free accounts get gated)
 *   2) Public web / directory snippets that already publish named@dealer-domain
 *   3) SMTP RCPT verify of pattern guesses when outbound :25 is open
 *
 * Do not pay for Hunter Starter just for Sipho — web publish + SMTP cover the free path.
 */

import dns from "node:dns/promises";
import net from "node:net";
import {
  assessProspectEmail,
  emailMatchesWebsiteDomain,
  isOutreachReadyForDealership,
  websiteHost,
} from "../../shared/prospectEmailQuality";

export type DiscoveredPerson = {
  fullName: string;
  firstName: string;
  lastName: string | null;
  role: string | null;
  source: "website" | "web_search";
};

export type EmailFindMethod = "hunter" | "web_publish" | "smtp";

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const ROLE_HINTS =
  /dealer\s*principal|managing\s*director|\bMD\b|\bCEO\b|owner|proprietor|general\s*manager|\bGM\b|sales\s*manager|director/i;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function splitName(full: string): { firstName: string; lastName: string | null } {
  const parts = full
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((p) => p.length > 1 && !/^(mr|mrs|ms|dr|prof)\.?$/i.test(p));
  if (parts.length === 0) return { firstName: full, lastName: null };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: null };
  return { firstName: parts[0]!, lastName: parts[parts.length - 1]! };
}

function looksLikePersonFullName(s: string): boolean {
  if (!/^[A-Z][a-zA-Z'’\-]+(?:\s+[A-Z][a-zA-Z'’\-]+){1,3}$/.test(s)) return false;
  const lower = s.toLowerCase();
  if (/(dealer|motors|auto|cars|sales|contact|about|team|home|menu)/i.test(lower)) {
    return false;
  }
  return true;
}

/** Pull "Name — Dealer Principal" style mentions from page text. */
export function extractPrincipalNamesFromText(text: string): DiscoveredPerson[] {
  const found: DiscoveredPerson[] = [];
  const seen = new Set<string>();

  // Pattern: Name (optional comma) Role
  const re =
    /([A-Z][a-zA-Z'’\-]+(?:\s+[A-Z][a-zA-Z'’\-]+){1,3})\s*[,:\-|–—]?\s*(Dealer\s*Principal|Managing\s*Director|General\s*Manager|Sales\s*Manager|Owner|Proprietor|Director|CEO|MD|GM)/gi;

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const fullName = m[1]!.replace(/\s+/g, " ").trim();
    const role = m[2]!.replace(/\s+/g, " ").trim();
    if (!looksLikePersonFullName(fullName)) continue;
    const key = fullName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const { firstName, lastName } = splitName(fullName);
    found.push({
      fullName,
      firstName,
      lastName,
      role,
      source: "website",
    });
  }

  // Reverse: Role: Name
  const re2 =
    /(Dealer\s*Principal|Managing\s*Director|General\s*Manager|Sales\s*Manager|Owner|Proprietor)\s*[:\-–—]\s*([A-Z][a-zA-Z'’\-]+(?:\s+[A-Z][a-zA-Z'’\-]+){1,3})/gi;
  while ((m = re2.exec(text)) !== null) {
    const role = m[1]!.replace(/\s+/g, " ").trim();
    const fullName = m[2]!.replace(/\s+/g, " ").trim();
    if (!looksLikePersonFullName(fullName)) continue;
    const key = fullName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const { firstName, lastName } = splitName(fullName);
    found.push({ fullName, firstName, lastName, role, source: "website" });
  }

  return found.slice(0, 8);
}

/** DuckDuckGo HTML search for LinkedIn-style principal mentions. */
export async function searchWebForPrincipalNames(
  dealershipName: string,
  city?: string | null,
): Promise<DiscoveredPerson[]> {
  const q = [
    `"${dealershipName}"`,
    city ? `"${city}"` : "",
    `"Dealer Principal" OR "Managing Director" OR "Owner"`,
    "South Africa",
  ]
    .filter(Boolean)
    .join(" ");

  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: {
        "User-Agent":
          "GrayArxBot/1.0 (+https://www.grayarx.com; prospect research)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const text = stripHtml(html);
    // Prefer snippets that mention the dealership
    const people = extractPrincipalNamesFromText(text).map((p) => ({
      ...p,
      source: "web_search" as const,
    }));
    // Also catch "Name - Dealer Principal at Dealership" in DDG titles
    const atRe = new RegExp(
      `([A-Z][a-zA-Z'’\\-]+(?:\\s+[A-Z][a-zA-Z'’\\-]+){1,2})\\s*[-–—|]\\s*(Dealer\\s*Principal|Managing\\s*Director|Owner)[^.]{0,40}${dealershipName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 40)}`,
      "gi",
    );
    let m: RegExpExecArray | null;
    const seen = new Set(people.map((p) => p.fullName.toLowerCase()));
    while ((m = atRe.exec(text)) !== null) {
      const fullName = m[1]!.replace(/\s+/g, " ").trim();
      if (!looksLikePersonFullName(fullName) || seen.has(fullName.toLowerCase())) continue;
      seen.add(fullName.toLowerCase());
      const { firstName, lastName } = splitName(fullName);
      people.push({
        fullName,
        firstName,
        lastName,
        role: m[2]!,
        source: "web_search",
      });
    }
    return people.slice(0, 6);
  } catch (err) {
    console.warn("[PrincipalNames] web search failed", err);
    return [];
  }
}

export function guessEmailsForPerson(
  person: DiscoveredPerson,
  website: string,
): string[] {
  const host = websiteHost(website);
  if (!host) return [];
  const first = person.firstName.toLowerCase().replace(/[^a-z]/g, "");
  const last = (person.lastName ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (first.length < 2) return [];
  const guesses = new Set<string>();
  guesses.add(`${first}@${host}`);
  if (last.length >= 2) {
    guesses.add(`${first}.${last}@${host}`);
    guesses.add(`${first}${last}@${host}`);
    guesses.add(`${first[0]}${last}@${host}`);
    guesses.add(`${first}_${last}@${host}`);
  }
  return [...guesses].filter(
    (e) =>
      assessProspectEmail(e).outreachReady &&
      emailMatchesWebsiteDomain(e, website),
  );
}

async function smtpRcptCheck(email: string): Promise<"ok" | "bad" | "unknown"> {
  const domain = email.split("@")[1];
  if (!domain) return "bad";
  let mxHost: string;
  try {
    const mx = await dns.resolveMx(domain);
    if (!mx.length) return "bad";
    mx.sort((a, b) => a.priority - b.priority);
    mxHost = mx[0]!.exchange;
  } catch {
    return "bad";
  }

  return await new Promise((resolve) => {
    const socket = net.createConnection({ host: mxHost, port: 25 });
    let buf = "";
    let step: "banner" | "helo" | "mail" | "rcpt" | "done" = "banner";
    const timer = setTimeout(() => {
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve("unknown");
    }, 8_000);

    const send = (line: string) => {
      socket.write(`${line}\r\n`);
    };

    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      buf += chunk;
      if (!buf.includes("\n")) return;
      const lines = buf.split(/\r?\n/);
      const last = lines.filter(Boolean).pop() ?? "";
      buf = "";
      const code = parseInt(last.slice(0, 3), 10);
      if (step === "banner") {
        if (code !== 220) {
          clearTimeout(timer);
          socket.destroy();
          resolve("unknown");
          return;
        }
        step = "helo";
        send("HELO grayarx.com");
      } else if (step === "helo") {
        if (code !== 250) {
          clearTimeout(timer);
          socket.destroy();
          resolve("unknown");
          return;
        }
        step = "mail";
        send("MAIL FROM:<noreply@grayarx.com>");
      } else if (step === "mail") {
        if (code !== 250) {
          clearTimeout(timer);
          socket.destroy();
          resolve("unknown");
          return;
        }
        step = "rcpt";
        send(`RCPT TO:<${email}>`);
      } else if (step === "rcpt") {
        step = "done";
        clearTimeout(timer);
        try {
          send("QUIT");
        } catch {
          /* ignore */
        }
        socket.destroy();
        if (code === 250 || code === 251) resolve("ok");
        else if (code >= 550 && code <= 553) resolve("bad");
        else resolve("unknown");
      }
    });
    socket.on("error", () => {
      clearTimeout(timer);
      resolve("unknown");
    });
  });
}

/** True if domain accepts any random local-part (pattern guesses are unsafe). */
export async function domainLooksLikeCatchAll(website: string): Promise<boolean> {
  const host = websiteHost(website);
  if (!host) return true;
  const probe = `zznope${Date.now().toString(36)}@${host}`;
  const result = await smtpRcptCheck(probe);
  return result === "ok";
}

/** Pull emails from plain text / search snippets. */
export function extractEmailsFromText(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.match(EMAIL_RE) ?? []) {
    found.add(m.toLowerCase());
  }
  return [...found];
}

/**
 * Optional Hunter.io email finder (HTTPS — works when outbound SMTP:25 is blocked).
 * Free Hunter accounts are often gated (“upgrade-required”); treat as optional.
 * Set HUNTER_API_KEY on Railway only if the key actually works.
 */
async function hunterFindEmail(input: {
  domain: string;
  firstName: string;
  lastName: string | null;
}): Promise<string | null> {
  const key = process.env.HUNTER_API_KEY?.trim();
  if (!key) return null;
  try {
    const params = new URLSearchParams({
      domain: input.domain,
      first_name: input.firstName,
      api_key: key,
    });
    if (input.lastName) params.set("last_name", input.lastName);
    const res = await fetch(`https://api.hunter.io/v2/email-finder?${params}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { email?: string; score?: number; verification?: { status?: string } };
    };
    const email = data.data?.email?.toLowerCase();
    const score = data.data?.score ?? 0;
    const status = data.data?.verification?.status;
    if (!email) return null;
    // Hunter score 70+ or verification valid/accept_all handled by caller domain checks
    if (score < 50 && status !== "valid") return null;
    return email;
  } catch (err) {
    console.warn("[PrincipalNames] Hunter lookup failed", err);
    return null;
  }
}

async function fetchDuckDuckGoHtml(query: string): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
    headers: {
      "User-Agent":
        "GrayArxBot/1.0 (+https://www.grayarx.com; prospect research)",
      Accept: "text/html",
    },
  });
  if (!res.ok) return "";
  return await res.text();
}

/**
 * Search public web/directory snippets for named emails already published
 * on the dealership domain (no paid Hunter needed).
 */
export async function searchWebForPublishedEmails(input: {
  website: string;
  dealershipName: string;
  people?: DiscoveredPerson[];
}): Promise<string[]> {
  const host = websiteHost(input.website);
  if (!host) return [];

  const queries: string[] = [
    `"@${host}" (email OR contact OR "dealer principal" OR director)`,
    `"${input.dealershipName}" "@${host}"`,
    `site:brabys.com "${input.dealershipName}"`,
    `site:cylex.co.za "${input.dealershipName}"`,
  ];
  for (const person of (input.people ?? []).slice(0, 3)) {
    const nameQ = person.lastName
      ? `"${person.firstName} ${person.lastName}" "@${host}"`
      : `"${person.firstName}" "@${host}" "${input.dealershipName}"`;
    queries.push(nameQ);
  }

  const found = new Set<string>();
  for (const q of queries) {
    try {
      const html = await fetchDuckDuckGoHtml(q);
      if (!html) continue;
      const text = stripHtml(html);
      for (const email of extractEmailsFromText(text)) {
        if (
          isOutreachReadyForDealership(email, input.website) &&
          emailMatchesWebsiteDomain(email, input.website)
        ) {
          found.add(email);
        }
      }
    } catch (err) {
      console.warn("[PrincipalNames] published-email search failed", q, err);
    }
  }
  return [...found];
}

/** Prefer emails whose local-part matches a discovered person's name. */
export function pickBestPublishedEmail(
  emails: string[],
  people: DiscoveredPerson[],
  website: string,
): { email: string; person: DiscoveredPerson } | null {
  const ready = emails.filter(
    (e) =>
      isOutreachReadyForDealership(e, website) &&
      emailMatchesWebsiteDomain(e, website),
  );
  if (!ready.length) return null;

  for (const person of people) {
    const first = person.firstName.toLowerCase().replace(/[^a-z]/g, "");
    const last = (person.lastName ?? "").toLowerCase().replace(/[^a-z]/g, "");
    if (first.length < 2) continue;
    const match = ready.find((email) => {
      const local = email.split("@")[0] ?? "";
      if (local === first) return true;
      if (last && (local === `${first}.${last}` || local === `${first}${last}` || local === `${first[0]}${last}` || local === `${first}_${last}`)) {
        return true;
      }
      return local.startsWith(first) && (!last || local.includes(last));
    });
    if (match) return { email: match, person };
  }

  // No name match — still use best published named inbox with a synthetic person
  const email = ready[0]!;
  const local = (email.split("@")[0] ?? "principal").replace(/[._]+/g, " ");
  const parts = local.split(/\s+/).filter(Boolean);
  const fullName = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
  const { firstName, lastName } = splitName(fullName || "Principal");
  return {
    email,
    person: {
      fullName: fullName || "Dealer Principal",
      firstName,
      lastName,
      role: "Dealer Principal",
      source: "web_search",
    },
  };
}

/**
 * Given people + dealer website, return a verified named email.
 * Order: optional Hunter → public web publish → SMTP RCPT (if :25 open).
 */
export async function verifyGuessedPrincipalEmail(input: {
  people: DiscoveredPerson[];
  website: string;
  dealershipName?: string;
}): Promise<{
  email: string;
  person: DiscoveredPerson;
  verified: boolean;
  method: EmailFindMethod;
} | null> {
  const host = websiteHost(input.website);
  if (!host) return null;
  const people = input.people;
  const dealershipName = input.dealershipName?.trim() || host;

  // 1) Hunter.io (HTTPS) — optional; free accounts often blocked
  if (process.env.HUNTER_API_KEY?.trim() && people.length) {
    for (const person of people) {
      const found = await hunterFindEmail({
        domain: host,
        firstName: person.firstName,
        lastName: person.lastName,
      });
      if (
        found &&
        isOutreachReadyForDealership(found, input.website) &&
        emailMatchesWebsiteDomain(found, input.website)
      ) {
        return { email: found, person, verified: true, method: "hunter" };
      }
    }
  }

  // 2) Public web / directories already publishing named@dealer-domain
  const published = await searchWebForPublishedEmails({
    website: input.website,
    dealershipName,
    people,
  });
  const fromWeb = pickBestPublishedEmail(published, people, input.website);
  if (fromWeb) {
    return {
      email: fromWeb.email,
      person: fromWeb.person,
      verified: true,
      method: "web_publish",
    };
  }

  // 3) SMTP RCPT of pattern guesses (often blocked on Railway)
  if (!people.length) return null;
  const catchAll = await domainLooksLikeCatchAll(input.website);
  if (catchAll) return null;

  for (const person of people) {
    const guesses = guessEmailsForPerson(person, input.website);
    for (const email of guesses) {
      if (!isOutreachReadyForDealership(email, input.website)) continue;
      const check = await smtpRcptCheck(email);
      if (check === "ok") {
        return { email, person, verified: true, method: "smtp" };
      }
    }
  }
  return null;
}

export async function discoverPrincipalPeople(input: {
  dealershipName: string;
  website: string;
  city?: string | null;
  pageTexts?: string[];
}): Promise<DiscoveredPerson[]> {
  const fromPages: DiscoveredPerson[] = [];
  for (const text of input.pageTexts ?? []) {
    fromPages.push(...extractPrincipalNamesFromText(text));
  }
  const fromSearch = await searchWebForPrincipalNames(
    input.dealershipName,
    input.city,
  );
  const seen = new Set<string>();
  const merged: DiscoveredPerson[] = [];
  for (const p of [...fromPages, ...fromSearch]) {
    const key = p.fullName.toLowerCase();
    if (seen.has(key)) continue;
    // Prefer people whose snippet/role looks principal-ish
    if (p.role && !ROLE_HINTS.test(p.role) && p.source === "web_search") continue;
    seen.add(key);
    merged.push(p);
  }
  return merged.slice(0, 8);
}
