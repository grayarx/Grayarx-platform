/**
 * Tests for the admin "Brand kit" page's server endpoints:
 * - adminDealerships.uploadBrandLogo (real file upload, replacing the old
 *   "coming soon" toast) — validates size/type and stores via storagePut.
 * - adminDealerships.updateBrandKit — persists the resulting URL (including
 *   the long base64 data: URL fallback used when no S3/R2 bucket is set).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDealershipById: vi.fn(),
    updateDealershipBrand: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({
    key,
    url: `/manus-storage/${key}`,
  })),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import { storagePut } from "./storage";

type Ctx = { user: { id: number; openId: string; role: string } };

const founderCtx: Ctx = { user: { id: 1, openId: "founder", role: "founder" } };
const dealerCtx: Ctx = { user: { id: 2, openId: "dealer", role: "dealer_owner" } };

// 1x1 transparent PNG
const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("adminDealerships.uploadBrandLogo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads a valid PNG and returns a URL", async () => {
    vi.mocked(db.getDealershipById).mockResolvedValueOnce({ id: 5 } as any);
    const caller = appRouter.createCaller(founderCtx as any);

    const result = await caller.adminDealerships.uploadBrandLogo({
      dealershipId: 5,
      mimeType: "image/png",
      dataBase64: TINY_PNG,
      filename: "logo.png",
    });

    expect(storagePut).toHaveBeenCalledOnce();
    const [key] = vi.mocked(storagePut).mock.calls[0];
    expect(key).toContain("brand-logos/5/");
    expect(result.url).toContain("/manus-storage/");
  });

  it("rejects oversized uploads", async () => {
    vi.mocked(db.getDealershipById).mockResolvedValueOnce({ id: 5 } as any);
    const caller = appRouter.createCaller(founderCtx as any);

    // ~6MB of base64 (well above the 5MB decoded limit).
    const bigBase64 = "A".repeat(8_000_000);

    await expect(
      caller.adminDealerships.uploadBrandLogo({
        dealershipId: 5,
        mimeType: "image/png",
        dataBase64: bigBase64,
        filename: "huge.png",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects unknown dealership", async () => {
    vi.mocked(db.getDealershipById).mockResolvedValueOnce(null);
    const caller = appRouter.createCaller(founderCtx as any);

    await expect(
      caller.adminDealerships.uploadBrandLogo({
        dealershipId: 999,
        mimeType: "image/png",
        dataBase64: TINY_PNG,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("rejects non-founder/admin callers", async () => {
    const caller = appRouter.createCaller(dealerCtx as any);
    await expect(
      caller.adminDealerships.uploadBrandLogo({
        dealershipId: 5,
        mimeType: "image/png",
        dataBase64: TINY_PNG,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(db.getDealershipById).not.toHaveBeenCalled();
  });

  it("rejects unsupported mime types at the schema level", async () => {
    const caller = appRouter.createCaller(founderCtx as any);
    await expect(
      caller.adminDealerships.uploadBrandLogo({
        dealershipId: 5,
        // @ts-expect-error deliberately invalid for the test
        mimeType: "application/pdf",
        dataBase64: TINY_PNG,
      }),
    ).rejects.toBeTruthy();
  });
});

describe("adminDealerships.updateBrandKit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists a hosted https logo URL", async () => {
    const caller = appRouter.createCaller(founderCtx as any);
    const result = await caller.adminDealerships.updateBrandKit({
      dealershipId: 5,
      brandLogoUrl: "https://cdn.example.com/logo.png",
    });
    expect(result.ok).toBe(true);
    expect(db.updateDealershipBrand).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ brandLogoUrl: "https://cdn.example.com/logo.png" }),
    );
  });

  it("persists a long base64 data: URL (no-S3 storage fallback)", async () => {
    const caller = appRouter.createCaller(founderCtx as any);
    const longDataUrl = `data:image/png;base64,${"A".repeat(500_000)}`;

    const result = await caller.adminDealerships.updateBrandKit({
      dealershipId: 5,
      brandLogoUrl: longDataUrl,
    });

    expect(result.ok).toBe(true);
    expect(db.updateDealershipBrand).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ brandLogoUrl: longDataUrl }),
    );
  });

  it("sanitises an invalid accent colour to null rather than erroring", async () => {
    const caller = appRouter.createCaller(founderCtx as any);
    await caller.adminDealerships.updateBrandKit({
      dealershipId: 5,
      brandAccentColor: "not-a-hex-colour",
    });
    expect(db.updateDealershipBrand).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ brandAccentColor: null }),
    );
  });

  it("rejects non-founder/admin callers", async () => {
    const caller = appRouter.createCaller(dealerCtx as any);
    await expect(
      caller.adminDealerships.updateBrandKit({
        dealershipId: 5,
        brandLogoUrl: "https://cdn.example.com/logo.png",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(db.updateDealershipBrand).not.toHaveBeenCalled();
  });
});
