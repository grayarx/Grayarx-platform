/**
 * Pilot outreach segments + curated Gauteng dealership research.
 * Dealers in the same segment receive the same email template (personalised header only).
 *
 * IMPORTANT: Only send bulk email to rows with emailVerified=true AND outreach-ready
 * quality (named / principal). Generic info@ / sales@ bounce on Resend — Kagiso flags
 * those for LinkedIn dealer-principal enrichment instead.
 */

import {
  assessProspectEmail,
  buildEnrichmentTarget,
  isOutreachReadyForDealership,
  type EnrichmentTarget,
} from "./prospectEmailQuality";

export type PilotOutreachSegment =
  | "no_website_social_only"
  | "basic_website_no_showroom"
  | "after_hours_leak"
  | "whatsapp_manual";

export type PilotProspect = {
  id: string;
  dealershipName: string;
  city: string;
  region: string;
  segment: PilotOutreachSegment;
  contactName: string;
  /** Dealer Principal / MD / Sales Manager / Owner when known */
  contactRole?: string;
  email?: string;
  /** True when email was found on official site / listing — still must pass quality gate */
  emailVerified: boolean;
  phone?: string;
  website?: string;
  facebook?: string;
  inventoryEstimate?: string;
  painPoint: string;
  researchNotes: string;
};

export const PILOT_SEGMENT_LABELS: Record<PilotOutreachSegment, string> = {
  no_website_social_only: "Facebook / WhatsApp only — no proper website",
  basic_website_no_showroom: "Basic website — no live AI showroom",
  after_hours_leak: "Website closes at 5pm — after-hours leads lost",
  whatsapp_manual: "Manual WhatsApp — no automated booking or routing",
};

export const PILOT_SEGMENT_SUBJECTS: Record<PilotOutreachSegment, string> = {
  no_website_social_only:
    "Turn your Facebook stock into a 24/7 showroom — GrayArx pilot (5 spots)",
  basic_website_no_showroom:
    "Add an AI showroom to your website — no rebuild required (pilot invite)",
  after_hours_leak:
    "Stop losing after-hours buyers — GrayArx pilot for Gauteng dealers",
  whatsapp_manual:
    "Your WhatsApp can book test drives automatically — pilot invite",
};

/**
 * Curated research — Gauteng & surrounds.
 * Most public info@ addresses bounce; keep them unverified until a principal/
 * named inbox is found (LinkedIn / site team page). Named contacts stay mailable.
 */
