/**
 * Find dealer-principal *names* anywhere public, then find a real
 * firstname@dealer-domain inbox without inventing filler.
 *
 * Sipho searches broadly — not LinkedIn-only:
 *   dealer site team/about pages, DuckDuckGo open web, LinkedIn/Facebook
 *   public snippets, SA directories (Brabys, Cylex, Hotfrog), news/press,
 *   then follows top result pages for names + published emails.
 *
 * Email order (no paid Hunter required):
 *   1) Optional Hunter.io if HUNTER_API_KEY actually works
 *   2) Public web / directory pages publishing named@dealer-domain
 *   3) SMTP RCPT of pattern guesses when outbound :25 is open
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

/** Queries spanning open web, LinkedIn, Facebook, SA directories, and press — not LinkedIn-only. */
export function buildPrincipalNameSearchQueries(
  dealershipName: string,
  city?: string | null,
): string[] {
  const name = `"${dealershipName}"`;
  const loc = city ? `"${city}"` : `"South Africa"`;
  const roles =
    '("Dealer Principal" OR "Managing Director" OR "General Manager" OR Owner OR Director OR Proprietor)';
  return [
    `${name} ${loc} ${roles}`,
    `${name} ${roles} (email OR contact OR "@")`,
    `site:linkedin.com ${name} ${roles}`,
    `site:facebook.com ${name} (owner OR "dealer principal" OR director OR manager)`,
    `site:brabys.com ${name}`,
    `site:cylex.co.za ${name}`,
    `site:hotfrog.co.za ${name}`,
    `site:yellosa.co.za ${name}`,
    `${name} ("appointed" OR "promoted" OR "takes over" OR "dealer principal") ${loc}`,
    `${name} (staff OR team OR management OR directors) ${loc}`,
  ];
}

/** Pull absolute result URLs out of DuckDuckGo HTML (uddg= + plain hrefs). */
export function extractSearchResultUrls(html: string): string[] {
  const urls = new Set<string>();
  const uddgRe = /uddg=([^&"']+)/gi;
  let m: RegExpExecArray | null;
  while ((m = uddgRe.exec(html)) !== null) {
    try {
      const u = decodeURIComponent(m[1]!).replace(/&amp;/g, "&");
      if (/^https?:\/\//i.test(u) && !/duckduckgo\.com/i.test(u)) {
        urls.add(u.split("#")[0]!);
      }
    } catch {
      /* ignore bad encoding */
    }
  }
  const hrefRe = /href="(https?:\/\/[^"]+)"/gi;
  while ((m = hrefRe.exec(html)) !== null) {
    const u = m[1]!.replace(/&amp;/g, "&");
    if (/duckduckgo\.com|google\.[^/]+\/search|bing\.com\/search/i.test(u)) continue;
    urls.add(u.split("#")[0]!);
  }
  return [...urls].slice(0, 16);
}

function peopleFromSearchText(
  text: string,
  dealershipName: string,
): DiscoveredPerson[] {
  const people = extractPrincipalNamesFromText(text).map((p) => ({
    ...p,
    source: "web_search" as const,
  }));
  const escaped = dealershipName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 40);
  const atRe = new RegExp(
    `([A-Z][a-zA-Z'’\\-]+(?:\\s+[A-Z][a-zA-Z'’\\-]+){1,2})\\s*[-–—|]\\s*(Dealer\\s*Principal|Managing\\s*Director|Owner|Director|General\\s*Manager)[^.]{0,50}${escaped}`,
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
  return people;
}

async function fetchPageText(url: string, timeoutMs = 5_000): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent":
          "GrayArxBot/1.0 (+https://www.grayarx.com; prospect research)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return stripHtml(html).slice(0, 40_000);
  } catch {
    return "";
  }
}

/**
 * Multi-source web search for principal names (open web + LinkedIn + Facebook +
 * directories + press). Follows top result pages — not LinkedIn-only.
 * `fast: true` = Generate/scout path: few snippet queries, no page follows.
 */
export async function searchWebForPrincipalNames(
  dealershipName: string,
  city?: string | null,
  opts?: { fast?: boolean },
): Promise<DiscoveredPerson[]> {
  const fast = opts?.fast === true;
  const queries = buildPrincipalNameSearchQueries(dealershipName, city).slice(
    0,
    fast ? 2 : 8,
  );
  const merged: DiscoveredPerson[] = [];
  const seen = new Set<string>();
  const addPeople = (people: DiscoveredPerson[]) => {
    for (const p of people) {
      const key = p.fullName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(p);
    }
  };

  for (const q of queries) {
    if (merged.length >= 8) break;
    try {
      const html = await fetchDuckDuckGoHtml(q, fast ? 5_000 : 8_000);
      if (!html) continue;
      addPeople(peopleFromSearchText(stripHtml(html), dealershipName));
      if (fast) continue; // snippets only — page follows are for full enrich ticks
      const followUrls = extractSearchResultUrls(html).slice(0, 4);
      await Promise.all(
        followUrls.map(async (url) => {
          const text = await fetchPageText(url, 5_000);
          if (text) addPeople(peopleFromSearchText(text, dealershipName));
        }),
      );
    } catch (err) {
      console.warn("[PrincipalNames] web search failed", q, err);
    }
  }
  return merged.slice(0, 8);
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

async function fetchDuckDuckGoHtml(
  query: string,
  timeoutMs = 8_000,
): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "User-Agent":
        "GrayArxBot/1.0 (+https://www.grayarx.com; prospect research)",
      Accept: "text/html",
    },
  });
  if (!res.ok) return "";
  return await res.text();
}

