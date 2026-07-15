/**
 * Dealer Q&A Playbook — structured knowledge for dealer-support agents.
 *
 * Source of truth for copy/tone: docs/DEALER_QA_PLAYBOOK.md (v3).
 * This module is what ships in the Railway build (docs/ is not bundled).
 *
 * Inject into dealer-facing / support-facing agents only.
 * Do NOT inject into buyer-facing Nala (WhatsApp / showroom stock Q&A).
 */

export type DealerQaTheme =
  | "elevator"
  | "price_billing"
  | "whatsapp_meta"
  | "ai_nala"
  | "inventory_vin"
  | "multi_branch"
  | "popia_trust"
  | "support_contract"
  | "website_integrations"
  | "objections"
  | "product_truths";

export type DealerQaEntry = {
  id: string;
  theme: DealerQaTheme;
  /** Dealer-facing question (or objection label). */
  question: string;
  /** Spoken / chat answer — lead with the win, ≤ 2–3 sentences. */
  answer: string;
  /** Short paste for SMS/WhatsApp when useful. */
  written?: string;
  /** Caveat — never invent production status. */
  note?: string;
  /** Keywords for deterministic matching (lowercase). */
  keywords: string[];
  /** Phrases never to say when handling this topic. */
  neverSay?: string[];
};

export const DEALER_QA_VERSION = "2026-07-v3";

export const DEALER_QA_THEMES: Record<
  DealerQaTheme,
  { label: string; description: string }
> = {
  elevator: { label: "Elevator", description: "30-second pitch" },
  price_billing: { label: "Price & billing", description: "Cost, tiers, payment, caps" },
  whatsapp_meta: { label: "WhatsApp & Meta", description: "Business number, go-live timing" },
  ai_nala: { label: "AI (Nala)", description: "What you get, languages, training" },
  inventory_vin: { label: "Inventory & VIN", description: "CSV stock, VIN, photos" },
  multi_branch: { label: "Multi-branch", description: "groupKey + Branch switcher" },
  popia_trust: { label: "POPIA & trust", description: "STOP/START, lead ownership" },
  support_contract: { label: "Support & contract", description: "Go-live, bugs, pilot terms" },
  website_integrations: { label: "Website & integrations", description: "Embed, email, SMS" },
  objections: { label: "Tough objections", description: "Say this / never say" },
  product_truths: { label: "Product truths", description: "July 2026 cheat-sheet" },
};

/** Agents that may receive the full commercial playbook in system prompts. */
export const DEALER_QA_AGENT_IDS = ["improvement", "prospector"] as const;

export function agentGetsDealerQaPlaybook(agentId: string): boolean {
  return (DEALER_QA_AGENT_IDS as readonly string[]).includes(agentId);
}

/**
 * Full structured playbook (~32 Q&As + objections + truths).
 * Keep display names Showroom / Growth / Multi-site. No Manus Forge for chat.
 */