export const PILOT_PROSPECTS: PilotProspect[] = [
  // ── Segment: no_website_social_only ─────────────────────────────────────
  {
    id: "gauteng-motor-fb-heavy",
    dealershipName: "Gauteng Motor Centre",
    city: "Pretoria CBD",
    region: "Gauteng",
    segment: "no_website_social_only",
    contactName: "Dealer Principal (TBD)",
    contactRole: "Dealer Principal",
    email: "info@gautengmotors.co.za",
    emailVerified: false,
    phone: "012 321 0033",
    website: "https://gautengmotors.co.za",
    facebook: "https://www.facebook.com/gautengmotorcentre",
    inventoryEstimate: "30–80 units",
    painPoint: "Heavy Facebook promotion but showroom UX is dated vs competitors.",
    researchNotes:
      "info@ listed publicly but generic mailboxes bounce — enrich via LinkedIn Dealer Principal search before send.",
  },
  {
    id: "jangdas-robertsham",
    dealershipName: "Jangdas Motors",
    city: "Robertsham, Johannesburg",
    region: "Gauteng",
    segment: "no_website_social_only",
    contactName: "Dealer Principal (TBD)",
    contactRole: "Dealer Principal",
    email: "info@jangdasmotors.com",
    emailVerified: false,
    phone: "081 436 0666",
    website: "https://jangdasmotors.com",
    inventoryEstimate: "20–60 units",
    painPoint: "Buyers still find stock via social / walk-ins more than the website.",
    researchNotes: "Generic info@ only — find named principal before Resend outreach.",
  },
  {
    id: "sd-auto-wychwood",
    dealershipName: "SD Auto CC",
    city: "Wychwood, Johannesburg",
    region: "Gauteng",
    segment: "no_website_social_only",
    contactName: "Donoven",
    contactRole: "Owner / Sales",
    email: "info@sdautocc.co.za",
    emailVerified: false,
    phone: "011 615 0228",
    website: "https://sdautocc.co.za",
    inventoryEstimate: "15–40 units",
    painPoint: "Phone/WhatsApp heavy — no AI showroom capturing overnight interest.",
    researchNotes:
      "Contact name Donoven known; need donoven@ or similar — do not send to info@.",
  },
  {
    id: "koos-mike-pretoria",
    dealershipName: "Koos and Mike Cars",
    city: "Pretoria Gardens",
    region: "Gauteng",
    segment: "no_website_social_only",
    contactName: "Owner",
    contactRole: "Owner",
    emailVerified: false,
    facebook: "https://www.facebook.com/profile.php?id=100083618730489",
    inventoryEstimate: "15–40 units",
    painPoint: "Stock lives on Facebook only — no searchable showroom or lead capture.",
    researchNotes: "WhatsApp/Facebook follow-up only until a public named email is verified.",
  },

  // ── Segment: basic_website_no_showroom ──────────────────────────────────
  {
    id: "jubilee-springs",
    dealershipName: "Jubilee Motors",
    city: "Springs",
    region: "Gauteng",
    segment: "basic_website_no_showroom",
    contactName: "Darius",
    contactRole: "Sales / Contact",
    email: "darius@jubileemotors.co.za",
    emailVerified: true,
    phone: "011 811 4008",
    website: "https://jubileemotors.co.za",
    inventoryEstimate: "20–50 units",
    painPoint: "Static WordPress site — no AI chat, WhatsApp routing, or instant booking.",
    researchNotes:
      "Named contact on site: darius@jubileemotors.co.za (also julia@ on directories). Prefer named over info@ which bounced.",
  },
  {
    id: "iands-de-deur",
    dealershipName: "I&S Motors",
    city: "De Deur",
    region: "Gauteng",
    segment: "basic_website_no_showroom",
    contactName: "Owner (TBD)",
    contactRole: "Owner",
    email: "info@iandsmotors.co.za",
    emailVerified: false,
    phone: "016 590 2896",
    website: "https://www.iandsmotors.co.za",
    inventoryEstimate: "15–40 units",
    painPoint: "Listings page only — buyers still phone instead of self-serving online.",
    researchNotes: "Generic info@ — LinkedIn principal enrichment required.",
  },
  {
    id: "omcmotors-lyndhurst",
    dealershipName: "OMC Motors",
    city: "Lyndhurst",
    region: "Gauteng",
    segment: "basic_website_no_showroom",
    contactName: "Sales Manager (TBD)",
    contactRole: "Sales Manager",
    email: "info@omcmotors.co.za",
    emailVerified: false,
    phone: "011 776 9964",
    website: "https://www.omcmotors.co.za",
    inventoryEstimate: "40–100 units",
    painPoint: "Live chat widget but no AI qualification or after-hours specialist agents.",
    researchNotes: "Generic info@ — find named GM / principal before send.",
  },

  // ── Segment: after_hours_leak ───────────────────────────────────────────
  {
    id: "voncal-wonderboom",
    dealershipName: "Voncal Auto",
    city: "Wonderboom South, Pretoria",
    region: "Gauteng",
    segment: "after_hours_leak",
    contactName: "Dealer Principal (TBD)",
    contactRole: "Dealer Principal",
    email: "info@voncalauto.co.za",
    emailVerified: false,
    phone: "010 000 6150",
    website: "https://voncalauto.co.za",
    inventoryEstimate: "30–70 units",
    painPoint: "Hours end mid-evening — after-hours browsers get no reply until morning.",
    researchNotes: "Generic info@ — enrich via LinkedIn before Resend.",
  },
  {
    id: "corona-gezina",
    dealershipName: "Corona Motors",
    city: "Gezina, Pretoria",
    region: "Gauteng",
    segment: "after_hours_leak",
    contactName: "Jan",
    contactRole: "Contact",
    email: "info@coronamotors.co.za",
    emailVerified: false,
    phone: "012 335 8359",
    website: "https://coronamotors.co.za",
    inventoryEstimate: "40–80 units",
    painPoint: "Strong local reputation but Sundays/late nights lose warm leads.",
    researchNotes: "Contact name Jan known — find jan@…; do not send to info@.",
  },
  {
    id: "m5-boksburg",
    dealershipName: "M5 Auto",
    city: "Boksburg",
    region: "Gauteng",
    segment: "after_hours_leak",
    contactName: "Ammaar",
    contactRole: "Contact",
    email: "info@m5auto.co.za",
    emailVerified: false,
    phone: "011 230 5220",
    website: "https://m5auto.co.za",
    inventoryEstimate: "50–120 units",
    painPoint: "High volume stock — after-hours enquiries need an always-on qualifier.",
    researchNotes: "Contact name Ammaar known — find ammaar@… before outreach.",
  },

  // ── Segment: whatsapp_manual ────────────────────────────────────────────
  {
    id: "preowned-motorland",
    dealershipName: "Pre-Owned Motorland",
    city: "Vanderbijlpark",
    region: "Gauteng",
    segment: "whatsapp_manual",
    contactName: "Dealer Principal (TBD)",
    contactRole: "Dealer Principal",
    email: "info@preownedmotorland.co.za",
    emailVerified: false,
    phone: "016 932 4212",
    website: "https://preownedmotorland.co.za",
    inventoryEstimate: "Luxury / exotic focus",
    painPoint: "High-value buyers message after hours — manual WhatsApp can't keep up.",
    researchNotes: "Generic info@ — LinkedIn principal enrichment required.",
  },
  {
    id: "southgate-wheels",
    dealershipName: "Southgate Wheels",
    city: "Roodepoort",
    region: "Gauteng",
    segment: "whatsapp_manual",
    contactName: "Dealer Principal (TBD)",
    contactRole: "Dealer Principal",
    email: "info@southgatewheels.co.za",
    emailVerified: false,
    phone: "011 326 0812",
    website: "https://southgatewheels.co.za",
    inventoryEstimate: "20–50 units",
    painPoint: "WhatsApp is the sales desk — no automated booking or routing.",
    researchNotes: "Generic info@ — do not bulk-send until named contact verified.",
  },
  {
    id: "jooste-montana",
    dealershipName: "Jooste Motors",
    city: "Montana, Pretoria",
    region: "Gauteng",
    segment: "whatsapp_manual",
    contactName: "Owner (TBD)",
    contactRole: "Owner",
    email: "info@joostemotors.co.za",
    emailVerified: false,
    phone: "082 448 7569",
    website: "https://joostemotors.co.za",
    inventoryEstimate: "50+ units",
    painPoint: "Staff answer WhatsApp manually — Lerato could pencil test drives 24/7.",
    researchNotes: "Generic info@ — enrich owner email via LinkedIn / site.",
  },
];

