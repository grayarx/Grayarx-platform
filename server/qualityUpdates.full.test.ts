import { describe, it, expect, beforeEach } from "vitest";
import { monitoring } from "./_core/monitoring";
import { mockSMSService, mockEmailService, generateTestOTP, generateTestEmail, generateTestToken } from "./_core/testingUtilities";
import { getPasswordResetTemplate, getWelcomeTemplate, getTwoFactorTemplate } from "./_core/emailTemplates";
import { generateAPIDocumentation } from "./_core/apiDocumentation";

describe("Quality Updates - Complete Test Suite", () => {
  beforeEach(() => {
    monitoring.reset();
    mockSMSService.clear();
    mockEmailService.clear();
  });

  describe("Update 11: SMS Service", () => {
    it("should send OTP via SMS", () => {
      const result = mockSMSService.send("+27123456789", "123456");
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should track sent SMS messages", () => {
      mockSMSService.send("+27123456789", "OTP: 123456");
      mockSMSService.send("+27987654321", "OTP: 654321");
      expect(mockSMSService.sentMessages).toHaveLength(2);
    });

    it("should get last sent message", () => {
      mockSMSService.send("+27123456789", "First message");
      mockSMSService.send("+27987654321", "Second message");
      const last = mockSMSService.getLastMessage();
      expect(last?.message).toBe("Second message");
    });
  });

  describe("Update 12: Email Templates", () => {
    it("should generate password reset template", () => {
      const template = getPasswordResetTemplate("https://example.com/reset?token=123", "John Doe");
      expect(template.subject).toContain("Reset");
      expect(template.html).toContain("John Doe");
      expect(template.text).toContain("reset");
    });

    it("should generate welcome template", () => {
      const template = getWelcomeTemplate("Jane Doe");
      expect(template.subject).toContain("Welcome");
      expect(template.html).toContain("Jane Doe");
      expect(template.text).toContain("GrayArx");
    });

    it("should generate 2FA template", () => {
      const template = getTwoFactorTemplate("123456");
      expect(template.subject).toContain("2FA");
      expect(template.html).toContain("123456");
      expect(template.text).toContain("expire");
    });

    it("should have both HTML and text versions", () => {
      const template = getPasswordResetTemplate("https://example.com", "User");
      expect(template.html).toBeTruthy();
      expect(template.text).toBeTruthy();
      expect(template.html.length).toBeGreaterThan(template.text.length);
    });
  });

  describe("Update 13: Audit Logging", () => {
    it("should track login events", () => {
      monitoring.recordLogin(150);
      expect(monitoring.getMetrics().totalLogins).toBe(1);
    });

    it("should track failed logins", () => {
      monitoring.recordFailedLogin();
      monitoring.recordFailedLogin();
      expect(monitoring.getMetrics().failedLogins).toBe(2);
    });

    it("should track signup events", () => {
      monitoring.recordSignup();
      expect(monitoring.getMetrics().successfulSignups).toBe(1);
    });

    it("should track 2FA enablement", () => {
      monitoring.record2FAEnabled();
      expect(monitoring.getMetrics().twoFactorEnabled).toBe(1);
    });

    it("should track suspicious activities", () => {
      monitoring.recordSuspiciousActivity("Multiple failed logins");
      expect(monitoring.getMetrics().suspiciousActivities).toBe(1);
    });

    it("should record errors", () => {
      monitoring.recordError("Test error");
      const errors = monitoring.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[errors.length - 1]).toContain("Test error");
    });
  });

  describe("Update 14: API Documentation", () => {
    it("should generate API documentation", () => {
      const doc = generateAPIDocumentation();
      expect(doc).toContain("Authentication");
      expect(doc).toContain("/api/auth/login");
      expect(doc).toContain("/api/auth/signup");
    });

    it("should include endpoint descriptions", () => {
      const doc = generateAPIDocumentation();
      expect(doc).toContain("POST");
      expect(doc).toContain("GET");
    });

    it("should include error codes", () => {
      const doc = generateAPIDocumentation();
      expect(doc).toContain("401");
      expect(doc).toContain("400");
    });
  });

  describe("Update 15: Testing Utilities", () => {
    it("should generate OTP codes", () => {
      const otp = generateTestOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("should generate unique OTP codes", () => {
      const otp1 = generateTestOTP();
      const otp2 = generateTestOTP();
      // Very unlikely to be the same
      expect(otp1).not.toBe(otp2);
    });

    it("should generate test tokens", () => {
      const token = generateTestToken(32);
      expect(token).toHaveLength(32);
      expect(/^[a-zA-Z0-9]+$/.test(token)).toBe(true);
    });

    it("should generate test emails", () => {
      const email = generateTestEmail();
      expect(email).toContain("@grayarx.test");
      expect(email).toContain("test-");
    });

    it("should generate unique test emails", () => {
      const email1 = generateTestEmail();
      const email2 = generateTestEmail();
      expect(email1).not.toBe(email2);
    });
  });

  describe("Update 16: Monitoring & Metrics", () => {
    it("should calculate success rate", () => {
      monitoring.recordLogin(100);
      monitoring.recordLogin(150);
      monitoring.recordFailedLogin();
      const rate = monitoring.getSuccessRate();
      expect(rate).toBe(66.66666666666666);
    });

    it("should calculate signup success rate", () => {
      monitoring.recordSignup();
      monitoring.recordSignup();
      monitoring.recordFailedSignup();
      const rate = monitoring.getSignupSuccessRate();
      expect(rate).toBeCloseTo(66.67, 1);
    });

    it("should calculate 2FA adoption rate", () => {
      monitoring.recordSignup();
      monitoring.recordSignup();
      monitoring.record2FAEnabled();
      const rate = monitoring.get2FAAdoptionRate();
      expect(rate).toBe(50);
    });

    it("should calculate average login time", () => {
      monitoring.recordLogin(100);
      monitoring.recordLogin(200);
      monitoring.recordLogin(300);
      const metrics = monitoring.getMetrics();
      expect(metrics.averageLoginTime).toBe(200);
    });

    it("should provide health status", async () => {
      const health = await monitoring.getHealthStatus();
      expect(health.status).toBe("healthy");
      expect(health.metrics.databaseConnection).toBe(true);
      expect(health.timestamp).toBeDefined();
    });

    it("should detect degraded health", async () => {
      for (let i = 0; i < 10; i++) {
        monitoring.recordFailedLogin();
      }
      monitoring.recordLogin(100);
      const health = await monitoring.getHealthStatus();
      expect(health.status).toBe("degraded");
    });
  });

  describe("Integration: All 20 Updates Working Together", () => {
    it("should handle complete authentication flow with monitoring", () => {
      // Simulate signup
      monitoring.recordSignup();
      expect(monitoring.getMetrics().successfulSignups).toBe(1);

      // Simulate login
      monitoring.recordLogin(150);
      expect(monitoring.getMetrics().totalLogins).toBe(1);

      // Simulate 2FA setup
      monitoring.record2FAEnabled();
      expect(monitoring.getMetrics().twoFactorEnabled).toBe(1);

      // Simulate password reset
      monitoring.recordPasswordReset();
      expect(monitoring.getMetrics().passwordResets).toBe(1);

      // Check metrics
      const metrics = monitoring.getMetrics();
      expect(metrics.successfulSignups).toBe(1);
      expect(metrics.totalLogins).toBe(1);
      expect(metrics.twoFactorEnabled).toBe(1);
      expect(metrics.passwordResets).toBe(1);
    });

    it("should send emails and SMS in workflow", () => {
      // Send welcome email
      const welcomeTemplate = getWelcomeTemplate("Test User");
      mockEmailService.send("user@example.com", welcomeTemplate.subject, welcomeTemplate.html);

      // Send 2FA SMS
      mockSMSService.send("+27123456789", "Your code: 123456");

      // Verify both were sent
      expect(mockEmailService.sentEmails).toHaveLength(1);
      expect(mockSMSService.sentMessages).toHaveLength(1);
    });

    it("should track all events and generate health report", async () => {
      // Simulate various events
      monitoring.recordSignup();
      monitoring.recordSignup();
      monitoring.recordLogin(100);
      monitoring.recordLogin(150);
      monitoring.recordFailedLogin();
      monitoring.record2FAEnabled();
      monitoring.recordSocialAccountLinked();
      monitoring.recordPasswordReset();

      // Get health status
      const health = await monitoring.getHealthStatus();
      expect(health.status).toBe("healthy");

      // Get metrics
      const metrics = monitoring.getMetrics();
      expect(metrics.successfulSignups).toBe(2);
      expect(metrics.totalLogins).toBe(2);
      expect(metrics.failedLogins).toBe(1);
      expect(metrics.twoFactorEnabled).toBe(1);
      expect(metrics.socialAccountsLinked).toBe(1);
      expect(metrics.passwordResets).toBe(1);
    });
  });
});
