import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

describe("public showroom + scheduling", () => {
  it("showroom.get returns null/undefined for non-existent id without auth", async () => {
    const caller = createCaller(null);
    const result = await caller.showroom.get({ id: 9_999_999 });
    // Drizzle returns undefined for missing single row; accept either.
    expect(result === null || result === undefined).toBe(true);
  });

  it("showroom.list is public and returns a paginated page object", async () => {
    const caller = createCaller(null);
    const result = await caller.showroom.list();
    expect(result).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        hasMore: expect.any(Boolean),
        nextOffset: expect.any(Number),
      }),
    );
  });

  it("prospects.listSchedules requires authentication", async () => {
    const caller = createCaller(null);
    await expect(caller.prospects.listSchedules()).rejects.toThrow();
  });

  it("prospects.enableNightlySchedule requires authentication", async () => {
    const caller = createCaller(null);
    await expect(caller.prospects.enableNightlySchedule()).rejects.toThrow();
  });
});


import { normalizeToE164, placeOutboundCall } from "./_core/calling";

describe("calling agent (Twilio integration)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("normalizes a SA local number to E.164", () => {
    expect(normalizeToE164("0794915187")).toBe("+27794915187");
  });

  it("keeps an already-international number as-is", () => {
    expect(normalizeToE164("+27794915187")).toBe("+27794915187");
  });

  it("returns null for invalid input", () => {
    expect(normalizeToE164("abc")).toBeNull();
  });

  it("gracefully skips outbound call when Twilio secrets are missing", async () => {
    const result = await placeOutboundCall({ toNumber: "+27794915187" });
    expect(result.ok).toBe(false);
    // @ts-expect-error – discriminated union narrowing
    expect(result.skipped).toBe(true);
  });
});
