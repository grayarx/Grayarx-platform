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
  "administrator",
  "contact",
  "hello",
  "support",
  "office",
  "reception",
  "mail",
  "emails",
  "webmaster",
  "webadmin",
  "webmaster",
  "postmaster",
  "hostmaster",
  "sysadmin",
  "root",
  "noreply",
  "no-reply",
  "donotreply",
  "dealership",
  "general",
  "it",
  "tech",
  "developer",
  "design",
  "designer",
  "studio",
  "agency",
]);

/** Role inboxes that are better than info@ but still not a principal. */
const ROLE_LOCAL_PARTS = new Set([
  "marketing",
  "gm",
  "manager",
  "accounts",
  "finance",
  "hr",
  "jobs",
  "careers",
]);

/**
 * Only treat as principal when local-part is clearly that role.
 * Bare "md"/"ceo" stay here; "principal@" alone is often invented and bounces —
 * prefer a real firstname@ on the dealership domain.
 */
const PRINCIPAL_LOCAL_PARTS = new Set([
  "dealerprincipal",
  "dealer-principal",
  "dealer_principal",
  "managingdirector",
  "managing-director",
  "managing_director",
  "proprietor",
]);

/**
 * LLM filler / demo locals that look "named" but are not real people.
 * jane.doe@ and john.doe@ bounced in production — treat as invalid.
 */
export const FILLER_EMAIL_LOCAL_PARTS = new Set([
  "jane.doe",
  "john.doe",
  "jane_doe",
  "john_doe",
  "janedoe",
  "johndoe",
  "jane.smith",
  "john.smith",
  "joe.bloggs",
  "jo.bloggs",
  "foo.bar",
  "foo.baz",
  "first.last",
  "firstname.lastname",
  "name.surname",
  "test.user",
  "test.dealer",
  "demo.user",
  "sample.user",
  "user.name",
  "dummy.user",
  "fake.user",
  "example.user",
  "test",
  "testing",
  "demo",
  "sample",
  "dummy",
  "fake",
  "placeholder",
  "asdf",
  "qwerty",
]);

const FILLER_LOCAL_RE =
  /^(jane|john|joe|jo|foo|bar|test|demo|sample|dummy|fake|example|user|name|firstname|lastname)[._-]?(doe|smith|bloggs|bar|baz|user|dealer|test|demo|sample|surname|lastname)?$/i;

function parseLocalPart(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;
  return trimmed.slice(0, at);
}

export function isFillerEmail(email: string | null | undefined): boolean {
  const local = parseLocalPart(email ?? "");
  if (!local) return false;
  if (FILLER_EMAIL_LOCAL_PARTS.has(local)) return true;
  if (FILLER_LOCAL_RE.test(local)) return true;
  // Obvious placeholder domains
  const domain = (email ?? "").trim().toLowerCase().split("@")[1] ?? "";
  if (
    /^(example|test|fake|dummy|placeholder|localhost|email|domain)\./.test(domain) ||
    domain.endsWith(".example") ||
    domain === "example.com" ||
    domain === "test.com"
  ) {
    return true;
  }
  return false;
}

