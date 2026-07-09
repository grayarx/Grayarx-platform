/**
 * Audit Log Service Tests
 */

import { describe, it, expect } from "vitest";
import {
  logAuditEvent,
  logLoginSuccess,
  logLoginFailed,
  logSignupSuccess,
  log2FAEnabled,
  log2FAVerified,
  logSuspiciousActivity,
} from "./auditLog";

describe("Audit Log Service", () => {
  describe("Audit Event Logging", () => {
    it("should log a successful login event without throwing", async () => {
      await expect(
        logLoginSuccess(
          "user123",
          "192.168.1.1",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          { browser: "Chrome", os: "Windows" }
        )
      ).resolves.not.toThrow();
    });

    it("should log a failed login event without throwing", async () => {
      await expect(
        logLoginFailed(
          "user@example.com",
          "192.168.1.1",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Invalid credentials"
        )
      ).resolves.not.toThrow();
    });

    it("should log a successful signup event without throwing", async () => {
      await expect(
        logSignupSuccess(
          "user123",
          "user@example.com",
          "192.168.1.1",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        )
      ).resolves.not.toThrow();
    });

    it("should log 2FA enabled event without throwing", async () => {
      await expect(
        log2FAEnabled(
          "user123",
          "192.168.1.1",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        )
      ).resolves.not.toThrow();
    });

    it("should log 2FA verified event without throwing", async () => {
      await expect(
        log2FAVerified(
          "user123",
          "192.168.1.1",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        )
      ).resolves.not.toThrow();
    });

    it("should log suspicious activity without throwing", async () => {
      await expect(
        logSuspiciousActivity(
          "user123",
          "user@example.com",
          "192.168.1.1",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Multiple failed login attempts detected"
        )
      ).resolves.not.toThrow();
    });
  });

  describe("Event Types", () => {
    it("should support all event types", async () => {
      const eventTypes = [
        "login_success",
        "login_failed",
        "signup_success",
        "password_reset_completed",
        "2fa_enabled",
        "2fa_verified",
        "suspicious_activity",
      ] as const;

      for (const eventType of eventTypes) {
        await expect(
          logAuditEvent({
            userId: "user123",
            eventType,
            ipAddress: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            status: eventType.includes("failed") ? "failed" : "success",
            message: `Test ${eventType}`,
          })
        ).resolves.not.toThrow();
      }
    });
  });

  describe("Device Information", () => {
    it("should log device information without throwing", async () => {
      await expect(
        logAuditEvent({
          userId: "user123",
          eventType: "login_success",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          deviceInfo: {
            browser: "Chrome",
            os: "Windows 10",
            device: "Desktop",
          },
          status: "success",
          message: "Login successful",
        })
      ).resolves.not.toThrow();
    });

    it("should log metadata without throwing", async () => {
      await expect(
        logAuditEvent({
          userId: "user123",
          eventType: "login_success",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          status: "success",
          message: "Login successful",
          metadata: {
            loginMethod: "email",
            twoFactorUsed: true,
            sessionDuration: 3600,
          },
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle logging errors gracefully", async () => {
      // This should not throw even if there's an error
      await expect(
        logAuditEvent({
          eventType: "login_success",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          status: "success",
        })
      ).resolves.not.toThrow();
    });

    it("should handle missing user ID", async () => {
      await expect(
        logAuditEvent({
          email: "user@example.com",
          eventType: "login_success",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          status: "success",
        })
      ).resolves.not.toThrow();
    });

    it("should handle missing email", async () => {
      await expect(
        logAuditEvent({
          userId: "user123",
          eventType: "login_success",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          status: "success",
        })
      ).resolves.not.toThrow();
    });
  });
});
