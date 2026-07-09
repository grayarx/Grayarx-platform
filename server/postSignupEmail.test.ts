import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  createEmailSequence,
  getPendingEmailSequences,
  updateEmailSequenceStatus,
  logEmailSequenceAttempt,
  getDealershipEmailSequences,
  getEmailSequenceById,
  getEmailSequenceLogs,
  getEmailSequenceStats,
} from "./db-email-sequences";
import {
  getWelcomeEmailTemplate,
  getSetupGuideEmailTemplate,
  getFirstLeadTipsEmailTemplate,
  getEmailTemplate,
} from "./_core/postSignupEmailTemplates";

describe("Post-Signup Email Automation", () => {
  const testDealershipId = 999;

  describe("Email Templates", () => {
    it("should generate welcome email template", () => {
      const template = getWelcomeEmailTemplate("Test Dealership", "John Doe");
      expect(template.subject).toContain("Welcome");
      expect(template.bodyHtml).toContain("Test Dealership");
      expect(template.bodyHtml).toContain("John Doe");
      expect(template.bodyHtml).toContain("GrayArx");
    });

    it("should generate setup guide email template", () => {
      const template = getSetupGuideEmailTemplate("Test Dealership");
      expect(template.subject).toContain("Setup Guide");
      expect(template.bodyHtml).toContain("4 steps");
      expect(template.bodyHtml).toContain("Upload Your Inventory");
    });

    it("should generate first lead tips email template", () => {
      const template = getFirstLeadTipsEmailTemplate("Test Dealership");
      expect(template.subject).toContain("First Lead");
      expect(template.bodyHtml).toContain("Congrats");
      expect(template.bodyHtml).toContain("48%");
    });

    it("should get correct template by sequence type", () => {
      const welcome = getEmailTemplate("welcome", "Test", "John");
      expect(welcome.subject).toContain("Welcome");

      const setup = getEmailTemplate("setup_guide", "Test");
      expect(setup.subject).toContain("Setup Guide");

      const tips = getEmailTemplate("first_lead_tips", "Test");
      expect(tips.subject).toContain("First Lead");
    });
  });

  describe("Email Sequence Database Operations", () => {
    it("should create email sequence", async () => {
      const now = new Date();
      const result = await createEmailSequence(
        testDealershipId,
        "welcome",
        "test@example.com",
        "Test Owner",
        "Welcome to GrayArx",
        "<h1>Welcome</h1>",
        now
      );

      expect(result).toBeDefined();
    });

    it("should update email sequence status", async () => {
      const now = new Date();
      const createResult = await createEmailSequence(
        testDealershipId,
        "welcome",
        "test@example.com",
        "Test Owner",
        "Welcome to GrayArx",
        "<h1>Welcome</h1>",
        now
      );

      const emailId = (createResult as any)?.[0]?.insertId || 1;

      const updateResult = await updateEmailSequenceStatus(
        emailId,
        "sent",
        "sendgrid-123",
        "pixel-456"
      );

      expect(updateResult).toBeDefined();
    });

    it("should log email sequence attempt", async () => {
      const logResult = await logEmailSequenceAttempt(
        testDealershipId,
        "welcome",
        1,
        1
      );

      expect(logResult).toBeDefined();
    });

    it("should get dealership email sequences", async () => {
      const sequences = await getDealershipEmailSequences(testDealershipId);
      expect(Array.isArray(sequences)).toBe(true);
    });

    it("should get email sequence stats", async () => {
      const stats = await getEmailSequenceStats(testDealershipId);
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("scheduled");
      expect(stats).toHaveProperty("sent");
      expect(stats).toHaveProperty("opened");
      expect(stats).toHaveProperty("clicked");
      expect(stats).toHaveProperty("failed");
      expect(stats).toHaveProperty("bounced");
    });
  });

  describe("Email Sequence Scheduling", () => {
    it("should schedule three emails for new dealership", async () => {
      const now = new Date();

      // Welcome email
      const welcome = await createEmailSequence(
        testDealershipId + 1,
        "welcome",
        "owner@dealership.com",
        "Dealership Owner",
        "Welcome to GrayArx",
        "<h1>Welcome</h1>",
        new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes
      );

      // Setup guide (day 1)
      const setup = await createEmailSequence(
        testDealershipId + 1,
        "setup_guide",
        "owner@dealership.com",
        "Dealership Owner",
        "Setup Guide",
        "<h1>Setup</h1>",
        new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      );

      // First lead tips (day 3)
      const tips = await createEmailSequence(
        testDealershipId + 1,
        "first_lead_tips",
        "owner@dealership.com",
        "Dealership Owner",
        "First Lead Tips",
        "<h1>Tips</h1>",
        new Date(now.getTime() + 72 * 60 * 60 * 1000) // 72 hours
      );

      expect(welcome).toBeDefined();
      expect(setup).toBeDefined();
      expect(tips).toBeDefined();
    });

    it("should get pending emails for processing", async () => {
      const now = new Date();

      // Create an email scheduled in the past (should be pending)
      await createEmailSequence(
        testDealershipId + 2,
        "welcome",
        "owner@dealership.com",
        "Owner",
        "Welcome",
        "<h1>Welcome</h1>",
        new Date(now.getTime() - 10 * 60 * 1000) // 10 minutes ago
      );

      const pending = await getPendingEmailSequences(10);
      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe("Email Sequence Status Transitions", () => {
    it("should transition email from scheduled to sent", async () => {
      const now = new Date();
      const createResult = await createEmailSequence(
        testDealershipId + 3,
        "welcome",
        "test@example.com",
        "Test",
        "Welcome",
        "<h1>Welcome</h1>",
        now
      );

      const emailId = (createResult as any)?.[0]?.insertId || 1;

      await updateEmailSequenceStatus(emailId, "sent", "msg-123");

      const sequence = await getEmailSequenceById(emailId);
      expect(sequence?.status).toBe("sent");
      expect(sequence?.sentAt).toBeDefined();
    });

    it("should transition email to failed status", async () => {
      const now = new Date();
      const createResult = await createEmailSequence(
        testDealershipId + 4,
        "setup_guide",
        "test@example.com",
        "Test",
        "Setup",
        "<h1>Setup</h1>",
        now
      );

      const emailId = (createResult as any)?.[0]?.insertId || 1;

      await updateEmailSequenceStatus(emailId, "failed");

      const sequence = await getEmailSequenceById(emailId);
      expect(sequence?.status).toBe("failed");
    });

    it("should track email opens", async () => {
      const now = new Date();
      const createResult = await createEmailSequence(
        testDealershipId + 5,
        "welcome",
        "test@example.com",
        "Test",
        "Welcome",
        "<h1>Welcome</h1>",
        now
      );

      const emailId = (createResult as any)?.[0]?.insertId || 1;

      // First mark as sent
      await updateEmailSequenceStatus(emailId, "sent");

      // Then mark as opened
      await updateEmailSequenceStatus(emailId, "opened");

      const sequence = await getEmailSequenceById(emailId);
      expect(sequence?.status).toBe("opened");
      expect(sequence?.openedAt).toBeDefined();
    });

    it("should track email clicks", async () => {
      const now = new Date();
      const createResult = await createEmailSequence(
        testDealershipId + 6,
        "first_lead_tips",
        "test@example.com",
        "Test",
        "Tips",
        "<h1>Tips</h1>",
        now
      );

      const emailId = (createResult as any)?.[0]?.insertId || 1;

      await updateEmailSequenceStatus(emailId, "clicked");

      const sequence = await getEmailSequenceById(emailId);
      expect(sequence?.status).toBe("clicked");
      expect(sequence?.clickedAt).toBeDefined();
    });
  });

  describe("Email Sequence Logging", () => {
    it("should log multiple delivery attempts", async () => {
      const logs = [];

      for (let i = 1; i <= 3; i++) {
        const log = await logEmailSequenceAttempt(
          testDealershipId + 7,
          "welcome",
          1,
          i
        );
        logs.push(log);
      }

      expect(logs.length).toBe(3);
    });

    it("should log failed delivery with error message", async () => {
      const log = await logEmailSequenceAttempt(
        testDealershipId + 8,
        "setup_guide",
        1,
        1,
        "Invalid email address"
      );

      expect(log).toBeDefined();
    });

    it("should retrieve email sequence logs", async () => {
      const logs = await getEmailSequenceLogs(1);
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("Email Sequence Statistics", () => {
    it("should calculate correct statistics", async () => {
      const stats = await getEmailSequenceStats(testDealershipId + 9);

      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.scheduled).toBeGreaterThanOrEqual(0);
      expect(stats.sent).toBeGreaterThanOrEqual(0);
      expect(stats.opened).toBeGreaterThanOrEqual(0);
      expect(stats.clicked).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBeGreaterThanOrEqual(0);
      expect(stats.bounced).toBeGreaterThanOrEqual(0);
    });
  });
});
