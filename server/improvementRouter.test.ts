/**
 * Router-level coverage for the ask-first Kagiso flow.
 *
 * The contract has changed from one-shot `applyAction` to a two-step
 * `proposeApply` (preview the diff, no mutation) → `confirmApply` (requires
 * `acknowledged: true`, then mutates). The old `applyAction` is now a
 * deliberate no-op that throws BAD_REQUEST to catch any stale clients.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

type ActionRow = {
  id: number;
  category: string;
  severity: string;
  title: string;
  finding: string;
  suggestedFix: string;
  autoApplicable: number;
  status: "open" | "pending_approval" | "applied" | "dismissed";
  appliedAt: Date | null;
};

const store: { actions: ActionRow[]; settings: Record<string, unknown> } = {
  actions: [],
  settings: {},
};

vi.mock("./db", () => ({
  createLead: vi.fn(async () => undefined),
  listLeads: vi.fn(async () => []),
  createBooking: vi.fn(async () => undefined),
  listBookings: vi.fn(async () => []),
  createVehicle: vi.fn(async () => undefined),
  listVehicles: vi.fn(async () => []),
  updateLead: vi.fn(async () => undefined),
  updateBooking: vi.fn(async () => undefined),
  deleteVehicle: vi.fn(async () => undefined),
  updateVehicle: vi.fn(async () => undefined),
  getVehicle: vi.fn(async () => undefined),
  getDashboardStats: vi.fn(async () => ({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    leadsLast7Days: 0,
    bookingsLast7Days: 0,
    totalProspects: 0,
    queuedProspects: 0,
  })),
  listCallAttempts: vi.fn(async () => []),
  listProspects: vi.fn(async () => []),
  createProspect: vi.fn(async () => undefined),
  updateProspect: vi.fn(async () => undefined),
  deleteProspect: vi.fn(async () => undefined),
  getProspect: vi.fn(async () => undefined),
  createAgentActivity: vi.fn(async () => undefined),
  logAgentActivity: vi.fn(async () => undefined),
  listAgentActivity: vi.fn(async () => []),
  getAgentStats: vi.fn(async () => ({
    email: { actionCount: 0, lastActionAt: null, lastAction: null },
    calling: { actionCount: 0, lastActionAt: null, lastAction: null },
    booking: { actionCount: 0, lastActionAt: null, lastAction: null },
    prospector: { actionCount: 0, lastActionAt: null, lastAction: null },
    improvement: { actionCount: 0, lastActionAt: null, lastAction: null },
    whatsapp: { actionCount: 0, lastActionAt: null, lastAction: null },
  })),
  createImprovementAction: vi.fn(async (row: Omit<ActionRow, "id" | "status" | "appliedAt">) => {
    const next: ActionRow = {
      id: store.actions.length + 1,
      status: "pending_approval",
      appliedAt: null,
      ...row,
    } as ActionRow;
    store.actions.push(next);
    return undefined;
  }),
  listImprovementActions: vi.fn(async () => store.actions),
  getImprovementAction: vi.fn(async (id: number) => store.actions.find((a) => a.id === id)),
  updateImprovementActionStatus: vi.fn(
    async (id: number, status: "open" | "pending_approval" | "applied" | "dismissed") => {
      const row = store.actions.find((a) => a.id === id);
      if (row) {
        row.status = status;
        row.appliedAt = status === "applied" ? new Date() : null;
      }
    },
  ),
  createWhatsappDraft: vi.fn(async () => undefined),
  listWhatsappDrafts: vi.fn(async () => []),
  updateWhatsappDraftStatus: vi.fn(async () => undefined),
  findVehicleByExternalRef: vi.fn(async () => undefined),
  getKagisoSettings: vi.fn(async () => ({ ...store.settings })),
  patchKagisoSettings: vi.fn(async (patch: Record<string, unknown>) => {
    store.settings = { ...store.settings, ...patch };
    return { ...store.settings };
  }),
  listDealerships: vi.fn(async () => []),
  countNetworkVehicles: vi.fn(async () => 0),
  countNetworkDealerships: vi.fn(async () => 0),
  listNetworkPhotos: vi.fn(async () => []),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: "ok" } }] })),
}));

vi.mock("./_core/calling", () => ({
  placeOutboundCall: vi.fn(async () => ({ ok: false, reason: "not_configured" })),
}));

const { appRouter } = await import("./routers");

function createCaller(user: { openId: string; role: string } | null) {
  return appRouter.createCaller({ user: user as any });
}

beforeEach(() => {
  store.actions = [];
  store.settings = {};
});

describe("ask-first contract", () => {
  it("legacy applyAction always throws — clients must use proposeApply / confirmApply", async () => {
    store.actions.push({
      id: 1,
      category: "agent_quality",
      severity: "high",
      title: "x",
      finding: "x",
      suggestedFix: "y",
      autoApplicable: 1,
      status: "pending_approval",
      appliedAt: null,
    });
    const caller = createCaller({ openId: "user", role: "user" });
    await expect(caller.improvement.applyAction({ id: 1 })).rejects.toThrow(/asks first/i);
    // And settings must NOT have changed
    expect(Object.keys(store.settings).length).toBe(0);
    expect(store.actions[0].status).toBe("pending_approval");
  });
});

describe("improvement.proposeApply", () => {
  it("requires authentication", async () => {
    const caller = createCaller(null);
    await expect(caller.improvement.proposeApply({ id: 1 })).rejects.toThrow();
  });

  it("rejects an action flagged for human review", async () => {
    store.actions.push({
      id: 1,
      category: "general",
      severity: "high",
      title: "Needs a human",
      finding: "x",
      suggestedFix: "y",
      autoApplicable: 0,
      status: "pending_approval",
      appliedAt: null,
    });
    const caller = createCaller({ openId: "user", role: "user" });
    await expect(caller.improvement.proposeApply({ id: 1 })).rejects.toThrow(/human review/i);
  });

  it("returns 404 when the action does not exist", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    await expect(caller.improvement.proposeApply({ id: 999 })).rejects.toThrow(/not found/i);
  });

  it("returns the before/after diff WITHOUT mutating settings", async () => {
    store.actions.push({
      id: 7,
      category: "agent_quality",
      severity: "high",
      title: "Tighten SLA",
      finding: "x",
      suggestedFix: "y",
      autoApplicable: 1,
      status: "pending_approval",
      appliedAt: null,
    });
    const caller = createCaller({ openId: "user", role: "user" });
    const proposal = await caller.improvement.proposeApply({ id: 7 });
    expect(proposal.patch).toMatchObject({ emailFirstTouchSlaSeconds: 45 });
    expect(proposal.changedKeys).toContain("emailFirstTouchSlaSeconds");
    expect(proposal.requiresAcknowledgement).toBe(true);
    // Critical: nothing mutated yet
    expect(Object.keys(store.settings).length).toBe(0);
    expect(store.actions[0].status).toBe("pending_approval");
  });
});

describe("improvement.confirmApply", () => {
  it("requires authentication", async () => {
    const caller = createCaller(null);
    await expect(
      caller.improvement.confirmApply({ id: 1, acknowledged: true }),
    ).rejects.toThrow();
  });

  it("zod rejects calls missing acknowledged:true", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    // @ts-expect-error — intentional bad input
    await expect(caller.improvement.confirmApply({ id: 1, acknowledged: false })).rejects.toThrow();
  });

  it("mutates settings and marks the action as applied when acknowledged", async () => {
    store.actions.push({
      id: 8,
      category: "prospect_cadence",
      severity: "medium",
      title: "Wake Sipho",
      finding: "x",
      suggestedFix: "y",
      autoApplicable: 1,
      status: "pending_approval",
      appliedAt: null,
    });
    const caller = createCaller({ openId: "user", role: "user" });
    const result = await caller.improvement.confirmApply({ id: 8, acknowledged: true });
    expect(result.success).toBe(true);
    expect(store.settings.prospectorEnabled).toBe(true);
    expect(store.actions[0].status).toBe("applied");
  });

  it("refuses to re-apply an already-applied action", async () => {
    store.actions.push({
      id: 9,
      category: "agent_quality",
      severity: "high",
      title: "Already done",
      finding: "x",
      suggestedFix: "y",
      autoApplicable: 1,
      status: "applied",
      appliedAt: new Date(),
    });
    const caller = createCaller({ openId: "user", role: "user" });
    await expect(
      caller.improvement.confirmApply({ id: 9, acknowledged: true }),
    ).rejects.toThrow(/already been applied/i);
  });
});

describe("improvement.dismiss", () => {
  it("dismisses an action without touching settings", async () => {
    store.actions.push({
      id: 10,
      category: "agent_quality",
      severity: "high",
      title: "Will be dismissed",
      finding: "x",
      suggestedFix: "y",
      autoApplicable: 1,
      status: "pending_approval",
      appliedAt: null,
    });
    const caller = createCaller({ openId: "user", role: "user" });
    await caller.improvement.dismiss({ id: 10 });
    expect(store.actions[0].status).toBe("dismissed");
    expect(Object.keys(store.settings).length).toBe(0);
  });
});
