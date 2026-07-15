import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Request } from "express";

vi.mock("./sdk", () => ({
  sdk: { authenticateRequest: vi.fn() },
}));

import { hasScheduledTaskSecret, isAuthorizedScheduledTask } from "./scheduledAuth";
import { sdk } from "./sdk";

function makeReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

describe("scheduledAuth", () => {
  const ORIGINAL_SECRET = process.env.SCHEDULED_TASK_SECRET;

  beforeEach(() => {
    vi.mocked(sdk.authenticateRequest).mockReset();
  });

  afterEach(() => {
    process.env.SCHEDULED_TASK_SECRET = ORIGINAL_SECRET;
  });

  describe("hasScheduledTaskSecret", () => {
    it("returns false when SCHEDULED_TASK_SECRET is not configured", () => {
      delete process.env.SCHEDULED_TASK_SECRET;
      const req = makeReq({ "x-scheduled-task-secret": "anything" });
      expect(hasScheduledTaskSecret(req)).toBe(false);
    });

    it("returns false when header is missing", () => {
      process.env.SCHEDULED_TASK_SECRET = "top-secret";
      expect(hasScheduledTaskSecret(makeReq())).toBe(false);
    });

    it("returns false when header doesn't match", () => {
      process.env.SCHEDULED_TASK_SECRET = "top-secret";
      const req = makeReq({ "x-scheduled-task-secret": "wrong" });
      expect(hasScheduledTaskSecret(req)).toBe(false);
    });

    it("returns true when header matches", () => {
      process.env.SCHEDULED_TASK_SECRET = "top-secret";
      const req = makeReq({ "x-scheduled-task-secret": "top-secret" });
      expect(hasScheduledTaskSecret(req)).toBe(true);
    });
  });

  describe("isAuthorizedScheduledTask", () => {
    it("authorizes via the shared-secret header without touching the legacy SDK", async () => {
      process.env.SCHEDULED_TASK_SECRET = "top-secret";
      const req = makeReq({ "x-scheduled-task-secret": "top-secret" });
      expect(await isAuthorizedScheduledTask(req)).toBe(true);
      expect(sdk.authenticateRequest).not.toHaveBeenCalled();
    });

    it("authorizes via the legacy x-manus-heartbeat header", async () => {
      delete process.env.SCHEDULED_TASK_SECRET;
      const req = makeReq({ "x-manus-heartbeat": "true" });
      expect(await isAuthorizedScheduledTask(req)).toBe(true);
    });

    it("authorizes via a legacy Manus cron session when isCron is true", async () => {
      delete process.env.SCHEDULED_TASK_SECRET;
      vi.mocked(sdk.authenticateRequest).mockResolvedValue({ isCron: true } as any);
      expect(await isAuthorizedScheduledTask(makeReq())).toBe(true);
    });

    it("is NOT authorized (and does not throw) when there's no secret, no heartbeat header, and no session cookie", async () => {
      delete process.env.SCHEDULED_TASK_SECRET;
      vi.mocked(sdk.authenticateRequest).mockRejectedValue(new Error("Invalid session cookie"));
      await expect(isAuthorizedScheduledTask(makeReq())).resolves.toBe(false);
    });

    it("is not authorized when the legacy session resolves but isCron is falsy", async () => {
      delete process.env.SCHEDULED_TASK_SECRET;
      vi.mocked(sdk.authenticateRequest).mockResolvedValue({ isCron: false } as any);
      expect(await isAuthorizedScheduledTask(makeReq())).toBe(false);
    });
  });
});
