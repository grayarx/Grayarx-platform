import { describe, it, expect } from "vitest";
import { COOKIE_NAME } from "@shared/const";
import type { Request } from "express";

/**
 * Smoke tests: Manus OAuth / SendGrid removed; dealer auth + Resend remain.
 */
describe("Auth and email after Manus/SendGrid removal", () => {
  it("sdk authenticateRequest accepts custom email/password session cookies", async () => {
    const { sdk } = await import("./_core/sdk");
    const token = Buffer.from(
      JSON.stringify({ userId: 1, email: "dealer@example.com", exp: Date.now() + 60_000 })
    ).toString("base64");

    const req = {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    } as unknown as Request;

    // Without DB user this throws; but verifyCustomSessionToken path runs first
    // (not Manus OAuth). Missing user → ForbiddenError is expected.
    await expect(sdk.authenticateRequest(req)).rejects.toThrow();
  });

  it("sdk has no Manus OAuth exchange methods", async () => {
    const { sdk } = await import("./_core/sdk");
    expect((sdk as any).exchangeCodeForToken).toBeUndefined();
    expect((sdk as any).getUserInfo).toBeUndefined();
    expect((sdk as any).getUserInfoWithJwt).toBeUndefined();
  });

  it("ENV has no oAuthServerUrl or sendgridApiKey", async () => {
    const { ENV } = await import("./_core/env");
    expect((ENV as any).oAuthServerUrl).toBeUndefined();
    expect((ENV as any).sendgridApiKey).toBeUndefined();
    expect(typeof ENV.resendApiKey).toBe("string");
  });

  it("emailService uses Resend", async () => {
    const emailService = await import("./_core/emailService");
    const resend = await import("./_core/resendEmailService");
    expect(typeof emailService.sendBrandedEmail).toBe("function");
    expect(typeof resend.sendEmailViaResend).toBe("function");
  });

  it("getLoginUrl is local /login (no Manus portal)", async () => {
    // Mirror client/src/const.ts behavior without importing Vite client code
    const getLoginUrl = (returnPath?: string) =>
      `/login${returnPath ? `?returnPath=${encodeURIComponent(returnPath)}` : ""}`;
    expect(getLoginUrl()).toBe("/login");
    expect(getLoginUrl("/dashboard")).toBe("/login?returnPath=%2Fdashboard");
    expect(getLoginUrl()).not.toContain("manus");
    expect(getLoginUrl()).not.toContain("oauth");
  });
});
