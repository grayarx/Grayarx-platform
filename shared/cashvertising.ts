/**
 * Dealer-principal pitch copy — Home, /for-dealers, onboarding, pilot email.
 *
 * Speak like a yard: stock, floor, test drives, after-hours WhatsApp, CSV / DMS.
 * No competitor brands. No invented testimonials or conversion %.
 * Proof is their own leakage math + this week's numbers on their stock.
 *
 * SEO meta stays in seo.ts. Prices stay in subscriptionTiers / SEO_OS_OFFERS.
 */

export const CASH_PILOT_DAYS = 14;
export const CASH_PILOT_WA_CAP = 150;

export const CASH_CTAS = {
  primary: "Start my 14-day Pilot — no card",
  seeCost: "See what after-hours is costing",
  howItWorks: "See how it works",
  formSubmit: "Put Nala on my stock",
  onboarding: "Prove it on my stock — R0 / 14 days",
  selfServe: "Or open self-serve setup →",
  applyPilot: "Apply for the 14-day Pilot",
} as const;

export const CASH_RISK_REVERSAL = [
  `R0 for ${CASH_PILOT_DAYS} days — 150 WhatsApp conversations, hard cap`,
  "No credit card. Month-to-month after you see this week's numbers",
  "Runs next to your current listings and DMS — nothing to rip out",
  "GrayArx onboarding — our team works your first stock file with you",
] as const;

/** Who the desk is built for — independent used / multi-brand, WhatsApp-heavy. */
export const CASH_FOR_YOU_IF = [
  "You run an independent used or multi-brand yard",
  "Buyers already WhatsApp you from your listings or the yard number",
  "Leads go cold after 6pm — or sit unread while you are with a customer",
  "You can drop a CSV or DMS export of live stock",
  "The dealer principal still takes the after-hours calls",
] as const;

export const CASH_PAS = {
  problem: "Your after-hours WhatsApp is feeding the dealer who replies.",
  agitate: [
    "That buyer already raised a hand on a car you are paying to list. Silence hands the drive to the next yard.",
    "The WhatsApp at 9pm is hotter than the browse at lunch — and they will not wait until 8am.",
    "Follow-up that depends on whoever remembers is not a process. It is a leak.",
    "A dated website tells a 2026 buyer your stock might be dated too.",
  ],
  solve:
    "Drop your CSV. Nala answers tonight from your live stock, books the test drive, and covers parts, service, and missed calls. Monday you see this week's numbers — not a pitch deck.",
} as const;

export const CASH_FASCINATIONS = [
  "Why a 9pm “is this still available?” is worth more than a noon listing click",
  "How one recovered deal at R12,000 gross covers Starter OS (R7,990) with change",
  "What the buyer does in the 11 hours you stay silent",
  "Why sold-stays-sold on CSV stops Nala quoting a car you already moved",
  "The Monday brief that names recovered deals vs the R14,990 desk",
] as const;

export const CASH_HOME = {
  eyebrow: "For dealer principals",
  h1Before: "Every unanswered 9pm WhatsApp is a deal you ",
  h1Accent: "already paid for",
  sub:
    "Give us your CSV. Nala answers tonight from your stock, books the test drive, and shows this week's numbers. 14 days. R0. No card.",
  trustLine: "Free 14-day Pilot · No credit card · Live on your stock",
  pathEyebrow: "Same-day path",
  pathH2Before: "From your stock file to a ",
  pathH2Accent: "booked test drive",
  pathSub:
    "Recovered after-hours deals pay for the OS. This is the loop we run on your yard — same day.",
  qualifierEyebrow: "Built for the floor",
  qualifierH2: "Built for the dealer principal who still takes the after-hours calls",
  qualifierSub:
    "Independent used and multi-brand stock. Heavy WhatsApp. Live CSV. If that is your yard, the 14-day Pilot is how you prove it.",
  forYouLabel: "This desk fits if",
  pasEyebrow: "What silence actually costs",
  pasH2: "They asked about the car. The chat sat unread.",
  capabilitiesEyebrow: "What you get",
  capabilitiesH2Before: "The desk that ",
  capabilitiesH2Accent: "pays for itself",
  capabilitiesSub:
    "Not a chatbot widget. A dealership OS for after-hours leakage — Nala on WhatsApp, with template replies if the language model is down. South Africa first, live in AU, UK, UAE, US, and NZ.",
  ctaEyebrow: "14 days on your stock",
  ctaH2Before: "Prove this week's numbers on ",
  ctaH2Accent: "your stock",
  ctaSub:
    "14 days, 150 WhatsApp conversations. Nala OS — showroom, parts, service, missed-call recovery, this week's numbers. Then most yards keep Professional at R14,990/mo because the leakage already cost more.",
} as const;

