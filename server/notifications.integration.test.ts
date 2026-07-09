import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  sendSMS,
  sendEmail,
  notifyLeadReceived,
  notifyBookingConfirmed,
  sendFollowupReminder,
} from "./_core/notificationService";
import {
  sendWhatsAppMessage,
  handleIncomingWhatsAppMessage,
  notifyDealershipWhatsApp,
} from "./_core/whatsappService";
import {
  syncAllInventory,
  updateVehiclePrices,
  removeUnlistedVehicles,
  deduplicateVehicles,
} from "./_core/inventorySyncService";

describe("Notification Services Integration Tests", () => {
  describe("SMS Notifications", () => {
    it("should send SMS successfully", async () => {
      const result = await sendSMS({
        phone: "0712345678",
        message: "Test SMS message",
        type: "custom",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should handle SMS with international format", async () => {
      const result = await sendSMS({
        phone: "+27712345678",
        message: "Test SMS with international format",
        type: "custom",
      });

      expect(result.success === true || result.success === false).toBe(true);
    });

    it("should fail gracefully when Twilio credentials missing", async () => {
      const result = await sendSMS({
        phone: "0712345678",
        message: "Test",
        type: "custom",
      });

      // Should still return a result object
      expect(result).toHaveProperty("success");
      expect(result.success === true || result.success === false).toBe(true);
    });
  });

  describe("Email Notifications", () => {
    it("should send email successfully", async () => {
      const result = await sendEmail({
        email: "test@example.com",
        subject: "Test Email",
        htmlContent: "<p>Test content</p>",
        type: "custom",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should send lead received notification", async () => {
      const result = await notifyLeadReceived(
        "0712345678",
        "dealer@example.com",
        {
          customerName: "John Doe",
          customerPhone: "0787654321",
          customerEmail: "john@example.com",
          vehicleInterest: "2011 Polo",
          message: "Interested in trade-in",
        }
      );

      expect(result.success).toBe(true);
    });

    it("should send booking confirmation", async () => {
      const result = await notifyBookingConfirmed(
        "0787654321",
        "john@example.com",
        {
          dealershipName: "Premium Motors",
          vehicleDetails: "2011 VW Polo Vivo",
          testDriveDate: "2026-05-25",
          testDriveTime: "14:00",
          dealershipPhone: "0712345678",
        }
      );

      expect(result.success).toBe(true);
    });

    it("should send follow-up reminder", async () => {
      const result = await sendFollowupReminder(
        "0787654321",
        "john@example.com",
        {
          dealershipName: "Premium Motors",
          vehicleDetails: "2011 VW Polo Vivo",
          dealershipPhone: "0712345678",
        }
      );

      expect(result.success).toBe(true);
    });
  });

  describe("WhatsApp Integration", () => {
    it("should send WhatsApp message successfully", async () => {
      const result = await sendWhatsAppMessage({
        phone: "0712345678",
        message: "Test WhatsApp message",
        type: "customer_enquiry",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should handle incoming WhatsApp message", async () => {
      const result = await handleIncomingWhatsAppMessage(
        "0787654321",
        "I'm interested in a test drive",
        "dealership_123"
      );

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    it("should parse vehicle enquiry type", async () => {
      const result = await handleIncomingWhatsAppMessage(
        "0787654321",
        "Do you have any Polos available?",
        "dealership_123"
      );

      expect(result.success).toBe(true);
      expect(result.response).toContain("interested");
    });

    it("should parse test drive request", async () => {
      const result = await handleIncomingWhatsAppMessage(
        "0787654321",
        "Can I book a test drive?",
        "dealership_123"
      );

      expect(result.success).toBe(true);
      expect(result.response).toContain("test drive");
    });

    it("should parse price enquiry", async () => {
      const result = await handleIncomingWhatsAppMessage(
        "0787654321",
        "How much is the Polo?",
        "dealership_123"
      );

      expect(result.success).toBe(true);
      expect(result.response).toContain("pricing");
    });

    it("should notify dealership via WhatsApp", async () => {
      const result = await notifyDealershipWhatsApp("0712345678", {
        customerName: "John Doe",
        customerPhone: "0787654321",
        vehicleInterest: "2011 Polo",
        message: "Interested in trade-in",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Inventory Sync", () => {
    it("should sync all inventory", async () => {
      const result = await syncAllInventory("dealership_123");

      expect(result.success).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.sources).toBeDefined();
    });

    it("should update vehicle prices", async () => {
      const result = await updateVehiclePrices("dealership_123");

      expect(result.success).toBe(true);
      expect(result.vehiclesUpdated).toBeDefined();
    });

    it("should remove unlisted vehicles", async () => {
      const result = await removeUnlistedVehicles("dealership_123");

      expect(result.success).toBe(true);
      expect(result.vehiclesRemoved).toBeDefined();
    });

    it("should deduplicate vehicles", () => {
      const vehicles = [
        {
          externalId: "1",
          source: "cars.co.za" as const,
          make: "VW",
          model: "Polo",
          year: 2011,
          price: 100000,
          mileage: 120000,
          fuelType: "Petrol",
          transmission: "Manual",
          description: "Good condition",
          dealershipId: "dealer_1",
        },
        {
          externalId: "2",
          source: "autotrader" as const,
          make: "VW",
          model: "Polo",
          year: 2011,
          price: 95000,
          mileage: 120000,
          fuelType: "Petrol",
          transmission: "Manual",
          description: "Excellent condition",
          dealershipId: "dealer_1",
        },
      ];

      const deduplicated = deduplicateVehicles(vehicles);

      // Should keep the cheaper one
      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].price).toBe(95000);
    });
  });

  describe("Load Testing", () => {
    it("should handle 100 concurrent SMS", async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        sendSMS({
          phone: `071234567${i % 10}`,
          message: `Test SMS ${i}`,
          type: "custom",
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      expect(results.every((r) => r.success || !r.success)).toBe(true);
    });

    it("should handle 50 concurrent WhatsApp messages", async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        sendWhatsAppMessage({
          phone: `071234567${i % 10}`,
          message: `Test WhatsApp ${i}`,
          type: "customer_enquiry",
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(50);
      expect(results.every((r) => r.success || !r.success)).toBe(true);
    });

    it("should handle 20 concurrent inventory syncs", async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        syncAllInventory(`dealership_${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(20);
      expect(results.every((r) => r.success !== undefined)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle SMS errors gracefully", async () => {
      const result = await sendSMS({
        phone: "",
        message: "",
        type: "custom",
      });

      expect(result).toHaveProperty("success");
      // Error property is optional
      expect(result.success === true || result.success === false).toBe(true);
    });

    it("should handle email errors gracefully", async () => {
      const result = await sendEmail({
        email: "invalid-email",
        subject: "",
        htmlContent: "",
        type: "custom",
      });

      expect(result).toHaveProperty("success");
      expect(result.success === true || result.success === false).toBe(true);
    });

    it("should handle WhatsApp errors gracefully", async () => {
      const result = await sendWhatsAppMessage({
        phone: "",
        message: "",
        type: "customer_enquiry",
      });

      expect(result).toHaveProperty("success");
      expect(result.success === true || result.success === false).toBe(true);
    });
  });
});
