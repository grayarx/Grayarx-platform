/**
 * Sipho — automatic dealer-principal email enrichment.
 *
 * Fetches dealership websites / contact pages, extracts real emails from HTML,
 * scores them with assessProspectEmail, and (optionally) asks the LLM to pick
 * the best named/principal contact **only from emails found on the page**.
 * Never invents info@ from a slug.
 */

import { invokeLLM } from "./llm";
import {
  assessProspectEmail,
  emailDomain,
  emailMatchesWebsiteDomain,
  isOutreachReadyForDealership,
  type ProspectEmailAssessment,
} from "../../shared/prospectEmailQuality";
import {
  isSaLandline,
  mergeDiscoveredPhone,
  pickPreferredSaPhone,
} from "../../shared/prospectPhone";
import dns from "node:dns/promises";

async function domainHasMx(email: string): Promise<boolean> {
  const domain = emailDomain(email);
  if (!domain) return false;
  try {
    const mx = await dns.resolveMx(domain);
    return Array.isArray(mx) && mx.length > 0;
  } catch {
    return false;
  }
}

const FETCH_TIMEOUT_MS = 4_000;
const FETCH_TIMEOUT_FAST_MS = 3_000;
const MAX_HTML_CHARS = 80_000;
const MAX_TEXT_FOR_LLM = 12_000;

export const CONTACT_PATHS = [
  "",
  "/contact",
  "/contact-us",
  "/contactus",
  "/contact-me",
  "/get-in-touch",
  "/about",
  "/about-us",
  "/about-the-team",
  "/who-we-are",
  "/our-company",
  "/company",
  "/team",
  "/our-team",
  "/meet-the-team",
  "/meet-us",
  "/the-team",
  "/staff",
  "/our-staff",
  "/management",
  "/leadership",
  "/directors",
  "/our-people",
  "/people",
];

/** Fewer pages for interactive / budgeted runs — still covers common SA dealer contact URLs */
export const CONTACT_PATHS_FAST = [
  "",
  "/contact",
  "/contact-us",
  "/about",
  "/about-us",
  "/team",
  "/our-team",
  "/meet-the-team",
];
export const CONTACT_PATHS_DEEP = CONTACT_PATHS;

const CONTACTISH_PATH = /contact|about|team|people|staff|leadership|directors/i;

/** Domains / locals that are never outreach contacts. */
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

export type EnrichmentCandidate = {
  dealershipName: string;
  website?: string | null;
  city?: string | null;
  region?: string | null;
  phone?: string | null;
  brandsCarried?: string | null;
  estimatedMonthlyVolume?: number | null;
  /** Existing DB id when updating */
  prospectId?: number;
  /** Known principal names from pool / pilot research */
  knownPeople?: Array<{ fullName: string; role?: string | null }>;
};

export type EnrichmentHit = {
  email: string;
  contactName: string | null;
  contactRole: string | null;
  quality: ProspectEmailAssessment["quality"];
  source: "website_mailto" | "website_text" | "llm_from_page";
  evidenceUrl: string;
  score: number;
  /** Switchboard / public number scraped from the same pages (never invented). */
  phone?: string | null;
};

export type EnrichmentAttemptResult = {
  dealershipName: string;
  prospectId?: number;
  status: "enriched" | "no_named_email" | "no_website" | "fetch_failed" | "skipped";
  hit?: EnrichmentHit;
  /** Best SA number found on fetched pages; existing candidate phone kept if scrape is empty. */
  phone?: string | null;
  pagesTried: number;
  notes: string;
  /** true when the full CONTACT_PATHS crawl ran */
  deep?: boolean;
};

function normalizeWebsite(url: string | null | undefined): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");
  if (/^[\w.-]+\.[a-z]{2,}/i.test(raw)) return `https://${raw.replace(/\/+$/, "")}`;
  return null;
}

function isBlockedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return BLOCKED_EMAIL_SUBSTRINGS.some((b) => lower.includes(b));
}

