import { describe, it, expect } from "vitest";
import { advancedReportingRouter } from "./advancedReportingRouter";

describe("Advanced Reporting Router", () => {
  it("should get sales report", async () => {
    const caller = advancedReportingRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getSalesReport({
      dealershipId: 1,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-05-26"),
    });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("report");
    expect(result.report).toHaveProperty("totalSales");
    expect(result.report).toHaveProperty("totalRevenue");
  });

  it("should get customer report", async () => {
    const caller = advancedReportingRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getCustomerReport({
      dealershipId: 1,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-05-26"),
    });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("report");
    expect(result.report).toHaveProperty("newCustomers");
  });

  it("should get inventory report", async () => {
    const caller = advancedReportingRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getInventoryReport({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("report");
    expect(result.report).toHaveProperty("totalVehicles");
  });

  it("should get forecast", async () => {
    const caller = advancedReportingRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getForecast({
      dealershipId: 1,
      metric: "sales",
      months: 6,
    });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("forecast");
    expect(Array.isArray(result.forecast)).toBe(true);
  });

  it("should get KPI dashboard", async () => {
    const caller = advancedReportingRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getKPIDashboard({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("kpis");
    expect(result.kpis).toHaveProperty("salesThisMonth");
  });

  it("should get report templates", async () => {
    const caller = advancedReportingRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getReportTemplates({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("templates");
    expect(Array.isArray(result.templates)).toBe(true);
  });
});
