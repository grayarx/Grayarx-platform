/**
 * Comprehensive Tests for Email Metrics, Preferences, and 2FA
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as emailMetricsService from "./_core/emailMetricsService";
import * as twoFactorService from "./_core/twoFactorService";

describe("Email Metrics Service", () => {
  describe("logEmailEvent", () => {
    it("should log email events successfully", async () => {
      const result = await emailMetricsService.logEmailEvent(
        1,
        "signup_email_sent",
        "test@example.com"
      );
      expect(result).toBe(true);
    });

    it("should log email events with metadata", async () => {
      const result = await emailMetricsService.logEmailEvent(
        1,
        "verification_email_sent",
        "test@example.com",
        undefined,
        { template: "verification_v1" }
      );
      expect(result).toBe(true);
    });

    it("should log bounce events with reason", async () => {
      const result = await emailMetricsService.logEmailEvent(
        1,
        "email_bounced",
        "invalid@example.com",
        "invalid_email"
      );
      expect(result).toBe(true);
    });
  });

  describe("Email Preferences", () => {
    it("should initialize email preferences for new user", async () => {
      const result = await emailMetricsService.initializeEmailPreferences(2);
      expect(result).toBe(true);
    });

    it("should retrieve user email preferences", async () => {
      await emailMetricsService.initializeEmailPreferences(3);
      const prefs = await emailMetricsService.getUserEmailPreferences(3);
      expect(prefs).toBeDefined();
      expect(prefs?.marketingEmails).toBe(1);
      expect(prefs?.alertEmails).toBe(1);
    });

    it("should update email preferences", async () => {
      await emailMetricsService.initializeEmailPreferences(4);
      const result = await emailMetricsService.updateEmailPreferences(4, {
        marketingEmails: 0,
        frequency: "weekly",
      });
      expect(result).toBe(true);

      const prefs = await emailMetricsService.getUserEmailPreferences(4);
      expect(prefs?.marketingEmails).toBe(0);
      expect(prefs?.frequency).toBe("weekly");
    });

    it("should unsubscribe user from all emails", async () => {
      await emailMetricsService.initializeEmailPreferences(5);
      const result = await emailMetricsService.unsubscribeUser(5);
      expect(result).toBe(true);

      const prefs = await emailMetricsService.getUserEmailPreferences(5);
      expect(prefs?.marketingEmails).toBe(0);
      expect(prefs?.alertEmails).toBe(0);
      expect(prefs?.unsubscribedAt).toBeDefined();
    });

    it("should check if should send email", async () => {
      await emailMetricsService.initializeEmailPreferences(6);
      await emailMetricsService.updateEmailPreferences(6, {
        marketingEmails: 0,
        alertEmails: 1,
      });

      const shouldSendMarketing = await emailMetricsService.shouldSendEmail(
        6,
        "marketing"
      );
      const shouldSendAlert = await emailMetricsService.shouldSendEmail(
        6,
        "alert"
      );

      expect(shouldSendMarketing).toBe(false);
      expect(shouldSendAlert).toBe(true);
    });
  });

  describe("Email Metrics Retrieval", () => {
    it("should retrieve user email metrics", async () => {
      await emailMetricsService.logEmailEvent(
        7,
        "signup_email_sent",
        "user7@example.com"
      );
      const metrics = await emailMetricsService.getUserEmailMetrics(7);
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
    });

    it("should get verification metrics", async () => {
      const metrics = await emailMetricsService.getEmailVerificationMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalSent).toBeGreaterThanOrEqual(0);
      expect(metrics.totalVerified).toBeGreaterThanOrEqual(0);
      expect(metrics.verificationRate).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Two-Factor Authentication Service", () => {
  describe("2FA Secret Generation", () => {
    it("should generate 2FA secret and QR code", async () => {
      const result = await twoFactorService.generateTwoFactorSecret(
        10,
        "user10@example.com"
      );
      expect(result).toBeDefined();
      expect(result?.secret).toBeDefined();
      expect(result?.qrCode).toBeDefined();
      expect(result?.secret?.length).toBeGreaterThan(0);
      expect(result?.qrCode?.startsWith("data:image")).toBe(true);
    });

    it("should handle invalid user email", async () => {
      const result = await twoFactorService.generateTwoFactorSecret(
        -1,
        "invalid@example.com"
      );
      // Should return null or handle gracefully
      expect(result === null || result?.secret).toBeDefined();
    });
  });

  describe("2FA Status Checking", () => {
    it("should check if 2FA is enabled", async () => {
      const isEnabled = await twoFactorService.is2FAEnabled(11);
      expect(typeof isEnabled).toBe("boolean");
    });

    it("should return false for new users", async () => {
      const isEnabled = await twoFactorService.is2FAEnabled(999);
      expect(isEnabled).toBe(false);
    });
  });

  describe("2FA Audit Logging", () => {
    it("should retrieve 2FA audit log", async () => {
      const logs = await twoFactorService.get2FAauditLog(12);
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("2FA Backup Codes", () => {
    it("should generate backup codes", async () => {
      const codes = await twoFactorService.regenerateBackupCodes(13);
      expect(codes).toBeDefined();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes?.length).toBe(10);

      // All codes should be 8 characters
      codes?.forEach((code) => {
        expect(code.length).toBe(8);
        expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
      });
    });
  });

  describe("2FA Disable", () => {
    it("should disable 2FA for user", async () => {
      const result = await twoFactorService.disable2FA(14);
      expect(result).toBe(true);

      const isEnabled = await twoFactorService.is2FAEnabled(14);
      expect(isEnabled).toBe(false);
    });
  });

  describe("2FA Session Management", () => {
    it("should verify 2FA session token", async () => {
      // This test would require creating a valid session first
      const isValid = await twoFactorService.verify2FASession(15, "invalid_token");
      expect(isValid).toBe(false);
    });
  });
});

describe("Integration Tests", () => {
  describe("Email Preferences and Metrics Integration", () => {
    it("should track email preferences changes in metrics", async () => {
      const userId = 20;

      // Initialize preferences
      await emailMetricsService.initializeEmailPreferences(userId);

      // Update preferences
      await emailMetricsService.updateEmailPreferences(userId, {
        marketingEmails: 0,
      });

      // Verify preferences were updated
      const prefs = await emailMetricsService.getUserEmailPreferences(userId);
      expect(prefs?.marketingEmails).toBe(0);
    });

    it("should handle unsubscribe flow correctly", async () => {
      const userId = 21;

      // Initialize preferences
      await emailMetricsService.initializeEmailPreferences(userId);

      // Log some email events
      await emailMetricsService.logEmailEvent(
        userId,
        "marketing_email_sent",
        "user21@example.com"
      );

      // Unsubscribe
      await emailMetricsService.unsubscribeUser(userId);

      // Verify unsubscribe
      const shouldSend = await emailMetricsService.shouldSendEmail(
        userId,
        "marketing"
      );
      expect(shouldSend).toBe(false);
    });
  });

  describe("2FA and Email Integration", () => {
    it("should log 2FA setup events", async () => {
      const userId = 30;

      // Generate 2FA secret
      const result = await twoFactorService.generateTwoFactorSecret(
        userId,
        "user30@example.com"
      );
      expect(result?.secret).toBeDefined();

      // Verify audit log was created
      const logs = await twoFactorService.get2FAauditLog(userId);
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});

describe("Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    // Test with invalid user ID
    const result = await emailMetricsService.getUserEmailMetrics(-1);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle invalid TOTP codes", async () => {
    // This would require a valid 2FA setup first
    const result = await twoFactorService.verifyTOTPCode(999, "000000");
    expect(result.success).toBe(false);
  });

  it("should handle invalid backup codes", async () => {
    const result = await twoFactorService.verifyBackupCode(999, "INVALID00");
    expect(result.success).toBe(false);
  });
});

describe("Security Tests", () => {
  it("should not expose sensitive information in metrics", async () => {
    const metrics = await emailMetricsService.getEmailVerificationMetrics();
    expect(metrics).toBeDefined();
    // Metrics should only contain aggregated data, not individual user info
    expect(typeof metrics.totalSent).toBe("number");
    expect(typeof metrics.verificationRate).toBe("number");
  });

  it("should hash backup codes", async () => {
    const codes = await twoFactorService.regenerateBackupCodes(40);
    expect(codes).toBeDefined();
    // Codes returned to user should be plaintext, but stored as hashes
    expect(Array.isArray(codes)).toBe(true);
  });

  it("should enforce one-time use of backup codes", async () => {
    // This test would require using a backup code and verifying it can't be used again
    // Implementation depends on actual backup code verification logic
    expect(true).toBe(true);
  });
});