export const DEALER_QA_ENTRIES: DealerQaEntry[] = [
  {
    id: "elevator",
    theme: "elevator",
    question: "What is GrayArx in 30 seconds?",
    answer:
      "GrayArx gives your yard a 24/7 AI assistant — Nala by default — on webchat and, on Growth+, WhatsApp. She answers from your live inventory, books viewings, and drops warm leads in your inbox. Buyers get a branded showroom and embed; you get CSV stock, shortcodes, and invoices you can pay by card or EFT.",
    written:
      "AI sales floor on WhatsApp and your website that never closes — priced for SA independents.",
    keywords: ["what is grayarx", "elevator", "pitch", "overview", "in a nutshell"],
  },
  {
    id: "q1_cost",
    theme: "price_billing",
    question: "What does it cost?",
    answer:
      "Pilot partners get Growth-level features at a founder-friendly monthly rate we agree on the call — not a per-seat CRM tax. Public site keeps list prices soft until post-pilot. Packaged tiers after that: Showroom, Growth, Multi-site.",
    written:
      "Pilot = Growth features @ negotiated monthly. Public prices stay soft. Tiers: Showroom → Growth → Multi-site.",
    note: "Do not invent a public ZAR figure unless founder confirmed today’s floor.",
    keywords: ["cost", "price", "pricing", "how much", "fee", "monthly", "subscription"],
  },
  {
    id: "q2_tiers",
    theme: "price_billing",
    question: "What’s in Showroom vs Growth vs Multi-site?",
    answer:
      "Showroom = public showroom, inventory/CSV, leads, bookings, webchat Nala, click-to-chat WhatsApp. Growth adds Cloud API WhatsApp bot, higher AI/message caps, deal-score, photo angles. Multi-site = Growth plus multi-branch (groupKey + Branch switcher), highest caps, dedicated onboarding.",
    note: "Internal ids are starter / professional / enterprise — always say the display names to dealers.",
    keywords: [
      "showroom vs",
      "growth vs",
      "multi-site",
      "multisite",
      "tiers",
      "plans",
      "what's included",
      "difference between",
    ],
  },
  {
    id: "q3_pay",
    theme: "price_billing",
    question: "How do we pay — card or EFT?",
    answer:
      "Both when set up: Stripe for card, or GrayArx-branded invoices with FNB EFT pay-to details from secure settings. You choose what fits the yard.",
    note: "Never paste full bank details into WhatsApp demos; invoices mask sensitive digits.",
    keywords: ["pay", "payment", "card", "eft", "stripe", "invoice", "bank", "fnb"],
  },
  {
    id: "q4_caps",
    theme: "price_billing",
    question: "What happens if we go over the message / AI cap?",
    answer:
      "Each tier has fair-use caps (AI sessions and WhatsApp volume). We soft-block with a clear message so a runaway bot doesn’t blow the bill; we talk overage if you’re consistently hot.",
    note: "Showroom ~400 AI/mo, click-to-chat only; Growth ~1,200 AI + ~2,000 WA msgs; Multi-site ~3,500 AI + ~8,000 WA.",
    keywords: ["cap", "overage", "limit", "quota", "message limit", "ai cap", "fair use"],
  },
  {
    id: "q5_wa_business",
    theme: "whatsapp_meta",
    question: "Do we need a WhatsApp Business number / Meta?",
    answer:
      "For the Cloud API bot: yes — a verified WhatsApp Business number on Meta, webhooks subscribed, then we link phone_number_id. Pilot partners still get Growth features at the pilot price even before Meta is done — you’re not dropped to Showroom. Without WA Business you just can’t run Cloud API Nala on WhatsApp yet; webchat + wa.me click-to-chat still work.",
    written:
      "Pilot = Growth features @ pilot price. Cloud API WhatsApp needs Meta WA Business. No Meta yet → still Growth web/showroom/leads/webchat; only the WhatsApp bot waits.",
    note: "Auto-link works when Meta’s display number matches exactly one unbound dealership’s contactPhone.",
    keywords: [
      "whatsapp business",
      "meta",
      "cloud api",
      "phone_number_id",
      "need whatsapp",
      "wa business",
    ],
  },
  {
    id: "q6_new_number",
    theme: "whatsapp_meta",
    question: "Do I need a new number?",
    answer:
      "Prefer your existing WhatsApp Business number if Meta will verify it for Cloud API — buyers keep messaging the number they know. Only get a new number if the current one can’t be moved to Business / Cloud API cleanly.",
    note: "Never promise “same personal phone tomorrow” if Business Manager is a mess — Meta timing is theirs.",
    keywords: ["new number", "same number", "change number", "different number"],
    neverSay: ["Live on Meta tonight", "No WA Business = you’re on Showroom"],
  },
  {
    id: "q7_wa_timeline",
    theme: "whatsapp_meta",
    question: "How long until WhatsApp is live?",
    answer:
      "Provision + shortcode + CSV can be same day; WhatsApp AI goes live once Meta verify + webhook subscribe are done. Target useful yard in ~48 hours; WA may slip if Meta queues you.",
    note: "Don’t promise same-day WA if their Business Manager isn’t ready.",
    keywords: ["how long", "whatsapp live", "go live whatsapp", "when is whatsapp", "timeline"],
  },
  {
    id: "q8_what_we_get",
    theme: "ai_nala",
    question: "What exactly do we get?",
    answer:
      "A public showroom, AI on webchat (all tiers) and WhatsApp Cloud API on Growth+, live stock answers from your DB, booking links, lead inbox, website embed. Default assistant name Nala — rename in Settings. Shortcode powers /book, /apply, /embed/{shortcode}.",
    note: "Humans are optional for handoff — not required for every reply.",
    keywords: ["what do we get", "what exactly", "features", "what’s included", "capabilities"],
  },
  {
    id: "q9_after_hours",
    theme: "ai_nala",
    question: "Does it work after hours?",
    answer:
      "Yes — Nala answers 24/7 on the channels you have live, so late-night and weekend buyers still get stock answers and next steps. Your team wakes up to leads and bookings.",
    note: "Complex finance / trade-ins escalate to humans; AI does not approve credit.",
    keywords: ["after hours", "24/7", "weekend", "overnight", "late night", "always on"],
  },
  {
    id: "q10_replace_sales",
    theme: "ai_nala",
    question: "Will it replace my salespeople?",
    answer:
      "No — it answers the 11pm “is the Hilux still available?” so your floor spends time on test drives and closes. Humans own negotiation, trade-in, and finance.",
    note: "Never pitch “fire half the floor.”",
    keywords: ["replace", "salespeople", "sales team", "fire", "staff", "employees"],
    neverSay: ["You can fire people", "It replaces your sales team"],
  },
  {
    id: "q11_ai_wrong",
    theme: "ai_nala",
    question: "What if the AI is wrong?",
    answer:
      "Stock answers are searched against your dealership’s inventory — if it’s not in the DB, we say so. Low-confidence or failed paths land in your fallback / human queue with a reference. Fix the stock row; the next answer follows the DB. Templates still reply if the LLM is briefly offline.",
    written:
      "Answers from your stock DB. Wrong listing → fix inventory. Fallback queue if unsure. Templates cover LLM outages.",
    note: "OpenAI polishes when quota is up; otherwise deterministic templates. No Manus Forge for chat.",
    keywords: ["wrong", "hallucinate", "incorrect", "mistake", "ai wrong", "inaccurate"],
    neverSay: ["100% accurate", "never hallucinates"],
  },
  {
    id: "q12_train_customers",
    theme: "ai_nala",
    question: "Do you train on our customers / our chats?",
    answer:
      "No — we don’t sell a story that we “train on your customers.” The assistant gets sharper from deal outcomes you mark, FAQs you add, and keeping inventory accurate — not from harvesting buyer chats into a public model.",
    note: "Point to privacy / POPIA docs if they want it in writing.",
    keywords: ["train on", "training data", "chatgpt", "openai train", "customer chats", "learn from chats"],
    neverSay: ["We train on all your customer chats"],
  },
  {
    id: "q13_rename_nala",
    theme: "ai_nala",
    question: "Can we rename Nala?",
    answer:
      "Yes — Settings → custom assistant name (up to 40 characters). Greetings, WhatsApp disclosure, and opt-out copy use that name.",
    note: "Blank = Nala.",
    keywords: ["rename", "custom name", "assistant name", "change nala", "brand the bot"],
  },
  {
    id: "q14_languages",
    theme: "ai_nala",
    question: "What languages?",
    answer:
      "Built for SA — English, Afrikaans, isiZulu, isiXhosa, and the other official languages, plus Portuguese for diaspora buyers. Matches the buyer’s language when detection is clear.",
    note: "Strongest in EN/AF; rarer languages may be shorter / more careful.",
    keywords: ["language", "languages", "afrikaans", "zulu", "xhosa", "multilingual", "portuguese"],
  },
  {
    id: "q15_stock_csv",
    theme: "inventory_vin",
    question: "How does stock get in — Cars.co.za sync?",
    answer:
      "Pilot path is honest: CSV import (and manual edits) into your GrayArx inventory. That DB is what Nala and the showroom use. Live Cars.co.za sync is not the pilot promise — we can map their CSV exports; we don’t claim a always-on classifieds scrape as the product.",
    written:
      "Pilot = CSV (or manual) into GrayArx. Not live Cars.co.za sync yet. Nala answers from your GrayArx stock.",
    note: "Sold stays sold on re-import; R1 placeholders hidden from public until fixed.",
    keywords: [
      "cars.co.za",
      "cars co za",
      "csv",
      "stock sync",
      "inventory sync",
      "import stock",
      "classifieds",
    ],
    neverSay: ["Live Cars.co.za sync is included in the pilot"],
  },
  {
    id: "q16_vin",
    theme: "inventory_vin",
    question: "What about VIN?",
    answer:
      "VIN is optional. If you enter one, it must be a valid ISO 3779 VIN — 17 characters, correct check digit (no I, O, Q). Public showroom and customer-facing docs mask it; staff see what they need in the dealer console.",
    note: "Invalid VIN on CSV import soft-warns — fix in Inventory rather than inventing stock.",
    keywords: ["vin", "chassis", "iso 3779", "vehicle identification"],
  },
  {
    id: "q17_photos",
    theme: "inventory_vin",
    question: "Photos — do you host them?",
    answer:
      "You can keep photos on external URLs from the CSV, or optionally mirror them into GrayArx storage for durability. Mirroring is optional — not forced — so light yards aren’t paying for storage they don’t need.",
    note: "Weak photos = weak WhatsApp trust; showroom credibility = photos + price + km.",
    keywords: ["photos", "images", "host photos", "mirror", "storage", "picture"],
  },
  {
    id: "q18_branches",
    theme: "multi_branch",
    question: "We have three branches.",
    answer:
      "Each branch is its own dealership record — own stock, WhatsApp, shortcode — linked by one groupKey. Staff with sibling branches get a Branch switcher in the console. That’s the Multi-site packaging.",
    note: "Import stock per branch — never mix yards in one CSV.",
    keywords: ["branch", "branches", "multi-branch", "groupkey", "group key", "multi site", "locations"],
  },
  {
    id: "q19_popia",
    theme: "popia_trust",
    question: "What about POPIA / people saying STOP?",
    answer:
      "Buyers can reply STOP (or unsubscribe / opt-out) and we stop proactive automated follow-ups. Reply START turns help back on. First chats acknowledge POPIA processing for the enquiry.",
    written: "STOP = stop automated follow-ups. START = resume. Enquiry processing disclosed up front.",
    note: "Dealer still owns lawful basis for their own outbound marketing campaigns.",
    keywords: ["popia", "privacy", "stop", "opt-out", "opt out", "unsubscribe", "gdpr", "consent"],
  },
  {
    id: "q20_leads_own",
    theme: "popia_trust",
    question: "Who owns the leads?",
    answer:
      "You do. Leads and bookings sit in your dealership account for your team to work. GrayArx is the platform processing them to deliver the service — we don’t resell your buyer list to other dealers.",
    note: "Point at dealer agreement / DPA / privacy hub if legal asks for paper.",
    keywords: ["who owns", "our leads", "lead ownership", "data ownership", "resell leads"],
    neverSay: ["We own the data", "we can sell your CRM"],
  },
  {
    id: "q21_go_live",
    theme: "support_contract",
    question: "How long to go live?",
    answer:
      "Most yards: provision + shortcode same day; stock CSV + photos in a few hours; WhatsApp once Meta is ready. Target: useful in 48 hours.",
    note: "Meta verification can delay WA only.",
    keywords: ["go live", "how long to launch", "onboarding time", "setup time", "48 hours"],
  },
  {
    id: "q22_support",
    theme: "support_contract",
    question: "Who do we call when something breaks?",
    answer:
      "Founder-led support for pilots — hello@grayarx.com / founder cell on the onboarding pack. In Dealer Help chat, say Report a bug: … — that opens a ticket and Kagiso starts investigating, proposing a fix for founder approval (no silent prod writes). Growth and Multi-site get priority paths; Multi-site includes phone + named contact packaging.",
    note: "Check webhook health first on WhatsApp issues. See docs/PILOT_SLA.md for honest response targets.",
    keywords: ["support", "breaks", "bug", "help desk", "who do we call", "contact support", "sla"],
  },
  {
    id: "q23_contract",
    theme: "support_contract",
    question: "What’s the contract / pilot terms?",
    answer:
      "Pilot agreement and POPIA consent before go-live — dealer agreement and consent form on grayarx.com/legal. Default is month-to-month with 30 days’ notice; we also offer a 12-month commit with founder rate lock if you want price certainty. We don’t lock you into a five-year CRM.",
    written:
      "Month-to-month (cancel ~30 days) or 12-month commit (rate lock). SLA: docs/PILOT_SLA.md.",
    note: "Don’t improvise legal terms on the call.",
    keywords: ["contract", "pilot terms", "cancel", "month-to-month", "12-month", "commitment", "agreement"],
  },
  {
    id: "q24_website",
    theme: "website_integrations",
    question: "Can it go on our own website?",
    answer:
      "Yes — Dealer → Settings → Website embed. Copy-paste iframe or script. Same shortcode drives book and apply URLs. Works beside your existing site — no full rebuild.",
    note: "WordPress shortcode plugin only if they want [grayarx_book …]; plain iframe needs no plugin.",
    keywords: ["website", "embed", "iframe", "wordpress", "own site", "widget"],
  },
  {
    id: "q25_email_sms",
    theme: "website_integrations",
    question: "Email / SMS?",
    answer:
      "Transactional lead and booking mail is live (Resend). Twilio SMS is optional later — don’t sell it as included today.",
    note: "Never promise SMS as default on Showroom.",
    keywords: ["sms", "email", "twilio", "resend", "text message"],
    neverSay: ["Twilio SMS is included and live"],
  },
  {
    id: "o1_cars_co_za",
    theme: "objections",
    question: "Why not just Cars.co.za?",
    answer:
      "Keep Cars.co.za — that’s where a lot of demand starts. GrayArx is the always-on reply and booking layer once someone messages you or lands on your showroom. Classifieds get attention; we convert the conversation from your live stock. We are not an ad-buy agency and we don’t replace your listing spend.",
    neverSay: ["Cars.co.za is useless", "Cancel your listings"],
    keywords: ["why not cars", "just use cars.co", "vs cars.co", "instead of cars"],
  },
  {
    id: "o2_look_stupid",
    theme: "objections",
    question: "What if AI is wrong and we look stupid?",
    answer:
      "We don’t invent cars that aren’t in your inventory. Wrong answers are almost always stale stock — fix the row, mark sold, keep photos/prices current. Anything dicey goes to your human queue with a reference so a salesperson owns the close.",
    neverSay: ["100% accurate / never hallucinates"],
    keywords: ["look stupid", "embarrass", "reputation", "trust ai"],
  },
  {
    id: "o3_new_wa_number",
    theme: "objections",
    question: "Do I need a new WhatsApp number?",
    answer:
      "Only if your current number can’t sit on Meta WhatsApp Business / Cloud API. Ideal path: same Business number buyers already use, verified, webhooks on, we link it (auto-link if contact phone matches Meta display). Until then you keep Growth webchat + click-to-chat — not a Showroom downgrade.",
    neverSay: ["Live on Meta tonight", "No WA Business = you’re on Showroom"],
    keywords: ["need a new whatsapp", "new whatsapp number"],
  },
  {
    id: "o4_leads",
    theme: "objections",
    question: "Who owns the leads? (objection)",
    answer:
      "Your dealership. We process them to run Nala, bookings, and your inbox — we don’t shop your leads to the dealer next door.",
    neverSay: ["We own the data / we can sell your CRM"],
    keywords: ["shop your leads", "sell our leads"],
  },
  {
    id: "o5_replace_team",
    theme: "objections",
    question: "Will this replace my team?",
    answer:
      "It replaces silence after hours — not your closers. Floor still owns trade-in, finance, and the handshake.",
    neverSay: ["You can fire people"],
    keywords: ["replace my team", "replace staff"],
  },
  {
    id: "o6_ads",
    theme: "objections",
    question: "We already pay for Facebook ads / a media buyer.",
    answer:
      "Keep them. We make sure the buyers those ads already send you get a fast, accurate answer from your stock — we don’t buy the clicks.",
    neverSay: ["Fire your agency"],
    keywords: ["facebook ads", "media buyer", "agency", "ad spend", "marketing agency"],
  },
  {
    id: "o7_openai_train",
    theme: "objections",
    question: "Is my data training ChatGPT / OpenAI on my customers?",
    answer:
      "We use OpenAI to polish replies when the key and quota are up; otherwise templates. We improve the product from outcomes and FAQs you control — not a pitch that we train foundation models on your buyers. See privacy / POPIA docs for processing detail.",
    neverSay: ["We train on all your customer chats to make the model smarter for everyone"],
    keywords: ["training chatgpt", "openai on my", "foundation model"],
  },
];

