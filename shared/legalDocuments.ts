/** Canonical list of GrayArx legal documents — single source for footer, hub, and dealer console. */

export type LegalDocCategory = "platform" | "pilot" | "compliance";

export interface LegalDocument {
  id: string;
  title: string;
  description: string;
  href: string;
  category: LegalDocCategory;
  /** Shown on pilot onboarding / dealer legal hub */
  requiredForPilot?: boolean;
  /** Printable or sign-off document */
  signOff?: boolean;
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: "terms",
    title: "Terms of Service",
    description: "Subscription terms between GrayArx and your dealership.",
    href: "/terms",
    category: "platform",
    requiredForPilot: true,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description: "POPIA-compliant data handling, retention, and your rights.",
    href: "/privacy-policy",
    category: "platform",
    requiredForPilot: true,
  },
  {
    id: "dpa",
    title: "Data Processing Agreement",
    description: "Processor obligations when GrayArx handles customer data on your behalf.",
    href: "/dpa",
    category: "platform",
    requiredForPilot: true,
  },
  {
    id: "dealer-agreement",
    title: "Dealer Agreement",
    description: "Pilot subscription contract — review and sign before go-live.",
    href: "/legal/dealer-agreement",
    category: "pilot",
    requiredForPilot: true,
    signOff: true,
  },
  {
    id: "popia-consent",
    title: "POPIA Consent & Acknowledgment Form",
    description: "Confirms your dealership understands POPIA duties as responsible party.",
    href: "/legal/popia-consent-form",
    category: "pilot",
    requiredForPilot: true,
    signOff: true,
  },
  {
    id: "ai-ethics",
    title: "AI Ethics & Transparency",
    description: "How our AI agents work, disclose themselves, and stay under human oversight.",
    href: "/ai-ethics",
    category: "compliance",
    requiredForPilot: true,
  },
  {
    id: "aup",
    title: "Acceptable Use Policy",
    description: "Permitted use of the platform and prohibited activities.",
    href: "/aup",
    category: "platform",
  },
  {
    id: "sla",
    title: "Service Level Agreement",
    description: "99.5% uptime commitment, support tiers, and remedies.",
    href: "/sla",
    category: "platform",
  },
  {
    id: "credit-disclaimer",
    title: "Credit & Finance Disclaimer",
    description: "GrayArx is software only — dealers remain responsible for NCA/FAIS compliance.",
    href: "/credit-disclaimer",
    category: "compliance",
    requiredForPilot: true,
  },
];

export const PILOT_SIGN_OFF_DOCS = LEGAL_DOCUMENTS.filter((d) => d.signOff);

export const PILOT_REQUIRED_DOCS = LEGAL_DOCUMENTS.filter((d) => d.requiredForPilot);

export function legalDocsByCategory(category: LegalDocCategory): LegalDocument[] {
  return LEGAL_DOCUMENTS.filter((d) => d.category === category);
}
