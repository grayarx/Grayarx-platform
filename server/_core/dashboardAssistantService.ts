import {
  buildDashboardAssistantReply,
  classifyDashboardIntent,
  type DashboardAssistantContext,
  type DashboardAssistantReply,
} from "../../shared/dashboardAssistant";
import {
  buildInventoryDeleteDoneReply,
  buildInventoryDeletePendingReply,
  type AssistantActionType,
} from "../../shared/assistantActions";
import {
  buildBugReportConfirmation,
  buildDealerHelpReply,
  bugTicketFromMessage,
  classifyDealerHelpIntent,
  isBugDescription,
} from "../../shared/dealerHelpAssistant";
import { isFounderOrAdmin } from "../../shared/userRoles";
import { AGENTS, AGENT_LIST, PRIMARY_INBOX } from "../../shared/agents";
import type { AgentId } from "../../shared/agents";
import {
  getAgentStats,
  getDashboardStats,
  listAgentActivity,
  logAgentActivity,
  getDb,
  countVehiclesScoped,
  deleteAllVehiclesScoped,
} from "../db";
import { supportTickets } from "../../drizzle/schema";
import { notifyOwner } from "./notification";

export async function gatherDashboardAssistantContext(): Promise<DashboardAssistantContext> {
  const [agentStats, activityRows, dashboardStats] = await Promise.all([
    getAgentStats(),
    listAgentActivity({ limit: 30 }),
    getDashboardStats({ includeProspects: true }),
  ]);

  const agents = AGENT_LIST.map((persona) => {
    const s = agentStats[persona.id] ?? {
      actionCount: 0,
      lastActionAt: null,
      lastAction: null,
    };
    return {
      id: persona.id,
      displayName: persona.displayName,
      role: persona.role,
      email: persona.email,
      description: persona.description,
      status: (s.actionCount > 0 ? "active" : "idle") as "active" | "idle",
      actionCount: s.actionCount,
      lastActionAt: s.lastActionAt,
      lastAction: s.lastAction,
    };
  });

  const recentActivity = activityRows.map((r) => ({
    agentId: r.agentId as AgentId,
    agentName: AGENTS[r.agentId as AgentId]?.displayName ?? r.agentId,
    summary: r.summary,
    createdAt: r.createdAt,
  }));

  return {
    agents,
    recentActivity,
    primaryInbox: PRIMARY_INBOX,
    stats: {
      totalLeads: dashboardStats.totalLeads,
      newLeads: dashboardStats.newLeads,
      totalBookings: dashboardStats.totalBookings,
      pendingBookings: dashboardStats.pendingBookings,
      totalVehicles: dashboardStats.totalVehicles,
      availableVehicles: dashboardStats.availableVehicles,
      leadsLast7Days: dashboardStats.leadsLast7Days,
      bookingsLast7Days: dashboardStats.bookingsLast7Days,
    },
  };
}

async function createDealerSupportTicket(input: {
  dealershipId: number;
  message: string;
  reporterName: string;
}): Promise<{ id: number; title: string } | null> {
  const db = await getDb();
  if (!db) return null;

  const ticket = bugTicketFromMessage(input.message);
  const result = await db.insert(supportTickets).values({
    dealershipId: input.dealershipId,
    title: ticket.title,
    description: `[${input.reporterName}] ${ticket.description}`,
    category: ticket.category,
    severity: ticket.severity,
    status: "open",
  });

  const header = Array.isArray(result) ? result[0] : result;
  const id = Number((header as { insertId?: number })?.insertId ?? 0);
  if (!id) return null;

  void notifyOwner({
    title: `Support ticket #${id} (${ticket.severity})`,
    content: `${input.reporterName} @ dealership ${input.dealershipId}: ${ticket.title}`,
  });

  // Kagiso starts investigation (propose → founder approve; no auto prod write)
  if (ticket.category === "bug" || ticket.severity === "critical" || ticket.severity === "high") {
    try {
      const { enqueueKagisoBugInvestigation } = await import("./kagisoBugIntake");
      await enqueueKagisoBugInvestigation({
        ticketId: id,
        dealershipId: input.dealershipId,
        title: ticket.title,
        description: ticket.description,
        severity: ticket.severity,
        category: ticket.category,
        source: "dealer_help",
      });
    } catch (e) {
      console.warn("[Kagiso] bug intake failed", e);
    }
  }

  return { id, title: ticket.title };
}

