/**
 * Dashboard assistant — intent routing + template replies for dealer ops chat.
 * Kagiso answers from live agent roster, activity, KPIs, and nav hints.
 */

import type { AgentId } from "./agents";
import { AGENTS, AGENT_LIST, PRIMARY_INBOX } from "./agents";
import {
  isInventoryBulkDeleteConfirm,
  isInventoryBulkDeleteRequest,
  type AssistantPendingAction,
} from "./assistantActions";

export type DashboardIntent =
  | "greeting"
  | "agent_roster"
  | "agent_status"
  | "agent_activity"
  | "dashboard_stats"
  | "navigation"
  | "inventory_bulk_delete"
  | "inventory_bulk_delete_confirm"
  | "help"
  | "unknown";

export type AgentSnapshot = {
  id: AgentId;
  displayName: string;
  role: string;
  email: string;
  description: string;
  status: "active" | "idle";
  actionCount: number;
  lastActionAt: Date | string | null;
  lastAction: string | null;
};

export type DashboardAssistantContext = {
  agents: AgentSnapshot[];
  recentActivity: Array<{
    agentId: AgentId;
    agentName: string;
    summary: string;
    createdAt: Date | string;
  }>;
  stats: {
    totalLeads: number;
    newLeads: number;
    totalBookings: number;
    pendingBookings: number;
    totalVehicles: number;
    availableVehicles: number;
    leadsLast7Days: number;
    bookingsLast7Days: number;
  };
  primaryInbox: string;
};

export type DashboardLink = {
  label: string;
  href: string;
};

export type AssistantMode = "owner" | "dealer";

export type DashboardAssistantReply = {
  reply: string;
  intent: DashboardIntent | string;
  links: DashboardLink[];
  mode: AssistantMode;
  matchedAgentId?: AgentId;
  ticketId?: number;
  pendingAction?: AssistantPendingAction;
  actionExecuted?: boolean;
};

const AGENT_ALIASES: Record<string, AgentId> = {
  mia: "email",
  themba: "calling",
  lerato: "booking",
  sipho: "prospector",
  kagiso: "improvement",
  nala: "whatsapp",
  thandi: "accountant",
  bongi: "fallback",
  tumi: "tradein",
  naledi: "preapproval",
  email: "email",
  calling: "calling",
  booking: "booking",
  prospector: "prospector",
  improvement: "improvement",
  whatsapp: "whatsapp",
  accountant: "accountant",
  fallback: "fallback",
  tradein: "tradein",
  "trade-in": "tradein",
  preapproval: "preapproval",
  finance: "preapproval",
};

const NAV_HINTS: Array<{
  keywords: RegExp[];
  href: string;
  label: string;
  blurb: string;
}> = [
  {
    keywords: [/\bcsv\b/i, /\bimport\b/i, /\bbulk\b/i],
    href: "/dealer/inventory/import",
    label: "CSV Import",
    blurb: "Bulk-import stock from a CSV file — it feeds your showroom and chatbots.",
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
    blurb: "Test drives and platform demos — Lerato owns this calendar.",
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
    blurb: "Seller listings — invite owners for inspection (Tumi).",
  },
  {
    keywords: [/\bnetwork\b/i, /\bpartner/i],
    href: "/dealer/network",
    label: "Dealer Network",
    blurb: "Partner dealerships and referrals.",
  },
  {
    keywords: [/\bagents?\b/i, /\bteam\b/i, /\broster\b/i],
    href: "/dealer/agents",
    label: "Agents",
    blurb: "Full roster, live activity feed, and test pings.",
  },
  {
    keywords: [/\bdashboard\b/i, /\boverview\b/i, /\bkpi/i],
    href: "/dashboard",
    label: "Dashboard",
    blurb: "KPIs, charts, and recent platform activity.",
  },
];

export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "no activity yet";
  const ts = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  if (!Number.isFinite(ts)) return "no activity yet";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

/** Resolve an agent id from free text (name, role, or id). */
export function resolveAgentFromMessage(message: string): AgentId | null {
  const lower = message.toLowerCase();

  for (const [alias, id] of Object.entries(AGENT_ALIASES)) {
    if (new RegExp(`\\b${alias.replace(/-/g, "[\\s-]?")}\\b`, "i").test(lower)) {
      return id;
    }
  }

  for (const persona of AGENT_LIST) {
    const roleWords = persona.role.toLowerCase().replace(/ agent$/i, "");
    if (lower.includes(roleWords)) return persona.id;
  }

  return null;
}