/** Pure: pull emails from HTML (mailto + plain text). */
export function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>();
  const mailtoRe = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(html)) !== null) {
    found.add(m[1]!.toLowerCase());
  }
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const plain = html.match(emailRe) ?? [];
  for (const e of plain) {
    found.add(e.toLowerCase());
  }
  return [...found].filter((e) => {
    if (isBlockedEmail(e)) return false;
    const a = assessProspectEmail(e);
    return a.quality !== "invalid";
  });
}

function htmlToRoughText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_FOR_LLM);
}

async function fetchPage(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<{ ok: boolean; html: string; finalUrl: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent":
          "GrayArxBot/1.0 (+https://www.grayarx.com; prospect research; contact hello@grayarx.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return { ok: false, html: "", finalUrl: url };
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("text/html") && !ctype.includes("application/xhtml")) {
      const buf = await res.text();
      if (buf.length < 200 || !buf.includes("<")) {
        return { ok: false, html: "", finalUrl: res.url || url };
      }
      return {
        ok: true,
        html: buf.slice(0, MAX_HTML_CHARS),
        finalUrl: res.url || url,
      };
    }
    const html = (await res.text()).slice(0, MAX_HTML_CHARS);
    return { ok: true, html, finalUrl: res.url || url };
  } catch {
    return { ok: false, html: "", finalUrl: url };
  }
}

function rankEmails(emails: string[]): ProspectEmailAssessment[] {
  return emails
    .map((e) => assessProspectEmail(e))
    .filter((a) => a.email)
    .sort((a, b) => b.score - a.score);
}

