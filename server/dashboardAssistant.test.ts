import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  getAgentStats: vi.fn(async () => ({
    booking: { actionCount: 3, lastActionAt: new Date(), lastAction: "booking_confirmed" },
    whatsapp: { actionCount: 0, lastActionAt: null, lastAction: null },
    email: { actionCount: 0, lastActionAt: null, lastAction: null },
    calling: { actionCount: 0, lastActionAt: null, lastAction: null },
    prospector: { actionCount: 0, lastActionAt: null, lastAction: null },
    improvement: { actionCount: 1, lastActionAt: new Date(), lastAction: "audit" },
    accountant: { actionCount: 0, lastActionAt: null, lastAction: null },
    fallback: { actionCount: 0, lastActionAt: null, lastAction: null },
    preapproval: { actionCount: 0, lastActionAt: null, lastAction: null },
    tradein: { actionCount: 0, lastActionAt: null, lastAction: null },
  })),
  listAgentActivity: vi.fn(async () => [
    {
      id: 1,
      agentId: "booking",
      action: "booking_confirmed",
      subjectType: "booking",
      subjectId: 1,
      summary: "Lerato confirmed a test drive.",
      payload: null,
      createdAt: new Date(),
    },
  ]),
  getDashboardStats: vi.fn(async () => ({
    totalLeads: 10,
    newLeads: 2,
    qualifiedLeads: 1,
    convertedLeads: 0,
    totalBookings: 4,
    pendingBookings: 1,
    confirmedBookings: 3,
    totalVehicles: 20,
    availableVehicles: 18,
    reservedVehicles: 1,
    soldVehicles: 1,
    leadsLast7Days: 3,
    bookingsLast7Days: 1,
    totalProspects: 0,
    queuedProspects: 0,
  })),
  logAgentActivity: vi.fn(async () => undefined),
  countVehiclesScoped: vi.fn(async () => 3),
  deleteAllVehiclesScoped: vi.fn(async () => 3),
  getDb: vi.fn(async () => ({
    insert: vi.fn(() => ({
      values: vi.fn(async () => ({ insertId: 99 })),
    })),
  })),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

import { appRouter } from "./routers";

const founderCtx = {
  user: {
    id: 1,
    openId: "founder",
    name: "Founder",
    email: "founder@grayarx.com",
    role: "founder",
    dealershipId: 1,
  },
};

const dealerCtx = {
  user: {
    id: 2,
    openId: "dealer",
    name: "Dealer User",
    email: "dealer@test.com",
    role: "dealer_owner",
    dealershipId: 5,
  },
};

describe("dashboardAssistant.chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gives founder full agent roster access", async () => {
    const caller = appRouter.createCaller(founderCtx as any);
    const res = await caller.dashboardAssistant.chat({
      message: "where are my agents?",
    });
    expect(res.mode).toBe("owner");
    expect(res.intent).toBe("agent_roster");
    expect(res.reply).toContain("Lerato");
  });

  it("explains background agents to dealers (no founder ops roster)", async () => {
    const caller = appRouter.createCaller(dealerCtx as any);
    const res = await caller.dashboardAssistant.chat({
      message: "where are my agents?",
    });
    expect(res.mode).toBe("dealer");
    // Dealers get a helpful "your AI runs in the background" answer, not a wall.
    expect(res.intent).toBe("help");
    expect(res.reply).toMatch(/background/i);
    // Founder-only tooling must not be exposed to dealers.
    expect(res.reply).not.toMatch(/Sipho ·/);
  });

  it("allows dealer navigation help", async () => {
    const caller = appRouter.createCaller(dealerCtx as any);
    const res = await caller.dashboardAssistant.chat({
      message: "how do I import csv stock",
    });
    expect(res.mode).toBe("dealer");
    expect(res.intent).toBe("navigation");
  });

  it("creates support ticket for dealer bug reports", async () => {
    const caller = appRouter.createCaller(dealerCtx as any);
    const res = await caller.dashboardAssistant.chat({
      message: "Bug: CSV import fails on row 12 with invalid price error message",
    });
    expect(res.mode).toBe("dealer");
    expect(res.intent).toBe("bug_report");
    expect(res.ticketId).toBe(99);
  });

  it("returns owner config for founder", async () => {
    const caller = appRouter.createCaller(founderCtx as any);
    const cfg = await caller.dashboardAssistant.config();
    expect(cfg.mode).toBe("owner");
    expect(cfg.label).toBe("Ask Kagiso");
  });

  it("returns dealer config for dealership user", async () => {
    const caller = appRouter.createCaller(dealerCtx as any);
    const cfg = await caller.dashboardAssistant.config();
    expect(cfg.mode).toBe("dealer");
    expect(cfg.label).toBe("Help");
  });

  it("asks for confirmation before bulk inventory delete", async () => {
    const caller = appRouter.createCaller(founderCtx as any);
    const res = await caller.dashboardAssistant.chat({
      message: "delete all my inventory",
    });
    expect(res.intent).toBe("inventory_bulk_delete");
    expect(res.pendingAction?.type).toBe("inventory_delete_all");
    expect(res.pendingAction?.vehicleCount).toBe(3);
    expect(res.reply).toContain("Cannot be undone");
  });

  it("executes bulk inventory delete on confirm", async () => {
    const caller = appRouter.createCaller(founderCtx as any);
    const res = await caller.dashboardAssistant.chat({
      message: "confirm",
      confirmAction: "inventory_delete_all",
    });
    expect(res.actionExecuted).toBe(true);
    expect(res.reply).toContain("removed **3**");
  });
});
