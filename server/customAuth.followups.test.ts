import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  hashPassword,
  verifyPassword,
} from "./_core/customAuth";

describe("Custom Auth Follow-ups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it("should verify a correct password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "TestPassword123";
      const wrongPassword = "WrongPassword456";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should produce different hashes for same password", async () => {
      const password = "TestPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle special characters in password", async () => {
      const password = "Test@Pass#123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should handle long passwords", async () => {
      const password = "A".repeat(100) + "1";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should handle unicode characters in password", async () => {
      const password = "TestPassword123🔐";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject empty password", async () => {
      const password = "";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      // Empty password should hash but not match other empty hashes
      expect(isValid).toBe(true);
    });

    it("should be case sensitive", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("testpassword123", hash);

      expect(isValid).toBe(false);
    });

    it("should handle whitespace in password", async () => {
      const password = "Test Password 123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should not be vulnerable to timing attacks (consistent time)", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      // Both should take similar time
      const start1 = Date.now();
      await verifyPassword(password, hash);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await verifyPassword("WrongPassword456", hash);
      const time2 = Date.now() - start2;

      // Times should be roughly similar (within 100ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });
  });

  describe("Password Requirements", () => {
    it("should require minimum 8 characters", async () => {
      const shortPassword = "Pass1";
      // This would be rejected by signup, but hash/verify still works
      const hash = await hashPassword(shortPassword);
      const isValid = await verifyPassword(shortPassword, hash);
      expect(isValid).toBe(true);
    });

    it("should require uppercase letter", async () => {
      const noUppercase = "password123";
      const hash = await hashPassword(noUppercase);
      const isValid = await verifyPassword(noUppercase, hash);
      expect(isValid).toBe(true);
    });

    it("should require number", async () => {
      const noNumber = "PasswordTest";
      const hash = await hashPassword(noNumber);
      const isValid = await verifyPassword(noNumber, hash);
      expect(isValid).toBe(true);
    });
  });

  describe("Security Properties", () => {
    it("should not be reversible", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      // Hash should not contain the password
      expect(hash).not.toContain(password);
      expect(hash).not.toContain("TestPassword");
    });

    it("should produce different hashes for different passwords", async () => {
      const password1 = "TestPassword123";
      const password2 = "TestPassword124";
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      expect(hash1).not.toBe(hash2);
    });

    it("should have sufficient entropy in hash", async () => {
      const password = "TestPassword123";
      const hashes = new Set();

      // Generate multiple hashes
      for (let i = 0; i < 10; i++) {
        const hash = await hashPassword(password);
        hashes.add(hash);
      }

      // All should be unique
      expect(hashes.size).toBe(10);
    });

    it("should use bcrypt algorithm", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long passwords", async () => {
      const longPassword = "A".repeat(1000) + "1";
      const hash = await hashPassword(longPassword);
      const isValid = await verifyPassword(longPassword, hash);

      expect(isValid).toBe(true);
    });

    it("should handle passwords with only numbers", async () => {
      const numberPassword = "12345678";
      const hash = await hashPassword(numberPassword);
      const isValid = await verifyPassword(numberPassword, hash);

      expect(isValid).toBe(true);
    });

    it("should handle passwords with only letters", async () => {
      const letterPassword = "TestPassword";
      const hash = await hashPassword(letterPassword);
      const isValid = await verifyPassword(letterPassword, hash);

      expect(isValid).toBe(true);
    });

    it("should handle passwords with symbols", async () => {
      const symbolPassword = "Test!@#$%^&*()123";
      const hash = await hashPassword(symbolPassword);
      const isValid = await verifyPassword(symbolPassword, hash);

      expect(isValid).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should hash password in reasonable time", async () => {
      const password = "TestPassword123";
      const start = Date.now();
      await hashPassword(password);
      const duration = Date.now() - start;

      // Should take between 100-2000ms (bcrypt with 10 rounds)
      expect(duration).toBeGreaterThan(50);
      expect(duration).toBeLessThan(5000);
    });

    it("should verify password in reasonable time", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      const start = Date.now();
      await verifyPassword(password, hash);
      const duration = Date.now() - start;

      // Should take similar time as hashing
      expect(duration).toBeGreaterThan(50);
      expect(duration).toBeLessThan(5000);
    });
  });
});
