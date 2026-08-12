/**
 * Find dealer-principal *names* (like you would on LinkedIn), then guess
 * firstname@dealer-domain emails and SMTP-verify them.
 *
 * Why websites alone fail: most SA dealer sites only publish info@/sales@.
 * LinkedIn shows people/titles but rarely emails — so we discover names,
 * map them onto the dealership domain, and only keep mailboxes that accept mail.
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

/**
 * Optional Hunter.io email finder (HTTPS — works when outbound SMTP:25 is blocked).
 * Set HUNTER_API_KEY on Railway.
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

/**
 * Given people + dealer website, return a verified named email.
 * Prefers Hunter.io when HUNTER_API_KEY is set (reliable on Railway);
 * falls back to SMTP RCPT checks when outbound :25 is open.
 */
export async function verifyGuessedPrincipalEmail(input: {
  people: DiscoveredPerson[];
  website: string;
}): Promise<{
  email: string;
  person: DiscoveredPerson;
  verified: boolean;
  method: "hunter" | "smtp";
} | null> {
  if (!input.people.length) return null;
  const host = websiteHost(input.website);
  if (!host) return null;

  // 1) Hunter.io (HTTPS) — best on cloud hosts that block SMTP
  if (process.env.HUNTER_API_KEY?.trim()) {
    for (const person of input.people) {
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

  // 2) SMTP RCPT (may be blocked on Railway — then returns null)
  const catchAll = await domainLooksLikeCatchAll(input.website);
  if (catchAll) return null;

  for (const person of input.people) {
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