async function pickBestWithLlm(input: {
  dealershipName: string;
  city?: string | null;
  pageText: string;
  emails: string[];
  pageUrl: string;
}): Promise<{ email: string; contactName: string | null; contactRole: string | null } | null> {
  const ready = input.emails.filter((e) => assessProspectEmail(e).outreachReady);
  const candidates = ready.length > 0 ? ready : input.emails;
  if (candidates.length === 0) return null;

  // If only one outreach-ready named email, skip LLM.
  if (ready.length === 1) {
    return { email: ready[0]!, contactName: null, contactRole: null };
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You enrich GrayArx dealership prospects. Pick the BEST dealer principal / managing director / owner / named sales manager email from the CANDIDATE list only. Never invent an email. Prefer named people over info@/sales@. If none are suitable decision-maker contacts, return email as empty string. Return JSON only.`,
        },
        {
          role: "user",
          content: `Dealership: ${input.dealershipName}
City: ${input.city ?? "unknown"}
Page: ${input.pageUrl}
Candidates (ONLY choose from these): ${JSON.stringify(candidates)}
Page text excerpt:
${input.pageText.slice(0, 8000)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "principal_pick",
          strict: true,
          schema: {
            type: "object",
            properties: {
              email: { type: "string" },
              contactName: { type: "string" },
              contactRole: { type: "string" },
              reason: { type: "string" },
            },
            required: ["email", "contactName", "contactRole", "reason"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw)) as {
      email?: string;
      contactName?: string;
      contactRole?: string;
    };
    const email = (parsed.email ?? "").trim().toLowerCase();
    if (!email || !candidates.map((c) => c.toLowerCase()).includes(email)) return null;
    if (!assessProspectEmail(email).outreachReady) return null;
    return {
      email,
      contactName: parsed.contactName?.trim() || null,
      contactRole: parsed.contactRole?.trim() || null,
    };
  } catch (err) {
    console.warn("[PrincipalEnrich] LLM pick failed", err);
    return null;
  }
}

/**
 * Research one dealership website for a named/principal email and a public phone.
 * `{ deep: true }` / `{ fast: false }` uses the full CONTACT_PATHS crawl.
 * `{ fast: true }` caps at 5 pages (Generate tail).
 */
export async function enrichDealershipPrincipal(
  candidate: EnrichmentCandidate,
  opts?: { fast?: boolean; deep?: boolean },
): Promise<EnrichmentAttemptResult> {
  const deep = opts?.deep === true;
  const fast = deep ? false : opts?.fast === true;
  const paths = fast ? CONTACT_PATHS_FAST : CONTACT_PATHS;
  const timeoutMs = fast ? FETCH_TIMEOUT_FAST_MS : FETCH_TIMEOUT_MS;

  const base = normalizeWebsite(candidate.website);
  if (!base) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "no_website",
      pagesTried: 0,
      notes: "No website URL to fetch",
      phone: mergeDiscoveredPhone(candidate.phone, null),
      deep,
    };
  }

  const allEmails = new Set<string>();
  let bestPageUrl = base;
  let bestPageText = "";
  let pagesTried = 0;
  let anyOk = false;
  let discoveredPhone: string | null = null;
  let foundNamedOnPage = false;

  for (const path of paths) {
    if (foundNamedOnPage && discoveredPhone && !CONTACTISH_PATH.test(path)) {
      break;
    }
    const url = `${base}${path}`;
    pagesTried += 1;
    const page = await fetchPage(url, timeoutMs);
    if (!page.ok || !page.html) continue;
    anyOk = true;
    const pagePhone = pickPreferredSaPhone(page.html, {
      pageUrl: `${page.finalUrl} ${path}`,
    });
    if (pagePhone) {
      const preferSwitchboard =
        CONTACTISH_PATH.test(path) || CONTACTISH_PATH.test(page.finalUrl);
      if (!discoveredPhone) {
        discoveredPhone = pagePhone;
      } else if (preferSwitchboard && isSaLandline(pagePhone) && !isSaLandline(discoveredPhone)) {
        discoveredPhone = pagePhone;
      } else {
        discoveredPhone = mergeDiscoveredPhone(discoveredPhone, pagePhone);
      }
    }
    const emails = extractEmailsFromHtml(page.html);
    for (const e of emails) allEmails.add(e);
    const ranked = rankEmails(emails.filter((e) => emailMatchesWebsiteDomain(e, base)));
    if (ranked.some((r) => r.email && isOutreachReadyForDealership(r.email, base))) {
      bestPageUrl = page.finalUrl;
      bestPageText = htmlToRoughText(page.html);
      foundNamedOnPage = true;
      if (discoveredPhone) continue;
    } else if (!bestPageText) {
      bestPageUrl = page.finalUrl;
      bestPageText = htmlToRoughText(page.html);
    }
  }

  discoveredPhone = mergeDiscoveredPhone(
    discoveredPhone,
    pickPreferredSaPhone(bestPageText),
  );
  const phone = mergeDiscoveredPhone(candidate.phone, discoveredPhone);
  const phoneNote = phone ? ` Switchboard: ${phone}.` : "";

  if (!anyOk) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "fetch_failed",
      pagesTried,
      notes: `Could not fetch ${base}`,
      phone,
      deep,
    };
  }

  const emailList = [...allEmails].filter((e) =>
    emailMatchesWebsiteDomain(e, base),
  );
  const ranked = rankEmails(emailList);
  const outreach = ranked.filter(
    (r) => r.email && isOutreachReadyForDealership(r.email, base),
  );

  if (outreach.length === 0) {
    // Broad public search (site + open web + LinkedIn/Facebook + SA directories + press),
    // then map names → named@dealer-domain without inventing filler.
    const pageTexts = [bestPageText].filter(Boolean);
    try {
      const {
        discoverPrincipalPeople,
        verifyGuessedPrincipalEmail,
      } = await import("./principalNameEmailGuess");
      const people = await discoverPrincipalPeople({
        dealershipName: candidate.dealershipName,
        website: base,
        city: candidate.city,
        pageTexts,
        fast,
        knownPeople: candidate.knownPeople,
      });
      const guessed = await verifyGuessedPrincipalEmail({
        people,
        website: base,
        dealershipName: candidate.dealershipName,
        fast,
      });
      if (guessed) {
        const assessment = assessProspectEmail(guessed.email);
        return {
          dealershipName: candidate.dealershipName,
          prospectId: candidate.prospectId,
          status: "enriched",
          hit: {
            email: guessed.email,
            contactName: guessed.person.fullName,
            contactRole: guessed.person.role,
            quality: assessment.quality,
            source: "website_text",
            evidenceUrl: bestPageUrl,
            score: assessment.score,
            phone,
          },
          phone,
          pagesTried,
          deep,
          notes: `Verified ${guessed.email} for ${guessed.person.fullName} (${guessed.person.role ?? "principal"}) via ${guessed.method} + name discovery on dealer domain.${phoneNote}`,
        };
      }
      const onPage = [...allEmails];
      return {
        dealershipName: candidate.dealershipName,
        prospectId: candidate.prospectId,
        status: "no_named_email",
        pagesTried,
        phone,
        deep,
        notes: `No public named email on dealer domain ${websiteHostSafe(base)} yet (sites often only list info@). People found: ${people.map((p) => p.fullName).join(", ") || "none"}. On page: ${onPage.slice(0, 5).join(", ") || "none"}. Sipho keeps searching dealer sites, directories, Facebook/LinkedIn snippets, and press — not LinkedIn-only.${phoneNote}`,
      };
    } catch (err) {
      console.warn("[PrincipalEnrich] name/email guess failed", err);
      const onPage = [...allEmails];
      return {
        dealershipName: candidate.dealershipName,
        prospectId: candidate.prospectId,
        status: "no_named_email",
        pagesTried,
        phone,
        deep,
        notes: `No named email on dealer domain ${websiteHostSafe(base)}. On page: ${onPage.slice(0, 5).join(", ") || "none"}.${phoneNote}`,
      };
    }
  }

  // Fast path: take best outreach-ready email without LLM
  let llmPick: {
    email: string;
    contactName: string | null;
    contactRole: string | null;
  } | null = null;
  if (!fast || outreach.length > 1) {
    llmPick = await pickBestWithLlm({
      dealershipName: candidate.dealershipName,
      city: candidate.city,
      pageText: bestPageText,
      emails: emailList,
      pageUrl: bestPageUrl,
    });
  }

  const chosenEmail = llmPick?.email ?? outreach[0]!.email!;
  if (!isOutreachReadyForDealership(chosenEmail, base)) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "no_named_email",
      pagesTried,
      phone,
      deep,
      notes: `Pick was not outreach-ready on dealer domain.${phoneNote}`,
    };
  }

  const hasMx = await domainHasMx(chosenEmail);
  if (!hasMx) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "no_named_email",
      pagesTried,
      phone,
      deep,
      notes: `Domain for ${chosenEmail} has no MX — would bounce.${phoneNote}`,
    };
  }

  const assessment = assessProspectEmail(chosenEmail);
  if (!assessment.outreachReady || !assessment.email) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "no_named_email",
      pagesTried,
      phone,
      deep,
      notes: `LLM/heuristic pick was not outreach-ready.${phoneNote}`,
    };
  }

  const hit: EnrichmentHit = {
    email: assessment.email,
    contactName: llmPick?.contactName ?? null,
    contactRole:
      llmPick?.contactRole ??
      (assessment.quality === "principal" ? "Dealer Principal" : null),
    quality: assessment.quality,
    source: llmPick
      ? "llm_from_page"
      : outreach[0]!.email === assessment.email
        ? "website_mailto"
        : "website_text",
    evidenceUrl: bestPageUrl,
    score: assessment.score,
    phone,
  };

  return {
    dealershipName: candidate.dealershipName,
    prospectId: candidate.prospectId,
    status: "enriched",
    hit,
    phone,
    pagesTried,
    deep,
    notes: `Found ${hit.email} (${hit.quality}) on ${hit.evidenceUrl} (domain+MX ok).${phoneNote}`,
  };
}

function websiteHostSafe(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
