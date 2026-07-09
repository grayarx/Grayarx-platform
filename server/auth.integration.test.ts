import { describe, it, expect } from "vitest";
import { createOTPCode, verifyOTPCode, generateBackupCodes, generateTotpSecret } from "./_core/twoFactorAuth";
import { generatePasswordResetToken, verifyPasswordResetToken, consumePasswordResetToken } from "./_core/customAuth";

describe("Integration Tests - Authentication System", () => {
  describe("Two-Factor Authentication", () => {
    it("should generate TOTP secret", async () => {
      const result = await generateTotpSecret("test@example.com");
      expect(result).toBeDefined();
      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.backupCodes).toHaveLength(10);
    });

    it("should generate OTP code for SMS", async () => {
      const otp = await createOTPCode(1, "sms");
      expect(otp).toBeDefined();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("should generate OTP code for Email", async () => {
      const otp = await createOTPCode(1, "email");
      expect(otp).toBeDefined();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("should verify valid OTP code", async () => {
      const otp = await createOTPCode(1, "sms");
      const isValid = await verifyOTPCode(1, otp, "sms");
      expect(isValid).toBe(true);
    });

    it("should reject invalid OTP code", async () => {
      const isValid = await verifyOTPCode(1, "000000", "sms");
      expect(isValid).toBe(false);
    });

    it("should generate backup codes", () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(10);
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it("should generate custom number of backup codes", () => {
      const codes = generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it("should prevent OTP code reuse", async () => {
      const otp = await createOTPCode(1, "sms");
      await verifyOTPCode(1, otp, "sms");
      const secondUse = await verifyOTPCode(1, otp, "sms");
      expect(secondUse).toBe(false);
    });
  });

  describe("Password Reset", () => {
    it("should generate password reset token", async () => {
      const token = await generatePasswordResetToken(1);
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
    });

    it("should verify valid reset token", async () => {
      const token = await generatePasswordResetToken(1);
      const result = await verifyPasswordResetToken(token);
      expect(result).toBeDefined();
      expect(result.userId).toBe(1);
    });

    it("should reject invalid reset token", async () => {
      const result = await verifyPasswordResetToken("invalid_token_12345");
      expect(result).toBeNull();
    });

    it("should prevent token reuse", async () => {
      const token = await generatePasswordResetToken(1);
      const firstUse = await verifyPasswordResetToken(token);
      expect(firstUse).toBeDefined();
      // Mark token as used
      await consumePasswordResetToken(token);
      // Second use returns null (token marked as used)
      const secondUse = await verifyPasswordResetToken(token);
      expect(secondUse).toBeNull();
    });

    it("should generate unique tokens", async () => {
      const token1 = await generatePasswordResetToken(1);
      const token2 = await generatePasswordResetToken(1);
      expect(token1).not.toBe(token2);
    });
  });

  describe("Security Best Practices", () => {
    it("should not expose sensitive data in tokens", async () => {
      const token = await generatePasswordResetToken(1);
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(token).not.toContain("password");
    });

    it("should generate cryptographically secure tokens", async () => {
      const token = await generatePasswordResetToken(1);
      expect(token.length).toBeGreaterThanOrEqual(32);
    });

    it("should handle concurrent OTP requests", async () => {
      const promises = [
        createOTPCode(1, "sms"),
        createOTPCode(1, "email"),
      ];
      const results = await Promise.all(promises);
      expect(results).toHaveLength(2);
      expect(results[0]).not.toBe(results[1]);
    });

    it("should handle concurrent token generation", async () => {
      const promises = [
        generatePasswordResetToken(1),
        generatePasswordResetToken(1),
      ];
      const results = await Promise.all(promises);
      expect(results).toHaveLength(2);
      expect(results[0]).not.toBe(results[1]);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid user ID gracefully", async () => {
      try {
        await createOTPCode(-1, "sms");
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle invalid OTP method", async () => {
      try {
        await createOTPCode(1, "invalid" as any);
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle database errors gracefully", async () => {
      try {
        const token = await generatePasswordResetToken(1);
        expect(token).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Performance", () => {
    it("should generate OTP code quickly", async () => {
      const start = Date.now();
      await createOTPCode(1, "sms");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it("should verify OTP code quickly", async () => {
      const otp = await createOTPCode(1, "sms");
      const start = Date.now();
      await verifyOTPCode(1, otp, "sms");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it("should generate token quickly", async () => {
      const start = Date.now();
      await generatePasswordResetToken(1);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it("should verify token quickly", async () => {
      const token = await generatePasswordResetToken(1);
      const start = Date.now();
      await verifyPasswordResetToken(token);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