export const DEALER_QA_NEVER_SAY: string[] = [
  "It replaces your sales team / fire people.",
  "100% accurate every time / never hallucinates.",
  "Live on Meta tonight when unverified or webhooks off.",
  "Multi-branch is live for all dealers without ops for that group.",
  "Exact public ZAR if pricing page is still soft — unless founder confirmed.",
  "We paste your FNB account in WhatsApp.",
  "Unlimited free AI on thousands of cars with unlimited chats.",
  "POPIA fully handled — you don’t need consent forms.",
  "Twilio SMS is included and live.",
  "OpenAI is required for any reply — templates cover outages.",
  "Manus Forge powers the chat.",
  "Live Cars.co.za sync is included in the pilot.",
  "We train on your customers’ chats.",
];

export const DEALER_QA_PRODUCT_TRUTHS: Array<{ truth: string; line: string }> = [
  {
    truth: "Tiers",
    line: "Showroom, Growth, Multi-site — pilot is Growth features at a deal we agree.",
  },
  { truth: "Pricing", line: "Public prices soft during pilot." },
  {
    truth: "Channels",
    line: "Webchat on Showroom; Cloud API WhatsApp on Growth+.",
  },
  {
    truth: "LLM",
    line: "OpenAI when available; templates always have a backstop. No Forge for chat.",
  },
  {
    truth: "STOP",
    line: "Buyers reply STOP — automated follow-ups stop; START resumes.",
  },
  {
    truth: "VIN",
    line: "Optional; if you enter it, it must be a real 17-character VIN; masked publicly.",
  },
  {
    truth: "Stock",
    line: "CSV into your GrayArx inventory — not live Cars.co.za sync yet. Sold stays sold; R1 hidden from public until fixed.",
  },
  {
    truth: "Support",
    line: "Bug report → Kagiso investigates → founder approves fix. Pilot SLA in docs/PILOT_SLA.md.",
  },
  {
    truth: "Contract",
    line: "Month-to-month or 12-month commit with founder rate lock.",
  },
  {
    truth: "Photos",
    line: "External URLs fine; mirroring into our storage is optional.",
  },
  {
    truth: "Learning",
    line: "Sharper from outcomes and FAQs you add — not ‘we train on your customers.’",
  },
  { truth: "Leads", line: "Your leads stay yours." },
  {
    truth: "Multi-branch",
    line: "One dealership per branch + groupKey + Branch switcher.",
  },
  {
    truth: "Billing",
    line: "Stripe and/or FNB EFT on branded invoices when set.",
  },
];