export function classifyDashboardIntent(message: string): DashboardIntent {
  const lower = message.trim().toLowerCase();
  if (!lower) return "unknown";

  if (/^(hi|hello|hey|howzit|howdy|good (morning|afternoon|evening)|yo)\b/.test(lower)) {
    return "greeting";
  }

  if (isInventoryBulkDeleteConfirm(lower)) {
    return "inventory_bulk_delete_confirm";
  }

  if (isInventoryBulkDeleteRequest(lower)) {
    return "inventory_bulk_delete";
  }

  if (
    /\b(help|what can you|what do you|how do i use|capabilities|commands)\b/i.test(lower)
  ) {
    return "help";
  }

  if (
    /\b(stats|statistics|kpi|numbers|how many leads|how many bookings|dashboard)\b/i.test(
      lower,
    ) &&
    !/\bwhere\b/i.test(lower)
  ) {
    return "dashboard_stats";
  }

  const agentId = resolveAgentFromMessage(message);

  if (
    agentId &&
    /\b(what did|last action|recent|activity|doing|done|busy|status|online|idle)\b/i.test(
      lower,
    )
  ) {
    return "agent_activity";
  }

  if (
    agentId &&
    /\b(where|who is|find|locate|status)\b/i.test(lower)
  ) {
    return "agent_status";
  }

  if (
    /\b(where (are|is) (my )?agents?|agent roster|list agents|my team|ai team|teammates)\b/i.test(
      lower,
    ) ||
    (/\bagents?\b/i.test(lower) && /\b(where|find|list|show|roster)\b/i.test(lower))
  ) {
    return "agent_roster";
  }

  if (agentId) return "agent_status";

  if (
    /\b(how (do|to)|where (do|to|is)|import|upload|navigate|go to|open)\b/i.test(lower)
  ) {
    return "navigation";
  }

  return "unknown";
}

function formatAgentLine(a: AgentSnapshot): string {
  const when = formatRelativeTime(a.lastActionAt);
  const status = a.status === "active" ? "active" : "idle";
  return `• **${a.displayName}** (${a.role}) — ${status}, ${a.actionCount} actions, last ${when}`;
}

function buildRosterReply(ctx: DashboardAssistantContext): DashboardAssistantReply {
  const lines = ctx.agents.map(formatAgentLine);
  const active = ctx.agents.filter((a) => a.status === "active").length;

  return {
    mode: "owner",
    intent: "agent_roster",
    links: [{ label: "Open Agents page", href: "/dealer/agents" }],
    reply: [
      `Your AI team lives on the **Agents** page — that's the shared inbox where every reply lands (${ctx.primaryInbox}).`,
      "",
      `${active} of ${ctx.agents.length} agents have logged activity recently:`,
      ...lines,
      "",
      "Tap **Open Agents** for the live feed, filters, and test pings.",
    ].join("\n"),
  };
}

function buildAgentStatusReply(
  agentId: AgentId,
  ctx: DashboardAssistantContext,
): DashboardAssistantReply {
  const agent =
    ctx.agents.find((a) => a.id === agentId) ??
    ({
      ...AGENTS[agentId],
      id: agentId,
      status: "idle" as const,
      actionCount: 0,
      lastActionAt: null,
      lastAction: null,
    } satisfies AgentSnapshot);

  const when = formatRelativeTime(agent.lastActionAt);
  const last =
    agent.lastAction && agent.actionCount > 0
      ? ` Last action: **${agent.lastAction}** (${when}).`
      : " No logged activity yet — use **Test ping** on the Agents page to verify wiring.";

  return {
    mode: "owner",
    intent: "agent_status",
    matchedAgentId: agentId,
    links: [{ label: "Agents page", href: "/dealer/agents" }],
    reply: [
      `**${agent.displayName}** — ${agent.role}`,
      "",
      agent.description,
      "",
      `Status: **${agent.status}** · ${agent.actionCount} total actions.${last}`,
      `Inbox: ${agent.email}`,
    ].join("\n"),
  };
}

function buildAgentActivityReply(
  agentId: AgentId,
  ctx: DashboardAssistantContext,
): DashboardAssistantReply {
  const persona = AGENTS[agentId];
  const rows = ctx.recentActivity.filter((r) => r.agentId === agentId).slice(0, 5);

  if (rows.length === 0) {
    return {
      mode: "owner",
      intent: "agent_activity",
      matchedAgentId: agentId,
      links: [{ label: "Agents feed", href: "/dealer/agents" }],
      reply: `No recent activity logged for **${persona.displayName}** yet. Once they handle leads, bookings, or emails you'll see it on the Agents feed.`,
    };
  }

  const lines = rows.map(
    (r) => `• ${formatRelativeTime(r.createdAt)} — ${r.summary}`,
  );

  return {
    mode: "owner",
    intent: "agent_activity",
    matchedAgentId: agentId,
    links: [{ label: "Full activity feed", href: "/dealer/agents" }],
    reply: [
      `Recent work from **${persona.displayName}** (${persona.role}):`,
      "",
      ...lines,
    ].join("\n"),
  };
}