export function buildPublishedEmailSearchQueries(input: {
  host: string;
  dealershipName: string;
  people?: DiscoveredPerson[];
}): string[] {
  const name = `"${input.dealershipName}"`;
  const queries: string[] = [
    `"@${input.host}" (email OR contact OR "dealer principal" OR director OR manager)`,
    `${name} "@${input.host}"`,
    `${name} (email OR mailto OR contact) -info@${input.host}`,
    `site:brabys.com ${name}`,
    `site:cylex.co.za ${name}`,
    `site:hotfrog.co.za ${name}`,
    `site:yellosa.co.za ${name}`,
    `site:facebook.com ${name} (@${input.host} OR email OR contact)`,
    `site:linkedin.com ${name} (@${input.host} OR email)`,
    `"${input.host}" ("dealer principal" OR "managing director") email`,
  ];
  for (const person of (input.people ?? []).slice(0, 4)) {
    const nameQ = person.lastName
      ? `"${person.firstName} ${person.lastName}" ("@${input.host}" OR "${input.host}")`
      : `"${person.firstName}" "@${input.host}" ${name}`;
    queries.push(nameQ);
  }
  return queries;
}

/**
 * Search public web/directories (and follow result pages) for named emails
 * already published on the dealership domain — not LinkedIn-only.
 */
export async function searchWebForPublishedEmails(input: {
  website: string;
  dealershipName: string;
  people?: DiscoveredPerson[];
  fast?: boolean;
}): Promise<string[]> {
  const host = websiteHost(input.website);
  if (!host) return [];
  const fast = input.fast === true;
  const queries = buildPublishedEmailSearchQueries({
    host,
    dealershipName: input.dealershipName,
    people: input.people,
  }).slice(0, fast ? 2 : 10);

  const found = new Set<string>();
  const ingest = (text: string) => {
    for (const email of extractEmailsFromText(text)) {
      if (
        isOutreachReadyForDealership(email, input.website) &&
        emailMatchesWebsiteDomain(email, input.website)
      ) {
        found.add(email);
      }
    }
  };

  for (const q of queries) {
    if (found.size >= 6) break;
    try {
      const html = await fetchDuckDuckGoHtml(q, fast ? 5_000 : 8_000);
      if (!html) continue;
      ingest(stripHtml(html));
      if (fast) continue; // snippets only on Generate path
      const followUrls = extractSearchResultUrls(html).slice(0, 4);
      await Promise.all(
        followUrls.map(async (url) => {
          const text = await fetchPageText(url, 5_000);
          if (text) ingest(text);
        }),
      );
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
  fast?: boolean;
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

  // 2) Public web / directories / social / press already publishing named@dealer-domain
  const published = await searchWebForPublishedEmails({
    website: input.website,
    dealershipName,
    people,
    fast: input.fast,
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

  // 3) SMTP RCPT of pattern guesses (often blocked on Railway — skip on fast Generate path)
  if (input.fast || !people.length) return null;
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

/** Turn a known first/full name from research notes into a DiscoveredPerson. */
export function personFromKnownName(
  fullName: string,
  role?: string | null,
): DiscoveredPerson | null {
  const cleaned = fullName.replace(/\s+/g, " ").trim();
  if (!cleaned || /TBD|unknown|dealer principal|sales manager|^owner$/i.test(cleaned)) {
    return null;
  }
  // Allow single first names (Donoven, Jan, Ammaar) — email guess still works.
  if (cleaned.split(" ").length === 1) {
    if (cleaned.length < 2) return null;
    return {
      fullName: cleaned,
      firstName: cleaned,
      lastName: null,
      role: role?.trim() || "Dealer Principal",
      source: "website",
    };
  }
  if (!looksLikePersonFullName(cleaned) && cleaned.split(" ").length > 1) {
    // Still accept "First Last" even if casing is off
    const { firstName, lastName } = splitName(cleaned);
    if (!firstName) return null;
    return {
      fullName: cleaned,
      firstName,
      lastName,
      role: role?.trim() || "Dealer Principal",
      source: "website",
    };
  }
  const { firstName, lastName } = splitName(cleaned);
  return {
    fullName: cleaned,
    firstName,
    lastName,
    role: role?.trim() || "Dealer Principal",
    source: "website",
  };
}

export async function discoverPrincipalPeople(input: {
  dealershipName: string;
  website: string;
  city?: string | null;
  pageTexts?: string[];
  fast?: boolean;
  /** Founder / pool / pilot known names — tried before cold scrape. */
  knownPeople?: Array<{ fullName: string; role?: string | null }>;
}): Promise<DiscoveredPerson[]> {
  const seeded: DiscoveredPerson[] = [];
  for (const k of input.knownPeople ?? []) {
    const person = personFromKnownName(k.fullName, k.role);
    if (person) seeded.push(person);
  }
  const fromPages: DiscoveredPerson[] = [];
  for (const text of input.pageTexts ?? []) {
    fromPages.push(...extractPrincipalNamesFromText(text));
  }
  const fromSearch = await searchWebForPrincipalNames(
    input.dealershipName,
    input.city,
    { fast: input.fast },
  );
  const seen = new Set<string>();
  const merged: DiscoveredPerson[] = [];
  // Seeded names first — highest chance of ammaar@ / donoven@ hits.
  for (const p of [...seeded, ...fromPages, ...fromSearch]) {
    const key = p.fullName.toLowerCase();
    if (seen.has(key)) continue;
    // Prefer people whose snippet/role looks principal-ish
    if (p.role && !ROLE_HINTS.test(p.role) && p.source === "web_search") continue;
    seen.add(key);
    merged.push(p);
  }
  return merged.slice(0, 8);
}
