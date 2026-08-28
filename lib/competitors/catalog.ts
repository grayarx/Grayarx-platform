/**
 * Competitive intel for GrayArx sales (Themba) and product planning.
 * Prices: public figures where known; otherwise bands / "quote only".
 * Rule: never trash competitors — sell the conversion layer beside them.
 */

export type CompetitorCategory =
  | "full_platform"
  | "dealer_crm"
  | "dms"
  | "whatsapp_ai"
  | "whatsapp_nurture"
  | "mobile_crm"
  | "marketplace"
  | "agency_automation"
  | "seo_bot";

export type CompetitorId =
  | "motorx"
  | "carleads"
  | "lieka_closer"
  | "adas"
  | "autosoft"
  | "jouver"
  | "vmg"
  | "dealershipiq"
  | "trinstel"
  | "conversio"
  | "raimond"
  | "visio_bdc"
  | "privyr"
  | "autotrader"
  | "cars_co_za"
  | "ai_automated"
  | "leadtrekker"
  | "autohub";

export type PricingNote = {
  /** Human-readable public or estimated band */
  public: string;
  /** Confidence for sales use */
  confidence: "public" | "estimated" | "quote_only";
  /** Notes for internal use */
  notes?: string;
};

export type CategoryScore = {
  category: string;
  they: string;
  we: string;
  /** How we beat or coexist */
  beat: string;
};

export type Competitor = {
  id: CompetitorId;
  name: string;
  aliases: string[];
  category: CompetitorCategory;
  categoryLabel: string;
  website?: string;
  sells: string[];
  pricing: PricingNote;
  strengths: string[];
  gaps: string[];
  sameAsGrayArx: "no" | "partial" | "closest";
  coexistence: string;
  oneLiner: string;
  talkTrack: string;
  sayNever: string;
  categories: CategoryScore[];
  productLessons: string[];
};

