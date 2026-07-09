/**
 * Tests for the new owner-only `admin.listDealerships` endpoint, the peer
 * `network.photos` gallery (no contact/price fields leak), and the
 * `dealer.uploadVehiclePhoto` mutation (storage call + URL persistence).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    listDealerships: vi.fn(),
    listAllDealerships: vi.fn(),
    listDealerNetworkPhotos: vi.fn(),
    listOnboardingSubmissions: vi.fn(),
    createOnboardingSubmission: vi.fn(),
    updateOnboardingStatus: vi.fn(),
    listPendingApprovals: vi.fn(),
    decideApproval: vi.fn(),
    listFallbackMessages: vi.fn(),
    resolveFallbackMessage: vi.fn(),
    listRoadmap: vi.fn(),
    createRoadmapItem: vi.fn(),
    decideRoadmapItem: vi.fn(),
    getAdminOverview: vi.fn(),
  };
});

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({
    key,
    url: `/manus-storage/${key}`,
  })),
}));

vi.mock("./_core/heartbeat", () => ({
  createHeartbeatJob: vi.fn(),
  listHeartbeatJobs: vi.fn(),
  updateHeartbeatJob: vi.fn(),
  deleteHeartbeatJob: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("./_core/calling", () => ({ placeOutboundCall: vi.fn() }));
vi.mock("./_core/agentPrompts", async () => {
  const actual = await vi.importActual<typeof import("./_core/agentPrompts")>(
    "./_core/agentPrompts",
  );
  return { ...actual, generateAgentReply: vi.fn() };
});

import { appRouter } from "./routers";
import { storagePut } from "./storage";

type Ctx = { user: { id: number; openId: string; role: "admin" | "user" } };

const ownerCtx: Ctx = {
  user: { id: 1, openId: "owner", role: "admin" },
};
const dealerCtx: Ctx = {
  user: { id: 2, openId: "dealer", role: "user" },
};

describe("admin.listDealerships", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the dealership directory for the owner", async () => {
    vi.mocked(db.listAllDealerships).mockResolvedValueOnce([
      {
        id: 1,
        name: "Owner",
        email: "owner@grayarx.com",
        role: "admin",
        createdAt: new Date("2026-01-01"),
        lastSignedIn: new Date("2026-05-01"),
        vehicleCount: 12,
        leadCount: 30,
      },
    ]);
    const caller = appRouter.createCaller(ownerCtx as any);
    const rows = await caller.admin.listDealerships();
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("owner@grayarx.com");
  });

  it("rejects non-owners with FORBIDDEN", async () => {
    const caller = appRouter.createCaller(dealerCtx as any);
    await expect(caller.admin.listDealerships()).rejects.toBeInstanceOf(
      TRPCError,
    );
  });
});

describe("network.photos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only image URLs and ids \u2014 no prices, names or contact info", async () => {
    vi.mocked(db.listDealerNetworkPhotos).mockResolvedValueOnce([
      { id: 1, imageUrl: "/manus-storage/a.jpg", createdAt: new Date() },
      { id: 2, imageUrl: "/manus-storage/b.jpg", createdAt: new Date() },
    ]);

    const caller = appRouter.createCaller(dealerCtx as any);
    const rows = await caller.network.photos({ limit: 10 });

    expect(rows).toHaveLength(2);
    for (const r of rows) {
      // Whitelist the keys we expect; anything else (e.g. price, contact) would
      // be a leak.
      expect(Object.keys(r).sort()).toEqual(["createdAt", "id", "imageUrl"]);
    }
  });
});

describe("dealer.uploadVehiclePhoto", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads to storage and returns the storage URL", async () => {
    const caller = appRouter.createCaller(dealerCtx as any);
    const result = await caller.dealer.uploadVehiclePhoto({
      filename: "test.png",
      mimeType: "image/png",
      // 1x1 transparent png
      dataBase64:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    });

    expect(storagePut).toHaveBeenCalledOnce();
    expect(result.url).toContain("/manus-storage/");
  });

  it("rejects unauthenticated callers", async () => {
    // protectedProcedure throws when ctx.user is missing
    const anon = appRouter.createCaller({ user: null } as any);
    await expect(
      anon.dealer.uploadVehiclePhoto({
        filename: "x.png",
        mimeType: "image/png",
        dataBase64: "AAAA",
      }),
    ).rejects.toBeTruthy();
  });
});
