/**
 * Prospect email quality — prefer dealer principals / named people over
 * generic info@ / sales@ mailboxes (those bounce hard on Resend).
 *
 * Used by Sipho scout prompts, pilot send gating, and Kagiso enrichment findings.
 */

export type ProspectEmailQuality =
  | "principal"
  | "named"
  | "role"
  | "generic"
  | "invalid"
  | "missing";

export type ProspectEmailAssessment = {
  email: string | null;
  localPart: string | null;
  quality: ProspectEmailQuality;
  /** 0–100; send readiness score */
  score: number;
  reason: string;
  /** True when safe enough for cold outreach by default */
  outreachReady: boolean;
};

/** Shared / catch-all local-parts that bounce often at SA dealerships. */
export const GENERIC_MAILBOX_LOCAL_PARTS = new Set([
  "info",
  "sales",
  "enquiries",
  "enquiry",
  "inquiries",
  "inquiry",
  "admin",
  "contact",
  "hello",
  "support",
  "office",
  "reception",
  "mail",
  "emails",
  "webmaster",
  "noreply",
  "no-reply",
  "dealership",
  "general",
]);

/** Role inboxes that are better than info@ but still not a principal. */
const ROLE_LOCAL_PARTS = new Set([
  "marketing",
  "md",
  "ceo",
  "gm",
  "manager",
  "accounts",
  "finance",
]);

/** Local-parts that usually mean owner / dealer principal / MD. */
const PRINCIPAL_LOCAL_PARTS = new Set([
  "principal",
  "dealerprincipal",
  "dealer-principal",
  "owner",
  "proprietor",
  "director",
  "managingdirector",
  "managing-director",
  "md",
  "ceo",
]);

function parseLocalPart(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;
  return trimmed.slice(0, at);
}

function looksLikePersonName(local: string): boolean {
  // firstname, first.last, first_last, first-last — not a single generic word
  if (GENERIC_MAILBOX_LOCAL_PARTS.has(local)) return false;
  if (ROLE_LOCAL_PARTS.has(local) || PRINCIPAL_LOCAL_PARTS.has(local)) return false;
  if (/^[a-z]{2,20}$/.test(local)) return true;
  if (/^[a-z]{2,20}[._-][a-z]{2,20}$/.test(local)) return true;
  return false;
}