/** Compact prompt block for dealer-support LLM system prompts. */
let _promptBlockCache: string | null = null;

export function formatDealerQaForSystemPrompt(): string {
  if (_promptBlockCache) return _promptBlockCache;

  const lines: string[] = [
    `## GrayArx Dealer Q&A Playbook (${DEALER_QA_VERSION})`,
    "Use these answers for dealer / founder / sales questions about product, pricing, WhatsApp, POPIA, contracts, SLA, VIN, multi-branch, inventory.",
    "Tone: SA dealer — confident, plain, no hype. Answers ≤ 2–3 sentences. Lead with the win.",
    "Display names only: Showroom / Growth / Multi-site. Chat LLM: OpenAI → templates. No Manus Forge for chat.",
    "",
  ];

  for (const entry of DEALER_QA_ENTRIES) {
    lines.push(`### ${entry.id}: ${entry.question}`);
    lines.push(`Say: ${entry.answer}`);
    if (entry.note) lines.push(`Note: ${entry.note}`);
    if (entry.neverSay?.length) {
      lines.push(`Never say: ${entry.neverSay.join(" / ")}`);
    }
    lines.push("");
  }

  lines.push("### Never-say list");
  for (const n of DEALER_QA_NEVER_SAY) {
    lines.push(`- ${n}`);
  }
  lines.push("");
  lines.push("### Product truths");
  for (const t of DEALER_QA_PRODUCT_TRUTHS) {
    lines.push(`- ${t.truth}: ${t.line}`);
  }

  _promptBlockCache = lines.join("\n");
  return _promptBlockCache;
}

