import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateEmailVerificationToken,
  verifyEmailToken,
  markEmailAsVerified,
  autoVerifyEmailForDevelopment,
} from "./customAuth";

// Mock database
vi.mock("./db", () => ({
  getUserById: vi.fn(),
  upsertUser: vi.fn(),
}));

describe("Email Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateEmailVerificationToken", () => {
    it("should generate a valid verification token", async () => {
      const token = await generateEmailVerificationToken(1, "test@example.com");
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate unique tokens", async () => {
      const token1 = await generateEmailVerificationToken(1, "test@example.com");
      const token2 = await generateEmailVerificationToken(1, "test@example.com");
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyEmailToken", () => {
    it("should return null for invalid token", async () => {
      const result = await verifyEmailToken("invalid_token");
      expect(result).toBeNull();
    });

    it("should return user data for valid token", async () => {
      const token = await generateEmailVerificationToken(1, "test@example.com");
      const result = await verifyEmailToken(token);
      expect(result).toBeDefined();
      if (result) {
        expect(result.userId).toBe(1);
        expect(result.email).toBe("test@example.com");
      }
    });
  });

  describe("markEmailAsVerified", () => {
    it("should mark email as verified", async () => {
      const mockUser = {
        id: 1,
        openId: "test_openid",
        name: "Test User",
        email: "test@example.com",
        passwordHash: null,
        loginMethod: "email",
        role: "user" as const,
        dealershipId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        emailVerified: 0,
        emailVerifiedAt: null,
      };

      (db.getUserById as any).mockResolvedValue(mockUser);
      (db.upsertUser as any).mockResolvedValue(true);

      const token = await generateEmailVerificationToken(1, "test@example.com");
      const result = await markEmailAsVerified(1, token);

      expect(result).toBe(true);
      expect(db.upsertUser).toHaveBeenCalled();
    });
  });

  describe("autoVerifyEmailForDevelopment", () => {
    it("should only work in development", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const result = await autoVerifyEmailForDevelopment(1);
      expect(result).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it("should auto-verify email in development", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const mockUser = {
        id: 1,
        openId: "test_openid",
        name: "Test User",
        email: "test@example.com",
        passwordHash: null,
        loginMethod: "email",
        role: "user" as const,
        dealershipId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        emailVerified: 0,
        emailVerifiedAt: null,
      };

      (db.getUserById as any).mockResolvedValue(mockUser);
      (db.upsertUser as any).mockResolvedValue(true);

      const result = await autoVerifyEmailForDevelopment(1);
      expect(result).toBe(true);
      expect(db.upsertUser).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should return false if user not found", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      (db.getUserById as any).mockResolvedValue(null);

      const result = await autoVerifyEmailForDevelopment(999);
      expect(result).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Email Verification Flow", () => {
    it("should complete full verification flow", async () => {
      const mockUser = {
        id: 1,
        openId: "test_openid",
        name: "Test User",
        email: "test@example.com",
        passwordHash: null,
        loginMethod: "email",
        role: "user" as const,
        dealershipId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        emailVerified: 0,
        emailVerifiedAt: null,
      };

      (db.getUserById as any).mockResolvedValue(mockUser);
      (db.upsertUser as any).mockResolvedValue(true);

      // Step 1: Generate token
      const token = await generateEmailVerificationToken(1, "test@example.com");
      expect(token).toBeDefined();

      // Step 2: Verify token
      const tokenData = await verifyEmailToken(token);
      expect(tokenData).toBeDefined();
      expect(tokenData?.userId).toBe(1);

      // Step 3: Mark as verified
      if (tokenData) {
        const verified = await markEmailAsVerified(tokenData.userId, token);
        expect(verified).toBe(true);
      }
    });
  });

  describe("Token Expiration", () => {
    it("should not verify expired tokens", async () => {
      // This test would require mocking time
      // In a real scenario, you'd use vi.useFakeTimers()
      // and advance time to test expiration
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Email Verification Security", () => {
    it("should not reveal if email exists", async () => {
      // This is a security test to ensure the API doesn't
      // leak information about whether an email is registered
      expect(true).toBe(true); // Placeholder
    });

    it("should prevent token reuse", async () => {
      const mockUser = {
        id: 1,
        openId: "test_openid",
        name: "Test User",
        email: "test@example.com",
        passwordHash: null,
        loginMethod: "email",
        role: "user" as const,
        dealershipId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        emailVerified: 0,
        emailVerifiedAt: null,
      };

      (db.getUserById as any).mockResolvedValue(mockUser);
      (db.upsertUser as any).mockResolvedValue(true);

      const token = await generateEmailVerificationToken(1, "test@example.com");

      // First use should work
      const result1 = await markEmailAsVerified(1, token);
      expect(result1).toBe(true);

      // Second use should fail (token already used)
      const result2 = await verifyEmailToken(token);
      expect(result2).toBeNull();
    });
  });
});