async function executeInventoryDeleteAll(input: {
  userId: number;
  allPlatform: boolean;
  mode: "owner" | "dealer";
}): Promise<DashboardAssistantReply> {
  const vehicleCount = await countVehiclesScoped(input.allPlatform, input.userId);

  if (vehicleCount === 0) {
    return {
      mode: input.mode,
      intent: "inventory_bulk_delete",
      links: [{ label: "Inventory", href: "/dealer/inventory" }],
      reply: buildInventoryDeleteDoneReply(0),
      actionExecuted: true,
    };
  }

  const deleted = await deleteAllVehiclesScoped(input.allPlatform, input.userId);

  void logAgentActivity({
    agentId: input.mode === "owner" ? "improvement" : "fallback",
    action: "inventory_bulk_delete",
    subjectType: "inventory",
    summary: `Deleted ${deleted} vehicle${deleted === 1 ? "" : "s"} from inventory.`,
    payload: { deleted, allPlatform: input.allPlatform, userId: input.userId },
  });

  return {
    mode: input.mode,
    intent: "inventory_bulk_delete",
    links: [{ label: "Inventory", href: "/dealer/inventory" }],
    reply: buildInventoryDeleteDoneReply(deleted),
    actionExecuted: true,
  };
}

async function buildInventoryDeletePending(input: {
  userId: number;
  allPlatform: boolean;
  mode: "owner" | "dealer";
}): Promise<DashboardAssistantReply> {
  const vehicleCount = await countVehiclesScoped(input.allPlatform, input.userId);
  const pending = buildInventoryDeletePendingReply({ vehicleCount, mode: input.mode });

  return {
    mode: input.mode,
    intent: "inventory_bulk_delete",
    links: pending.links,
    reply: pending.reply,
    pendingAction: pending.pendingAction,
  };
}

export async function answerDashboardAssistant(input: {
  message: string;
  userName?: string | null;
  userRole?: string | null;
  userId?: number | null;
  dealershipId?: number | null;
  confirmAction?: AssistantActionType;
}): Promise<DashboardAssistantReply> {
  const who = input.userName?.trim() || "Dealer";
  const isOwner = isFounderOrAdmin({ role: input.userRole ?? null });
  const userId = input.userId ?? 0;
  const mode = isOwner ? ("owner" as const) : ("dealer" as const);
  const allPlatform = isOwner;

  if (
    input.confirmAction === "inventory_delete_all" ||
    classifyDashboardIntent(input.message) === "inventory_bulk_delete_confirm"
  ) {
    return executeInventoryDeleteAll({ userId, allPlatform, mode });
  }

  if (classifyDashboardIntent(input.message) === "inventory_bulk_delete") {
    return buildInventoryDeletePending({ userId, allPlatform, mode });
  }

  let result: DashboardAssistantReply;

  if (!isOwner) {
    const intent = classifyDealerHelpIntent(input.message);

    if (intent === "inventory_bulk_delete") {
      return buildInventoryDeletePending({ userId, allPlatform: false, mode: "dealer" });
    }

    if (intent === "inventory_bulk_delete_confirm") {
      return executeInventoryDeleteAll({ userId, allPlatform: false, mode: "dealer" });
    }

    if (intent === "bug_report" && isBugDescription(input.message) && input.dealershipId) {
      const ticket = await createDealerSupportTicket({
        dealershipId: input.dealershipId,
        message: input.message,
        reporterName: who,
      });
      if (ticket) {
        result = buildBugReportConfirmation({
          ticketId: ticket.id,
          title: ticket.title,
        });
      } else {
        result = buildDealerHelpReply({ message: input.message });
        result = {
          ...result,
          reply: `${result.reply}\n\n(Could not save the ticket right now — email **hello@grayarx.com** with your description.)`,
        };
      }
    } else {
      result = buildDealerHelpReply({ message: input.message });
    }
  } else {
    const context = await gatherDashboardAssistantContext();
    result = buildDashboardAssistantReply({
      message: input.message,
      context,
    });
  }

  void logAgentActivity({
    agentId: isOwner ? "improvement" : "fallback",
    action: isOwner ? "dashboard_assistant_reply" : "dealer_help_reply",
    subjectType: "user",
    summary: `${isOwner ? "Kagiso" : "Help"} answered "${input.message.slice(0, 80)}" for ${who} (${result.intent}).`,
    payload: {
      intent: result.intent,
      mode: result.mode,
      matchedAgentId: result.matchedAgentId ?? null,
      ticketId: result.ticketId ?? null,
    },
  });

  return result;
}
