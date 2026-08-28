/**
 * Full competitor pricing matrix — public figures preferred; else estimated / quote_only.
 * Research snapshot for GrayArx packaging decisions.
 */

export type PriceRow = {
  name: string;
  category: string;
  plans: Array<{
    plan: string;
    price: string;
    confidence: "public" | "estimated" | "quote_only";
    source?: string;
  }>;
  notes?: string;
};

export const COMPETITOR_PRICE_MATRIX: PriceRow[] = [
  {
    name: "MotorX",
    category: "Full dealership platform",
    plans: [
      {
        plan: "Starter",
        price: "Custom ZAR (not published)",
        confidence: "quote_only",
        source: "motorx.co.za",
      },
      {
        plan: "Professional",
        price: "Custom ZAR (not published)",
        confidence: "quote_only",
        source: "motorx.co.za",
      },
      {
        plan: "Enterprise",
        price: "Custom ZAR (not published)",
        confidence: "quote_only",
        source: "motorx.co.za",
      },
    ],
    notes:
      "Month-to-month, 30-day cancel. Demo required. Treat as full-suite cost — typically above a single chatbot, often in the multi-thousand to mid-five-figure ZAR/mo range for groups (sales-confirmed, not public).",
  },
  {
    name: "Adas DMS",
    category: "DMS",
    plans: [
      {
        plan: "DMS software",
        price: "R1,260/mo excl VAT",
        confidence: "public",
        source: "adasoft.co.za",
      },
      {
        plan: "Cloud server (1–3 users)",
        price: "R250–R325/mo excl VAT (+ setup from R550–R1,099)",
        confidence: "public",
        source: "adasoft.co.za",
      },
      {
        plan: "Advertising / website feeds",
        price: "R250/mo excl VAT",
        confidence: "public",
        source: "adasoft.co.za",
      },
      {
        plan: "Website packages (quoted)",
        price: "R3,306–R9,800 (packages)",
        confidence: "estimated",
        source: "comparison sites",
      },
    ],
    notes: "Setup fees on DMS/cloud. No lock-in messaging on site.",
  },
  {
    name: "Autosoft (XSOFT SA)",
    category: "DMS",
    plans: [
      {
        plan: "Standard package (5 users)",
        price: "From ~R9,500 (license structure; yearly after year 2)",
        confidence: "public",
        source: "xsoft.co.za",
      },
    ],
  },
  {
    name: "Jouver",
    category: "Lite DMS",
    plans: [
      {
        plan: "Free",
        price: "R0 up to 10 vehicles",
        confidence: "public",
        source: "jouver.com",
      },
      {
        plan: "Paid",
        price: "From ~R179/mo SA",
        confidence: "public",
        source: "jouver.com",
      },
    ],
  },
  {
    name: "VMG DMS",
    category: "DMS",
    plans: [
      {
        plan: "Starting",
        price: "From ~R100/mo (directory listing) / quote typical",
        confidence: "estimated",
        source: "krowdbase / sales",
      },
    ],
  },
  {
    name: "Visio BDC",
    category: "WhatsApp nurture",
    plans: [
      {
        plan: "Starter",
        price: "R1,500/mo",
        confidence: "public",
        source: "Visio BDC site",
      },
      {
        plan: "Pro",
        price: "R3,000/mo",
        confidence: "public",
        source: "Visio BDC site",
      },
      {
        plan: "Scale",
        price: "R5,000/mo",
        confidence: "public",
        source: "Visio BDC site",
      },
    ],
  },
  {
    name: "Raimond (automotive chatbot)",
    category: "WhatsApp bot + SEO brand",
    plans: [
      {
        plan: "Starter bot",
        price: "R5,000/mo — 1 WA number, 1 widget, 1,000 conversations",
        confidence: "public",
        source: "raimond.biz automotive chatbot page (historical/product)",
      },
      {
        plan: "Pro bot",
        price: "R10,000/mo — 5,000 conversations, white-label",
        confidence: "public",
        source: "raimond.biz automotive chatbot page (historical/product)",
      },
      {
        plan: "SEO retainer",
        price: "On request",
        confidence: "quote_only",
        source: "raimond.biz/pricing",
      },
    ],
    notes:
      "SEO site now leads with retainers on request; bot tier figures remain the best public chat-volume anchors in-market.",
  },
  {
    name: "AI Automated Solutions",
    category: "Custom AI agency",
    plans: [
      {
        plan: "Dealership automation band",
        price: "R2,500–R26,000/mo",
        confidence: "public",
        source: "aiautomatedsolutions.co.za",
      },
      {
        plan: "Typical build",
        price: "R14,900/mo",
        confidence: "public",
        source: "aiautomatedsolutions.co.za",
      },
      {
        plan: "Complex / multi-system",
        price: "R50,000+/mo",
        confidence: "public",
        source: "aiautomatedsolutions.co.za",
      },
    ],
  },
  {
    name: "Privyr",
    category: "Mobile CRM",
    plans: [
      {
        plan: "Free Forever",
        price: "$0 (limited)",
        confidence: "public",
        source: "privyr.com/pricing",
      },
      {
        plan: "Pro",
        price: "~$25–35/user/mo (+ ~$0.10/lead distribution)",
        confidence: "public",
        source: "privyr.com / G2",
      },
      {
        plan: "Ultimate",
        price: "Contact sales",
        confidence: "quote_only",
        source: "privyr.com/pricing",
      },
    ],
    notes: "USD pricing. 5 seats ≈ R3–4k+ ZAR/mo before lead fees (FX varies).",
  },
  {
    name: "Leadtrekker",
    category: "Lead management",
    plans: [
      {
        plan: "Per user",
        price: "From R249/user/mo",
        confidence: "public",
        source: "Leadtrekker blog",
      },
    ],
  },
  {
    name: "DealershipIQ",
    category: "WhatsApp chatbot",
    plans: [
      {
        plan: "All plans",
        price: "Not published — demo / quote",
        confidence: "quote_only",
        source: "dealershipiq.co",
      },
    ],
    notes: "Budget against WhatsApp AI band ~R4k–R12k/mo when scoping.",
  },
  {
    name: "Trinstel",
    category: "WhatsApp AI studio",
    plans: [
      {
        plan: "Assistant + CRM",
        price: "Not published — AI audit / 7-day trial",
        confidence: "quote_only",
        source: "trinstel.com",
      },
    ],
  },
  {
    name: "Conversio (AmbitX)",
    category: "Horizontal WhatsApp AI",
    plans: [
      {
        plan: "Sales agent",
        price: "Custom ZAR, month-to-month, no setup fees",
        confidence: "quote_only",
        source: "ambitx.ai",
      },
    ],
  },
  {
    name: "CarLeads",
    category: "Dealer CRM",
    plans: [
      {
        plan: "Platform",
        price: "Quote only",
        confidence: "quote_only",
        source: "carleads.co.za",
      },
    ],
  },
  {
    name: "lieKa / Closer CRM",
    category: "DMS + CRM",
    plans: [
      {
        plan: "Stack",
        price: "Quote / debit-order",
        confidence: "quote_only",
        source: "lieka.co.za",
      },
    ],
  },
  {
    name: "AutoTrader / Cars.co.za",
    category: "Marketplace",
    plans: [
      {
        plan: "Dealer packages",
        price: "Sales-quoted (traffic, not software OS)",
        confidence: "quote_only",
        source: "dealer sales",
      },
    ],
  },
];

export const PRICING_STRATEGY = {
  principle:
    "GrayArx is an AI-native dealership OS (sales + parts + service + recovery + proof). Price like an OS, not like a cheap chatbot. Free pilot hooks; paid tiers sit at or above Raimond Pro for Professional.",
  grayArx: [
    { plan: "Pilot", price: "R0 / 14 days", why: "Proof before pay" },
    {
      plan: "Starter OS",
      price: "R5,990/mo",
      why: "Above Visio Scale (R5k) & Raimond Starter (R5k) — sells outcomes not chats",
    },
    {
      plan: "Professional OS",
      price: "R11,990/mo",
      why: "Above Raimond Pro (R10k); below agency typical R14.9k — full sales+parts+service OS",
    },
    {
      plan: "Enterprise OS",
      price: "From R19,990/mo",
      why: "Multi-yard / MotorX-class footprint without custom agency R50k+",
    },
  ],
  whyNotCheaper:
    "Undercutting taught the market we were a bolt-on. We run more modules than Visio/Raimond and a clearer product than MotorX's AI-assist story — premium price matches premium OS.",
};
