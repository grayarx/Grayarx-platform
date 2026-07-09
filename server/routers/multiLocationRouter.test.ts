import { describe, it, expect } from "vitest";
import { multiLocationRouter } from "./multiLocationRouter";

describe("Multi-Location Router", () => {
  it("should get user dealerships", async () => {
    const caller = multiLocationRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getUserDealerships();
    
    expect(result).toHaveProperty("dealerships");
    expect(Array.isArray(result.dealerships)).toBe(true);
    expect(result.dealerships.length).toBeGreaterThan(0);
  });

  it("should get dealership details", async () => {
    const caller = multiLocationRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getDealershipDetails({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("details");
    expect(result.details).toHaveProperty("name");
    expect(result.details).toHaveProperty("location");
  });

  it("should create dealership", async () => {
    const caller = multiLocationRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.createDealership({
      name: "GrayArx West",
      location: "Cape Town",
      address: "100 Main St, Cape Town",
      phone: "+27 21 123 4567",
      email: "west@grayarx.co.za",
      managerId: 1,
      businessHours: { open: "08:00", close: "18:00" },
    });
    
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("dealershipId");
  });

  it("should get dealership staff", async () => {
    const caller = multiLocationRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getDealershipStaff({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("staff");
    expect(Array.isArray(result.staff)).toBe(true);
  });

  it("should get cross-location analytics", async () => {
    const caller = multiLocationRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getCrossLocationAnalytics();
    
    expect(result).toHaveProperty("summary");
    expect(result.summary).toHaveProperty("totalLocations");
    expect(result.summary).toHaveProperty("totalVehicles");
    expect(result).toHaveProperty("locationComparison");
  });

  it("should sync data across locations", async () => {
    const caller = multiLocationRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.syncDataAcrossLocations({
      sourceLocationId: 1,
      targetLocationIds: [2, 3],
      dataType: "templates",
    });
    
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("synced", true);
  });

  it("should consolidate inventory", async () => {
    const caller = multiLocationRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.consolidateInventory({ dealershipIds: [1, 2, 3] });
    
    expect(result).toHaveProperty("locations");
    expect(result).toHaveProperty("consolidatedInventory");
    expect(result.consolidatedInventory).toHaveProperty("totalVehicles");
  });
});
