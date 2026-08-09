/**
 * Dealer-facing help assistant — general navigation + bug reports only.
 * No agent roster, platform ops, or cross-dealer intelligence.
 */

import { PRIMARY_INBOX } from "./agents";
import {
  classifyDashboardIntent,
  type DashboardAssistantReply,
  type DashboardLink,
} from "./dashboardAssistant";
import {
  isInventoryBulkDeleteConfirm,
  isInventoryBulkDeleteRequest,
} from "./assistantActions";
import {
  formatDealerQaReply,
  matchDealerQa,
} from "./dealerQaPlaybook";

export type DealerHelpIntent =
  | "greeting"
  | "help"
  | "navigation"
  | "product_qa"
  | "inventory_bulk_delete"
  | "inventory_bulk_delete_confirm"
  | "bug_report"
  | "bug_report_prompt"
  | "restricted"
  | "unknown";

export type DealerHelpReply = DashboardAssistantReply & {
  intent: DealerHelpIntent;
  mode: "dealer";
  ticketId?: number;
};

const OWNER_ONLY_INTENTS = new Set([
  "agent_roster",
  "agent_status",
  "agent_activity",
  "dashboard_stats",
]);

const DEALER_NAV: Array<{
  keywords: RegExp[];
  href: string;
  label: string;
  blurb: string;
}> = [
  {
    keywords: [/\bcsv\b/i, /\bimport\b/i, /\bbulk\b/i],
    href: "/dealer/inventory/import",
    label: "CSV Import",
    blurb: "Bulk-import stock from a CSV file — it feeds your showroom.",
  },
  {
    keywords: [/\binventory\b/i, /\bstock\b/i, /\bvehicles?\b/i, /\bcars?\b/i],
    href: "/dealer/inventory",
    label: "Inventory",
    blurb: "Add, edit, and publish vehicles on your showroom.",
  },
  {
    keywords: [/\bleads?\b/i, /\benquir(y|ies)\b/i],
    href: "/dealer/leads",
    label: "Leads",
    blurb: "Inbound enquiries from web, email, and WhatsApp.",
  },
  {
    keywords: [/\bbookings?\b/i, /\btest[\s-]?drive/i, /\bcalendar\b/i],
    href: "/dealer/bookings",
    label: "Bookings",
    blurb: "Test drives and appointments on your calendar.",
  },
  {
    keywords: [/\bsettings?\b/i, /\bwhatsapp\b/i, /\btheme\b/i],
    href: "/dealer/settings",
    label: "Settings",
    blurb: "Showroom theme, WhatsApp wiring, and price fixes.",
  },
  {
    keywords: [/\bshowroom\b/i, /\bpublic\b/i],
    href: "/showroom",
    label: "Showroom",
    blurb: "Your public stock page — what buyers see.",
  },
  {
    keywords: [/\bphotos?\b/i, /\bimages?\b/i],
    href: "/dealer/csv-photo",
    label: "Photos",
    blurb: "8-angle uploads, AutoTrader image saves, and photo health.",
  },
  {
    keywords: [/\btrade[\s-]?in/i, /\btradeins?\b/i],
    href: "/dealer/trade-ins",
    label: "Trade-In Network",
    blurb: "Seller listings — invite owners for inspection.",
  },
  {
    keywords: [/\bdashboard\b/i, /\boverview\b/i],
    href: "/dashboard",
    label: "Dashboard",
    blurb: "Your dealership KPIs and recent activity.",
  },
];

export const DEALER_HELP_QUICK_PROMPTS = [
  "How do I import CSV?",
  "What does it cost?",
  "Do we need WhatsApp Business?",
  "Report a bug",
] as const;

export function isBugDescription(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 20) return false;
  return /\b(bug|error|broken|crash|not working|doesn't work|doesnt work|failed|issue|problem|can't|cannot|stuck|wrong|glitch|freeze)\b/i.test(
    trimmed,
  );
}

