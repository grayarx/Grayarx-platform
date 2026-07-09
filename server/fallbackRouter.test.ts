/**
 * Router-level coverage for adminFallback.trigger.
 *
 * Verifies:
 *   - rejects non-admins with FORBIDDEN
 *   - inside business hours without `force`: returns ok:false
 *   - after-hours: drafts a reply, persists the row, calls notifyOwner
 *   - inside business hours with `force=true`: also drafts/persists
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const persistedMessages: Array<any> = [];
const dealershipsStore = [
  { id: 7, name: "Karoo Motors", brandLogoUrl: null, brandAccentColor: null, brandSignature: null, vatNumber: null, bankDetails: null, languages: ["en"] },
];

vi.mock("./db", async () => {
  return {
    getDb: vi.fn(async () => null),
    upsertUser: vi.fn(async () => undefined),
    getUserByOpenId: vi.fn(async () => undefined),
    listAllDealerships: vi.fn(async () => dealershipsStore),
    getDealershipById: vi.fn(async (id: number) =>
      dealershipsStore.find((d) => d.id === id) ?? null,
    ),
    createFallbackMessage: vi.fn(async (input: any) => {
      const id = persistedMessages.length + 1;
      persistedMessages.push({ id, ...input });
      return { id, reference: input.referenceNumber };
    }),
    listFallbackMessages: vi.fn(async () => persistedMessages),
    resolveFallbackMessage: vi.fn(async () => undefined),
    logAgentActivity: vi.fn(async () => undefined),
  };
});

const notificationMocks = vi.hoisted(() => ({
  notifyOwner: vi.fn(async () => true),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: notificationMocks.notifyOwner,
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: "" } }] })),
}));

// Force `isAfterHoursSAST` deterministically per-test.
const fakeNow = { value: new Date("2026-05-19T03:00:00.000Z") }; // Tue 05:00 SAST → after-hours
vi.mock("./_core/fallbackAgent", async () => {
  const actual = await vi.importActual<typeof import("./_core/fallbackAgent")>(
    "./_core/fallbackAgent",
  );
  return {
    ...actual,
    isAfterHoursSAST: () => actual.isAfterHoursSAST(fakeNow.value),
  };
});

import { appRouter } from "./routers";

function createCaller(role: "user" | "admin" | null) {
  return appRouter.createCaller({
    user: role
      ? ({
          id: 1,
          openId: "founder",
          name: "Founder",
          email: "founder@example.com",
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as never)
      : null,
    req: { headers: {} } as never,
    res: { setHeader: () => undefined } as never,
  });
}

beforeEach(() => {
  persistedMessages.length = 0;
  notificationMocks.notifyOwner.mockClear();
  fakeNow.value = new Date("2026-05-19T03:00:00.000Z");
});

describe("adminFallback.trigger", () => {
  it("rejects non-admin callers", async () => {
    const caller = createCaller("user");
    await expect(
      caller.adminFallback.trigger({
        dealershipId: 7,
        channel: "email",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns ok:false during business hours without force", async () => {
    fakeNow.value = new Date("2026-05-19T09:00:00.000Z"); // Tue 11:00 SAST
    const caller = createCaller("admin");
    const res = await caller.adminFallback.trigger({
      dealershipId: 7,
      channel: "email",
      customerName: "Sipho",
    });
    expect(res.ok).toBe(false);
    expect(persistedMessages).toHaveLength(0);
    expect(notificationMocks.notifyOwner).not.toHaveBeenCalled();
  });

  it("drafts + persists + notifies owner after-hours", async () => {
    const caller = createCaller("admin");
    const res = await caller.adminFallback.trigger({
      dealershipId: 7,
      channel: "whatsapp",
      customerName: "Naledi",
      customerContact: "+27821234567",
      inboundMessage: "Is the Hilux still available?",
      language: "en",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return; // narrow for TS
    expect(res.reference).toMatch(/^GA-K7-/);
    expect(persistedMessages).toHaveLength(1);
    expect(persistedMessages[0]?.outboundReply).toBeTruthy();
    expect(notificationMocks.notifyOwner).toHaveBeenCalledTimes(1);
    const arg = notificationMocks.notifyOwner.mock.calls[0]?.[0] as
      | { title: string; content: string }
      | undefined;
    expect(arg?.title).toContain("after-hours");
    expect(arg?.content).toContain("Karoo Motors");
    expect(arg?.content).toContain(res.reference);
  });

  it("with force=true the founder can override business hours", async () => {
    fakeNow.value = new Date("2026-05-19T09:00:00.000Z"); // Tue 11:00 SAST
    const caller = createCaller("admin");
    const res = await caller.adminFallback.trigger({
      dealershipId: 7,
      channel: "email",
      customerName: "Test",
      force: true,
    });
    expect(res.ok).toBe(true);
    expect(persistedMessages).toHaveLength(1);
  });
});
