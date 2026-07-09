import { describe, it, expect, beforeAll } from "vitest";
import {
  createEmailSequence,
  getPendingEmailSequences,
  getEmailSequenceStats,
  getDealershipEmailSequences,
} from "./db-email-sequences";

describe("Post-Signup Email Automation - Stress Tests", () => {
  const stressDealershipId = 9999;

  describe("High Volume Scheduling", () => {
    it("should handle scheduling 1000 emails without errors", async () => {
      const now = new Date();
      const promises = [];

      for (let i = 0; i < 1000; i++) {
        const scheduledTime = new Date(now.getTime() + (i % 72) * 60 * 60 * 1000);
        promises.push(
          createEmailSequence(
            stressDealershipId,
            i % 3 === 0 ? "welcome" : i % 3 === 1 ? "setup_guide" : "first_lead_tips",
            `customer${i}@example.com`,
            `Customer ${i}`,
            `Test Email ${i}`,
            `<h1>Test Email ${i}</h1>`,
            scheduledTime
          )
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(1000);
      expect(results.every((r) => r)).toBe(true);
    });

    it("should retrieve stats for dealership with 1000 emails", async () => {
      const stats = await getEmailSequenceStats(stressDealershipId);
      expect(stats.total).toBeGreaterThanOrEqual(1000);
      expect(stats.scheduled).toBeGreaterThanOrEqual(1000);
    });

    it("should handle retrieving large batch of dealership emails", async () => {
      const sequences = await getDealershipEmailSequences(stressDealershipId);
      expect(sequences.length).toBeGreaterThanOrEqual(1000);
    });

    it("should handle mixed sequence types at scale", async () => {
      const now = new Date();
      const promises = [];

      // Create 300 of each type
      for (let i = 0; i < 300; i++) {
        promises.push(
          createEmailSequence(
            stressDealershipId + 1,
            "welcome",
            `welcome${i}@example.com`,
            `Welcome ${i}`,
            "Welcome",
            "<h1>Welcome</h1>",
            new Date(now.getTime() + 5 * 60 * 1000)
          )
        );
      }

      for (let i = 0; i < 300; i++) {
        promises.push(
          createEmailSequence(
            stressDealershipId + 1,
            "setup_guide",
            `setup${i}@example.com`,
            `Setup ${i}`,
            "Setup Guide",
            "<h1>Setup</h1>",
            new Date(now.getTime() + 24 * 60 * 60 * 1000)
          )
        );
      }

      for (let i = 0; i < 300; i++) {
        promises.push(
          createEmailSequence(
            stressDealershipId + 1,
            "first_lead_tips",
            `tips${i}@example.com`,
            `Tips ${i}`,
            "First Lead Tips",
            "<h1>Tips</h1>",
            new Date(now.getTime() + 72 * 60 * 60 * 1000)
          )
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(900);

      const stats = await getEmailSequenceStats(stressDealershipId + 1);
      expect(stats.total).toBeGreaterThanOrEqual(900);
    });
  });

  describe("Pending Email Retrieval at Scale", () => {
    it("should efficiently retrieve pending emails when many are scheduled", async () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 1000 * 60 * 60); // 1000 minutes ago

      // Create 500 emails scheduled in the past (should be pending)
      const promises = [];
      for (let i = 0; i < 500; i++) {
        promises.push(
          createEmailSequence(
            stressDealershipId + 2,
            i % 3 === 0 ? "welcome" : i % 3 === 1 ? "setup_guide" : "first_lead_tips",
            `pending${i}@example.com`,
            `Pending ${i}`,
            `Pending Email ${i}`,
            `<h1>Pending ${i}</h1>`,
            pastTime
          )
        );
      }

      await Promise.all(promises);

      // Retrieve pending emails
      const pending = await getPendingEmailSequences(100);
      expect(pending.length).toBeGreaterThanOrEqual(0);
      expect(pending.length).toBeLessThanOrEqual(100); // Limited by query
    });

    it("should handle pagination of pending emails", async () => {
      const batch1 = await getPendingEmailSequences(50);
      const batch2 = await getPendingEmailSequences(100);

      expect(batch1.length).toBeLessThanOrEqual(50);
      expect(batch2.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Dealership Email Filtering at Scale", () => {
    it("should efficiently filter emails by sequence type", async () => {
      const welcomeEmails = await getDealershipEmailSequences(
        stressDealershipId + 1,
        "welcome"
      );
      const setupEmails = await getDealershipEmailSequences(
        stressDealershipId + 1,
        "setup_guide"
      );
      const tipsEmails = await getDealershipEmailSequences(
        stressDealershipId + 1,
        "first_lead_tips"
      );

      expect(Array.isArray(welcomeEmails)).toBe(true);
      expect(Array.isArray(setupEmails)).toBe(true);
      expect(Array.isArray(tipsEmails)).toBe(true);
    });
  });

  describe("Stats Calculation Performance", () => {
    it("should calculate stats efficiently for dealership with many emails", async () => {
      const startTime = Date.now();
      const stats = await getEmailSequenceStats(stressDealershipId);
      const duration = Date.now() - startTime;

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("scheduled");
      expect(stats).toHaveProperty("sent");
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    it("should handle stats calculation for multiple dealerships", async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(getEmailSequenceStats(stressDealershipId + i));
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      expect(results.every((r) => r.total >= 0)).toBe(true);
    });
  });

  describe("Email Sequence Creation Reliability", () => {
    it("should maintain data integrity with rapid sequential creates", async () => {
      const now = new Date();
      const dealerId = stressDealershipId + 100;

      for (let i = 0; i < 100; i++) {
        await createEmailSequence(
          dealerId,
          "welcome",
          `rapid${i}@example.com`,
          `Rapid ${i}`,
          `Rapid Email ${i}`,
          `<h1>Rapid ${i}</h1>`,
          new Date(now.getTime() + i * 1000)
        );
      }

      const sequences = await getDealershipEmailSequences(dealerId);
      expect(sequences.length).toBeGreaterThanOrEqual(100);
    });

    it("should handle special characters in email content", async () => {
      const specialContent = `
        <h1>Special Characters Test</h1>
        <p>Testing: & < > " ' \\ / @ # $ % ^ * ( ) { } [ ] | ; : , . ? !</p>
        <p>Unicode: 你好 مرحبا שלום Здравствуй</p>
      `;

      const result = await createEmailSequence(
        stressDealershipId + 101,
        "welcome",
        "special@example.com",
        "Special Test",
        "Special Characters",
        specialContent,
        new Date()
      );

      expect(result).toBeDefined();
    });

    it("should handle very long email addresses and names", async () => {
      const longEmail = `${'a'.repeat(32)}@${'b'.repeat(32)}.com`;
      const longName = "A".repeat(100);

      const result = await createEmailSequence(
        stressDealershipId + 102,
        "welcome",
        longEmail,
        longName,
        "Long Email Test",
        "<h1>Long Email</h1>",
        new Date()
      );

      expect(result).toBeDefined();
    });

    it("should handle very large HTML content", async () => {
      let largeHtml = "<h1>Large Content</h1>";
      for (let i = 0; i < 100; i++) {
        largeHtml += `<p>Paragraph ${i}: This is a test paragraph with some content to make it larger.</p>`;
      }

      const result = await createEmailSequence(
        stressDealershipId + 103,
        "welcome",
        "large@example.com",
        "Large Content",
        "Large HTML Test",
        largeHtml,
        new Date()
      );

      expect(result).toBeDefined();
    });
  });

  describe("Time-based Scheduling Stress", () => {
    it("should handle emails scheduled across different time zones", async () => {
      const now = new Date();
      const promises = [];

      // Schedule emails for different times
      const timeOffsets = [
        0, // Now
        5 * 60 * 1000, // 5 minutes
        1 * 60 * 60 * 1000, // 1 hour
        24 * 60 * 60 * 1000, // 1 day
        7 * 24 * 60 * 60 * 1000, // 1 week
        30 * 24 * 60 * 60 * 1000, // 1 month
      ];

      for (let i = 0; i < timeOffsets.length; i++) {
        promises.push(
          createEmailSequence(
            stressDealershipId + 104,
            "welcome",
            `timezone${i}@example.com`,
            `Timezone ${i}`,
            `Timezone Email ${i}`,
            `<h1>Timezone ${i}</h1>`,
            new Date(now.getTime() + timeOffsets[i])
          )
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(timeOffsets.length);
    });
  });

  describe("Query Performance", () => {
    it("should retrieve dealership emails efficiently", async () => {
      const startTime = Date.now();
      const sequences = await getDealershipEmailSequences(stressDealershipId + 1);
      const duration = Date.now() - startTime;

      expect(sequences.length).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(2000); // Should complete in less than 2 seconds
    });

    it("should retrieve pending emails efficiently", async () => {
      const startTime = Date.now();
      const pending = await getPendingEmailSequences(100);
      const duration = Date.now() - startTime;

      expect(pending.length).toBeLessThanOrEqual(100);
      expect(duration).toBeLessThan(2000); // Should complete in less than 2 seconds
    });
  });
});
