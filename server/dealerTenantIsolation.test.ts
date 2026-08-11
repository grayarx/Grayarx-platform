import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getRecentActivity,
  getDashboardStats,
  getLeadsTrend,
  listLeads,
  listBookings,
  listProspects,
  listVehicles,
} = vi.hoisted(() => ({
  getRecentActivity: vi.fn(),
  getDashboardStats: vi.fn(),
  getLeadsTrend: vi.fn(),
  listLeads: vi.fn(),
  listBookings: vi.fn(),
  listProspects: vi.fn(),
  listVehicles: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getRecentActivity,
    getDashboardStats,
    getLeadsTrend,
    listLeads,
    listBookings,
    listProspects,
    getLeadById: vi.fn(),
    updateLeadStatus: vi.fn(),
    updateBookingStatus: vi.fn(),
    listVehicles,
    listTestDriveBookings: vi.fn(async () => []),
    getDealershipById: vi.fn(),
    listDealershipsByGroupKey: vi.fn(async () => []),
    updateUserDealershipId: vi.fn(),
    getDb: vi.fn(async () => null),
  };
});

import { appRouter } from "./routers";

function createCaller(user: {
  openId: string;
  role: "user" | "admin" | "founder" | "dealer_owner" | "dealer_consultant";
  dealershipId?: number | null;
} | null) {
  return appRouter.createCaller({
    user: user
      ? ({
          id: 1,
          openId: user.openId,
          name: "Test User",
          email: "dealer@example.com",
          loginMethod: "email",
          role: user.role,
          dealershipId: user.dealershipId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as never)
      : null,
    req: { headers: {} } as never,
    res: { setHeader: () => undefined } as never,
  } as never);
}

describe("dealer multi-tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRecentActivity.mockResolvedValue([]);
    getDashboardStats.mockResolvedValue({
      totalLeads: 0,
      newLeads: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      totalVehicles: 0,
      availableVehicles: 0,
      reservedVehicles: 0,
      soldVehicles: 0,
      leadsLast7Days: 0,
      bookingsLast7Days: 0,
      totalProspects: 0,
      queuedProspects: 0,
    });
    getLeadsTrend.mockResolvedValue([]);
    listLeads.mockResolvedValue([]);
    listBookings.mockResolvedValue([]);
    listProspects.mockResolvedValue([]);
    listVehicles.mockResolvedValue([]);
  });

  it("dealer.activity scopes to dealershipId and never requests prospects", async () => {
    const caller = createCaller({
      openId: "dealer-1",
      role: "dealer_owner",
      dealershipId: 42,
    });
    await caller.dealer.activity();
    expect(getRecentActivity).toHaveBeenCalledWith(10, {
      dealershipId: 42,
      includeProspects: false,
    });
  });

  it("dealer.activity returns empty when dealershipId is missing", async () => {
    const caller = createCaller({
      openId: "dealer-2",
      role: "dealer_owner",
      dealershipId: null,
    });
    const rows = await caller.dealer.activity();
    expect(rows).toEqual([]);
    expect(getRecentActivity).not.toHaveBeenCalled();
  });

  it("dealer.stats scopes KPIs and excludes Prospector aggregates", async () => {
    const caller = createCaller({
      openId: "dealer-3",
      role: "dealer_owner",
      dealershipId: 7,
    });
    await caller.dealer.stats();
    expect(getDashboardStats).toHaveBeenCalledWith({
      dealershipId: 7,
      includeProspects: false,
    });
  });

  it("dealer.listBookings (platform demos) rejects non-founder dealers", async () => {
    const caller = createCaller({
      openId: "dealer-4",
      role: "dealer_owner",
      dealershipId: 7,
    });
    await expect(caller.dealer.listBookings()).rejects.toThrow(/founder|admin/i);
    expect(listBookings).not.toHaveBeenCalled();
  });

  it("dealer.listBookings allows founder", async () => {
    const caller = createCaller({
      openId: "founder-1",
      role: "founder",
      dealershipId: 1,
    });
    listBookings.mockResolvedValue([{ id: 1 }]);
    const rows = await caller.dealer.listBookings();
    expect(rows).toEqual([{ id: 1 }]);
    expect(listBookings).toHaveBeenCalled();
  });

  it("prospects.list rejects dealer roles (Admin Prospector stays founder-only)", async () => {
    const caller = createCaller({
      openId: "dealer-5",
      role: "dealer_owner",
      dealershipId: 7,
    });
    await expect(caller.prospects.list()).rejects.toThrow(/founder/i);
    expect(listProspects).not.toHaveBeenCalled();
  });

  it("prospects.list allows founder", async () => {
    const caller = createCaller({
      openId: "founder-2",
      role: "founder",
      dealershipId: null,
    });
    listProspects.mockResolvedValue([{ id: 9, dealershipName: "Riverside Auto Sales" }]);
    const rows = await caller.prospects.list();
    expect(rows).toHaveLength(1);
    expect(listProspects).toHaveBeenCalled();
  });

  it("dealer.listLeads scopes to the dealer's dealershipId", async () => {
    const caller = createCaller({
      openId: "dealer-6",
      role: "dealer_consultant",
      dealershipId: 55,
    });
    await caller.dealer.listLeads();
    expect(listLeads).toHaveBeenCalledWith(200, 55);
  });

  it("showroom.list scopes a signed-in dealer to their own stock", async () => {
    const caller = createCaller({
      openId: "dealer-7",
      role: "dealer_owner",
      dealershipId: 99,
    });
    await caller.showroom.list(null);
    expect(listVehicles).toHaveBeenLastCalledWith(
      2000,
      expect.objectContaining({
        dealershipId: 99,
        excludeSold: true,
        excludePlaceholderPrices: true,
      }),
    );
  });

  it("showroom.list gives anonymous visitors the marketplace, not a dealer's stock", async () => {
    const caller = createCaller(null);
    await caller.showroom.list(null);
    const lastArgs = listVehicles.mock.calls.at(-1);
    expect(lastArgs?.[1]).not.toHaveProperty("dealershipId");
    expect(lastArgs?.[1]).toEqual(
      expect.objectContaining({ excludeSold: true, excludePlaceholderPrices: true }),
    );
  });

  it("showroom.list honors an explicit dealershipId (public shortcode preview)", async () => {
    const caller = createCaller({
      openId: "dealer-8",
      role: "dealer_owner",
      dealershipId: 99,
    });
    await caller.showroom.list({ dealershipId: 5 });
    expect(listVehicles).toHaveBeenLastCalledWith(
      2000,
      expect.objectContaining({ dealershipId: 5 }),
    );
  });

  it("showroom.list scopes a founder with a linked yard to that yard only", async () => {
    const caller = createCaller({
      openId: "founder-yard",
      role: "founder",
      dealershipId: 42,
    });
    await caller.showroom.list(null);
    expect(listVehicles).toHaveBeenLastCalledWith(
      2000,
      expect.objectContaining({
        dealershipId: 42,
        excludeSold: true,
        excludePlaceholderPrices: true,
      }),
    );
  });

  it("dealer.listVehicles scopes a founder with a linked yard to that yard", async () => {
    const caller = createCaller({
      openId: "founder-yard-2",
      role: "founder",
      dealershipId: 77,
    });
    await caller.dealer.listVehicles();
    expect(listVehicles).toHaveBeenLastCalledWith(2000, { dealershipId: 77 });
  });

  it("dealer.listVehicles scopes a dealer to their dealership only", async () => {
    const caller = createCaller({
      openId: "dealer-9",
      role: "dealer_owner",
      dealershipId: 88,
    });
    await caller.dealer.listVehicles();
    expect(listVehicles).toHaveBeenLastCalledWith(2000, { dealershipId: 88 });
  });
});