export function classifyDealerHelpIntent(message: string): DealerHelpIntent {
  const lower = message.trim().toLowerCase();
  if (!lower) return "unknown";

  // Founder-only agent names → redirect away from platform ops
  if (isFounderOnlyAgentQuestion(lower)) {
    return "restricted";
  }

  // Dealer-facing agent / roster questions → helpful dealer roster answer
  if (
    resolveAgentQuestion(lower) ||
    /\b(where (are|is) (my )?agents?|agent roster|my (ai )?team|ai teammates)\b/i.test(lower)
  ) {
    return "help";
  }

  const ownerIntent = classifyDashboardIntent(message);
  if (OWNER_ONLY_INTENTS.has(ownerIntent)) {
    // "WhatsApp" aliases to Nala in the owner classifier — don't block product Q&A
    const clearlyAgentOps =
      /\b(agent|roster|doing|status|where (are|is)|what did|my team)\b/i.test(lower);
    if (ownerIntent === "dashboard_stats") {
      return "restricted";
    }
    if (clearlyAgentOps || ownerIntent === "agent_roster") {
      return "help";
    }
  }

  if (/^(hi|hello|hey|howzit|good (morning|afternoon|evening))\b/.test(lower)) {
    return "greeting";
  }

  if (isInventoryBulkDeleteConfirm(lower)) {
    return "inventory_bulk_delete_confirm";
  }

  if (isInventoryBulkDeleteRequest(lower)) {
    return "inventory_bulk_delete";
  }

  if (/\b(help|what can you|how do i use|support)\b/i.test(lower) && !isBugDescription(message)) {
    return "help";
  }

  if (
    /\b(report (a )?bug|bug report|something (is )?broken|found a bug|log (a )?issue)\b/i.test(
      lower,
    )
  ) {
    return isBugDescription(message) ? "bug_report" : "bug_report_prompt";
  }

  if (isBugDescription(message)) return "bug_report";

  // Console nav wins when the message clearly points at a dealer page
  const navHit = DEALER_NAV.some((h) => h.keywords.some((re) => re.test(message)));
  if (
    navHit &&
    /\b(how (do|to)|where (do|to|is)|import|upload|navigate|go to|open)\b/i.test(lower)
  ) {
    return "navigation";
  }

  // Product / commercial Q&A from the dealer playbook
  if (matchDealerQa(message)) return "product_qa";

  if (
    /\b(how (do|to)|where (do|to|is)|import|upload|navigate|go to|open)\b/i.test(lower)
  ) {
    return "navigation";
  }

  if (ownerIntent === "navigation") return "navigation";
  if (ownerIntent === "help") return "help";

  return "unknown";
}

function resolveAgentQuestion(lower: string): boolean {
  return (
    /\b(where (are|is) (my )?agents?|agent roster|lerato|nala|mia|sipho|kagiso|themba|tumi|bongi|thandi|naledi)\b/i.test(
      lower,
    ) && /\b(agent|doing|status|where|what did)\b/i.test(lower)
  );
}

function isFounderOnlyAgentQuestion(lower: string): boolean {
  return /\b(sipho|kagiso|themba|thandi|prospector|improvement agent|accountant|compliance inbox|founder inbox)\b/i.test(
    lower,
  );
}

function buildDealerAgentsReply(): DealerHelpReply {
  return {
    mode: "dealer",
    intent: "help",
    links: [
      { label: "Leads", href: "/dealer/leads" },
      { label: "Bookings", href: "/dealer/bookings" },
    ],
    reply: [
      "Your AI runs **in the background 24/7** — you don’t manage an agent roster.",
      "",
      "What shows up for you:",
      "• **Leads** — WhatsApp / web / email enquiries (Nala + Mia)",
      "• **Bookings** — test-drive requests (Lerato)",
      "• Finance forms → your F&I queue (Naledi; humans decide)",
      "• Trade-ins → Trade-In Network (Tumi)",
      "• After-hours cover (Bongi)",
      "",
      "GrayArx founder tools (Sipho, Themba, Kagiso, Thandi, compliance inbox) are not in your console.",
    ].join("\n"),
  };
}

