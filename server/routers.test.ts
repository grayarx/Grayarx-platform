import { describe, it, expect, beforeEach, vi } from "vitest";
import { twoFactorRouter } from "./routers/twoFactorRouter";
import { socialLoginRouter } from "./routers/socialLoginRouter";
import { adminUserRouter } from "./routers/adminUserRouter";

describe("2FA Router", () => {
  const mockCtx = {
    user: {
      id: 1,
      email: "test@grayarx.com",
      role: "user" as const,
    },
  };

  it("should enable 2FA with authenticator method", async () => {
    const caller = twoFactorRouter.createCaller(mockCtx);
    const result = await caller.enable2FA({ method: "authenticator" });

    expect(result).toHaveProperty("secret");
    expect(result).toHaveProperty("qrCode");
    expect(result.method).toBe("authenticator");
  });

  it("should generate backup codes", async () => {
    const caller = twoFactorRouter.createCaller(mockCtx);
    const result = await caller.generateBackupCodes();

    expect(result).toHaveProperty("codes");
    expect(Array.isArray(result.codes)).toBe(true);
    expect(result.codes.length).toBe(10);
  });

  it("should get 2FA status", async () => {
    const caller = twoFactorRouter.createCaller(mockCtx);
    const result = await caller.get2FAStatus();

    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("enabled");
    expect(result).toHaveProperty("methods");
    expect(result.userId).toBe(1);
  });

  it("should disable 2FA", async () => {
    const caller = twoFactorRouter.createCaller(mockCtx);
    const result = await caller.disable2FA({ method: "authenticator" });

    expect(result.success).toBe(true);
    expect(result.message).toContain("disabled");
  });
});

describe("Social Login Router", () => {
  const mockCtx = {
    user: {
      id: 1,
      email: "test@grayarx.com",
      role: "user" as const,
    },
  };

  it("should get linked accounts", async () => {
    const caller = socialLoginRouter.createCaller(mockCtx);
    const result = await caller.getLinkedAccounts();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should link a social account", async () => {
    const caller = socialLoginRouter.createCaller(mockCtx);
    const result = await caller.linkAccount({
      provider: "google",
      providerId: "google-123",
      email: "test@gmail.com",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("linked");
  });

  it("should unlink a social account", async () => {
    const caller = socialLoginRouter.createCaller(mockCtx);
    const result = await caller.unlinkAccount({ provider: "google" });

    expect(result.success).toBe(true);
    expect(result.message).toContain("unlinked");
  });
});

describe("Admin User Router", () => {
  const mockCtx = {
    user: {
      id: 1,
      email: "admin@grayarx.com",
      role: "admin" as const,
    },
  };

  it("should list users", async () => {
    const caller = adminUserRouter.createCaller(mockCtx);
    const result = await caller.listUsers({
      page: 1,
      limit: 20,
    });

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should get audit log", async () => {
    const caller = adminUserRouter.createCaller(mockCtx);
    const result = await caller.getAuditLog({
      page: 1,
      limit: 50,
    });

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should get login history", async () => {
    const caller = adminUserRouter.createCaller(mockCtx);
    const result = await caller.getLoginHistory({
      userId: 2,
      limit: 50,
    });

    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("logins");
    expect(result.userId).toBe(2);
  });
});
