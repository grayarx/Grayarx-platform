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
  type ProspectEmailAssessment,
} from "../../shared/prospectEmailQuality";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_CHARS = 80_000;
const MAX_TEXT_FOR_LLM = 12_000;

const CONTACT_PATHS = [
  "",
  "/contact",
  "/contact-us",
  "/contactus",
  "/about",
  "/about-us",
  "/team",
  "/our-team",
  "/meet-the-team",
];

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
};

export type EnrichmentHit = {
  email: string;
  contactName: string | null;
  contactRole: string | null;
  quality: ProspectEmailAssessment["quality"];
  source: "website_mailto" | "website_text" | "llm_from_page";
  evidenceUrl: string;
  score: number;
};

export type EnrichmentAttemptResult = {
  dealershipName: string;
  prospectId?: number;
  status: "enriched" | "no_named_email" | "no_website" | "fetch_failed" | "skipped";
  hit?: EnrichmentHit;
  pagesTried: number;
  notes: string;
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

async function fetchPage(url: string): Promise<{ ok: boolean; html: string; finalUrl: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent":
          "GrayArxBot/1.0 (+https://www.grayarx.com; prospect research; contact hello@grayarx.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return { ok: false, html: "", finalUrl: url };
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("text/html") && !ctype.includes("application/xhtml")) {
      // Some SA dealer sites omit content-type — still try body if small
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
 * Research one dealership website for a named/principal email.
 */
export async function enrichDealershipPrincipal(
  candidate: EnrichmentCandidate,
): Promise<EnrichmentAttemptResult> {
  const base = normalizeWebsite(candidate.website);
  if (!base) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "no_website",
      pagesTried: 0,
      notes: "No website URL to fetch",
    };
  }

  const allEmails = new Set<string>();
  let bestPageUrl = base;
  let bestPageText = "";
  let pagesTried = 0;
  let anyOk = false;

  for (const path of CONTACT_PATHS) {
    const url = `${base}${path}`;
    pagesTried += 1;
    const page = await fetchPage(url);
    if (!page.ok || !page.html) continue;
    anyOk = true;
    const emails = extractEmailsFromHtml(page.html);
    for (const e of emails) allEmails.add(e);
    const ranked = rankEmails(emails);
    if (ranked.some((r) => r.outreachReady)) {
      bestPageUrl = page.finalUrl;
      bestPageText = htmlToRoughText(page.html);
      // Keep scanning a couple more contact paths for better names, but we have signal
      if (path === "/contact" || path === "/contact-us" || path === "/team") break;
    } else if (!bestPageText) {
      bestPageUrl = page.finalUrl;
      bestPageText = htmlToRoughText(page.html);
    }
  }

  if (!anyOk) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "fetch_failed",
      pagesTried,
      notes: `Could not fetch ${base}`,
    };
  }

  const emailList = [...allEmails];
  const ranked = rankEmails(emailList);
  const outreach = ranked.filter((r) => r.outreachReady);

  if (outreach.length === 0) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "no_named_email",
      pagesTried,
      notes: `Found ${emailList.length} email(s) on site but none named/principal: ${emailList.slice(0, 5).join(", ") || "none"}`,
    };
  }

  const llmPick = await pickBestWithLlm({
    dealershipName: candidate.dealershipName,
    city: candidate.city,
    pageText: bestPageText,
    emails: emailList,
    pageUrl: bestPageUrl,
  });

  const chosenEmail = llmPick?.email ?? outreach[0]!.email!;
  const assessment = assessProspectEmail(chosenEmail);
  if (!assessment.outreachReady || !assessment.email) {
    return {
      dealershipName: candidate.dealershipName,
      prospectId: candidate.prospectId,
      status: "no_named_email",
      pagesTried,
      notes: "LLM/heuristic pick was not outreach-ready",
    };
  }

  const hit: EnrichmentHit = {
    email: assessment.email,
    contactName: llmPick?.contactName ?? null,
    contactRole: llmPick?.contactRole ?? (assessment.quality === "principal" ? "Dealer Principal" : null),
    quality: assessment.quality,
    source: llmPick ? "llm_from_page" : outreach[0]!.email === assessment.email ? "website_mailto" : "website_text",
    evidenceUrl: bestPageUrl,
    score: assessment.score,
  };

  return {
    dealershipName: candidate.dealershipName,
    prospectId: candidate.prospectId,
    status: "enriched",
    hit,
    pagesTried,
    notes: `Found ${hit.email} (${hit.quality}) on ${hit.evidenceUrl}`,
  };
}
