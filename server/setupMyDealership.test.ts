import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

const updateWhere = vi.fn();
const updateSet = vi.fn(() => ({ where: updateWhere }));
const mockDb = {
  update: vi.fn(() => ({ set: updateSet })),
};

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn(async () => mockDb),
    createDealership: vi.fn(async () => ({ id: 42, publicShortcode: "testuser" })),
  };
});

function callerFor(user: {
  id: number;
  email?: string | null;
  name?: string | null;
  role: string;
  dealershipId?: number | null;
}) {
  return appRouter.createCaller({
    user: user as any,
    req: { headers: {}, ip: "127.0.0.1" } as any,
    res: { cookie: vi.fn() } as any,
  });
}

describe("auth.setupMyDealership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateWhere.mockResolvedValue(undefined);
  });

  it("promotes a plain user and creates a dealership", async () => {
    const caller = callerFor({
      id: 9,
      email: "test.acc@example.com",
      name: "Test Acc",
      role: "user",
      dealershipId: null,
    });
    const res = await caller.auth.setupMyDealership();
    expect(res.success).toBe(true);
    expect(res.alreadyReady).toBe(false);
    expect(res.role).toBe("dealer_owner");
    expect(res.dealershipId).toBe(42);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("is idempotent when already a linked dealer", async () => {
    const caller = callerFor({
      id: 3,
      email: "owner@example.com",
      role: "dealer_owner",
      dealershipId: 7,
    });
    const res = await caller.auth.setupMyDealership();
    expect(res.alreadyReady).toBe(true);
    expect(res.dealershipId).toBe(7);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("no-ops for founders", async () => {
    const caller = callerFor({
      id: 1,
      email: "grayarx@gmail.com",
      role: "founder",
      dealershipId: null,
    });
    const res = await caller.auth.setupMyDealership();
    expect(res.alreadyReady).toBe(true);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
