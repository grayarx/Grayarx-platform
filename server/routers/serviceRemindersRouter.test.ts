import { describe, it, expect } from "vitest";
import { serviceRemindersRouter } from "./serviceRemindersRouter";

describe("Service Reminders Router", () => {
  it("should get maintenance schedule", async () => {
    const caller = serviceRemindersRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getMaintenanceSchedule({ vehicleId: 1, dealershipId: 1 });
    
    expect(result).toHaveProperty("vehicleId", 1);
    expect(result).toHaveProperty("schedule");
    expect(Array.isArray(result.schedule)).toBe(true);
    expect(result.schedule.length).toBeGreaterThan(0);
  });

  it("should create reminder rule", async () => {
    const caller = serviceRemindersRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.createReminderRule({
      dealershipId: 1,
      serviceType: "Oil Change",
      interval: "5000 miles",
      reminderDaysBefore: 14,
      channel: "sms",
    });
    
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("ruleId");
  });

  it("should get reminder rules", async () => {
    const caller = serviceRemindersRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getReminderRules({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("rules");
    expect(Array.isArray(result.rules)).toBe(true);
  });

  it("should send service reminder", async () => {
    const caller = serviceRemindersRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.sendServiceReminder({
      customerId: 101,
      vehicleId: 1,
      dealershipId: 1,
      serviceType: "Oil Change",
      channel: "sms",
    });
    
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("reminderSent", true);
  });

  it("should get pending reminders", async () => {
    const caller = serviceRemindersRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getPendingReminders({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("pendingReminders");
    expect(Array.isArray(result.pendingReminders)).toBe(true);
  });

  it("should get reminder statistics", async () => {
    const caller = serviceRemindersRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getReminderStats({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("stats");
    expect(result.stats).toHaveProperty("totalRemindersSent");
    expect(result.stats).toHaveProperty("deliveryRate");
  });
});