export const COMPETITORS: Competitor[] = [
  {
    id: "motorx",
    name: "MotorX",
    aliases: ["motor x", "motor-x", "motorx.co.za"],
    category: "full_platform",
    categoryLabel: "Full dealership growth platform",
    website: "https://motorx.co.za",
    sells: [
      "Smart lead CRM (AutoTrader, Cars.co.za, FB, WhatsApp, phone)",
      "WhatsApp Business inbox, templates, broadcasts",
      "AI-drafted replies & follow-up sequences (assists humans)",
      "Stock syndication to marketplaces + website",
      "Finance tools, e-sign contracts, multi-branch",
      "Sales analytics, social auto-post packages",
    ],
    pricing: {
      public: "Custom ZAR — Starter / Professional / Enterprise",
      confidence: "quote_only",
      notes:
        "Month-to-month, 30-day cancel. No ZAR on site — demo required. Treat as full-suite cost, typically well above a conversion-only agent.",
    },
    strengths: [
      "One login for CRM + stock + WhatsApp team inbox",
      "Strong SA marketplace integrations",
      "Finance + contracts in the same OS",
      "Multi-branch / group story",
    ],
    gaps: [
      "AI drafts for staff — does not own the buyer alone after hours",
      "Lead can still sit in CRM overnight until a human opens it",
      "No Monday ROI proof of recovered marketplace leads → booked viewings",
      "Full platform commit vs thin conversion pilot",
    ],
    sameAsGrayArx: "no",
    coexistence:
      "Keep MotorX as the dealership OS. GrayArx sits on top of their leads and converts after-hours → booked viewing.",
    oneLiner:
      "MotorX runs the dealership. GrayArx never lets an AutoTrader lead go cold overnight.",
    talkTrack:
      "Perfect — keep MotorX. We don't replace your CRM or stock feeds. We sit on the leads MotorX and AutoTrader already collect and turn after-hours enquiries into booked viewings before your team opens. Free parallel pilot — nothing to switch off.",
    sayNever: "Cancel MotorX / we're better at everything.",
    categories: [
      {
        category: "After-hours buyer chat",
        they: "WhatsApp inbox + AI suggestions for staff",
        we: "Nala answers alone from live stock",
        beat: "Own the first response when nobody is online",
      },
      {
        category: "Marketplace lead at 21:00",
        they: "Lead lands in CRM until morning",
        we: "Instant reply → qualify → book viewing",
        beat: "Speed-to-lead while interest is hot",
      },
      {
        category: "Missed call",
        they: "Often logged / missed",
        we: "WhatsApp recovery in under 60s",
        beat: "Recover the call they already paid to get",
      },
      {
        category: "Proof",
        they: "Platform feature list",
        we: "Monday ROI: recovered leads + viewings booked",
        beat: "Outcome report, not a module tour",
      },
      {
        category: "Risk & price",
        they: "Full suite (custom multi-module)",
        we: "Conversion-only tier + free pilot",
        beat: "Cheaper lane, zero cancel of MotorX",
      },
    ],
    productLessons: [
      "Must integrate / webhook into MotorX CRM — friend the platform",
      "Never rebuild stock syndication or e-sign first",
      "Win on autonomous after-hours + Monday proof",
    ],
  },
  {
    id: "carleads",
    name: "CarLeads",
    aliases: ["car leads", "carleads.co.za"],
    category: "dealer_crm",
    categoryLabel: "Motor dealership CRM",
    website: "https://carleads.co.za",
    sells: [
      "Lead pipeline for motor dealers",
      "Stock + AutoTrader / Cars.co.za sync",
      "WhatsApp & email follow-ups / automation rules",
      "Deal tracking, multi-branch, analytics",
    ],
    pricing: {
      public: "Quote only (not published)",
      confidence: "quote_only",
    },
    strengths: ["Dealer-native CRM", "Marketplace integrations", "Automation rules"],
    gaps: [
      "CRM for humans — not a buyer-facing AI showroom",
      "No live-stock conversation agent as the product",
    ],
    sameAsGrayArx: "partial",
    coexistence: "CarLeads = pipeline. GrayArx = first-mile conversion into that pipeline.",
    oneLiner: "They organise the deal. We create the booked viewing that fills it.",
    talkTrack:
      "CarLeads is solid for pipeline. We don't ask you to rip it out — we fill it with warmer, booked viewings from after-hours and marketplace leads. Pilot beside it.",
    sayNever: "Replace your CRM.",
    categories: [
      {
        category: "Lead capture",
        they: "Centralised CRM inbox",
        we: "AI first reply + booking before CRM task",
        beat: "Fewer cold leads sitting in New",
      },
    ],
    productLessons: ["CRM webhook / push booked leads into CarLeads"],
  },
  {
    id: "lieka_closer",
    name: "lieKa Closer CRM",
    aliases: ["lieka", "closer crm", "lie ka"],
    category: "dealer_crm",
    categoryLabel: "DMS-linked CRM",
    website: "https://lieka.co.za/closer-crm/",
    sells: [
      "Lead capture from web, FB, Google, WhatsApp",
      "Follow-ups and deal stages",
      "Sync with lieKa DMS (stock, invoicing)",
    ],
    pricing: {
      public: "Quote / debit-order with lieKa stack",
      confidence: "quote_only",
    },
    strengths: ["Tight DMS link", "Communication + CRM together"],
    gaps: ["Still human-led response", "Not a conversion AI product"],
    sameAsGrayArx: "no",
    coexistence: "Keep DMS + Closer. Add GrayArx for overnight conversion.",
    oneLiner: "Closer tracks the deal. GrayArx creates the appointment overnight.",
    talkTrack:
      "Keep lieKa for stock and invoicing. We only own the buyer conversation until a viewing is booked — then hand off into Closer.",
    sayNever: "Rip out your DMS.",
    categories: [],
    productLessons: ["Optional handoff to Closer / lieKa later"],
  },
  {
    id: "adas",
    name: "Adas DMS",
    aliases: ["adasoft", "adas dms", "adas"],
    category: "dms",
    categoryLabel: "Classic dealer management (back-office)",
    website: "https://adasoft.co.za",
    sells: [
      "Stock costing, buy/sell, VAT, SAPS register",
      "Floorplan, invoices, website + advertiser feeds",
      "Long tenure with independent used-car dealers",
    ],
    pricing: {
      public: "~R1,200–R1,500/mo DMS band + cloud/user fees; websites R3.3k–R9.8k packages (quoted)",
      confidence: "estimated",
      notes: "Partial public figures from comparison sites; confirm on call.",
    },
    strengths: ["Compliance + accounting depth", "Trusted by independents"],
    gaps: ["Not buyer AI", "Not after-hours conversion"],
    sameAsGrayArx: "no",
    coexistence: "Adas owns the yard books. GrayArx owns the buyer at 9pm.",
    oneLiner: "We never compete with Adas on invoices — we fill the diary.",
    talkTrack:
      "Adas is your back office — keep it. GrayArx is the conversion layer on AutoTrader and WhatsApp so those leads become viewings. Free pilot, no DMS change.",
    sayNever: "We replace Adas.",
    categories: [],
    productLessons: ["Never build DMS first", "Feed bookings into Adas later if needed"],
  },
  {
    id: "autosoft",
    name: "Autosoft (XSOFT)",
    aliases: ["autosoft", "xsoft"],
    category: "dms",
    categoryLabel: "Dealership management software",
    website: "https://xsoft.co.za/software/autosoft",
    sells: [
      "Commissions, VAT, invoices, OTP",
      "Stock, floorplan, reconditioning, reporting",
    ],
    pricing: {
      public: "Packages from ~R9,500 (license structure; yearly after year 2)",
      confidence: "public",
      notes: "Standard 5-user package; additional users extra.",
    },
    strengths: ["Deep ops tooling", "20+ year trust"],
    gaps: ["Zero buyer-facing AI"],
    sameAsGrayArx: "no",
    coexistence: "Ops software stays. Conversion sits on top.",
    oneLiner: "Autosoft runs the books. We book the buyers.",
    talkTrack:
      "You're sorted on management software. We're only here for after-hours and marketplace conversion into booked viewings.",
    sayNever: "Switch off Autosoft.",
    categories: [],
    productLessons: [],
  },
  {
    id: "jouver",
    name: "Jouver",
    aliases: ["jouver"],
    category: "dms",
    categoryLabel: "Lightweight DMS / stock",
    website: "https://www.jouver.com",
    sells: ["Stock/DMS lite for independents", "Localised subscriptions"],
    pricing: {
      public: "Free up to 10 vehicles; from ~R179/mo SA",
      confidence: "public",
    },
    strengths: ["Cheap entry", "Transparent pricing"],
    gaps: ["Not a conversion AI"],
    sameAsGrayArx: "no",
    coexistence: "Complementary — different job.",
    oneLiner: "Cheap stock system ≠ after-hours closer.",
    talkTrack:
      "Jouver handles stock admin. We handle the buyer who messages at night — different budget line.",
    sayNever: "",
    categories: [],
    productLessons: [],
  },
  {
    id: "vmg",
    name: "VMG DMS",
    aliases: ["vmg", "vmg software"],
    category: "dms",
    categoryLabel: "Independent dealer DMS",
    website: "https://vmgsoftware.co.za",
    sells: ["Lite / Pro / Accounting packages", "Mobile disc scan, TransUnion pricing"],
    pricing: {
      public: "Quote only",
      confidence: "quote_only",
    },
    strengths: ["SA independent focus", "Lot operations"],
    gaps: ["Not conversion AI"],
    sameAsGrayArx: "no",
    coexistence: "Keep DMS; add conversion.",
    oneLiner: "Ops vs conversion — different products.",
    talkTrack:
      "VMG is for running the yard. GrayArx is for converting AutoTrader and WhatsApp into viewings overnight.",
    sayNever: "",
    categories: [],
    productLessons: [],
  },
  {
    id: "dealershipiq",
    name: "DealershipIQ",
    aliases: ["dealership iq", "mooniq", "moon iq"],
    category: "whatsapp_ai",
    categoryLabel: "WhatsApp chatbot for dealers",
    website: "https://dealershipiq.co",
    sells: [
      "24/7 WhatsApp FAQ + brochures",
      "Book test drives",
      "CRM handoff / agent takeover",
    ],
    pricing: {
      public: "Not public (demo / quote)",
      confidence: "quote_only",
      notes: "Budget against WhatsApp AI band ~R4k–R12k/mo when scoping.",
    },
    strengths: ["Clear dealer WhatsApp pitch", "Handover to sales"],
    gaps: [
      "Chatbot channel only — not full marketplace recovery stack",
      "May not prove Monday ROI on recovered AutoTrader leads",
      "Stock-truth depth varies by implementation",
    ],
    sameAsGrayArx: "closest",
    coexistence:
      "If they already pay for a WA bot, run a proof pilot: live stock + marketplace ingest + missed-call + Monday numbers.",
    oneLiner: "Same channel — we win on live stock, marketplace recovery, and proof.",
    talkTrack:
      "DealershipIQ covers WhatsApp chat — fair. Ask them: does it answer from live stock, recover AutoTrader leads at 9pm, and show Monday viewings booked? We run a free side-by-side on your stock so the numbers decide.",
    sayNever: "Their bot is useless.",
    categories: [
      {
        category: "WhatsApp replies",
        they: "FAQ + book test drive",
        we: "Live stock truth + qualify + book",
        beat: "Fewer wrong answers on sold cars",
      },
      {
        category: "Lead sources",
        they: "WhatsApp inbound",
        we: "WhatsApp + marketplace + missed call",
        beat: "Wider recovery net",
      },
      {
        category: "Proof",
        they: "Demo / features",
        we: "Monday ROI report",
        beat: "Outcome over chatbot story",
      },
    ],
    productLessons: [
      "Must be clearly better on live inventory + multi-source recovery",
      "Parts/service WhatsApp is a later Growth wedge vs pure sales bots",
    ],
  },
  {
    id: "trinstel",
    name: "Trinstel",
    aliases: ["trinstel"],
    category: "whatsapp_ai",
    categoryLabel: "WhatsApp AI studio (sales + service)",
    website: "https://trinstel.com",
    sells: [
      "24/7 WhatsApp qualify + book (sales & service)",
      "Parts availability queries, service booking",
      "CRM integration (DealerSocket, HubSpot, Zoho…)",
      "Live in ~14 days; 7-day trial messaging",
    ],
    pricing: {
      public: "Not public (AI audit / trial)",
      confidence: "quote_only",
    },
    strengths: [
      "Sales + service + parts angle",
      "Fast deployment story",
      "CRM connector list",
    ],
    gaps: [
      "Studio/custom build vs productised dealer conversion engine",
      "Less emphasis on SA marketplace lead recovery proof",
    ],
    sameAsGrayArx: "closest",
    coexistence: "Compete on productised ROI + free pilot; copy their parts/service roadmap later.",
    oneLiner: "They sell WhatsApp AI studio. We sell booked viewings from your paid leads.",
    talkTrack:
      "Trinstel is a solid WhatsApp assistant story. Our wedge is marketplace lead recovery + missed-call WhatsApp + Monday proof on your stock — productised, free pilot, no 14-day build theatre. Parts and service are on our Growth roadmap once sales conversion is proven.",
    sayNever: "They're just an agency.",
    categories: [
      {
        category: "Parts / service",
        they: "Already in pitch",
        we: "Sales conversion first → parts module next",
        beat: "Win sales ROI now; roadmap parts to match",
      },
    ],
    productLessons: [
      "PRIORITY: parts & service WhatsApp to close this gap",
      "Publish CRM connectors list",
    ],
  },
  {
    id: "conversio",
    name: "Conversio (AmbitX)",
    aliases: ["conversio", "ambitx", "ambit x"],
    category: "whatsapp_ai",
    categoryLabel: "Horizontal WhatsApp AI sales agent",
    website: "https://ambitx.ai/products/conversio",
    sells: [
      "24/7 WhatsApp qualify + book for any industry",
      "POPIA, SA languages, ZAR pricing",
      "Live in ~2 weeks",
    ],
    pricing: {
      public: "Custom ZAR, month-to-month",
      confidence: "quote_only",
    },
    strengths: ["Strong WA agent UX", "Compliance messaging", "11 languages"],
    gaps: ["Not stock-native / dealer-native", "No AutoTrader recovery product"],
    sameAsGrayArx: "partial",
    coexistence: "Horizontal agent vs vertical dealer conversion.",
    oneLiner: "General WhatsApp AI vs dealer live-stock conversion.",
    talkTrack:
      "Conversio is a general sales agent. We're built for yards — live vehicle stock, marketplace leads, missed calls, Monday dealer ROI. Different job.",
    sayNever: "",
    categories: [],
    productLessons: ["Lean into vertical dealer proof hard"],
  },
  {
    id: "raimond",
    name: "Raimond",
    aliases: ["raymond bot", "raimond bot", "raimond"],
    category: "seo_bot",
    categoryLabel: "SEO + WhatsApp bot",
    sells: ["Automotive WhatsApp bot", "SEO packages"],
    pricing: {
      public: "Bot ~R5,000/mo (1k chats) / ~R10,000/mo (5k chats)",
      confidence: "estimated",
      notes: "Use as price anchor — undercut on conversion-only packages.",
    },
    strengths: ["Clear chat-volume pricing", "SEO bundle"],
    gaps: ["Generic bot economics", "Not conversion proof"],
    sameAsGrayArx: "no",
    coexistence: "Price under Raimond Pro while selling outcomes not chat counts.",
    oneLiner: "They sell chats. We sell booked viewings — usually cheaper.",
    talkTrack:
      "Raimond-style bots often sit at R5–10k for chat volume. Our Convert package is typically R2.5–4k for live-stock recovery and booked viewings — and the pilot is free so you only pay if Monday looks good.",
    sayNever: "",
    categories: [
      {
        category: "Pricing",
        they: "R5k–R10k chat tiers",
        we: "R2.5k–R4k conversion tier + free pilot",
        beat: "Cheaper + outcome-priced",
      },
    ],
    productLessons: ["Publish clear ZAR packages vs chat-volume competitors"],
  },
  {
    id: "visio_bdc",
    name: "Visio BDC",
    aliases: ["visio", "visio bdc"],
    category: "whatsapp_nurture",
    categoryLabel: "WhatsApp nurture / signal templates",
    website: "https://visio-bdc.vercel.app",
    sells: [
      "38 buying-intent signals → WhatsApp templates",
      "Shared inbox / kanban handoff",
    ],
    pricing: {
      public: "R1,500 / R3,000 / R5,000 per month",
      confidence: "public",
    },
    strengths: ["Transparent pricing", "Signal automation"],
    gaps: ["Templates for humans — not AI closing first mile", "Not live-stock Q&A"],
    sameAsGrayArx: "no",
    coexistence: "They nudge humans. We answer the buyer.",
    oneLiner: "Templates alert staff. Nala books the viewing.",
    talkTrack:
      "Visio is great for templated nurture at R1.5–5k. We sit one layer closer to the sale — AI answers from live stock and books the viewing, then your team closes. Can run beside templates.",
    sayNever: "",
    categories: [
      {
        category: "Automation depth",
        they: "Signal → template → human",
        we: "Lead → AI → booked viewing → human",
        beat: "First mile done before staff open WhatsApp",
      },
    ],
    productLessons: ["Price Convert above Visio Starter, below their Scale + Raimond"],
  },
  {
    id: "privyr",
    name: "Privyr",
    aliases: ["privyr"],
    category: "mobile_crm",
    categoryLabel: "Mobile lead-response CRM",
    sells: [
      "Fast lead alerts (incl. marketplace)",
      "Human WhatsApp / SMS templates",
      "Lead distribution to reps",
    ],
    pricing: {
      public: "Free tier; Pro ~$25–35/user/mo + ~$0.10/lead distribution (USD)",
      confidence: "public",
    },
    strengths: ["Speed-to-lead for humans", "Simple mobile UX"],
    gaps: ["Humans still must reply", "After-hours gap remains"],
    sameAsGrayArx: "no",
    coexistence: "Privyr wakes the rep. GrayArx replies when the rep is asleep.",
    oneLiner: "They speed humans up. We cover when humans aren't there.",
    talkTrack:
      "Privyr helps your team respond faster on their phones — keep it for daytime. After 6pm and Sundays, GrayArx answers and books so the lead isn't cold by Monday.",
    sayNever: "",
    categories: [],
    productLessons: [],
  },
  {
    id: "autotrader",
    name: "AutoTrader",
    aliases: ["auto trader", "autotrader sa"],
    category: "marketplace",
    categoryLabel: "Marketplace / buyer traffic",
    sells: ["Listings", "Buyer traffic", "Dealer digital tools / reporting"],
    pricing: {
      public: "Dealer packages (sales-quoted)",
      confidence: "quote_only",
    },
    strengths: ["Demand / traffic", "Brand buyers already use"],
    gaps: ["Not a conversation layer", "Leads go cold without dealer response"],
    sameAsGrayArx: "no",
    coexistence: "NEVER compete. Convert their traffic.",
    oneLiner: "You already pay for traffic. We convert it.",
    talkTrack:
      "AutoTrader brings the buyers — we never replace that. We make sure the lead at 9pm gets a live-stock reply and a booked viewing instead of waiting until morning.",
    sayNever: "Cancel AutoTrader / we're like AutoTrader.",
    categories: [],
    productLessons: ["Lead ingest API is table stakes"],
  },
  {
    id: "cars_co_za",
    name: "Cars.co.za",
    aliases: ["cars.co.za", "cars co za", "cars co.za"],
    category: "marketplace",
    categoryLabel: "Marketplace / buyer traffic",
    sells: ["Listings", "Buyer enquiries"],
    pricing: {
      public: "Dealer packages (quoted)",
      confidence: "quote_only",
    },
    strengths: ["SA traffic"],
    gaps: ["Same as any marketplace — conversion is on the dealer"],
    sameAsGrayArx: "no",
    coexistence: "Convert, don't replace.",
    oneLiner: "Traffic source — we convert it.",
    talkTrack:
      "Same story as AutoTrader — keep paying for Cars.co.za traffic; we convert the enquiry into a booked viewing after hours.",
    sayNever: "Replace Cars.co.za.",
    categories: [],
    productLessons: ["Ingest Cars leads alongside AutoTrader"],
  },
  {
    id: "ai_automated",
    name: "AI Automated Solutions",
    aliases: ["ai automated", "aiautomated"],
    category: "agency_automation",
    categoryLabel: "Custom AI automation agency",
    website: "https://aiautomatedsolutions.co.za",
    sells: [
      "WhatsApp lead capture",
      "Stock sync",
      "Missed-call / re-engagement builds",
    ],
    pricing: {
      public: "R2,500–R26,000/mo; typical build ~R14,900/mo",
      confidence: "public",
    },
    strengths: ["Flexible custom builds", "Broad automation menu"],
    gaps: ["Agency pricing / project risk", "Not a fixed dealer product"],
    sameAsGrayArx: "partial",
    coexistence: "Undercut agency retainers with a productised Convert tier.",
    oneLiner: "Custom agency vs productised conversion — we win on price clarity and pilot.",
    talkTrack:
      "Custom AI builds often land R15k/mo. Our Convert package is a fixed product at a fraction of that, free pilot, Monday ROI — no project scope creep.",
    sayNever: "",
    categories: [
      {
        category: "Pricing clarity",
        they: "R2.5k–R26k / ~R15k typical",
        we: "R2.5–4k Convert + free pilot",
        beat: "Product price vs agency quote",
      },
    ],
    productLessons: ["Stay productised — avoid becoming a custom agency"],
  },
  {
    id: "leadtrekker",
    name: "Leadtrekker",
    aliases: ["lead trekker", "leadtrekker"],
    category: "mobile_crm",
    categoryLabel: "General SA lead management",
    sells: ["Lead management", "WhatsApp / ads integrations"],
    pricing: {
      public: "From ~R249/user/mo",
      confidence: "public",
    },
    strengths: ["Cheap seats", "Local LMS"],
    gaps: ["Not dealer vertical conversion AI"],
    sameAsGrayArx: "no",
    coexistence: "Generic LMS vs dealer conversion.",
    oneLiner: "Cheap CRM seats aren't an after-hours stock agent.",
    talkTrack:
      "Leadtrekker is fine for logging leads. We answer the buyer from your live cars and book the viewing — different line item.",
    sayNever: "",
    categories: [],
    productLessons: [],
  },
  {
    id: "autohub",
    name: "auto-HUB",
    aliases: ["auto hub", "autohub", "egmsa"],
    category: "dealer_crm",
    categoryLabel: "OEM / dealer lead management hub",
    sells: ["Lead distribution & reporting for dealer networks"],
    pricing: {
      public: "Quote / OEM-driven",
      confidence: "quote_only",
    },
    strengths: ["Network-scale reporting", "OEM footprint"],
    gaps: ["Not Nala-style buyer AI"],
    sameAsGrayArx: "no",
    coexistence: "Enterprise lead hub — integrate later, don't replace.",
    oneLiner: "Network LMS vs yard conversion agent.",
    talkTrack:
      "If auto-HUB distributes leads across the group, we still convert the ones that hit your yard after hours into booked viewings.",
    sayNever: "",
    categories: [],
    productLessons: [],
  },
];