export function groupProspectsBySegment(
  prospects: PilotProspect[] = PILOT_PROSPECTS,
): Record<PilotOutreachSegment, PilotProspect[]> {
  const groups: Record<PilotOutreachSegment, PilotProspect[]> = {
    no_website_social_only: [],
    basic_website_no_showroom: [],
    after_hours_leak: [],
    whatsapp_manual: [],
  };
  for (const p of prospects) {
    groups[p.segment].push(p);
  }
  return groups;
}

export type MailableOptions = {
  /**
   * When true, also include verified generic mailboxes (info@ etc.).
   * Default false — Resend bounce rate on those is too high.
   */
  includeGenericMailboxes?: boolean;
};

/** Verified + outreach-ready (named/principal) emails only, unless includeGenericMailboxes. */
export function mailableProspects(
  prospects: PilotProspect[] = PILOT_PROSPECTS,
  segment?: PilotOutreachSegment,
  opts: MailableOptions = {},
): PilotProspect[] {
  const filtered = segment ? prospects.filter((p) => p.segment === segment) : prospects;
  const seen = new Set<string>();
  return filtered.filter((p) => {
    if (!p.emailVerified || !p.email?.trim()) return false;
    if (!opts.includeGenericMailboxes && !isOutreachReadyForDealership(p.email, p.website)) {
      return false;
    }
    const key = p.email.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Prospects that need dealer-principal / LinkedIn enrichment before cold email. */
export function prospectsNeedingPrincipalEnrichment(
  prospects: PilotProspect[] = PILOT_PROSPECTS,
): EnrichmentTarget[] {
  return prospects
    .filter((p) => {
      const a = assessProspectEmail(p.email);
      return !p.emailVerified || !a.outreachReady;
    })
    .map((p) =>
      buildEnrichmentTarget({
        dealershipName: p.dealershipName,
        city: p.city,
        email: p.email,
      }),
    );
}
