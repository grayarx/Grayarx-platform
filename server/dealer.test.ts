import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// Smoke test: prospects.list and dealer.stats are protected (no ctx.user => UNAUTHORIZED)
// We use the same pattern as server/auth.logout.test.ts: create caller with no user.

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

describe("dealer + prospects routers", () => {
  it("dealer.stats requires authentication", async () => {
    const caller = createCaller(null);
    await expect(caller.dealer.stats()).rejects.toThrow();
  });

  it("dealer.listLeads requires authentication", async () => {
    const caller = createCaller(null);
    await expect(caller.dealer.listLeads()).rejects.toThrow();
  });

  it("prospects.list requires authentication", async () => {
    const caller = createCaller(null);
    await expect(caller.prospects.list()).rejects.toThrow();
  });

  it("prospects.scout requires authentication", async () => {
    const caller = createCaller(null);
    await expect(
      caller.prospects.scout({ region: "Gauteng", count: 1 }),
    ).rejects.toThrow();
  });

  it("dealer.stats returns valid shape when authenticated", async () => {
    const caller = createCaller({ openId: "test-user", role: "user" });
    const stats = await caller.dealer.stats();
    expect(stats).toHaveProperty("totalLeads");
    expect(stats).toHaveProperty("totalBookings");
    expect(stats).toHaveProperty("totalVehicles");
    expect(stats).toHaveProperty("totalProspects");
    expect(typeof stats.totalLeads).toBe("number");
  });
});