export const GRAYARX_PACKAGES = [
  {
    id: "pilot",
    name: "Pilot",
    price: "R0 / 14 days",
    target: "Any yard (esp. MotorX / bot users)",
    includes: [
      "Nala on their live stock",
      "Web + one channel",
      "Monday recovery report",
    ],
  },
  {
    id: "convert",
    name: "Convert",
    price: "R2,490–R3,990/mo",
    target: "MotorX / Adas / Visio users who need conversion only",
    includes: [
      "Web + WhatsApp",
      "Marketplace lead recovery",
      "Missed-call → WhatsApp",
      "Monday ROI",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "R4,990–R7,990/mo",
    target: "Yards without a full platform / higher volume",
    includes: [
      "Everything in Convert",
      "Branded showroom / embed",
      "Higher volume",
      "Invoice / pay links",
      "Parts & service WhatsApp (roadmap)",
    ],
  },
  {
    id: "group",
    name: "Group",
    price: "Custom",
    target: "Multi-yard groups",
    includes: ["Multi-branch", "SSO", "SLA", "CRM webhooks (MotorX/CarLeads)"],
  },
] as const;

/** Ordered product bets to win every category without becoming MotorX */
export const BEAT_ROADMAP = [
  {
    phase: "Now (table stakes)",
    items: [
      "Live AutoTrader + Cars.co.za lead ingest",
      "Production Meta WhatsApp send",
      "Missed-call → WhatsApp recovery (Twilio)",
      "Auto Monday email ROI report",
      "CRM webhook into MotorX / CarLeads",
    ],
  },
  {
    phase: "Next (close cousin gaps)",
    items: [
      "Parts & service WhatsApp (beat Trinstel pitch)",
      "Trade-in capture → appraiser handoff",
      "Finance pre-qual partner link (don't build a bank)",
      "Multi-branch stock routing",
    ],
  },
  {
    phase: "Later (premium, still not DMS)",
    items: [
      "Buyer showroom embed / branded site",
      "No-show reminders + rebook",
      "Group reporting / SSO",
    ],
  },
  {
    phase: "Do not build first",
    items: [
      "Full DMS (Adas/Autosoft already cheap & deep)",
      "Cancel-AutoTrader features",
      "Social Shorts / marketing factory until conversion proven",
      "E-sign + full finance OS (MotorX lane)",
    ],
  },
] as const;

export const PRICE_BANDS = [
  {
    band: "WhatsApp nurture / BDC templates",
    range: "R1,500–R5,000/mo",
    examples: "Visio BDC",
  },
  {
    band: "WhatsApp AI / chatbots",
    range: "~R4,000–R12,000/mo (often quote-only; Raimond R5–10k)",
    examples: "DealershipIQ, Trinstel, Conversio, Raimond",
  },
  {
    band: "Custom AI agency builds",
    range: "R2,500–R26,000/mo (typical ~R14,900)",
    examples: "AI Automated Solutions",
  },
  {
    band: "DMS / back-office",
    range: "~R179–R1,500+/mo entry; Autosoft packages from ~R9,500",
    examples: "Jouver, Adas, Autosoft, VMG",
  },
  {
    band: "Full dealership platform",
    range: "Custom ZAR (Starter → Enterprise)",
    examples: "MotorX",
  },
  {
    band: "GrayArx Convert (suggested)",
    range: "R2,490–R3,990/mo (+ free 14-day pilot)",
    examples: "Undercuts Raimond & agencies; sits under full MotorX",
  },
] as const;
