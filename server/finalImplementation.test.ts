import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { generateAuthorizationUrl, googleOAuthConfig, appleOAuthConfig } from "./_core/oauthProviders";
import {
  generateEmailVerificationToken,
  verifyEmailWithToken,
  isEmailVerified,
} from "./_core/emailVerification";
import {
  createSession,
  getUserSessions,
  logoutSession,
  getSessionByToken,
} from "./_core/sessionManagement";

describe("OAuth Providers", () => {
  it("should generate Google authorization URL", () => {
    const url = generateAuthorizationUrl(googleOAuthConfig, "test-state", ["email", "profile"]);
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("client_id=");
    expect(url).toContain("redirect_uri=");
    expect(url).toContain("state=test-state");
  });

  it("should generate Apple authorization URL", () => {
    const url = generateAuthorizationUrl(appleOAuthConfig, "test-state", ["email", "name"]);
    expect(url).toContain("appleid.apple.com");
    expect(url).toContain("client_id=");
    expect(url).toContain("response_mode=form_post");
  });

  it("should have correct OAuth config structure", () => {
    expect(googleOAuthConfig).toHaveProperty("clientId");
    expect(googleOAuthConfig).toHaveProperty("redirectUri");
    expect(googleOAuthConfig).toHaveProperty("authorizationUrl");
    expect(googleOAuthConfig).toHaveProperty("tokenUrl");
    expect(googleOAuthConfig).toHaveProperty("userInfoUrl");
  });

  it("should have test credentials as fallback", () => {
    expect(googleOAuthConfig.clientId).toBeDefined();
    expect(googleOAuthConfig.clientId).not.toBe("");
  });
});

describe("Email Verification", () => {
  it("should generate email verification token", async () => {
    const token = await generateEmailVerificationToken(1, "test@example.com");
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
  });

  it("should verify email with valid token", async () => {
    const token = await generateEmailVerificationToken(1, "test@example.com");
    const result = await verifyEmailWithToken(token);
    expect(result).toBeDefined();
    expect(result?.userId).toBe(1);
    expect(result?.email).toBe("test@example.com");
  });

  it("should return null for invalid token", async () => {
    const result = await verifyEmailWithToken("invalid-token");
    expect(result).toBeNull();
  });

  it("should return null for already verified token", async () => {
    const token = await generateEmailVerificationToken(1, "test@example.com");
    await verifyEmailWithToken(token);
    const result = await verifyEmailWithToken(token);
    expect(result).toBeNull();
  });

  it("should check email verification status", async () => {
    const token = await generateEmailVerificationToken(1, "test@example.com");
    await verifyEmailWithToken(token);
    const verified = await isEmailVerified(1);
    expect(verified).toBe(true);
  });
});

describe("Session Management", () => {
  let sessionToken: string;

  it("should create a new session", async () => {
    const session = await createSession(1, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "192.168.1.1");
    expect(session).toBeDefined();
    expect(session.userId).toBe(1);
    expect(session.deviceName).toBeDefined();
    expect(session.browser).toBeDefined();
    expect(session.ipAddress).toBe("192.168.1.1");
    sessionToken = session.token;
  });

  it("should get user sessions", async () => {
    const sessions = await getUserSessions(1);
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThan(0);
  });

  it("should get session by token", async () => {
    const session = await getSessionByToken(sessionToken);
    expect(session).toBeDefined();
    expect(session?.userId).toBe(1);
    expect(session?.token).toBe(sessionToken);
  });

  it("should logout a session", async () => {
    const session = await createSession(1, "Mozilla/5.0", "192.168.1.2");
    await logoutSession(session.id);
    const result = await getSessionByToken(session.token);
    expect(result).toBeNull();
  });

  it("should parse device info from user agent", async () => {
    const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15";
    const session = await createSession(1, userAgent, "192.168.1.3");
    expect(session.deviceType).toBeDefined();
    expect(session.browser).toBeDefined();
  });
});

describe("Integration Tests", () => {
  it("should handle complete OAuth flow", () => {
    const state = "test-state-123";
    const url = generateAuthorizationUrl(googleOAuthConfig, state, ["email", "profile"]);
    expect(url).toContain(state);
    expect(url).toContain("response_type=code");
  });

  it("should handle complete email verification flow", async () => {
    const token = await generateEmailVerificationToken(2, "integration@example.com");
    const verified = await verifyEmailWithToken(token);
    expect(verified?.email).toBe("integration@example.com");
  });

  it("should handle complete session flow", async () => {
    const session = await createSession(2, "Mozilla/5.0", "192.168.1.4");
    const sessions = await getUserSessions(2);
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.some((s) => s.token === session.token)).toBe(true);
  });
});