function looksLikePersonName(local: string): boolean {
  // firstname, first.last, first_last, first-last — not a single generic word
  if (GENERIC_MAILBOX_LOCAL_PARTS.has(local)) return false;
  if (ROLE_LOCAL_PARTS.has(local) || PRINCIPAL_LOCAL_PARTS.has(local)) return false;
  if (FILLER_EMAIL_LOCAL_PARTS.has(local) || FILLER_LOCAL_RE.test(local)) return false;
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
      reason: "No email on file — find the dealer principal on the site, directories, or public web (not LinkedIn-only).",
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

  if (isFillerEmail(raw)) {
    const local = parseLocalPart(raw);
    return {
      email: raw,
      localPart: local,
      quality: "invalid",
      score: 0,
      reason: "Filler/demo email (e.g. jane.doe / john.doe) — not a real contact.",
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
  // Bare principal@ / owner@ / md@ / ceo@ / director@ — often invented; treat as role not ready
  if (
    local === "principal" ||
    local === "owner" ||
    local === "md" ||
    local === "ceo" ||
    local === "director"
  ) {
    return {
      email: raw,
      localPart: local,
      quality: "role",
      score: 45,
      reason: `${local}@ without a person name is often wrong — prefer firstname@ on the dealer domain.`,
      outreachReady: false,
    };
  }
  if (PRINCIPAL_LOCAL_PARTS.has(local) || local.includes("dealerprincipal") || local.includes("managingdirector")) {
    return {
      email: raw,
      localPart: local,
      quality: "principal",
      score: 95,
      reason: "Looks like a dealer principal / managing director inbox.",
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

/** Extract registrable-ish host from a website URL (strip www.). */
export function websiteHost(website: string | null | undefined): string | null {
  const raw = (website ?? "").trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const host = new URL(withProto).hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

export function emailDomain(email: string | null | undefined): string | null {
  const d = (email ?? "").trim().toLowerCase().split("@")[1] ?? "";
  return d || null;
}

/**
 * Email must belong to the dealership site domain (or a close parent/child).
 * Rejects site-builder addresses like webadmin@vmgsoftware.co.za on voncalauto.co.za.
 */
export function emailMatchesWebsiteDomain(
  email: string | null | undefined,
  website: string | null | undefined,
): boolean {
  const ed = emailDomain(email);
  const host = websiteHost(website);
  if (!ed || !host) return false;
  if (ed === host) return true;
  if (ed.endsWith(`.${host}`) || host.endsWith(`.${ed}`)) return true;
  return false;
}

/**
 * Final gate before store/send: named/principal local-part AND email domain
 * matches the dealership website (when a website is known).
 */
export function isOutreachReadyForDealership(
  email: string | null | undefined,
  website: string | null | undefined,
): boolean {
  const a = assessProspectEmail(email);
  if (!a.outreachReady) return false;
  if (!website?.trim()) return false; // require a website to prove domain ownership
  return emailMatchesWebsiteDomain(email, website);
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
      "Search public web + directories (Brabys/Cylex) + Facebook/LinkedIn for Dealer Principal / MD / Owner",
      "Check dealership website Contact / About / Team / Management pages for a named email",
      "Prefer firstname@ or first.last@ on the dealer domain over info@ / sales@ / enquiries@",
      "Only mark emailVerified after confirming the address on an official page or conversation",
    ],
  };
}

/** Prompt fragment shared by Sipho scout (manual + nightly). */
export const PRINCIPAL_EMAIL_SCOUT_RULES = `EMAIL RULES (critical — generic and filler emails bounce):
- NEVER invent emails. Do not use jane.doe@, john.doe@, john.smith@, test@, demo@, or any placeholder.
- NEVER invent info@ / sales@ / enquiries@ / admin@ / webadmin@ from a dealership slug.
- ONLY return an email if it is a real named person on the dealership's OWN domain (same as the website).
- Reject site-builder emails (e.g. webadmin@vmgsoftware.co.za on a dealer site).
- If you do not have a verified named email on the dealer domain, set email to "" (empty).
- Prefer real public dealerships with real websites over fictional ones.`;


/**
 * Only keep outreach-ready (named / principal) emails.
 * Generic info@ etc. are dropped — we do not store bounce-bait.
 */
export function sanitizeScoutEmail(input: {
  email?: string | null;
  dealershipName: string;
  city?: string | null;
  website?: string | null;
}): { email: string | null; sourceNoteExtra: string; outreachReady: boolean } {
  const ready = isOutreachReadyForDealership(input.email, input.website);
  const assessment = assessProspectEmail(input.email);
  if (ready && assessment.email) {
    return {
      email: assessment.email,
      sourceNoteExtra: `email_quality=${assessment.quality}|domain_match=1`,
      outreachReady: true,
    };
  }
  const target = buildEnrichmentTarget({
    dealershipName: input.dealershipName,
    city: input.city,
    email: input.email,
  });
  return {
    email: null,
    outreachReady: false,
    sourceNoteExtra: [
      "skipped_not_outreach_ready",
      `email_quality=${assessment.quality}`,
      input.website && assessment.email && !emailMatchesWebsiteDomain(input.email, input.website)
        ? "domain_mismatch"
        : null,
      `linkedin=${target.linkedInPeopleSearch}`,
    ]
      .filter(Boolean)
      .join(" | "),
  };
}

/** Filter insert rows to named/principal emails on the dealership's own domain. */
export function filterOutreachReadyProspectInserts<
  T extends { email?: string | null; dealershipName?: string; website?: string | null },
>(rows: T[]): T[] {
  return rows.filter((row) => isOutreachReadyForDealership(row.email, row.website));
}