export function assessProspectEmail(email: string | null | undefined): ProspectEmailAssessment {
  const raw = (email ?? "").trim();
  if (!raw) {
    return {
      email: null,
      localPart: null,
      quality: "missing",
      score: 0,
      reason: "No email on file — find the dealer principal on LinkedIn or the site contact page.",
      outreachReady: false,
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return {
      email: raw,
      localPart: null,
      quality: "invalid",
      score: 0,
      reason: "Email format looks invalid.",
      outreachReady: false,
    };
  }

  const local = parseLocalPart(raw)!;
  if (GENERIC_MAILBOX_LOCAL_PARTS.has(local)) {
    return {
      email: raw,
      localPart: local,
      quality: "generic",
      score: 25,
      reason: `${local}@ is a shared mailbox — high bounce / ignore risk. Prefer dealer principal or named contact.`,
      outreachReady: false,
    };
  }
  if (PRINCIPAL_LOCAL_PARTS.has(local) || local.includes("principal") || local.includes("owner")) {
    return {
      email: raw,
      localPart: local,
      quality: "principal",
      score: 95,
      reason: "Looks like a dealer principal / owner / MD inbox.",
      outreachReady: true,
    };
  }
  if (ROLE_LOCAL_PARTS.has(local)) {
    return {
      email: raw,
      localPart: local,
      quality: "role",
      score: 55,
      reason: "Role inbox (better than info@, still not a named principal).",
      outreachReady: false,
    };
  }
  if (looksLikePersonName(local)) {
    return {
      email: raw,
      localPart: local,
      quality: "named",
      score: 85,
      reason: "Named person inbox — good cold-outreach target.",
      outreachReady: true,
    };
  }
  return {
    email: raw,
    localPart: local,
    quality: "role",
    score: 50,
    reason: "Unknown local-part pattern — verify before sending.",
    outreachReady: false,
  };
}

export function isGenericMailbox(email: string | null | undefined): boolean {
  return assessProspectEmail(email).quality === "generic";
}

/** LinkedIn people search for dealer principal / MD at a dealership. */
export function linkedInPrincipalSearchUrl(
  dealershipName: string,
  city?: string | null,
): string {
  const parts = [
    "Dealer Principal",
    dealershipName.trim(),
    city?.trim() || "",
    "South Africa",
  ].filter(Boolean);
  const keywords = encodeURIComponent(parts.join(" "));
  return `https://www.linkedin.com/search/results/people/?keywords=${keywords}`;
}

export function linkedInCompanySearchUrl(dealershipName: string): string {
  const keywords = encodeURIComponent(`${dealershipName.trim()} South Africa`);
  return `https://www.linkedin.com/search/results/companies/?keywords=${keywords}`;
}

export type EnrichmentTarget = {
  dealershipName: string;
  city?: string | null;
  currentEmail?: string | null;
  quality: ProspectEmailQuality;
  linkedInPeopleSearch: string;
  linkedInCompanySearch: string;
  suggestedActions: string[];
};

export function buildEnrichmentTarget(input: {
  dealershipName: string;
  city?: string | null;
  email?: string | null;
}): EnrichmentTarget {
  const assessment = assessProspectEmail(input.email);
  return {
    dealershipName: input.dealershipName,
    city: input.city ?? null,
    currentEmail: assessment.email,
    quality: assessment.quality,
    linkedInPeopleSearch: linkedInPrincipalSearchUrl(input.dealershipName, input.city),
    linkedInCompanySearch: linkedInCompanySearchUrl(input.dealershipName),
    suggestedActions: [
      "Search LinkedIn for Dealer Principal / Managing Director / Owner",
      "Check dealership website Contact / About / Team pages for a named email",
      "Prefer firstname@ or principal@ over info@ / sales@ / enquiries@",
      "Only mark emailVerified after confirming the address on an official page or conversation",
    ],
  };
}

/** Prompt fragment shared by Sipho scout (manual + nightly). */
export const PRINCIPAL_EMAIL_SCOUT_RULES = `EMAIL RULES (critical — generic mailboxes bounce):
- Prefer dealer principal / managing director / owner / named sales manager emails (e.g. darius@…, thabo.m@…, principal@…).
- NEVER invent info@ / sales@ / enquiries@ from a dealership slug — those bounce and waste Resend quota.
- If you do not know a real named contact email, set email to "" (empty string) and put "needs_principal_enrichment" in rationale/source notes.
- Also provide contactName (person) and contactRole (e.g. "Dealer Principal", "Managing Director", "Sales Manager").
- When inventing FICTIONAL practice prospects, still use a plausible named local-part (firstname@dealership-slug.co.za), never info@.`;

/**
 * Strip generic / invalid scout emails so we never store bounce-bait info@.
 * Returns sanitized email + notes to append to sourceNotes.
 */
export function sanitizeScoutEmail(input: {
  email?: string | null;
  dealershipName: string;
  city?: string | null;
}): { email: string | null; sourceNoteExtra: string } {
  const assessment = assessProspectEmail(input.email);
  if (assessment.outreachReady && assessment.email) {
    return { email: assessment.email, sourceNoteExtra: `email_quality=${assessment.quality}` };
  }
  const target = buildEnrichmentTarget({
    dealershipName: input.dealershipName,
    city: input.city,
    email: input.email,
  });
  const kept =
    assessment.quality === "generic" || assessment.quality === "role"
      ? assessment.email
      : null;
  return {
    // Keep generic on file for enrichment UI, but tag clearly — callers should
    // not send until upgraded. Empty/invalid → null.
    email: kept,
    sourceNoteExtra: [
      "needs_principal_enrichment",
      `email_quality=${assessment.quality}`,
      `linkedin=${target.linkedInPeopleSearch}`,
    ].join(" | "),
  };
}
