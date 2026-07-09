import {
  buildDashboardAssistantReply,
  type DashboardAssistantContext,
  type DashboardAssistantReply,
} from "../../shared/dashboardAssistant";
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
} from "../db";
import { supportTickets } from "../../drizzle/schema";
import { notifyOwner } from "./notification";

export async function gatherDashboardAssistantContext(): Promise<DashboardAssistantContext> {
  const [agentStats, activityRows, dashboardStats] = await Promise.all([
    getAgentStats(),
    listAgentActivity({ limit: 30 }),
    getDashboardStats(),
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

  return { id, title: ticket.title };
}

export async function answerDashboardAssistant(input: {
  message: string;
  userName?: string | null;
  userRole?: string | null;
  dealershipId?: number | null;
}): Promise<DashboardAssistantReply> {
  const who = input.userName?.trim() || "Dealer";
  const isOwner = isFounderOrAdmin({ role: input.userRole ?? null });

  let result: DashboardAssistantReply;

  if (!isOwner) {
    const intent = classifyDealerHelpIntent(input.message);

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
