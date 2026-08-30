/**
 * ICP-focused SEO copy — Nala Dealership OS (sales + parts + service + trade-in).
 * Keep titles ≤ ~60 chars and descriptions ≤ ~155 where practical.
 */

export const SITE_ORIGIN = "https://www.grayarx.com";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/hero-car.jpg`;

export const ICP_KEYWORDS =
  "dealership OS, Nala WhatsApp, after-hours leads, car dealer software, CSV inventory showroom, missed-call recovery, parts and service desk, this week's numbers, free 14-day pilot GrayArx, South Africa Australia UK UAE USA New Zealand";

/** Public list prices for schema.org offers — keep in sync with docs/PRICING.md. */
export const SEO_OS_OFFERS = [
  {
    name: "Pilot",
    price: "0",
    description: "14 days, 150 WhatsApp conversations, then decide on this week's numbers",
  },
  {
    name: "Starter OS",
    price: "7990",
    description: "1,000 WhatsApp conversations / month — sales + recovery",
  },
  {
    name: "Professional OS",
    price: "14990",
    description: "3,500 WhatsApp conversations / month — full dealership OS (hero close)",
  },
  {
    name: "Enterprise OS",
    price: "29990",
    description: "From R29,990/mo — 12,000 WhatsApp conversations, multi-yard + SLA",
  },
] as const;

export const SEO_AREA_SERVED = [
  { "@type": "Country" as const, name: "South Africa" },
  { "@type": "Country" as const, name: "Australia" },
  { "@type": "Country" as const, name: "United Kingdom" },
  { "@type": "Country" as const, name: "United Arab Emirates" },
  { "@type": "Country" as const, name: "United States" },
  { "@type": "Country" as const, name: "New Zealand" },
];

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
    title: "GrayArx — WhatsApp dealership OS",
    description:
      "Nala answers after-hours WhatsApp from live stock, books drives, parts and service. Free 14-day Pilot. Then Professional OS R14,990/mo.",
    keywords: ICP_KEYWORDS,
  },
  onboarding: {
    path: "/onboarding",
    title: "Free 14-day OS pilot | GrayArx",
    description:
      "Start a 14-day Pilot on your stock — Nala WhatsApp, CSV showroom, parts, service, missed-call recovery. No card. ZA, AU, UK, UAE, US, NZ.",
    keywords:
      "dealership OS free trial, Nala WhatsApp pilot, car dealer CRM onboarding, 14-day pilot GrayArx",
  },
  forDealers: {
    path: "/for-dealers",
    title: "Dealership OS ROI | GrayArx",
    description:
      "After-hours WhatsApp leakage vs Nala OS. 14-day Pilot, then Starter R7,990 or Professional R14,990/mo on your CSV stock.",
    keywords:
      "dealership OS ROI, WhatsApp leads cost, car dealer software pricing, Nala Professional OS",
  },
  help: {
    path: "/help",
    title: "Help for dealers | GrayArx OS",
    description:
      "GrayArx Dealership OS: CSV import, after-hours WhatsApp, parts, service, this week's numbers, 14-day Pilot FAQ, POPIA.",
    keywords: "GrayArx help, Nala WhatsApp setup, CSV inventory import, dealership OS FAQ",
  },
  legal: {
    path: "/legal",
    title: "POPIA & dealer legal centre | GrayArx",
    description:
      "Dealer agreement, POPIA consent, privacy, and compliance docs for GrayArx Dealership OS — attorney-ready from day one.",
    keywords: "POPIA dealership software, car dealer agreement South Africa, GrayArx legal",
  },
  showroom: {
    path: "/showroom",
    title: "Live car showroom | GrayArx",
    description:
      "Browse live dealership stock on GrayArx. Shareable filters — powered by dealer CSV inventory and Nala on WhatsApp.",
    keywords: "used cars showroom, dealership stock online, GrayArx marketplace",
  },
  tradeIn: {
    path: "/trade-in",
    title: "Trade-in estimate | GrayArx",
    description:
      "Instant trade-in range from Tumi — then hand off to finance or a GrayArx dealership showroom. Nala OS trade-in desk.",
    keywords: "car trade-in value, vehicle valuation, GrayArx trade-in",
  },
  finance: {
    path: "/finance",
    title: "Car finance calculator | GrayArx",
    description:
      "Estimate monthly instalments with SA prime and NCA VAF norms — then apply for pre-approval at a GrayArx dealership.",
    keywords: "car finance calculator South Africa, vehicle instalment estimate",
  },
  compare: {
    path: "/compare",
    title: "Compare cars side by side | GrayArx",
    description:
      "Compare up to three vehicles from live GrayArx dealership stock — shareable link for WhatsApp.",
    keywords: "compare used cars, WhatsApp car compare",
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
        areaServed: [...SEO_AREA_SERVED],
        sameAs: [SITE_ORIGIN],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_ORIGIN}/#software`,
        name: "GrayArx",
        alternateName: "Nala Dealership OS",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_ORIGIN,
        description: home.description,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "ZAR",
          lowPrice: "0",
          highPrice: "29990",
          offerCount: String(SEO_OS_OFFERS.length),
          url: absoluteUrl("/onboarding"),
          offers: SEO_OS_OFFERS.map((o) => ({
            "@type": "Offer",
            name: o.name,
            price: o.price,
            priceCurrency: "ZAR",
            description: o.description,
            url: absoluteUrl("/onboarding"),
          })),
        },
        featureList: [
          "WhatsApp after-hours buyer replies from live stock",
          "CSV / DMS inventory sync to live showroom",
          "Parts desk and service bookings",
          "Trade-in intake",
          "Missed-call WhatsApp recovery",
          "This week's numbers email",
          "Lead follow-up drip (Mia)",
          "Test-drive bookings",
          "Template fallback when LLM credits run out",
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
          name: "Start 14-day dealership OS pilot",
        },
      },
    ],
  };
}
