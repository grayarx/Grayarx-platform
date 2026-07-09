/**
 * Password Hashing Service Tests
 */

import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "./passwordHashing";

describe("Password Hashing Service", () => {
  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it("should produce different hashes for the same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should verify correct password", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should handle long passwords", async () => {
      const longPassword = "A".repeat(100) + "1!";
      const hash = await hashPassword(longPassword);
      const isValid = await verifyPassword(longPassword, hash);

      expect(isValid).toBe(true);
    });
  });

  describe("Password Strength Validation", () => {
    it("should accept strong password", () => {
      const result = validatePasswordStrength("StrongPass123!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = validatePasswordStrength("Short1!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters long");
    });

    it("should reject password without uppercase", () => {
      const result = validatePasswordStrength("lowercase123!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one uppercase letter");
    });

    it("should reject password without lowercase", () => {
      const result = validatePasswordStrength("UPPERCASE123!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one lowercase letter");
    });

    it("should reject password without number", () => {
      const result = validatePasswordStrength("NoNumbers!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one number");
    });

    it("should reject password without special character", () => {
      const result = validatePasswordStrength("NoSpecial123");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one special character");
    });

    it("should reject password longer than 128 characters", () => {
      const longPassword = "A".repeat(129) + "1!";
      const result = validatePasswordStrength(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must not exceed 128 characters");
    });

    it("should return multiple errors for weak password", () => {
      const result = validatePasswordStrength("weak");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it("should accept password with various special characters", () => {
      const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*"];
      specialChars.forEach((char) => {
        const password = `Password123${char}`;
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty password", async () => {
      const result = validatePasswordStrength("");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle password with spaces", async () => {
      const password = "Pass word123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should handle unicode characters in password", async () => {
      const password = "Pässwörd123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should be case-sensitive", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("testpassword123!", hash);
      expect(isValid).toBe(false);
    });
  });
});
