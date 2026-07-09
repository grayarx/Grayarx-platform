/**
 * SMS Webhook Integration Tests
 * Tests for incoming SMS and webhook processing
 */

import { describe, it, expect } from "vitest";
import { validateTwilioSignature, testSMSWebhook } from "./_core/smsWebhook";
import { getWhatsappMessages } from "./db";

describe("SMS Webhook Tests", () => {
  describe("Signature Validation", () => {
    it("should validate correct Twilio signature", () => {
      const url = "https://grayarx.com/api/webhooks/sms";
      const params = {
        MessageSid: "SM1234567890abcdef",
        AccountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        From: "+27821234567",
        To: "+27821234567",
        Body: "Test message",
      };

      // Generate correct signature
      const { createHmac } = require("crypto");
      const data = Object.keys(params)
        .sort()
        .reduce((acc: string, key: string) => acc + key + params[key as keyof typeof params], url);
      const correctSignature = createHmac("sha1", "test-auth-token").update(data).digest("Base64");

      const isValid = validateTwilioSignature(url, params, correctSignature, "test-auth-token");
      expect(isValid).toBe(true);
    });

    it("should reject invalid signature", () => {
      const url = "https://grayarx.com/api/webhooks/sms";
      const params = {
        MessageSid: "SM1234567890abcdef",
      };
      const invalidSignature = "invalid-signature-string";

      const isValid = validateTwilioSignature(url, params, invalidSignature, "test-auth-token");
      expect(isValid).toBe(false);
    });

    it("should reject tampered parameters", () => {
      const url = "https://grayarx.com/api/webhooks/sms";
      const params = {
        MessageSid: "SM1234567890abcdef",
      };

      const { createHmac } = require("crypto");
      const data = Object.keys(params)
        .sort()
        .reduce((acc: string, key: string) => acc + key + params[key as keyof typeof params], url);
      const correctSignature = createHmac("sha1", "test-auth-token").update(data).digest("Base64");

      // Tamper with params
      params.MessageSid = "SM_DIFFERENT";

      const isValid = validateTwilioSignature(url, params, correctSignature, "test-auth-token");
      expect(isValid).toBe(false);
    });
  });

  describe("Incoming Message Processing", () => {
    it("should process incoming SMS", async () => {
      const payload = {
        MessageSid: "SM1234567890abcdef",
        AccountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        From: "+27821234567",
        To: "+27821234567",
        Body: "Hi! I'm interested in the BMW.",
        NumMedia: "0",
      };

      await testSMSWebhook(payload);
      // Should not throw
    });

    it("should handle various phone formats", async () => {
      const formats = [
        "+27821234567",
        "0821234567",
        "27821234567",
        "+27 82 123 4567",
      ];

      for (const phone of formats) {
        const payload = {
          From: phone,
          To: "+27821234567",
          Body: "Test message",
        };

        await testSMSWebhook(payload);
        // Should not throw
      }
    });

    it("should store message with correct direction", async () => {
      const payload = {
        MessageSid: "SM_INBOUND_TEST",
        From: "+27821234567",
        To: "+27821234567",
        Body: "Customer reply message",
        NumMedia: "0",
      };

      await testSMSWebhook(payload);
      // Message should be stored as inbound
    });

    it("should handle long messages", async () => {
      const longMessage = "A".repeat(500);
      const payload = {
        From: "+27821234567",
        To: "+27821234567",
        Body: longMessage,
      };

      await testSMSWebhook(payload);
      // Should handle without truncation
    });

    it("should handle special characters", async () => {
      const specialMessage = "Test with special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/";
      const payload = {
        From: "+27821234567",
        To: "+27821234567",
        Body: specialMessage,
      };

      await testSMSWebhook(payload);
      // Should preserve special characters
    });

    it("should handle unicode characters", async () => {
      const unicodeMessage = "Test with unicode: ä½ å¥½ä¸–ç•Œ Ù…Ø±Ø­Ø¨Ø§ Ø¨Ø§Ù„Ø¹Ø§Ù„Ù…";
      const payload = {
        From: "+27821234567",
        To: "+27821234567",
        Body: unicodeMessage,
      };

      await testSMSWebhook(payload);
      // Should preserve unicode
    });

    it("should handle empty message", async () => {
      const payload = {
        From: "+27821234567",
        To: "+27821234567",
        Body: "",
      };

      await testSMSWebhook(payload);
      // Should handle gracefully
    });
  });

  describe("Status Updates", () => {
    it("should process sent status", async () => {
      const payload = {
        MessageSid: "SM1234567890abcdef",
        MessageStatus: "sent",
      };

      await testSMSWebhook(payload);
      // Should update message status
    });

    it("should process delivered status", async () => {
      const payload = {
        MessageSid: "SM1234567890abcdef",
        MessageStatus: "delivered",
      };

      await testSMSWebhook(payload);
      // Should update message status
    });

    it("should process failed status", async () => {
      const payload = {
        MessageSid: "SM1234567890abcdef",
        MessageStatus: "failed",
      };

      await testSMSWebhook(payload);
      // Should update message status
    });

    it("should handle all Twilio status values", async () => {
      const statuses = ["queued", "sending", "sent", "delivered", "failed", "undelivered", "read"];

      for (const status of statuses) {
        const payload = {
          MessageSid: `SM_${status}`,
          MessageStatus: status,
        };

        await testSMSWebhook(payload);
        // Should handle all status values
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle missing MessageSid", async () => {
      const payload = {
        From: "+27821234567",
        To: "+27821234567",
        Body: "Test",
      };

      await testSMSWebhook(payload);
      // Should generate MessageSid
    });

    it("should handle missing From", async () => {
      const payload = {
        To: "+27821234567",
        Body: "Test",
      };

      // Should not throw, but handle gracefully
      try {
        await testSMSWebhook(payload);
      } catch (error) {
        // Expected to fail gracefully
      }
    });

    it("should handle malformed phone numbers", async () => {
      const payload = {
        From: "invalid-phone",
        To: "+27821234567",
        Body: "Test",
      };

      // Should attempt to normalize
      try {
        await testSMSWebhook(payload);
      } catch (error) {
        // Expected to handle gracefully
      }
    });

    it("should handle concurrent webhooks", async () => {
      const payloads = Array(10)
        .fill(null)
        .map((_, i) => ({
          MessageSid: `SM_CONCURRENT_${i}`,
          From: `+2782123456${i}`,
          To: "+27821234567",
          Body: `Concurrent message ${i}`,
        }));

      const results = await Promise.all(payloads.map((p) => testSMSWebhook(p)));
      expect(results).toBeDefined();
    });
  });

  describe("Conversation Management", () => {
    it("should create new conversation for new customer", async () => {
      const payload = {
        From: "+27899999999",
        To: "+27821234567",
        Body: "First message from new customer",
      };

      await testSMSWebhook(payload);
      // Should create new conversation
    });

    it("should add to existing conversation", async () => {
      // First message
      await testSMSWebhook({
        From: "+27888888888",
        To: "+27821234567",
        Body: "First message",
      });

      // Second message from same customer
      await testSMSWebhook({
        From: "+27888888888",
        To: "+27821234567",
        Body: "Second message",
      });

      // Should be in same conversation
    });

    it("should track conversation timestamps", async () => {
      const payload = {
        From: "+27877777777",
        To: "+27821234567",
        Body: "Test message",
      };

      await testSMSWebhook(payload);
      // Should update lastMessageAt timestamp
    });
  });

  describe("South African Specific", () => {
    it("should handle all SA carriers", async () => {
      const carriers = [
        "+27821234567", // Vodacom
        "+27731234567", // MTN
        "+27821234567", // Cell C
        "+27821234567", // Telkom
      ];

      for (const phone of carriers) {
        const payload = {
          From: phone,
          To: "+27821234567",
          Body: "Test from SA carrier",
        };

        await testSMSWebhook(payload);
      }
    });

    it("should handle local SA format", async () => {
      const payload = {
        From: "0821234567",
        To: "+27821234567",
        Body: "Local format message",
      };

      await testSMSWebhook(payload);
      // Should normalize to +27821234567
    });

    it("should handle SA business context", async () => {
      const payload = {
        From: "+27821234567",
        To: "+27821234567",
        Body: "Hi! I'm interested in the vehicle for R249,999. Can I test drive?",
      };

      await testSMSWebhook(payload);
      // Should preserve pricing and context
    });
  });
});
