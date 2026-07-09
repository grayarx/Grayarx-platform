/**
 * Canonical agent personas — the "team roster" displayed on the Agents page
 * and used throughout the system for any agent-attributed action.
 *
 * Each agent is tied to a real-looking mailbox under @grayarx.com so dealers
 * can recognise them in their inbox. Configure the actual SMTP/IMAP later via
 * SendGrid / SES / Postmark; for now these are the canonical FROM addresses.
 */

export type AgentId =
  | "email"
  | "calling"
  | "booking"
  | "prospector"
  | "improvement"
  | "whatsapp"
  | "accountant"
  | "fallback"
  | "preapproval"
  | "tradein";

export type AgentPersona = {
  id: AgentId;
  displayName: string;
  role: string;
  email: string;
  signature: string;
  color: string; // Tailwind/CSS class for badges
  description: string;
  avatarUrl: string;
};

export const AGENTS: Record<AgentId, AgentPersona> = {
  email: {
    id: "email",
    displayName: "Mia",
    role: "Email Agent",
    email: "mia@grayarx.com",
    signature: "Mia · GrayArx Customer Concierge",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-mia-UEewSarNBdAgodzLRxVAU5.webp",
    description:
      "Replies to lead emails within seconds, in the customer's language. Follows up at smart intervals (day 1, 3, 7) until the lead either books a test drive or opts out.",
  },
  calling: {
    id: "calling",
    displayName: "Themba",
    role: "Calling Agent",
    email: "themba@grayarx.com",
    signature: "Themba · GrayArx Voice Concierge",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-themba-a4kg3nBuYDzsMeGY8onqkm.webp",
    description:
      "Places polite, on-brand outbound calls in a South African English voice. Qualifies buyers and pitches dealership prospects handed off by the Prospector.",
  },
  booking: {
    id: "booking",
    displayName: "Lerato",
    role: "Booking Agent",
    email: "lerato@grayarx.com",
    signature: "Lerato · GrayArx Booking Concierge",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-lerato-MHEMVdXmRiHSXFiXkpPCFN.webp",
    description:
      "Owns the test-drive calendar. Finds free slots, confirms appointments, and sends WhatsApp + email reminders before the booking.",
  },
  prospector: {
    id: "prospector",
    displayName: "Sipho",
    role: "Prospector Agent",
    email: "sipho@grayarx.com",
    signature: "Sipho · GrayArx Business Development",
    color: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-sipho-ntvMMNVigvLKKf5htoC6qD.webp",
    description:
      "Goes hunting at 05:00 SAST every night, rotating through SA provinces weekly. Scores each dealership 0–100 and hands the hot ones to the Calling Agent.",
  },
  improvement: {
    id: "improvement",
    displayName: "Kagiso",
    role: "Improvement Agent",
    email: "kagiso@grayarx.com",
    signature: "Kagiso · GrayArx Continuous Improvement",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-kagiso-5nPwDHzWaXXAEMZt5wdSQv.webp",
    description:
      "Reads every other agent's activity, the dashboard KPIs and the multilingual self-check scores. Writes a prioritised list of improvements with impact estimates, and applies the safe ones automatically — like a sales-ops manager that never sleeps.",
  },
  whatsapp: {
    id: "whatsapp",
    displayName: "Nala",
    role: "WhatsApp Agent",
    email: "nala@grayarx.com",
    signature: "Nala · GrayArx WhatsApp Concierge",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-nala-NLdVzsVDeAxVihGRKcbJEo.webp",
    description:
      "Drafts WhatsApp replies in the buyer's language using a casual, voice-note-like tone. Shorter than email, no formal sign-off, emoji-light. The same multilingual guardrails apply.",
  },
  accountant: {
    id: "accountant",
    displayName: "Thandi",
    role: "Accountant Agent",
    email: "thandi@grayarx.com",
    signature: "Thandi · GrayArx Accountant",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    avatarUrl: "",
    description:
      "Generates invoices, payment statements and VAT reconciliation. POPIA-aware: masks ID and bank-account numbers to last-4-digits in every customer-facing document.",
  },
  fallback: {
    id: "fallback",
    displayName: "Bongi",
    role: "Fallback Agent",
    email: "hello@grayarx.com",
    signature: "Bongi · GrayArx After-Hours Concierge",
    color: "text-slate-300 bg-slate-500/10 border-slate-500/30",
    avatarUrl: "",
    description:
      "Watches every channel after-hours. When no human is available, replies professionally with a reference number and books the customer for a callback first thing next business morning.",
  },
  tradein: {
    id: "tradein",
    displayName: "Tumi",
    role: "Trade-In Valuation Agent",
    email: "tumi@grayarx.com",
    signature: "Tumi · GrayArx Trade-In Concierge",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    avatarUrl: "",
    description:
      "Values trade-ins in seconds using an eight-factor South-African market model (year, mileage, condition, transmission, fuel, body type, service history, market). Writes a plain-language memo the dealer principal can hand to the buyer.",
  },
  preapproval: {
    id: "preapproval",
    displayName: "Naledi",
    role: "Pre-Approval Agent",
    email: "finance@grayarx.com",
    signature: "Naledi · GrayArx Finance Concierge",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    avatarUrl: "",
    description:
      "Walks finance applicants through the pre-approval steps in plain language, captures the documents and information a human F&I manager needs, and acknowledges every applicant with a reference number. Never grants approval \u2014 every decision is made by a human.",
  },
};

export const AGENT_LIST: AgentPersona[] = [
  AGENTS.email,
  AGENTS.calling,
  AGENTS.booking,
  AGENTS.prospector,
  AGENTS.improvement,
  AGENTS.whatsapp,
  AGENTS.accountant,
  AGENTS.fallback,
  AGENTS.preapproval,
  AGENTS.tradein,
];

/**
 * The single inbound mailbox dealers/customers can reply to.
 * (This is where Mia listens.)
 */
export const PRIMARY_INBOX = "hello@grayarx.com";