function buildRestrictedReply(): DealerHelpReply {
  return {
    mode: "dealer",
    intent: "restricted",
    links: [
      { label: "Leads", href: "/dealer/leads" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    reply: [
      "That tool is **GrayArx founder ops** — not part of your dealership console.",
      "",
      "Your AI works quietly in the background. Use **Leads**, **Bookings**, and **Inventory**.",
      "",
      "I can also help with CSV import, photos, or bug reports.",
      "",
      `Urgent support: **${PRIMARY_INBOX}**`,
    ].join("\n"),
  };
}

function buildDealerGreeting(): DealerHelpReply {
  return {
    mode: "dealer",
    intent: "greeting",
    links: [{ label: "Dashboard", href: "/dashboard" }],
    reply: [
      "Hi — I'm the **GrayArx Help** assistant for your dealership.",
      "",
      "Ask how to use the console, find a page, or **report a bug**. Our team reviews every ticket.",
    ].join("\n"),
  };
}

function buildDealerHelp(): DealerHelpReply {
  return {
    mode: "dealer",
    intent: "help",
    links: [
      { label: "CSV Import", href: "/dealer/inventory/import" },
      { label: "Inventory", href: "/dealer/inventory" },
    ],
    reply: [
      "I can help with:",
      "",
      "• **Product Q&A** — pricing, WhatsApp/Meta, POPIA, VIN, tiers, contract",
      "• **How do I…?** — CSV import, photos, leads, bookings, settings",
      "• **Delete all inventory** — bulk-remove your vehicles (with confirmation)",
      "• **Report a bug** — describe what broke and I'll log it for GrayArx support",
      "",
      `Email support: **${PRIMARY_INBOX}**`,
    ].join("\n"),
  };
}

function buildProductQaReply(message: string): DealerHelpReply {
  const entry = matchDealerQa(message);
  if (!entry) return buildDealerUnknown();

  return {
    mode: "dealer",
    intent: "product_qa",
    links: [
      { label: "Settings", href: "/dealer/settings" },
      { label: "CSV Import", href: "/dealer/inventory/import" },
    ],
    reply: formatDealerQaReply(entry),
  };
}

function buildDealerNavigation(message: string): DealerHelpReply {
  const matches = DEALER_NAV.filter((h) => h.keywords.some((re) => re.test(message)));

  if (matches.length === 0) {
    return {
      mode: "dealer",
      intent: "navigation",
      links: DEALER_NAV.slice(0, 4).map((h) => ({ label: h.label, href: h.href })),
      reply: [
        "Common pages in your console:",
        "• CSV Import · Inventory · Leads · Bookings · Photos · Settings · Showroom",
      ].join("\n"),
    };
  }

  const primary = matches[0]!;
  return {
    mode: "dealer",
    intent: "navigation",
    links: matches.slice(0, 3).map((h) => ({ label: h.label, href: h.href })),
    reply: [`**${primary.label}** — ${primary.blurb}`, "", `Open **${primary.label}** from the sidebar or tap the link below.`].join(
      "\n",
    ),
  };
}

function buildBugReportPrompt(): DealerHelpReply {
  return {
    mode: "dealer",
    intent: "bug_report_prompt",
    links: [],
    reply: [
      "To log a bug, reply with:",
      "",
      "1. What you were trying to do",
      "2. What happened instead",
      "3. Any error message you saw",
      "",
      "Example: *CSV import fails on row 12 — says invalid price*",
    ].join("\n"),
  };
}

export function buildBugReportConfirmation(input: {
  ticketId: number;
  title: string;
}): DealerHelpReply {
  return {
    mode: "dealer",
    intent: "bug_report",
    ticketId: input.ticketId,
    links: [{ label: "Dashboard", href: "/dashboard" }],
    reply: [
      `Thanks — I've logged **ticket #${input.ticketId}**: ${input.title}`,
      "",
      "GrayArx support has the ticket and will investigate. For urgent issues email **hello@grayarx.com**.",
    ].join("\n"),
  };
}

function buildDealerUnknown(): DealerHelpReply {
  return {
    mode: "dealer",
    intent: "unknown",
    links: buildDealerHelp().links,
    reply: [
      "Try asking:",
      "• *What does it cost?* / *Do we need WhatsApp Business?*",
      "• *Delete all my inventory*",
      "• *How do I import CSV?*",
      "• *Where do I upload photos?*",
      "• *Report a bug: …* (describe the issue)",
      "• *Help*",
    ].join("\n"),
  };
}

export function buildDealerHelpReply(input: {
  message: string;
  ticket?: { id: number; title: string } | null;
}): DealerHelpReply {
  if (input.ticket) {
    return buildBugReportConfirmation({
      ticketId: input.ticket.id,
      title: input.ticket.title,
    });
  }

  const intent = classifyDealerHelpIntent(input.message);

  const lower = input.message.trim().toLowerCase();
  if (
    intent === "help" &&
    (resolveAgentQuestion(lower) ||
      /\b(where (are|is) (my )?agents?|agent roster|my (ai )?team|ai teammates)\b/i.test(lower))
  ) {
    return buildDealerAgentsReply();
  }

  switch (intent) {
    case "restricted":
      return buildRestrictedReply();
    case "greeting":
      return buildDealerGreeting();
    case "help":
      return buildDealerHelp();
    case "product_qa":
      return buildProductQaReply(input.message);
    case "navigation":
      return buildDealerNavigation(input.message);
    case "bug_report_prompt":
      return buildBugReportPrompt();
    case "bug_report":
      return buildBugReportPrompt();
    default:
      return buildDealerUnknown();
  }
}

export function bugTicketFromMessage(message: string): {
  title: string;
  description: string;
  category: "bug" | "feature_request" | "performance" | "other";
  severity: "critical" | "high" | "medium" | "low";
} {
  const trimmed = message.trim();
  const firstLine = trimmed.split(/\n/)[0]?.slice(0, 120) ?? "Dealer reported issue";
  const title = firstLine.length > 10 ? firstLine : `Dealer issue: ${trimmed.slice(0, 80)}`;

  let severity: "critical" | "high" | "medium" | "low" = "medium";
  if (/\b(critical|down|urgent|can't login|cannot login|data loss|lost all)\b/i.test(trimmed)) {
    severity = "critical";
  } else if (/\b(error|failed|broken|not working)\b/i.test(trimmed)) {
    severity = "high";
  }

  const category = /\bfeature|wish|would like|request\b/i.test(trimmed)
    ? "feature_request"
    : "bug";

  return {
    title: title.slice(0, 255),
    description: trimmed,
    category,
    severity,
  };
}