export const CASH_FOR_DEALERS = {
  eyebrow: "For dealer principals",
  h1Before: "See exactly what unanswered 9pm WhatsApps ",
  h1Accent: "cost your yard",
  sub:
    "Yards lose deals after 6pm on WhatsApp. Put your stock live, catch those leads overnight, and book the test drive — 14-day Pilot until you see this week's numbers on your cars.",
  proofH2: "What the 14-day Pilot actually proves",
  closeH2: "Ready when your next after-hours lead hits",
  closeSub:
    "Tell us the yard. GrayArx will get CSV and WhatsApp live and prove one recovered path on your stock. No card. Our team does the first stock file with you.",
  reasonWhy:
    "We start with after-hours because that is where gross is already leaking. Runs next to your listings and DMS. After the Pilot, most yards keep Professional OS (R14,990/mo). Month-to-month once you see proof.",
} as const;

export const CASH_ONBOARDING = {
  h1: "Prove recovered deals on your stock",
  sub:
    "14-day Pilot — Nala WhatsApp, live showroom, parts, service, missed-call recovery. No card. We review every application within one business day. GrayArx works your first stock file with you.",
  submit: "Start my 14-day Pilot",
  thanksH1: "You're in — we'll put stock live.",
  thanksSub: "Our team will review your application within one business day.",
} as const;

export const CASH_FORM = {
  scarcity: "GrayArx onboarding — our team still does the first night with you",
  h3: "Start your 14-day Pilot",
  sub: "3 fields. 2 minutes. Nala OS on your stock — no card.",
  trust: "✓ No credit card · ✓ CSV live the same day · ✓ POPIA compliant",
  proofTitle: "Proof you can check — not a quote we wrote",
  proofBody:
    "Run the numbers on this page. Then we prove one recovered after-hours path on your stock. This week's numbers decide.",
} as const;

export const CASH_ROI = {
  eyebrow: "Your yard's numbers",
  h3: "Put in your after-hours volume. See what silence costs.",
  sub: "Use your ignored WhatsApps and gross on one deal. Recovered drives vs Nala OS (Professional R14,990/mo).",
} as const;

export const CASH_FLOATING = {
  eyebrow: "After-hours leak",
  body: "Nala answers 9pm WhatsApps from your live stock — 14-day Pilot, no card.",
  cta: "Stop the leak",
} as const;

export const CASH_PROOF_STEPS = [
  {
    title: "Drop your CSV",
    desc: "DMS or spreadsheet — your stock becomes the source of truth the same day.",
  },
  {
    title: "Showroom goes live",
    desc: "Buyers browse your yard, not a dump of every listing on the internet.",
  },
  {
    title: "WhatsApp after hours",
    desc: "Nala answers when you are closed. Mia follows up the cold ones. Missed calls bounce to WhatsApp.",
  },
  {
    title: "Drives in your inbox",
    desc: "Bookings and leads land where the floor already works. Monday: this week's numbers.",
  },
] as const;

export const CASH_CAPABILITIES = [
  {
    title: "After-hours that actually reply",
    desc: "Nala on WhatsApp plus Mia follow-up so overnight interest becomes a booked test drive — not a missed-call list the next yard farms.",
  },
  {
    title: "Your stock, one truth",
    desc: "CSV / DMS sync keeps showroom, chat, and WhatsApp on the same cars. Sold stays sold. Nala never quotes a unit you already moved.",
  },
  {
    title: "Buyer path that closes",
    desc: "Trade-in → finance → pre-approval → booking on the car they want — without five browser tabs.",
  },
  {
    title: "Built for dealers, not theatre",
    desc: "POPIA-aware flows, 11 SA languages, and human control — ZA first, with yards in AU, UK, UAE, US, and NZ.",
  },
] as const;

export const CASH_PILOT_FEATURES = [
  "Nala on WhatsApp from live stock",
  "CSV / DMS showroom",
  "Parts + service desk",
  "Trade-in intake",
  "Missed-call recovery",
  "This week's numbers",
  "Mia follow-up drip",
  "Test-drive bookings",
] as const;

