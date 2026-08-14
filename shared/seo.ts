/**
 * ICP-focused SEO copy — independent SA dealership principals.
 * Keep titles ≤ ~60 chars and descriptions ≤ ~155 where practical.
 */

export const SITE_ORIGIN = "https://www.grayarx.com";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/hero-car.jpg`;

export const ICP_KEYWORDS =
  "dealership software South Africa, WhatsApp for car dealers, after-hours leads, CSV car inventory showroom, used car dealership CRM SA, free pilot GrayArx";

export type SeoPageKey =
  | "home"
  | "onboarding"
  | "help"
  | "legal"
  | "showroom"
  | "tradeIn"
  | "finance"
  | "compare"
  | "forDealers";

export type SeoPageMeta = {
  title: string;
  description: string;
  path: string;
  keywords?: string;
};

export const SEO_PAGES: Record<SeoPageKey, SeoPageMeta> = {
  home: {
    path: "/",
    title: "GrayArx — WhatsApp + showroom for SA dealers",
    description:
      "Stop losing after-hours WhatsApp leads. Independent SA dealerships put CSV stock live, answer buyers overnight, and book test drives. Free pilot.",
    keywords: ICP_KEYWORDS,
  },
  onboarding: {
    path: "/onboarding",
    title: "Free dealership pilot | GrayArx South Africa",
    description:
      "Onboard your SA dealership in one application — CSV inventory, WhatsApp Nala, leads, and bookings. Free pilot, no credit card.",
    keywords:
      "dealership software free trial South Africa, car dealer CRM onboarding, WhatsApp dealership pilot",
  },
  forDealers: {
    path: "/for-dealers",
    title: "ROI for SA dealerships | GrayArx",
    description:
      "Run the after-hours leakage math for your yard. One recovered deal a month usually covers GrayArx — free pilot on your CSV stock.",
    keywords:
      "dealership ROI calculator South Africa, WhatsApp leads cost, car dealer software worth it",
  },
  help: {
    path: "/help",
    title: "Help for SA car dealers | GrayArx",
    description:
      "How GrayArx works for dealerships: CSV import, WhatsApp after hours, Mia follow-ups, test drives, and POPIA. Pilot FAQ.",
    keywords: "GrayArx help, dealership WhatsApp setup, CSV inventory import SA",
  },
  legal: {
    path: "/legal",
    title: "POPIA & dealer legal centre | GrayArx",
    description:
      "Dealer agreement, POPIA consent, privacy, and SA compliance docs for GrayArx dealerships — attorney-ready from day one.",
    keywords: "POPIA dealership software, car dealer agreement South Africa",
  },
  showroom: {
    path: "/showroom",
    title: "Live car showroom | GrayArx",
    description:
      "Browse live dealership stock on GrayArx. Independent SA yards with shareable filters — powered by dealer CSV inventory.",
    keywords: "used cars South Africa showroom, dealership stock online",
  },
  tradeIn: {
    path: "/trade-in",
    title: "Trade-in estimate SA | GrayArx",
    description:
      "Instant South African trade-in range from Tumi — then hand off to finance or a GrayArx dealership showroom.",
    keywords: "car trade-in value South Africa, vehicle valuation SA",
  },
  finance: {
    path: "/finance",
    title: "Car finance calculator SA | GrayArx",
    description:
      "Estimate monthly instalments with SA prime and NCA VAF norms — then apply for pre-approval at a GrayArx dealership.",
    keywords: "car finance calculator South Africa, vehicle instalment estimate",
  },
  compare: {
    path: "/compare",
    title: "Compare cars side by side | GrayArx",
    description:
      "Compare up to three vehicles from live GrayArx dealership stock — shareable link for WhatsApp.",
    keywords: "compare used cars South Africa",
  },
};

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Organization + SoftwareApplication JSON-LD for the marketing home. */
export function buildHomeJsonLd(): Record<string, unknown> {
  const home = SEO_PAGES.home;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_ORIGIN}/#organization`,
        name: "GrayArx",
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/logo-crest.png`,
        description: home.description,
        areaServed: {
          "@type": "Country",
          name: "South Africa",
        },
        sameAs: [SITE_ORIGIN],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_ORIGIN}/#software`,
        name: "GrayArx",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_ORIGIN,
        description: home.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "ZAR",
          description: "Free pilot for qualifying South African dealerships",
          url: absoluteUrl("/onboarding"),
        },
        featureList: [
          "WhatsApp after-hours buyer replies",
          "CSV / DMS inventory sync to live showroom",
          "Lead follow-up drip (Mia)",
          "Test-drive bookings",
          "Trade-in and finance handoff",
          "POPIA-aware dealer workflows",
        ],
        provider: { "@id": `${SITE_ORIGIN}/#organization` },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_ORIGIN}/#website`,
        url: SITE_ORIGIN,
        name: "GrayArx",
        description: home.description,
        publisher: { "@id": `${SITE_ORIGIN}/#organization` },
        potentialAction: {
          "@type": "RegisterAction",
          target: absoluteUrl("/onboarding"),
          name: "Start free dealership pilot",
        },
      },
    ],
  };
}