function buildStatsReply(ctx: DashboardAssistantContext): DashboardAssistantReply {
  const s = ctx.stats;
  return {
    mode: "owner",
    intent: "dashboard_stats",
    links: [{ label: "Dashboard overview", href: "/dashboard" }],
    reply: [
      "**Dashboard snapshot**",
      "",
      `• Leads: **${s.totalLeads}** total (${s.newLeads} new) · **${s.leadsLast7Days}** in the last 7 days`,
      `• Bookings: **${s.totalBookings}** (${s.pendingBookings} pending) · **${s.bookingsLast7Days}** this week`,
      `• Inventory: **${s.availableVehicles}** available of **${s.totalVehicles}** vehicles`,
    ].join("\n"),
  };
}

function buildNavigationReply(message: string): DashboardAssistantReply {
  const matches = NAV_HINTS.filter((h) => h.keywords.some((re) => re.test(message)));

  if (matches.length === 0) {
    return {
      mode: "owner",
      intent: "navigation",
      links: NAV_HINTS.slice(0, 4).map((h) => ({ label: h.label, href: h.href })),
      reply: [
        "I can point you to any dealer page. Try asking about:",
        "• CSV import · Inventory · Leads · Bookings · Settings · Showroom · Photos · Agents",
      ].join("\n"),
    };
  }

  const primary = matches[0]!;
  const links = matches.slice(0, 3).map((h) => ({ label: h.label, href: h.href }));

  return {
    mode: "owner",
    intent: "navigation",
    links,
    reply: [`**${primary.label}** — ${primary.blurb}`, "", `Go to ${primary.href} or use the sidebar tab.`].join(
      "\n",
    ),
  };
}

function buildHelpReply(): DashboardAssistantReply {
  return {
    mode: "owner",
    intent: "help",
    links: [
      { label: "Agents", href: "/dealer/agents" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    reply: [
      "I'm **Kagiso**, your dashboard ops assistant. Ask me things like:",
      "",
      "• *Where are my agents?* — full roster + status",
      "• *What is Lerato doing?* — recent activity for one agent",
      "• *Dashboard stats* — leads, bookings, inventory",
      "• *How do I import CSV?* — navigation + short how-to",
      "• *Delete all inventory* — bulk-remove every vehicle (with confirmation)",
      "",
      `Primary inbox for all agent replies: **${PRIMARY_INBOX}**`,
    ].join("\n"),
  };
}

function buildGreetingReply(ctx: DashboardAssistantContext): DashboardAssistantReply {
  const active = ctx.agents.filter((a) => a.status === "active").length;
  return {
    mode: "owner",
    intent: "greeting",
    links: [{ label: "View agents", href: "/dealer/agents" }],
    reply: [
      "Hey — Kagiso here. I watch the platform so you don't have to.",
      "",
      `${active} agents are active right now. Ask **where are my agents?** or **dashboard stats** anytime.`,
    ].join("\n"),
  };
}

function buildUnknownReply(): DashboardAssistantReply {
  return {
    mode: "owner",
    intent: "unknown",
    links: buildHelpReply().links,
    reply: [
      "Not sure I caught that. Try:",
      "• *Delete all my inventory* — bulk remove vehicles",
      "• *Where are my agents?*",
      "• *What did Nala do recently?*",
      "• *How do I import inventory?*",
      "• *Help* — full list of things I can answer",
    ].join("\n"),
  };
}

/** Build a template reply from classified intent + live context. */
export function buildDashboardAssistantReply(input: {
  message: string;
  context: DashboardAssistantContext;
}): DashboardAssistantReply {
  const intent = classifyDashboardIntent(input.message);
  const agentId = resolveAgentFromMessage(input.message);

  switch (intent) {
    case "greeting":
      return buildGreetingReply(input.context);
    case "agent_roster":
      return buildRosterReply(input.context);
    case "agent_status":
      return buildAgentStatusReply(agentId ?? "improvement", input.context);
    case "agent_activity":
      return buildAgentActivityReply(agentId ?? "whatsapp", input.context);
    case "dashboard_stats":
      return buildStatsReply(input.context);
    case "navigation":
      return buildNavigationReply(input.message);
    case "help":
      return buildHelpReply();
    default:
      return buildUnknownReply();
  }
}

export const OWNER_QUICK_PROMPTS = [
  "Where are my agents?",
  "Dashboard stats",
  "Delete all my inventory",
  "How do I import CSV?",
] as const;

/** @deprecated use OWNER_QUICK_PROMPTS */
export const DASHBOARD_QUICK_PROMPTS = OWNER_QUICK_PROMPTS;
