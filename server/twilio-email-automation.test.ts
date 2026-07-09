import { describe, it, expect, beforeAll } from "vitest";
import { twilioService, getTwilioStatus } from "./_core/twilioService";
import { processEmailSequences, getSequenceMetrics } from "./_core/emailSequenceAutomation";

describe("Twilio Integration & Email Automation", () => {
  describe("Twilio Service", () => {
    it("should initialize in mock mode when no credentials provided", () => {
      const status = getTwilioStatus();
      expect(status).toBeDefined();
      expect(status.mode).toBe("mock");
    });

    it("should have configuration status available", () => {
      const status = getTwilioStatus();
      expect(status.configured).toBeDefined();
      expect(status.hasAccountSid).toBeDefined();
      expect(status.hasAuthToken).toBeDefined();
      expect(status.hasPhoneNumber).toBeDefined();
      expect(status.hasWhatsappNumber).toBeDefined();
    });

    it("should send mock SMS successfully", async () => {
      const result = await twilioService.sendSMS("+27123456789", "Test SMS message");
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.mode).toBe("mock");
    });

    it("should send mock WhatsApp successfully", async () => {
      const result = await twilioService.sendWhatsApp("+27123456789", "Test WhatsApp message");
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.mode).toBe("mock");
    });

    it("should generate unique message IDs", async () => {
      const result1 = await twilioService.sendSMS("+27123456789", "Message 1");
      const result2 = await twilioService.sendSMS("+27123456789", "Message 2");

      expect(result1.messageId).not.toBe(result2.messageId);
    });

    it("should handle SMS with special characters", async () => {
      const message = "Test message with special chars: @#$%^&*()";
      const result = await twilioService.sendSMS("+27123456789", message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should handle WhatsApp with emojis", async () => {
      const message = "Your booking is confirmed! 🎉 See you soon! 🚗";
      const result = await twilioService.sendWhatsApp("+27123456789", message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe("Email Sequence Automation", () => {
    it("should process email sequences without errors", async () => {
      // This should not throw
      await expect(processEmailSequences()).resolves.not.toThrow();
    });

    it("should get sequence metrics", async () => {
      const metrics = await getSequenceMetrics(999);

      if (metrics) {
        expect(metrics).toHaveProperty("totalSequences");
        expect(metrics).toHaveProperty("activeSequences");
        expect(metrics).toHaveProperty("pausedSequences");
        expect(metrics).toHaveProperty("totalEmailsSent");
        expect(metrics).toHaveProperty("averageOpenRate");
        expect(metrics).toHaveProperty("averageClickRate");
      }
    });

    it("should handle missing dealership gracefully", async () => {
      const metrics = await getSequenceMetrics(999999);
      expect(metrics).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("should send booking confirmation SMS", async () => {
      const result = await twilioService.sendSMS(
        "+27123456789",
        "Hi John, your test drive booking at GrayArx is confirmed for 2026-05-30 at 14:00. We look forward to seeing you!"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.mode).toBe("mock");
    });

    it("should send booking reminder WhatsApp", async () => {
      const result = await twilioService.sendWhatsApp(
        "+27123456789",
        "Hi John, reminder: your test drive at GrayArx is tomorrow at 14:00. See you then! 🚗"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should send lead alert SMS", async () => {
      const result = await twilioService.sendSMS(
        "+27123456789",
        "New lead alert for GrayArx: Jane Doe is interested in Toyota Hilux. Check your dashboard for details."
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should handle multiple messages in sequence", async () => {
      const messages = [
        "First message",
        "Second message",
        "Third message",
      ];

      const results = await Promise.all(
        messages.map((msg) => twilioService.sendSMS("+27123456789", msg))
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.messageId).toBeDefined();
      });

      // All message IDs should be unique
      const ids = results.map((r) => r.messageId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty phone number gracefully", async () => {
      const result = await twilioService.sendSMS("", "Test message");
      // Should still succeed in mock mode
      expect(result).toBeDefined();
    });

    it("should handle very long messages", async () => {
      const longMessage = "A".repeat(1000);
      const result = await twilioService.sendSMS("+27123456789", longMessage);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should handle concurrent requests", async () => {
      const promises = Array.from({ length: 10 }).map((_, i) =>
        twilioService.sendSMS("+2712345678" + i, `Message ${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
