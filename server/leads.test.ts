import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", async () => {
  return {
    createLead: vi.fn(async () => undefined),
    listLeads: vi.fn(async () => []),
    createBooking: vi.fn(async () => undefined),
    listBookings: vi.fn(async () => []),
    getDb: vi.fn(async () => null),
    upsertUser: vi.fn(async () => undefined),
    getUserByOpenId: vi.fn(async () => undefined),
    logAgentActivity: vi.fn(async () => undefined),
    listAgentActivity: vi.fn(async () => []),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{ message: { content: "AI suggestion: try a sedan." } }],
  })),
}));

import { appRouter } from "./routers";
import { createLead, createBooking } from "./db";
import type { Request, Response } from "express";

const buildContext = () => {
  return {
    req: { cookies: {} } as unknown as Request,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response,
    user: null,
  };
};

describe("leads.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a lead with valid input", async () => {
    const caller = appRouter.createCaller(buildContext());
    const result = await caller.leads.create({
      dealershipName: "ABC Motors",
      contactName: "Jane Doe",
      email: "jane@abc.co.za",
      phone: "+27820000000",
      monthlyVehicles: 50,
      notes: "Need help with after-hours leads",
    });

    expect(result.success).toBe(true);
    expect(createLead).toHaveBeenCalledOnce();
  });

  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(buildContext());
    await expect(
      caller.leads.create({
        dealershipName: "ABC",
        contactName: "Jane",
        email: "not-an-email",
        phone: "+27820000000",
      }),
    ).rejects.toThrow();
  });
});

describe("bookings.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a booking", async () => {
    const caller = appRouter.createCaller(buildContext());
    const result = await caller.bookings.create({
      dealershipName: "ABC Motors",
      contactName: "Jane Doe",
      email: "jane@abc.co.za",
      phone: "+27820000000",
      preferredDate: "2026-06-15",
      preferredTime: "10:00",
    });

    expect(result.success).toBe(true);
    expect(createBooking).toHaveBeenCalledOnce();
  });
});

describe("showroom.aiSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a summary", async () => {
    const caller = appRouter.createCaller(buildContext());
    const result = await caller.showroom.aiSearch({
      query: "Family SUV under R800k",
    });
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
  });
});
