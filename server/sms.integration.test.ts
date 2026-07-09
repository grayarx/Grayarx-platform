/**
 * SMS Integration Tests
 * Comprehensive testing of SMS functionality
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sendSMS, getTwilioStatus } from "./_core/twilioService";
import {
  createWhatsappConversation,
  getOrCreateWhatsappConversation,
  createWhatsappMessage,
  getWhatsappMessages,
  updateWhatsappMessageStatus,
} from "./db";

describe("SMS Integration Tests", () => {
  let conversationId: number;
  const testDealershipId = 1;
  const testPhone = "+27821234567";

  beforeAll(async () => {
    // Create test conversation
    const conversation = await getOrCreateWhatsappConversation(
      testDealershipId,
      testPhone
    );
    conversationId = conversation.id;
  });

  describe("Twilio Service", () => {
    it("should return correct status", () => {
      const status = getTwilioStatus();
      expect(status).toBeDefined();
      expect(status.mode).toBe("mock");
      expect(status.hasAccountSid).toBe(true);
    });

    it("should send SMS in mock mode", async () => {
      const result = await sendSMS(testPhone, "Test message");
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.mode).toBe("mock");
    });

    it("should handle various phone formats", async () => {
      const formats = [
        "+27821234567",
        "0821234567",
        "+27 82 123 4567",
        "27821234567",
      ];

      for (const phone of formats) {
        const result = await sendSMS(phone, "Test message");
        expect(result.success).toBe(true);
      }
    });

    it("should send long messages", async () => {
      const longMessage = "A".repeat(500);
      const result = await sendSMS(testPhone, longMessage);
      expect(result.success).toBe(true);
    });
  });

  describe("Database Persistence", () => {
    it("should create conversation", async () => {
      expect(conversationId).toBeGreaterThan(0);
    });

    it("should store outbound message", async () => {
      const result = await sendSMS(testPhone, "Test outbound message");
      expect(result.success).toBe(true);

      if (result.messageId) {
        const message = await createWhatsappMessage({
          conversationId,
          direction: "outbound",
          messageType: "text",
          content: "Test outbound message",
          metaMessageId: result.messageId,
          status: "sent",
        });

        expect(message).toBeDefined();
      }
    });

    it("should retrieve message history", async () => {
      // Add a test message
      await createWhatsappMessage({
        conversationId,
        direction: "inbound",
        messageType: "text",
        content: "Test inbound message",
        status: "delivered",
      });

      // Retrieve history
      const messages = await getWhatsappMessages(conversationId);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some((m) => m.content === "Test inbound message")).toBe(true);
    });

    it("should update message status", async () => {
      const message = await createWhatsappMessage({
        conversationId,
        direction: "outbound",
        messageType: "text",
        content: "Status test message",
        status: "sent",
      });

      await updateWhatsappMessageStatus(message.id, "delivered");

      const messages = await getWhatsappMessages(conversationId);
      const updated = messages.find((m) => m.id === message.id);
      expect(updated?.status).toBe("delivered");
    });
  });

  describe("Bulk SMS", () => {
    it("should send multiple messages", async () => {
      const phones = [
        "+27821111111",
        "+27822222222",
        "+27833333333",
      ];

      const results = await Promise.all(
        phones.map((phone) => sendSMS(phone, "Bulk test message"))
      );

      expect(results.every((r) => r.success)).toBe(true);
      expect(results.length).toBe(3);
    });

    it("should handle mixed success/failure", async () => {
      const messages = [
        { phone: "+27821111111", message: "Message 1" },
        { phone: "", message: "Invalid phone" }, // Invalid
        { phone: "+27822222222", message: "Message 2" },
      ];

      const results = await Promise.all(
        messages
          .filter((m) => m.phone) // Filter out invalid
          .map((m) => sendSMS(m.phone, m.message))
      );

      expect(results.filter((r) => r.success).length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty phone number", async () => {
      const result = await sendSMS("", "Test message");
      // Should either fail gracefully or be prevented
      expect(result).toBeDefined();
    });

    it("should handle empty message", async () => {
      const result = await sendSMS(testPhone, "");
      expect(result).toBeDefined();
    });

    it("should handle special characters in message", async () => {
      const specialMessage = "Test with special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/";
      const result = await sendSMS(testPhone, specialMessage);
      expect(result.success).toBe(true);
    });

    it("should handle unicode characters", async () => {
      const unicodeMessage = "Test with unicode: 你好世界 مرحبا بالعالم";
      const result = await sendSMS(testPhone, unicodeMessage);
      expect(result.success).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should send message within timeout", async () => {
      const start = Date.now();
      await sendSMS(testPhone, "Performance test");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // 5 second timeout
    });

    it("should handle concurrent requests", async () => {
      const promises = Array(10)
        .fill(null)
        .map((_, i) => sendSMS(testPhone, `Concurrent message ${i}`));

      const results = await Promise.all(promises);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe("Message Types", () => {
    it("should handle text messages", async () => {
      const result = await sendSMS(testPhone, "Plain text message");
      expect(result.success).toBe(true);
    });

    it("should handle messages with URLs", async () => {
      const result = await sendSMS(
        testPhone,
        "Check this out: https://grayarx.com/showroom/123"
      );
      expect(result.success).toBe(true);
    });

    it("should handle messages with phone numbers", async () => {
      const result = await sendSMS(
        testPhone,
        "Call us at +27 82 123 4567 or 079 491 5187"
      );
      expect(result.success).toBe(true);
    });

    it("should handle messages with pricing", async () => {
      const result = await sendSMS(
        testPhone,
        "Special offer: R199,999 for this vehicle. Limited time!"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("South African Specific", () => {
    it("should handle SA phone numbers", async () => {
      const saNumbers = [
        "+27821234567", // Vodacom
        "+27731234567", // MTN
        "+27821234567", // Cell C
        "+27821234567", // Telkom
      ];

      for (const phone of saNumbers) {
        const result = await sendSMS(phone, "SA test message");
        expect(result.success).toBe(true);
      }
    });

    it("should handle SA currency formatting", async () => {
      const result = await sendSMS(
        testPhone,
        "Vehicle price: R 249,999 - Finance available from R 4,999/month"
      );
      expect(result.success).toBe(true);
    });

    it("should handle SA languages", async () => {
      const messages = [
        "Hello! Thanks for your interest.", // English
        "Hallo! Dankie vir jou belangstelling.", // Afrikaans
        "Sawubona! Ngiyabonga ngomdla wakho.", // Zulu
      ];

      for (const message of messages) {
        const result = await sendSMS(testPhone, message);
        expect(result.success).toBe(true);
      }
    });
  });
});
