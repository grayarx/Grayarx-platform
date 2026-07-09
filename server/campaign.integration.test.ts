/**
 * Campaign System Integration Tests
 * 
 * Tests for:
 * - Dealership analysis and pain point identification
 * - Dealership grouping by pain points
 * - Email template generation
 * - Batch email scheduling
 * - Campaign management
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  analyzeDealershipProfile,
  groupDealershipsByPainPoints,
  DealershipProfile,
  DealershipAnalysis,
  generateCampaignSummary,
} from "../server/_core/advancedProspectorEngine";
import {
  generatePersonalizedEmail,
  generateDealershipEmailBatch,
  scheduleBatchEmails,
  createBatchCampaign,
  calculateCampaignMetrics,
  generateCampaignSummary as generateEmailCampaignSummary,
} from "../server/_core/batchEmailScheduler";

describe("Campaign System Integration Tests", () => {
  let dealershipProfile: DealershipProfile;
  let dealershipAnalysis: DealershipAnalysis;

  beforeAll(() => {
    dealershipProfile = {
      dealershipId: "dealer-001",
      dealershipName: "Premium Auto Sales",
      region: "Gauteng",
      city: "Johannesburg",
      website: "https://premiumautosales.co.za",
      phone: "+27123456789",
      email: "info@premiumautosales.co.za",
      estimatedMonthlyVolume: 50,
      brandsCarried: ["Toyota", "Honda", "Mazda"],
      googleReviewScore: 4.2,
      reviewCount: 127,
      socialMediaPresence: {
        facebook: "premiumautosales",
        instagram: "premiumautosales",
      },
      researchedAt: new Date(),
    };
  });

  describe("Dealership Analysis", () => {
    it("should analyze dealership profile and identify pain points", async () => {
      dealershipAnalysis = await analyzeDealershipProfile(dealershipProfile);

      expect(dealershipAnalysis).toBeDefined();
      expect(dealershipAnalysis.dealershipId).toBe("dealer-001");
      expect(dealershipAnalysis.dealershipName).toBe("Premium Auto Sales");
      expect(dealershipAnalysis.painPoints).toBeDefined();
      expect(dealershipAnalysis.painPoints.length).toBeGreaterThan(0);
      expect(dealershipAnalysis.fitScore).toBeGreaterThanOrEqual(0);
      expect(dealershipAnalysis.fitScore).toBeLessThanOrEqual(100);
    });

    it("should have valid pain point structure", () => {
      expect(dealershipAnalysis.painPoints[0]).toHaveProperty("id");
      expect(dealershipAnalysis.painPoints[0]).toHaveProperty("category");
      expect(dealershipAnalysis.painPoints[0]).toHaveProperty("severity");
      expect(dealershipAnalysis.painPoints[0]).toHaveProperty("description");
      expect(dealershipAnalysis.painPoints[0]).toHaveProperty("evidence");
      expect(dealershipAnalysis.painPoints[0]).toHaveProperty("estimatedImpact");
    });

    it("should generate personalized message", () => {
      expect(dealershipAnalysis.personalizedMessage).toBeDefined();
      expect(dealershipAnalysis.personalizedMessage.length).toBeGreaterThan(0);
      expect(dealershipAnalysis.personalizedMessage).toContain("Premium Auto Sales");
    });

    it("should recommend email template", () => {
      expect(dealershipAnalysis.recommendedEmailTemplate).toBeDefined();
      expect(dealershipAnalysis.recommendedEmailTemplate).toMatch(/^template_/);
    });
  });

  describe("Dealership Grouping", () => {
    it("should group dealerships by pain points", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);

      expect(groups).toBeDefined();
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0]).toHaveProperty("groupId");
      expect(groups[0]).toHaveProperty("groupName");
      expect(groups[0]).toHaveProperty("primaryPainPoints");
      expect(groups[0]).toHaveProperty("dealerships");
    });

    it("should generate campaign summary", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const summary = generateCampaignSummary(groups);

      expect(summary).toHaveProperty("totalDealerships");
      expect(summary).toHaveProperty("totalEmails");
      expect(summary).toHaveProperty("groupCount");
      expect(summary.totalDealerships).toBeGreaterThan(0);
      expect(summary.totalEmails).toBeGreaterThan(0);
    });
  });

  describe("Email Template Generation", () => {
    it("should generate personalized email template", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const template = generatePersonalizedEmail(dealershipAnalysis, groups[0]);

      expect(template).toBeDefined();
      expect(template.subject).toBeDefined();
      expect(template.subject).toContain("Premium Auto Sales");
      expect(template.htmlBody).toBeDefined();
      expect(template.plainTextBody).toBeDefined();
      expect(template.ctaText).toBeDefined();
      expect(template.ctaUrl).toBeDefined();
    });

    it("should include GrayArx branding in email", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const template = generatePersonalizedEmail(dealershipAnalysis, groups[0]);

      expect(template.htmlBody).toContain("GrayArx");
      expect(template.htmlBody).toContain("Mia");
      expect(template.plainTextBody).toContain("GrayArx");
    });

    it("should include unsubscribe link", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const template = generatePersonalizedEmail(dealershipAnalysis, groups[0]);

      expect(template.htmlBody).toContain("unsubscribe");
    });
  });

  describe("Batch Email Scheduling", () => {
    it("should generate 100 emails per dealership", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const baseTemplate = generatePersonalizedEmail(dealershipAnalysis, groups[0]);
      const emails = generateDealershipEmailBatch(dealershipAnalysis, groups[0], baseTemplate);

      expect(emails.length).toBe(100);
    });

    it("should have unique email IDs", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const baseTemplate = generatePersonalizedEmail(dealershipAnalysis, groups[0]);
      const emails = generateDealershipEmailBatch(dealershipAnalysis, groups[0], baseTemplate);

      const emailIds = new Set(emails.map((e) => e.emailId));
      expect(emailIds.size).toBe(100);
    });

    it("should stagger email sending times", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const baseTemplate = generatePersonalizedEmail(dealershipAnalysis, groups[0]);
      const emails = generateDealershipEmailBatch(dealershipAnalysis, groups[0], baseTemplate);
      const scheduled = scheduleBatchEmails(emails, new Date());

      const times = scheduled.map((e) => e.scheduledTime.getTime());
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThan(times[i - 1]);
      }
    });

    it("should have all emails in scheduled status", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const baseTemplate = generatePersonalizedEmail(dealershipAnalysis, groups[0]);
      const emails = generateDealershipEmailBatch(dealershipAnalysis, groups[0], baseTemplate);
      const scheduled = scheduleBatchEmails(emails, new Date());

      expect(scheduled.every((e) => e.status === "scheduled")).toBe(true);
    });
  });

  describe("Campaign Management", () => {
    it("should create batch campaign", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const campaign = createBatchCampaign(groups[0]);

      expect(campaign).toHaveProperty("campaignId");
      expect(campaign).toHaveProperty("groupId");
      expect(campaign).toHaveProperty("totalEmails");
      expect(campaign.status).toBe("scheduled");
      expect(campaign.totalEmails).toBeGreaterThan(0);
    });

    it("should calculate campaign metrics", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const campaign = createBatchCampaign(groups[0]);
      const baseTemplate = generatePersonalizedEmail(dealershipAnalysis, groups[0]);
      const emails = generateDealershipEmailBatch(dealershipAnalysis, groups[0], baseTemplate);

      const updated = calculateCampaignMetrics(campaign, emails);

      expect(updated).toHaveProperty("emailsSent");
      expect(updated).toHaveProperty("emailsOpened");
      expect(updated).toHaveProperty("openRate");
      expect(updated).toHaveProperty("clickRate");
    });

    it("should generate campaign summary", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const campaign = createBatchCampaign(groups[0]);
      const baseTemplate = generatePersonalizedEmail(dealershipAnalysis, groups[0]);
      const emails = generateDealershipEmailBatch(dealershipAnalysis, groups[0], baseTemplate);

      const summary = generateEmailCampaignSummary(campaign, emails);

      expect(summary).toHaveProperty("campaignId");
      expect(summary).toHaveProperty("groupName");
      expect(summary).toHaveProperty("totalEmails");
      expect(summary).toHaveProperty("estimatedConversions");
      expect(summary).toHaveProperty("estimatedDemos");
      expect(summary).toHaveProperty("estimatedRevenue");
    });
  });

  describe("End-to-End Campaign Flow", () => {
    it("should complete full campaign workflow", async () => {
      // 1. Analyze dealership
      const analysis = await analyzeDealershipProfile(dealershipProfile);
      expect(analysis.dealershipId).toBe("dealer-001");

      // 2. Group dealerships
      const groups = groupDealershipsByPainPoints([analysis]);
      expect(groups.length).toBeGreaterThan(0);

      // 3. Generate emails
      const baseTemplate = generatePersonalizedEmail(analysis, groups[0]);
      const emails = generateDealershipEmailBatch(analysis, groups[0], baseTemplate);
      expect(emails.length).toBe(100);

      // 4. Schedule emails
      const scheduled = scheduleBatchEmails(emails, new Date());
      expect(scheduled.every((e) => e.status === "scheduled")).toBe(true);

      // 5. Create campaign
      const campaign = createBatchCampaign(groups[0]);
      expect(campaign.status).toBe("scheduled");

      // 6. Calculate metrics
      const updated = calculateCampaignMetrics(campaign, scheduled);
      expect(updated.totalEmails).toBeGreaterThan(0);

      // 7. Generate summary
      const summary = generateEmailCampaignSummary(campaign, scheduled);
      expect(summary.totalEmails).toBe(100);
    });
  });

  describe("Campaign Performance Metrics", () => {
    it("should calculate realistic open rates", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const campaign = createBatchCampaign(groups[0]);
      const baseTemplate = generatePersonalizedEmail(dealershipAnalysis, groups[0]);
      const emails = generateDealershipEmailBatch(dealershipAnalysis, groups[0], baseTemplate);

      // Simulate 30% open rate
      const simulatedEmails = emails.map((e, i) => ({
        ...e,
        status: i < 30 ? "opened" : "sent",
      }));

      const updated = calculateCampaignMetrics(campaign, simulatedEmails);
      expect(updated.openRate).toBeCloseTo(30, 1);
    });

    it("should calculate realistic click rates", () => {
      const analyses = [dealershipAnalysis];
      const groups = groupDealershipsByPainPoints(analyses);
      const campaign = createBatchCampaign(groups[0]);
      const baseTemplate = generatePersonalizedEmail(dealershipAnalysis, groups[0]);
      const emails = generateDealershipEmailBatch(dealershipAnalysis, groups[0], baseTemplate);

      // Simulate 10% click rate
      const simulatedEmails = emails.map((e, i) => ({
        ...e,
        status: i < 10 ? "clicked" : "sent",
      }));

      const updated = calculateCampaignMetrics(campaign, simulatedEmails);
      expect(updated.clickRate).toBeCloseTo(10, 1);
    });
  });
});
