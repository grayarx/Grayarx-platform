/**
 * Tests for the new agent.* tRPC endpoints and the live multilingual
 * reply path wired into leads.create.
 *
 * We mock ./db so each test gets isolated, deterministic data — including
 * for the agent activity log. We also mock the LLM so we can drive the
 * self-check pass deterministically.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { __resetRateLimiterForTests } from "./_core/rateLimit";

const activityStore: Array<{
  agentId: string;
  action: string;
  subjectType: string | null;
  subjectId: number | null;
  summary: string;
  payload: unknown;
  createdAt: Date;
}> = [];

const llmReplies: string[] = [];

vi.mock("./db", async () => {
  return {
    createLead: vi.fn(async () => undefined),
    listLeads: vi.fn(async () => []),
    createBooking: vi.fn(async () => undefined),
    listBookings: vi.fn(async () => []),
    getDb: vi.fn(async () => null),
    upsertUser: vi.fn(async () => undefined),
    getUserByOpenId: vi.fn(async () => undefined),
    logAgentActivity: vi.fn(async (entry: {
      agentId: string;
      action: string;
      subjectType?: string | null;
      subjectId?: number | null;
      summary: string;
      payload?: unknown;
    }) => {
      activityStore.push({
        agentId: entry.agentId,
        action: entry.action,
        subjectType: entry.subjectType ?? null,
        subjectId: entry.subjectId ?? null,
        summary: entry.summary,
        payload: entry.payload ?? null,
        createdAt: new Date(),
      });
    }),
    listAgentActivity: vi.fn(async (opts?: { agentId?: string; limit?: number }) => {
      let rows = [...activityStore].reverse();
      if (opts?.agentId) rows = rows.filter((r) => r.agentId === opts.agentId);
      if (opts?.limit) rows = rows.slice(0, opts.limit);
      return rows.map((r, i) => ({ id: activityStore.length - i, ...r }));
    }),
    getAgentStats: vi.fn(async () => {
      const base: Record<string, { actionCount: number; lastActionAt: Date | null; lastAction: string | null }> = {
        email: { actionCount: 0, lastActionAt: null, lastAction: null },
        calling: { actionCount: 0, lastActionAt: null, lastAction: null },
        booking: { actionCount: 0, lastActionAt: null, lastAction: null },
        prospector: { actionCount: 0, lastActionAt: null, lastAction: null },
        improvement: { actionCount: 0, lastActionAt: null, lastAction: null },
        whatsapp: { actionCount: 0, lastActionAt: null, lastAction: null },
        accountant: { actionCount: 0, lastActionAt: null, lastAction: null },
        fallback: { actionCount: 0, lastActionAt: null, lastAction: null },
        preapproval: { actionCount: 0, lastActionAt: null, lastAction: null },
      };
      for (const row of activityStore) {
        const cur = base[row.agentId];
        if (!cur) continue;
        cur.actionCount += 1;
        if (!cur.lastActionAt || row.createdAt > cur.lastActionAt) {
          cur.lastActionAt = row.createdAt;
          cur.lastAction = row.action;
        }
      }
      return base;
    }),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => {
    const next = llmReplies.shift() ?? "Hi there, thanks for the enquiry. We'll follow up tomorrow. Kind regards, Mia · GrayArx Customer Concierge";
    return { choices: [{ message: { content: next } }] };
  }),
}));

import { appRouter } from "./routers";

function createCaller(user: { openId: string; role: "user" | "admin" } | null) {
  return appRouter.createCaller({
    user: user
      ? ({
          id: 1,
          openId: user.openId,
          name: "Test Dealer",
          email: "dealer@example.com",
          loginMethod: "manus",
          role: user.role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as never)
      : null,
    req: { headers: {} } as never,
    res: { setHeader: () => undefined } as never,
  } as never);
}

beforeEach(() => {
  activityStore.length = 0;
  llmReplies.length = 0;
  __resetRateLimiterForTests();
});

describe("agent.list (roster)", () => {
  it("requires authentication", async () => {
    const caller = createCaller(null);
    await expect(caller.agent.list()).rejects.toThrow();
  });

  it("returns the full roster with identity, email, status, and action stats", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    const result = await caller.agent.list();
    expect(result.primaryInbox).toMatch(/@grayarx\.com$/);
    expect(result.agents).toHaveLength(10);
    const ids = result.agents.map((a) => a.id).sort();
    expect(ids).toEqual([
      "accountant",
      "booking",
      "calling",
      "email",
      "fallback",
      "improvement",
      "preapproval",
      "prospector",
      "tradein",
      "whatsapp",
    ]);
    for (const agent of result.agents) {
      expect(agent.displayName).toBeTruthy();
      expect(agent.email).toMatch(/@grayarx\.com$/);
      expect(agent.role).toBeTruthy();
      expect(["idle", "active", "paused"]).toContain(agent.status);
      expect(typeof agent.stats.actionCount).toBe("number");
    }
  });

  it("reflects action counts after activity is logged", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    // Submit a lead — that should generate at least one Mia (email) activity entry.
    await caller.leads.create({
      dealershipName: "Test Motors",
      contactName: "Alex Tester",
      email: "alex@test.com",
      phone: "+27721234567",
      language: "en",
    });
    const { agents } = await caller.agent.list();
    const mia = agents.find((a) => a.id === "email");
    expect(mia).toBeDefined();
    expect(mia!.stats.actionCount).toBeGreaterThan(0);
    expect(mia!.status).toBe("active");
  });
});

describe("agent.feed", () => {
  it("requires authentication", async () => {
    const caller = createCaller(null);
    await expect(caller.agent.feed({ limit: 5 })).rejects.toThrow();
  });

  it("returns the unified live feed in reverse-chronological order", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    await caller.leads.create({
      dealershipName: "Alpha Auto",
      contactName: "Person One",
      email: "one@a.com",
      phone: "+27721111111",
      language: "en",
    });
    await caller.leads.create({
      dealershipName: "Beta Motors",
      contactName: "Person Two",
      email: "two@b.com",
      phone: "+27722222222",
      language: "en",
    });
    const feed = await caller.agent.feed({ limit: 10 });
    expect(feed.length).toBeGreaterThanOrEqual(2);
    // Newest entry first
    expect(feed[0]!.summary).toMatch(/Beta Motors|Mia drafted/);
  });

  it("filters by agentId", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    await caller.leads.create({
      dealershipName: "Filter Co",
      contactName: "Person",
      email: "f@f.com",
      phone: "+27720000000",
      language: "en",
    });
    const onlyMia = await caller.agent.feed({ limit: 20, agentId: "email" });
    expect(onlyMia.length).toBeGreaterThan(0);
    for (const row of onlyMia) {
      expect(row.agentId).toBe("email");
    }
    const onlySipho = await caller.agent.feed({ limit: 20, agentId: "prospector" });
    expect(onlySipho).toEqual([]);
  });
});

describe("live multilingual reply path (leads.create → Mia)", () => {
  it("emits both a lead_received and a draft_ready activity for a clean draft", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    llmReplies.push(
      "Hi Sarah, thanks for getting in touch with GrayArx — we received your enquiry from Test Motors and will follow up within one working day. Would you like to book a 30-minute demo? Kind regards, Mia · GrayArx Customer Concierge",
    );
    await caller.leads.create({
      dealershipName: "Test Motors",
      contactName: "Sarah",
      email: "sarah@test.com",
      phone: "+27721234567",
      language: "en",
    });
    const actions = activityStore
      .filter((a) => a.agentId === "email")
      .map((a) => a.action);
    expect(actions).toContain("lead_received");
    expect(actions).toContain("draft_ready");
  });

  it("triggers the self-check rewrite when the first draft fails the guardrails", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    // First reply is a forbidden-phrase mess; second is clean.
    llmReplies.push("As an AI, dear valued customer, I cannot help.");
    llmReplies.push(
      "Hi Themba, thanks for getting in touch with GrayArx. We have your enquiry from Test Motors and will follow up within one working day. Would Tuesday at 10am suit you for a demo? Kind regards, Mia · GrayArx Customer Concierge",
    );
    await caller.leads.create({
      dealershipName: "Test Motors",
      contactName: "Themba",
      email: "themba@test.com",
      phone: "+27721234567",
      language: "en",
    });
    const ready = activityStore.find(
      (a) => a.agentId === "email" && a.action === "draft_ready",
    );
    expect(ready).toBeDefined();
    expect(
      (ready!.payload as { attempts: number; score: number }).attempts,
    ).toBe(2);
    expect(
      (ready!.payload as { reply: string }).reply,
    ).not.toContain("As an AI");
  });

  it("falls back to draft_failed (without crashing the lead) when the LLM throws", async () => {
    const llmModule = await import("./_core/llm");
    const spy = vi.spyOn(llmModule, "invokeLLM").mockRejectedValueOnce(new Error("Upstream LLM offline"));
    const caller = createCaller({ openId: "user", role: "user" });
    const result = await caller.leads.create({
      dealershipName: "Offline Co",
      contactName: "Pat",
      email: "pat@off.com",
      phone: "+27721234567",
      language: "en",
    });
    expect(result.success).toBe(true);
    const failed = activityStore.find(
      (a) => a.agentId === "email" && a.action === "draft_failed",
    );
    expect(failed).toBeDefined();
    spy.mockRestore();
  });

  it("uses the requested non-English language path", async () => {
    const caller = createCaller({ openId: "user", role: "user" });
    llmReplies.push(
      "Sawubona Thandi, ngiyabonga ngokuxhumana ne-GrayArx. Sizokuphendula kusasa. Ngiyabonga, Mia · GrayArx Customer Concierge",
    );
    await caller.leads.create({
      dealershipName: "Zulu Wheels",
      contactName: "Thandi",
      email: "thandi@zw.co.za",
      phone: "+27721234567",
      language: "zu",
    });
    const received = activityStore.find(
      (a) => a.agentId === "email" && a.action === "lead_received",
    );
    expect(received).toBeDefined();
    expect((received!.payload as { language: string }).language).toBe("zu");
    const ready = activityStore.find(
      (a) => a.agentId === "email" && a.action === "draft_ready",
    );
    expect((ready!.payload as { language: string }).language).toBe("zu");
  });
});
