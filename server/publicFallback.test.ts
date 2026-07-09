/**
 * Coverage for the public inbound fallback path + setShortcode.
 *
 * publicFallback.inbound is unauthenticated (chat widgets, WhatsApp webhooks,
 * contact forms) so its safety properties are critical:
 *   - rejects unknown shortcodes with NOT_FOUND
 *   - persists the message + pages founder regardless of after-hours
 *   - only echoes the auto-reply when actually after-hours
 *   - validates input shape (zod)
 *
 * adminFallback.setShortcode:
 *   - rejects non-admins
 *   - rejects shortcodes already taken by a different dealership
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const persistedMessages: Array<any> = [];
const dealershipsStore: Array<any> = [
  {
    id: 11,
    name: "Highveld Auto",
    publicShortcode: "highveld",
    brandLogoUrl: null,
    brandAccentColor: null,
    brandSignature: null,
    vatNumber: null,
    bankDetails: null,
    languages: ["en"],
  },
  {
    id: 12,
    name: "Cape Coast Cars",
    publicShortcode: "capecoast",
    brandLogoUrl: null,
    brandAccentColor: null,
    brandSignature: null,
    vatNumber: null,
    bankDetails: null,
    languages: ["en"],
  },
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
    getDealershipByShortcode: vi.fn(async (s: string) =>
      dealershipsStore.find((d) => d.publicShortcode === s) ?? null,
    ),
    setDealershipShortcode: vi.fn(async (id: number, s: string) => {
      const d = dealershipsStore.find((x) => x.id === id);
      if (d) d.publicShortcode = s;
    }),
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

const fakeNow = { value: new Date("2026-05-19T03:00:00.000Z") }; // after-hours by default
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
          openId: "u",
          name: "U",
          email: "u@example.com",
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
  // Reset shortcodes to known state
  dealershipsStore[0].publicShortcode = "highveld";
  dealershipsStore[1].publicShortcode = "capecoast";
});

describe("publicFallback.inbound", () => {
  it("rejects unknown shortcode with NOT_FOUND", async () => {
    const caller = createCaller(null);
    await expect(
      caller.publicFallback.inbound({
        shortcode: "nosuch",
        channel: "web_chat",
        inboundMessage: "Hi, is the Polo still available?",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(persistedMessages).toHaveLength(0);
    expect(notificationMocks.notifyOwner).not.toHaveBeenCalled();
  });

  it("validates input shape (rejects empty message and bad shortcode)", async () => {
    const caller = createCaller(null);
    await expect(
      caller.publicFallback.inbound({
        shortcode: "BAD-CODE",
        channel: "web_chat",
        inboundMessage: "hi",
      } as any),
    ).rejects.toBeTruthy();
    await expect(
      caller.publicFallback.inbound({
        shortcode: "highveld",
        channel: "web_chat",
        inboundMessage: "",
      }),
    ).rejects.toBeTruthy();
  });

  it("after-hours: persists, returns auto-reply + reference, pages founder", async () => {
    const caller = createCaller(null);
    const res = await caller.publicFallback.inbound({
      shortcode: "highveld",
      channel: "web_chat",
      customerName: "Lerato",
      customerContact: "lerato@example.com",
      inboundMessage: "Looking for a 2022 Hilux",
      language: "en",
    });
    expect(res.ok).toBe(true);
    expect(res.afterHours).toBe(true);
    expect(res.reference).toMatch(/^GA-/);
    expect(res.autoReply).toBeTruthy();
    expect(persistedMessages).toHaveLength(1);
    expect(persistedMessages[0]?.dealershipId).toBe(11);
    expect(notificationMocks.notifyOwner).toHaveBeenCalledTimes(1);
    const arg = notificationMocks.notifyOwner.mock.calls[0]?.[0] as
      | { title: string; content: string }
      | undefined;
    expect(arg?.title).toContain("after-hours");
    expect(arg?.content).toContain("Highveld Auto");
  });

  it("in-hours: still persists + pages founder, but does NOT echo an auto-reply", async () => {
    fakeNow.value = new Date("2026-05-19T09:00:00.000Z"); // Tue 11:00 SAST
    const caller = createCaller(null);
    const res = await caller.publicFallback.inbound({
      shortcode: "capecoast",
      channel: "whatsapp",
      inboundMessage: "Hi, please call me back.",
    });
    expect(res.ok).toBe(true);
    expect(res.afterHours).toBe(false);
    expect(res.autoReply).toBeNull();
    expect(persistedMessages).toHaveLength(1);
    expect(notificationMocks.notifyOwner).toHaveBeenCalledTimes(1);
    const arg = notificationMocks.notifyOwner.mock.calls[0]?.[0] as
      | { title: string; content: string }
      | undefined;
    expect(arg?.title).toContain("in-hours");
  });
});

describe("adminFallback.setShortcode", () => {
  it("rejects non-admins", async () => {
    const caller = createCaller("user");
    await expect(
      caller.adminFallback.setShortcode({
        dealershipId: 11,
        shortcode: "newone",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a shortcode already taken by another dealership", async () => {
    const caller = createCaller("admin");
    await expect(
      caller.adminFallback.setShortcode({
        dealershipId: 11,
        shortcode: "capecoast", // owned by id=12
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("accepts a free shortcode and persists it", async () => {
    const caller = createCaller("admin");
    const res = await caller.adminFallback.setShortcode({
      dealershipId: 11,
      shortcode: "highveld2",
    });
    expect(res.ok).toBe(true);
    expect(dealershipsStore[0].publicShortcode).toBe("highveld2");
  });

  it("validates shortcode format (lowercase a-z0-9, 4-12 chars)", async () => {
    const caller = createCaller("admin");
    await expect(
      caller.adminFallback.setShortcode({
        dealershipId: 11,
        shortcode: "BAD",
      } as any),
    ).rejects.toBeTruthy();
    await expect(
      caller.adminFallback.setShortcode({
        dealershipId: 11,
        shortcode: "way-too-long-shortcode",
      } as any),
    ).rejects.toBeTruthy();
  });
});