/**
 * Deterministic match for dealer Help / FAQ paths.
 * Returns best entry when keyword score clears the threshold.
 */
export function matchDealerQa(
  message: string,
  opts?: { minScore?: number },
): DealerQaEntry | null {
  const query = message.trim().toLowerCase();
  if (query.length < 3) return null;

  const minScore = opts?.minScore ?? 2;
  let best: { entry: DealerQaEntry; score: number } | null = null;

  for (const entry of DEALER_QA_ENTRIES) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (query.includes(kw.toLowerCase())) {
        score += kw.includes(" ") ? 3 : 2;
      }
    }
    // Boost if question words appear
    const qWords = entry.question
      .toLowerCase()
      .replace(/[“”"‘’'?!.]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    for (const w of qWords) {
      if (query.includes(w)) score += 0.5;
    }
    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  if (!best || best.score < minScore) return null;
  return best.entry;
}

/** Format a matched entry for dealer Help chat (markdown). */
export function formatDealerQaReply(entry: DealerQaEntry): string {
  const parts = [entry.answer];
  if (entry.written) {
    parts.push("", `**Short paste:** ${entry.written}`);
  }
  if (entry.note) {
    parts.push("", `*Note:* ${entry.note}`);
  }
  return parts.join("\n");
}

export function dealerQaCount(): number {
  return DEALER_QA_ENTRIES.length;
}
