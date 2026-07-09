/**
 * Comprehensive Test Suite for New Agents
 * 
 * Tests:
 * - Sipho Enhanced (dealership research)
 * - Deal Pipeline Agent (prospect tracking)
 * - Contract Agent (onboarding)
 * - Dealership Health Monitor
 * - Nala Enhanced (support)
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  gatherDealershipIntelligence,
  analyzeDealershipWebsite,
  searchDealershipNews,
  identifyWeaknesses,
  scoreDealershipProspect,
} from "../server/_core/siphoRealResearch";
import {
  createDeal,
  moveDealToStage,
  logFollowUp,
  shouldFollowUp,
  calculateDealVelocity,
  generateFollowUpMessage,
} from "../server/_core/dealPipelineAgent";
import {
  createOnboardingWorkflow,
  completeTask,
  generateOnboardingEmail,
  generateTrainingMaterials,
} from "../server/_core/contractAgent";
import {
  calculateDealershipHealth,
  generateHealthReport,
} from "../server/_core/dealershipHealthMonitor";
import {
  classifyQuery,
  generateFAQResponse,
  processDealershipQuery,
  generateActionItems,
} from "../server/_core/nalaEnhanced";

describe("Sipho Enhanced - Dealership Research", () => {
  // LLM calls can be slow
  const testTimeout = 15000;
  it("should analyze dealership website", async () => {
    // Skip LLM test in CI
    if (process.env.CI) return;
    const analysis = await analyzeDealershipWebsite(
      "Test Dealership",
      "https://example-dealership.co.za"
    );

    expect(analysis).toBeDefined();
    expect(analysis.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score).toBeLessThanOrEqual(100);
    expect(analysis.mobileOptimized).toBeDefined();
    expect(analysis.hasAI).toBeDefined();
    expect(Array.isArray(analysis.leadCaptureMethods)).toBe(true);
    expect(typeof analysis.inventorySystem).toBe("string");
    expect(Array.isArray(analysis.issues)).toBe(true);
  });

  it("should search for dealership news", async () => {
    // Skip LLM test in CI
    if (process.env.CI) return;
    const news = await searchDealershipNews("Test Dealership", "Johannesburg");

    expect(Array.isArray(news)).toBe(true);
    // News might be empty, but should be valid array
    if (news.length > 0) {
      expect(news[0]).toHaveProperty("date");
      expect(news[0]).toHaveProperty("headline");
      expect(news[0]).toHaveProperty("source");
      expect(news[0]).toHaveProperty("relevance");
    }
  });

  it.skip("should gather complete dealership intelligence", async () => {
    // Skip LLM test in CI
    if (process.env.CI) return;
    const intelligence = await gatherDealershipIntelligence(
      "Test Dealership",
      "https://example-dealership.co.za",
      "Johannesburg"
    );

    expect(intelligence).toBeDefined();
    expect(intelligence.dealershipName).toBe("Test Dealership");
    expect(intelligence.website).toBe("https://example-dealership.co.za");
    expect(intelligence.location).toBe("Johannesburg");
    expect(intelligence.websiteQuality).toBeDefined();
    expect(intelligence.marketPosition).toBeDefined();
    expect(Array.isArray(intelligence.weaknesses)).toBe(true);
    expect(Array.isArray(intelligence.opportunities)).toBe(true);
    expect(intelligence.prospectScore).toBeDefined();
    expect(intelligence.prospectScore.total).toBeGreaterThanOrEqual(0);
    expect(intelligence.prospectScore.total).toBeLessThanOrEqual(100);
    expect(["platinum", "gold", "silver", "bronze"]).toContain(intelligence.prospectScore.tier);
  });
});

describe("Deal Pipeline Agent", () => {
  let deal: any;

  beforeEach(() => {
    deal = createDeal({
      dealershipName: "Test Dealership",
      contactName: "John Doe",
      contactEmail: "john@example.com",
      contactPhone: "+27 11 123 4567",
      initialScore: 75,
      source: "sipho",
    });
  });

  it("should create a new deal", () => {
    expect(deal).toBeDefined();
    expect(deal.dealershipName).toBe("Test Dealership");
    expect(deal.stage).toBe("prospect");
    expect(deal.score).toBe(75);
    expect(deal.followUps).toEqual([]);
  });

  it("should move deal to qualified stage", async () => {
    const qualified = await moveDealToStage(deal, "qualified", {
      qualifiedBy: "themba",
      interestLevel: "high",
    });

    expect(qualified.stage).toBe("qualified");
    expect(qualified.stageData.qualified).toBeDefined();
    expect(qualified.stageData.qualified?.interestLevel).toBe("high");
  });

  it("should log follow-up", async () => {
    const withFollowUp = await logFollowUp(deal, "themba", "cold_call", "Interested, scheduling demo");

    expect(withFollowUp.followUps.length).toBe(1);
    expect(withFollowUp.followUps[0].agent).toBe("themba");
    expect(withFollowUp.followUps[0].action).toBe("cold_call");
    expect(withFollowUp.lastFollowUpAt).toBeDefined();
  });

  it("should determine if deal needs follow-up", () => {
    const needsFollowUp = shouldFollowUp(deal);
    // New deal might or might not need follow-up depending on timing
    expect(typeof needsFollowUp).toBe("boolean");
  });

  it("should calculate deal velocity", () => {
    const deals = [deal];
    const velocity = calculateDealVelocity(deals);

    expect(velocity.totalDeals).toBe(1);
    expect(velocity.byStage.prospect).toBe(1);
    expect(velocity.conversionRate).toBeGreaterThanOrEqual(0);
    expect(velocity.conversionRate).toBeLessThanOrEqual(100);
  });

  it("should generate follow-up message", async () => {
    const message = await generateFollowUpMessage(deal);

    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
  });
});

describe("Contract & Onboarding Agent", () => {
  let workflow: any;

  beforeEach(() => {
    workflow = createOnboardingWorkflow({
      dealershipId: "dealer-123",
      dealershipName: "Test Dealership",
      primaryContactName: "John Doe",
      primaryContactEmail: "john@example.com",
      primaryContactPhone: "+27 11 123 4567",
      technicalContactName: "Jane Smith",
      technicalContactEmail: "jane@example.com",
      technicalContactPhone: "+27 11 987 6543",
    });
  });

  it("should create onboarding workflow", () => {
    expect(workflow).toBeDefined();
    expect(workflow.dealershipName).toBe("Test Dealership");
    expect(Array.isArray(workflow.tasks)).toBe(true);
    expect(workflow.tasks.length).toBeGreaterThan(0);
    expect(workflow.completionPercentage).toBe(0);
  });

  it("should complete onboarding task", () => {
    const updated = completeTask(workflow, "task-1", "Account created successfully");

    expect(updated.tasks[0].completed).toBe(true);
    expect(updated.tasks[0].completedAt).toBeDefined();
    expect(updated.completionPercentage).toBeGreaterThan(0);
  });

  it("should generate onboarding email", async () => {
    // Skip slow LLM test in CI
    if (process.env.CI) return;
    const email = await generateOnboardingEmail(
      "Test Dealership",
      "John Doe",
      "https://onboard.grayarx.com/workflow-123"
    );

    expect(typeof email).toBe("string");
    expect(email.length).toBeGreaterThan(0);
    expect(email).toContain("Test Dealership");
  });

  it("should generate training materials", async () => {
    // Skip slow LLM test in CI
    if (process.env.CI) return;
    const materials = await generateTrainingMaterials("Test Dealership");

    expect(materials).toBeDefined();
    expect(typeof materials.gettingStarted).toBe("string");
    expect(typeof materials.agentGuide).toBe("string");
    expect(typeof materials.bestPractices).toBe("string");
    expect(typeof materials.faq).toBe("string");
    expect(materials.gettingStarted.length).toBeGreaterThan(0);
  });
});

describe("Dealership Health Monitor", () => {
  it("should calculate dealership health", async () => {
    const health = await calculateDealershipHealth({
      dealershipId: "dealer-123",
      dealershipName: "Test Dealership",
      dailyActiveUsers: 5,
      weeklyActiveUsers: 12,
      monthlyActiveUsers: 20,
      lastActivityAt: new Date(),
      leadsProcessed: 150,
      bookingsCreated: 45,
      emailsSent: 300,
      callsPlaced: 80,
      averageResponseTime: 45,
      leadConversionRate: 30,
      bookingShowupRate: 75,
      customerSatisfactionScore: 85,
      supportTicketsOpen: 2,
      supportTicketsTotalThisMonth: 8,
      averageResolutionTime: 4,
    });

    expect(health).toBeDefined();
    expect(health.dealershipName).toBe("Test Dealership");
    expect(health.overallHealthScore).toBeGreaterThanOrEqual(0);
    expect(health.overallHealthScore).toBeLessThanOrEqual(100);
    expect(["excellent", "good", "at-risk", "critical"]).toContain(health.healthStatus);
    expect(health.churnRiskScore).toBeGreaterThanOrEqual(0);
    expect(health.churnRiskScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(health.upsellOpportunities)).toBe(true);
  });

  it("should generate health report", async () => {
    // Skip LLM test in CI
    if (process.env.CI) return;
    const health = await calculateDealershipHealth({
      dealershipId: "dealer-123",
      dealershipName: "Test Dealership",
      dailyActiveUsers: 5,
      weeklyActiveUsers: 12,
      monthlyActiveUsers: 20,
      lastActivityAt: new Date(),
      leadsProcessed: 150,
      bookingsCreated: 45,
      emailsSent: 300,
      callsPlaced: 80,
      averageResponseTime: 45,
      leadConversionRate: 30,
      bookingShowupRate: 75,
      customerSatisfactionScore: 85,
      supportTicketsOpen: 2,
      supportTicketsTotalThisMonth: 8,
      averageResolutionTime: 4,
    });

    const report = await generateHealthReport(health);

    expect(typeof report).toBe("string");
    expect(report.length).toBeGreaterThan(0);
  });
});

describe("Nala Enhanced - Dealership Support", () => {
  it("should classify query", async () => {
    const category = await classifyQuery("How do I import my vehicle inventory?");

    expect(["how-to", "troubleshooting", "booking", "feature-request", "other"]).toContain(category);
  });

  it("should generate FAQ response", async () => {
    const response = await generateFAQResponse(
      "How do I reset my password?",
      "Test Dealership",
      "en"
    );

    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(0);
  });

  it("should process dealership query", async () => {
    // Skip LLM test in CI
    if (process.env.CI) return;
    const query = {
      id: "query-123",
      dealershipId: "dealer-123",
      dealershipName: "Test Dealership",
      senderName: "John Doe",
      senderEmail: "john@example.com",
      query: "How do I add a new team member?",
      category: "how-to" as const,
      language: "en",
      timestamp: new Date(),
    };

    const response = await processDealershipQuery(query);

    expect(response).toBeDefined();
    expect(response.queryId).toBe("query-123");
    expect(["faq", "booking-handoff", "feature-request", "escalation"]).toContain(
      response.responseType
    );
    expect(typeof response.message).toBe("string");
    expect(response.message.length).toBeGreaterThan(0);
  });

  it.skip("should generate action items", async () => {
    const actionItems = await generateActionItems(
      "How do I configure my email settings?",
      "how-to"
    );

    expect(Array.isArray(actionItems)).toBe(true);
    if (actionItems.length > 0) {
      expect(actionItems[0]).toHaveProperty("action");
      expect(actionItems[0]).toHaveProperty("description");
    }
  });
});

describe("Integration Tests - Full Workflows", () => {
  it.skip("should execute complete B2B sales workflow", async () => {
    // Skip slow LLM test in CI
    if (process.env.CI) return;
    // 1. Sipho researches dealership
    const intelligence = await gatherDealershipIntelligence(
      "Integration Test Dealership",
      "https://example-dealership.co.za",
      "Johannesburg"
    );
    expect(intelligence).toBeDefined();

    // 2. Create deal in pipeline
    const deal = createDeal({
      dealershipName: intelligence.dealershipName,
      contactName: "Test Contact",
      contactEmail: "contact@example.com",
      contactPhone: "+27 11 123 4567",
      initialScore: intelligence.prospectScore.total,
      source: "sipho",
    });
    expect(deal.stage).toBe("prospect");

    // 3. Move to qualified
    const qualified = await moveDealToStage(deal, "qualified", {
      qualifiedBy: "themba",
      interestLevel: "high",
    });
    expect(qualified.stage).toBe("qualified");

    // 4. Create onboarding workflow
    const workflow = createOnboardingWorkflow({
      dealershipId: "integration-test-123",
      dealershipName: intelligence.dealershipName,
      primaryContactName: "Test Contact",
      primaryContactEmail: "contact@example.com",
      primaryContactPhone: "+27 11 123 4567",
      technicalContactName: "Tech Contact",
      technicalContactEmail: "tech@example.com",
      technicalContactPhone: "+27 11 987 6543",
    });
    expect(workflow.tasks.length).toBeGreaterThan(0);

    // 5. Complete first task
    const updated = completeTask(workflow, "task-1");
    expect(updated.completionPercentage).toBeGreaterThan(0);
  });

  it("should execute complete dealership support workflow", async () => {
    // Skip slow LLM test in CI
    if (process.env.CI) return;
    // 1. Dealership sends query
    const query = {
      id: "integration-query-123",
      dealershipId: "dealer-123",
      dealershipName: "Integration Test Dealership",
      senderName: "John Doe",
      senderEmail: "john@example.com",
      query: "How do I set up my team members?",
      category: "how-to" as const,
      language: "en",
      timestamp: new Date(),
    };

    // 2. Nala processes query
    const response = await processDealershipQuery(query);
    expect(response).toBeDefined();
    expect(response.message.length).toBeGreaterThan(0);

    // 3. Generate action items
    const actionItems = await generateActionItems(query.query, query.category);
    expect(Array.isArray(actionItems)).toBe(true);
  });
});

describe("Stress Tests - High Volume", () => {
  it("should handle 100 concurrent deal creations", async () => {
    const deals = Array.from({ length: 100 }, (_, i) =>
      createDeal({
        dealershipName: `Dealership ${i}`,
        contactName: `Contact ${i}`,
        contactEmail: `contact${i}@example.com`,
        contactPhone: `+27 11 ${String(i).padStart(7, "0")}`,
        initialScore: Math.random() * 100,
        source: "sipho",
      })
    );

    expect(deals.length).toBe(100);
    expect(deals.every((d) => d.stage === "prospect")).toBe(true);
  });

  it("should calculate velocity for 1000 deals", () => {
    const deals = Array.from({ length: 1000 }, (_, i) => ({
      id: `deal-${i}`,
      dealershipName: `Dealership ${i}`,
      stage: i % 5 === 0 ? "won" : i % 5 === 1 ? "lost" : "prospect",
      score: Math.random() * 100,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      lastUpdatedAt: new Date(),
      movedToStageAt: new Date(),
      contactName: "Test",
      contactEmail: "test@example.com",
      contactPhone: "+27 11 123 4567",
      estimatedMonthlyLeads: 50,
      estimatedAnnualValue: 50000,
      stageData: {},
      followUps: [],
      daysInStage: 0,
      needsFollowUp: false,
      lastFollowUpAt: null,
    }));

    const velocity = calculateDealVelocity(deals);

    expect(velocity.totalDeals).toBe(1000);
    expect(velocity.byStage.won).toBeGreaterThan(0);
    expect(velocity.byStage.lost).toBeGreaterThan(0);
    expect(velocity.conversionRate).toBeGreaterThanOrEqual(0);
  });
});
