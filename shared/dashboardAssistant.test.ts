import { describe, it, expect } from "vitest";
import {
  buildDashboardAssistantReply,
  classifyDashboardIntent,
  resolveAgentFromMessage,
  type DashboardAssistantContext,
} from "./dashboardAssistant";

const mockContext: DashboardAssistantContext = {
  primaryInbox: "hello@grayarx.com",
  stats: {
    totalLeads: 42,
    newLeads: 5,
    totalBookings: 12,
    pendingBookings: 2,
    totalVehicles: 80,
    availableVehicles: 65,
    leadsLast7Days: 8,
    bookingsLast7Days: 3,
  },
  agents: [
    {
      id: "booking",
      displayName: "Lerato",
      role: "Booking Agent",
      email: "lerato@grayarx.com",
      description: "Owns the test-drive calendar.",
      status: "active",
      actionCount: 10,
      lastActionAt: new Date(Date.now() - 3600_000),
      lastAction: "booking_confirmed",
    },
    {
      id: "whatsapp",
      displayName: "Nala",
      role: "WhatsApp Agent",
      email: "nala@grayarx.com",
      description: "WhatsApp replies.",
      status: "idle",
      actionCount: 0,
      lastActionAt: null,
      lastAction: null,
    },
  ],
  recentActivity: [
    {
      agentId: "booking",
      agentName: "Lerato",
      summary: "Confirmed test drive for Thabo M.",
      createdAt: new Date(Date.now() - 1800_000),
    },
  ],
};

describe("dashboardAssistant", () => {
  it("classifies agent roster questions", () => {
    expect(classifyDashboardIntent("where are my agents")).toBe("agent_roster");
    expect(classifyDashboardIntent("show me the agent roster")).toBe("agent_roster");
  });

  it("resolves agent names from messages", () => {
    expect(resolveAgentFromMessage("what is Lerato doing")).toBe("booking");
    expect(resolveAgentFromMessage("Nala whatsapp status")).toBe("whatsapp");
  });

  it("builds roster reply with agents page link", () => {
    const res = buildDashboardAssistantReply({
      message: "where are my agents",
      context: mockContext,
    });
    expect(res.intent).toBe("agent_roster");
    expect(res.mode).toBe("owner");
    expect(res.reply).toContain("Lerato");
    expect(res.links.some((l) => l.href === "/dealer/agents")).toBe(true);
  });

  it("builds agent activity reply", () => {
    const res = buildDashboardAssistantReply({
      message: "what did Lerato do recently",
      context: mockContext,
    });
    expect(res.intent).toBe("agent_activity");
    expect(res.reply).toContain("Confirmed test drive");
    expect(res.matchedAgentId).toBe("booking");
  });

  it("builds navigation reply for CSV import", () => {
    const res = buildDashboardAssistantReply({
      message: "how do I import csv stock",
      context: mockContext,
    });
    expect(res.intent).toBe("navigation");
    expect(res.links[0]?.href).toBe("/dealer/inventory/import");
  });

  it("builds dashboard stats reply", () => {
    const res = buildDashboardAssistantReply({
      message: "dashboard stats",
      context: mockContext,
    });
    expect(res.intent).toBe("dashboard_stats");
    expect(res.reply).toContain("42");
    expect(res.reply).toContain("65");
  });
});
