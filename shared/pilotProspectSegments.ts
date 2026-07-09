/**
 * Pilot outreach segments + curated Gauteng dealership research.
 * Dealers in the same segment receive the same email template (personalised header only).
 *
 * IMPORTANT: Only send bulk email to rows with emailVerified=true (public contact email found).
 * Rows without email are for WhatsApp/Facebook follow-up — see docs/PILOT_OUTREACH_RESEARCH.md
 */

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
  email?: string;
  /** True when email was found on official site / listing — safe for Resend bulk */
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

/** Curated research — Gauteng & surrounds, March 2026 */
export const PILOT_PROSPECTS: PilotProspect[] = [
  // ── Segment: no_website_social_only ─────────────────────────────────────
  {
    id: "koos-mike-pretoria",
    dealershipName: "Koos and Mike Cars",
    city: "Pretoria Gardens",
    region: "Gauteng",
    segment: "no_website_social_only",
    contactName: "Owner",
    emailVerified: false,
    phone: undefined,
    facebook: "https://www.facebook.com/profile.php?id=100083618730489",
    inventoryEstimate: "15–40 units",
    painPoint: "Stock lives on Facebook only — no searchable showroom or lead capture.",
    researchNotes:
      "Listed on Africa2Trust as Pretoria Gardens used-car dealer; primary marketing via Facebook.",
  },
  {
    id: "ha-sales-kempton",
    dealershipName: "H A Sales Cars",
    city: "Kempton Park",
    region: "Gauteng",
    segment: "no_website_social_only",
    contactName: "Owner",
    emailVerified: false,
    phone: "068 063 8788",
    facebook: "https://www.facebook.com/people/H-A-SALES-CARS/100083618730489/",
    inventoryEstimate: "10–30 units",
    painPoint: "Buyers DM on Facebook/WhatsApp — no structured test-drive or finance flow.",
    researchNotes: "Active Facebook listings; WhatsApp number in posts.",
  },
  {
    id: "cj-auto-edenvale",
    dealershipName: "CJ Auto Spares & Cars",
    city: "Edenvale",
    region: "Gauteng",
    segment: "no_website_social_only",
    contactName: "Owner",
    emailVerified: false,
    phone: "011 452 9696",
    facebook: "https://www.facebook.com/CJ_Auto_Spares/",
    inventoryEstimate: "Mixed stock + spares",
    painPoint: "Multi-channel Facebook sales with no central inventory hub.",
    researchNotes: "Terrace Road, Eastleigh; also lists cars for sale alongside spares.",
  },
  {
    id: "gauteng-motor-fb-heavy",
    dealershipName: "Gauteng Motor Centre",
    city: "Pretoria CBD",
    region: "Gauteng",
    segment: "no_website_social_only",
    contactName: "Sales Manager",
    email: "info@gautengmotors.co.za",
    emailVerified: true,
    phone: "012 321 0033",
    website: "https://gautengmotors.co.za",
    facebook: "https://www.facebook.com/gautengmotorcentre",
    inventoryEstimate: "30–80 units",
    painPoint: "Heavy Facebook promotion but showroom UX is dated vs competitors.",
    researchNotes: "Has website but primary engagement appears social-first.",
  },

  // ── Segment: basic_website_no_showroom ──────────────────────────────────
  {
    id: "jubilee-springs",
    dealershipName: "Jubilee Motors",
    city: "Springs",
    region: "Gauteng",
    segment: "basic_website_no_showroom",
    contactName: "Darius",
    email: "darius@jubileemotors.co.za",
    emailVerified: true,
    phone: "011 811 4008",
    website: "https://jubileemotors.co.za",
    inventoryEstimate: "20–50 units",
    painPoint: "Static WordPress site — no AI chat, WhatsApp routing, or instant booking.",
    researchNotes: "Public contact page lists darius@jubileemotors.co.za.",
  },
  {
    id: "iands-de-deur",
    dealershipName: "I&S Motors",
    city: "De Deur",
    region: "Gauteng",
    segment: "basic_website_no_showroom",
    contactName: "Owner",
    email: "info@iandsmotors.co.za",
    emailVerified: true,
    phone: "016 590 2896",
    website: "https://www.iandsmotors.co.za",
    inventoryEstimate: "15–40 units",
    painPoint: "Listings page only — buyers still phone instead of self-serving online.",
    researchNotes: "info@ on homepage footer.",
  },
  {
    id: "omcmotors-lyndhurst",
    dealershipName: "OMC Motors",
    city: "Lyndhurst",
    region: "Gauteng",
    segment: "basic_website_no_showroom",
    contactName: "Sales Manager",
    email: "info@omcmotors.co.za",
    emailVerified: true,
    phone: "011 776 9964",
    website: "https://www.omcmotors.co.za",
    inventoryEstimate: "40–100 units",
    painPoint: "Live chat widget but no AI qualification or after-hours specialist agents.",
    researchNotes: "info@omcmotors.co.za on contact page.",
  },

  // ── Segment: after_hours_leak ───────────────────────────────────────────
  {
    id: "jooste-montana",
    dealershipName: "Jooste Motors",
    city: "Montana, Pretoria",
    region: "Gauteng",
    segment: "after_hours_leak",
    contactName: "Owner",
    email: "info@joostemotors.co.za",
    emailVerified: false,
    phone: "082 448 7569",
    website: "https://joostemotors.co.za",
    inventoryEstimate: "50+ units",
    painPoint: "Strong Google rating but enquiries die after 5pm and on Sundays.",
    researchNotes: "WhatsApp-first CTA; verify info@ before bulk send.",
  },
  {
    id: "gauteng-motors-afterhours",
    dealershipName: "Gauteng Motor Centre",
    city: "Pretoria",
    region: "Gauteng",
    segment: "after_hours_leak",
    contactName: "Sales Manager",
    email: "info@gautengmotors.co.za",
    emailVerified: true,
    phone: "012 321 0033",
    website: "https://gautengmotors.co.za",
    inventoryEstimate: "30–80 units",
    painPoint: "Weekend Facebook interest doesn't convert — no Bongi-style after-hours agent.",
    researchNotes: "Duplicate segment entry for after-hours angle; dedupe by email on send.",
  },

  // ── Segment: whatsapp_manual ────────────────────────────────────────────
  {
    id: "jooste-whatsapp",
    dealershipName: "Jooste Motors",
    city: "Montana, Pretoria",
    region: "Gauteng",
    segment: "whatsapp_manual",
    contactName: "Owner",
    email: "info@joostemotors.co.za",
    emailVerified: false,
    phone: "082 448 7569",
    website: "https://joostemotors.co.za",
    inventoryEstimate: "50+ units",
    painPoint: "Staff answer WhatsApp manually — Lerato could pencil test drives 24/7.",
    researchNotes: "Click-to-WhatsApp on site; ideal WhatsApp Cloud API pilot candidate.",
  },
  {
    id: "omc-whatsapp",
    dealershipName: "OMC Motors",
    city: "Lyndhurst",
    region: "Gauteng",
    segment: "whatsapp_manual",
    contactName: "Bridget",
    email: "info@omcmotors.co.za",
    emailVerified: true,
    phone: "011 776 9964",
    website: "https://www.omcmotors.co.za",
    inventoryEstimate: "40–100 units",
    painPoint: "Chat widget goes offline — WhatsApp + AI routing would recover leads.",
    researchNotes: "Site shows offline chat agents outside hours.",
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

export function mailableProspects(
  prospects: PilotProspect[] = PILOT_PROSPECTS,
  segment?: PilotOutreachSegment,
): PilotProspect[] {
  const filtered = segment ? prospects.filter((p) => p.segment === segment) : prospects;
  const seen = new Set<string>();
  return filtered.filter((p) => {
    if (!p.emailVerified || !p.email?.trim()) return false;
    const key = p.email.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