export const CASH_MARQUEE = [
  "After-hours WhatsApp",
  "Dealership OS — Nala",
  "CSV stock live tonight",
  "Parts + service desk",
  "Missed-call recovery",
  "This week's numbers",
  "Free 14-day Pilot",
  "ZA · AU · UK · UAE · US · NZ",
] as const;

export const CASH_FOR_DEALERS_PROOF = [
  "CSV / DMS stock live on your showroom the same day",
  "WhatsApp after hours — Nala answers; missed calls bounce to WhatsApp",
  "Parts desk, service bookings, and trade-in intake on Professional OS",
  "This week's numbers so you see recovered deals vs the R14,990 desk",
  "14-day Pilot (150 WA cap) — then Starter R7,990 or Professional R14,990/mo",
] as const;

/** Pilot email — after-hours leak, live stock, 14-day Pilot. */
export const CASH_EMAIL_SEGMENTS = {
  no_website_social_only: {
    subject: "How to turn Facebook stock into a 24/7 showroom (14-day Pilot)",
    headline: "Your Facebook cars deserve a showroom that captures the lead",
    hook: "You're already posting stock. Buyers still WhatsApp at 9pm — and wait. GrayArx puts those cars on a live showroom and answers while you sleep.",
    bullets: [
      "Live inventory page buyers can browse from your social bio",
      "Nala on WhatsApp from that same stock — 11 SA languages",
      "Lerato pencils test drives; Tumi takes trade-in enquiries",
      "No DMS change — runs next to how you already sell",
    ],
  },
  basic_website_no_showroom: {
    subject: "Give us your CSV — buyers on your cars tonight",
    headline: "Add a live showroom — no website rebuild",
    hook: "Your site lists cars, but buyers still phone instead of self-serving. GrayArx plugs a live showroom and WhatsApp desk on top of what you already have.",
    bullets: [
      "Vehicle chat on every listing (colour, price, finance, availability)",
      "WhatsApp auto-replies with specialist routing (booking vs trade-in)",
      "Lead inbox with reference numbers — nothing falls through",
      "14-day Pilot on your stock — no card, 150 WhatsApp cap",
    ],
  },
  after_hours_leak: {
    subject: "Your 9pm WhatsApps are paying the next dealer",
    headline: "Stop losing buyers after 5pm",
    hook: "Most “is this still available?” messages arrive evenings and weekends. Silence for 11 hours is a decision — the next yard that replies gets the drive.",
    bullets: [
      "Nala answers after hours from your live CSV stock",
      "Missed calls bounce to WhatsApp with a reference (POPIA-safe)",
      "Morning summary for your sales team — this week's numbers",
      "14-day Pilot — GrayArx works the first stock file with you",
    ],
  },
  whatsapp_manual: {
    subject: "WhatsApp that books the test drive while you sleep",
    headline: "WhatsApp that books test drives for you",
    hook: "You're already on WhatsApp — that's the desk. GrayArx connects Meta Cloud API so Nala answers stock questions and Lerato pencils drives while you sleep.",
    bullets: [
      "Intent routing: booking → Lerato, trade-in → Tumi, general → Nala",
      "Uses your existing business number (Meta Cloud API)",
      "Multilingual — Afrikaans, isiZulu, English + 8 more",
      "14-day Pilot — our team does the first night with you",
    ],
  },
} as const;

export const CASH_EMAIL_SCARCITY =
  "GrayArx onboarding · we review every yard within one business day · first stock file is done with you";

export const CASH_SALES_SUBJECTS = {
  sipho: (dealershipName: string) =>
    `${dealershipName}: what happens to your 9pm WhatsApps?`,
  intro: "Your 9pm WhatsApps are paying the next dealer",
  followup: "Give us 14 days on your stock — then this week's numbers decide",
  last: "The next after-hours lead will not wait",
} as const;

export const CASH_ELEVATOR =
  "GrayArx stops after-hours WhatsApps dying on your phone. You drop a CSV; Nala answers from your live stock, books the test drive, and shows this week's numbers. 14-day Pilot is R0 — then most yards keep Professional OS at R14,990/mo because recovered deals already paid for it.";

export const CASH_ELEVATOR_WRITTEN =
  "After-hours WhatsApp from live stock — 14-day Pilot R0, then Professional R14,990/mo.";
