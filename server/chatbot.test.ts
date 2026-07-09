/**
 * Comprehensive Chatbot Test Suite
 * Tests all chatbot services and functionality
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as nlpService from "./_core/chatbotNLPService";
import * as analyticsService from "./_core/chatbotAnalyticsService";
import * as memoryService from "./_core/chatbotMemoryService";
import * as sentimentService from "./_core/chatbotSentimentService";
import * as cacheService from "./_core/chatbotCacheService";
import * as securityService from "./_core/chatbotSecurityService";
import * as webhookService from "./_core/chatbotWebhookService";

describe("Chatbot NLP Service", () => {
  it("should detect pricing intent", () => {
    const result = nlpService.detectIntent("What is your pricing?");
    expect(result.intent).toBe("pricing");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should detect demo intent", () => {
    const result = nlpService.detectIntent("Can you show me a demo?");
    expect(result.intent).toBe("demo");
  });

  it("should extract email entities", () => {
    const entities = nlpService.extractEntities("Contact me at test@example.com");
    const emailEntity = entities.find((e) => e.type === "email");
    expect(emailEntity).toBeDefined();
    expect(emailEntity?.value).toBe("test@example.com");
  });

  it("should extract phone entities", () => {
    const entities = nlpService.extractEntities("Call me at 0123456789");
    const phoneEntity = entities.find((e) => e.type === "phone");
    expect(phoneEntity).toBeDefined();
  });

  it("should calculate semantic similarity", () => {
    const similarity = nlpService.calculateSimilarity(
      "What is the price?",
      "How much does it cost?"
    );
    expect(similarity).toBeGreaterThan(0.3);
  });

  it("should detect follow-up questions", () => {
    const isFollowUp = nlpService.isFollowUpQuestion(
      "And what about features?",
      "Tell me about pricing"
    );
    expect(isFollowUp).toBe(true);
  });

  it("should generate response suggestions", () => {
    const suggestions = nlpService.generateResponseSuggestions("pricing");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toBeDefined();
  });
});

describe("Chatbot Analytics Service", () => {
  beforeEach(() => {
    analyticsService.clearAnalyticsData();
  });

  it("should track message sent event", () => {
    analyticsService.trackMessageSent("conv1", "user1", { intent: "pricing" });
    const events = analyticsService.getConversationEvents("conv1");
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe("message_sent");
  });

  it("should track escalation event", () => {
    analyticsService.trackEscalation("conv1", "user1", "High frustration");
    const events = analyticsService.getConversationEvents("conv1");
    expect(events.some((e) => e.eventType === "escalation")).toBe(true);
  });

  it("should calculate conversation metrics", () => {
    analyticsService.trackMessageSent("conv1", "user1", {});
    analyticsService.trackMessageReceived("conv1", "user1", {});
    const metrics = analyticsService.getConversationMetrics();
    expect(metrics.totalConversations).toBeGreaterThan(0);
  });

  it("should track user metrics", () => {
    analyticsService.trackResolution("conv1", "user1", 5);
    const userMetrics = analyticsService.getUserMetrics("user1");
    expect(userMetrics?.resolutionCount).toBe(1);
    expect(userMetrics?.averageSatisfaction).toBe(5);
  });
});

describe("Chatbot Memory Service", () => {
  beforeEach(() => {
    memoryService.deleteConversation("test_session");
  });

  it("should create conversation", () => {
    const conv = memoryService.createConversation("test_session", "user1", "en");
    expect(conv.sessionId).toBe("test_session");
    expect(conv.language).toBe("en");
  });

  it("should add message to conversation", () => {
    memoryService.createConversation("test_session", "user1", "en");
    memoryService.addMessage("test_session", {
      id: "msg1",
      role: "user",
      content: "Hello",
      timestamp: Date.now(),
    });

    const messages = memoryService.getMessages("test_session");
    expect(messages.length).toBe(1);
    expect(messages[0].content).toBe("Hello");
  });

  it("should update entities", () => {
    memoryService.createConversation("test_session", "user1", "en");
    memoryService.updateEntities("test_session", { email: "test@example.com" });

    const conv = memoryService.getConversation("test_session");
    expect(conv?.entities.email).toBe("test@example.com");
  });

  it("should generate conversation summary", () => {
    memoryService.createConversation("test_session", "user1", "en");
    memoryService.addMessage("test_session", {
      id: "msg1",
      role: "user",
      content: "What is pricing?",
      timestamp: Date.now(),
      intent: "pricing",
    });

    const summary = memoryService.generateSummary("test_session");
    expect(summary).toBeDefined();
    expect(summary?.messageCount).toBe(1);
  });

  it("should export conversation as JSON", () => {
    memoryService.createConversation("test_session", "user1", "en");
    memoryService.addMessage("test_session", {
      id: "msg1",
      role: "user",
      content: "Hello",
      timestamp: Date.now(),
    });

    const exported = memoryService.exportConversation("test_session", "json");
    const parsed = JSON.parse(exported);
    expect(parsed.sessionId).toBe("test_session");
  });

  it("should search conversations", () => {
    memoryService.createConversation("test_session1", "user1", "en");
    memoryService.updateEntities("test_session1", { dealership: "Main St" });

    const results = memoryService.searchConversations("Main St");
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("Chatbot Sentiment Service", () => {
  it("should detect positive sentiment", () => {
    const sentiment = sentimentService.analyzeSentiment("I love this product!");
    expect(sentiment.label).toBe("positive");
    expect(sentiment.score).toBeGreaterThan(0.5);
  });

  it("should detect negative sentiment", () => {
    const sentiment = sentimentService.analyzeSentiment("This is terrible and broken");
    expect(sentiment.label).toBe("negative");
    expect(sentiment.score).toBeLessThan(-0.5);
  });

  it("should detect neutral sentiment", () => {
    const sentiment = sentimentService.analyzeSentiment("What are the features?");
    expect(sentiment.label).toBe("neutral");
  });

  it("should determine escalation need", () => {
    const negativeSentiment = sentimentService.analyzeSentiment(
      "I'm extremely frustrated and angry!"
    );
    const shouldEscalate = sentimentService.shouldEscalate(negativeSentiment);
    expect(shouldEscalate).toBe(true);
  });

  it("should not escalate for positive sentiment", () => {
    const positiveSentiment = sentimentService.analyzeSentiment("Great service!");
    const shouldEscalate = sentimentService.shouldEscalate(positiveSentiment);
    expect(shouldEscalate).toBe(false);
  });
});

describe("Chatbot Cache Service", () => {
  beforeEach(() => {
    cacheService.clearAllCaches();
  });

  it("should cache and retrieve response", () => {
    cacheService.cacheResponse("test query", "test response", "en");
    const cached = cacheService.getCachedResponse("test query", "en");
    expect(cached).toBe("test response");
  });

  it("should return undefined for non-cached item", () => {
    const cached = cacheService.getCachedResponse("non-existent", "en");
    expect(cached).toBeUndefined();
  });

  it("should cache FAQ results", () => {
    const faqResults = [{ question: "Q1", answer: "A1" }];
    cacheService.cacheFAQ("test", faqResults, "en");
    const cached = cacheService.getCachedFAQ("test", "en");
    expect(cached).toEqual(faqResults);
  });

  it("should get cache statistics", () => {
    cacheService.cacheResponse("q1", "r1", "en");
    cacheService.getCachedResponse("q1", "en");
    const stats = cacheService.getCacheStats();
    expect(stats.response.hitRate).toBeGreaterThan(0);
  });

  it("should clear specific cache", () => {
    cacheService.cacheResponse("q1", "r1", "en");
    cacheService.clearCache("response");
    const cached = cacheService.getCachedResponse("q1", "en");
    expect(cached).toBeUndefined();
  });
});

describe("Chatbot Security Service", () => {
  it("should validate clean input", () => {
    const result = securityService.validateInput("What is your pricing?");
    expect(result.valid).toBe(true);
  });

  it("should reject SQL injection", () => {
    const result = securityService.validateInput("SELECT * FROM users; DROP TABLE users;");
    expect(result.valid).toBe(false);
  });

  it("should reject XSS attempts", () => {
    const result = securityService.validateInput("<script>alert('xss')</script>");
    expect(result.valid).toBe(false);
  });

  it("should sanitize output", () => {
    const output = "<script>alert('xss')</script> Hello";
    const sanitized = securityService.sanitizeOutput(output);
    expect(sanitized).not.toContain("<script>");
  });

  it("should mask sensitive information", () => {
    const text = "Contact me at test@example.com";
    const masked = securityService.maskSensitiveInfo(text);
    expect(masked).toContain("***@***");
  });

  it("should detect suspicious patterns", () => {
    const result = securityService.checkSuspiciousPatterns("HELLO!!! CHECK THIS OUT!!!!");
    expect(result.suspicious).toBe(true);
  });

  it("should check rate limits", () => {
    const status1 = securityService.checkUserRateLimit("user1");
    expect(status1.allowed).toBe(true);
    expect(status1.remaining).toBeGreaterThan(0);
  });

  it("should generate security tokens", () => {
    const token = securityService.generateSecurityToken();
    expect(token.length).toBe(64);
  });
});

describe("Chatbot Webhook Service", () => {
  beforeEach(() => {
    // Clear webhooks
    const webhooks = webhookService.getAllWebhooks();
    webhooks.forEach((w) => webhookService.unregisterWebhook(w.id));
  });

  it("should register webhook", () => {
    const webhook = webhookService.registerWebhook({
      id: "test_webhook",
      url: "https://example.com/webhook",
      events: ["conversation.started"],
      active: true,
      retryCount: 3,
      retryDelay: 60,
    });

    expect(webhook.id).toBe("test_webhook");
    expect(webhook.active).toBe(true);
  });

  it("should unregister webhook", () => {
    webhookService.registerWebhook({
      id: "test_webhook",
      url: "https://example.com/webhook",
      events: ["conversation.started"],
      active: true,
      retryCount: 3,
      retryDelay: 60,
    });

    const result = webhookService.unregisterWebhook("test_webhook");
    expect(result).toBe(true);
  });

  it("should get all webhooks", () => {
    webhookService.registerWebhook({
      id: "test_webhook1",
      url: "https://example.com/webhook1",
      events: ["conversation.started"],
      active: true,
      retryCount: 3,
      retryDelay: 60,
    });

    webhookService.registerWebhook({
      id: "test_webhook2",
      url: "https://example.com/webhook2",
      events: ["conversation.ended"],
      active: true,
      retryCount: 3,
      retryDelay: 60,
    });

    const webhooks = webhookService.getAllWebhooks();
    expect(webhooks.length).toBe(2);
  });

  it("should update webhook", () => {
    webhookService.registerWebhook({
      id: "test_webhook",
      url: "https://example.com/webhook",
      events: ["conversation.started"],
      active: true,
      retryCount: 3,
      retryDelay: 60,
    });

    const updated = webhookService.updateWebhook("test_webhook", { active: false });
    expect(updated?.active).toBe(false);
  });

  it("should get webhook delivery stats", () => {
    const stats = webhookService.getWebhookDeliveryStats();
    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });
});

describe("Integration Tests", () => {
  beforeEach(() => {
    analyticsService.clearAnalyticsData();
    memoryService.deleteConversation("integration_test");
  });

  it("should handle complete conversation flow", () => {
    // Create conversation
    const conv = memoryService.createConversation("integration_test", "user1", "en");
    expect(conv.sessionId).toBe("integration_test");

    // Detect intent
    const nlpResult = nlpService.detectIntent("What is your pricing?");
    expect(nlpResult.intent).toBe("pricing");

    // Analyze sentiment
    const sentiment = sentimentService.analyzeSentiment("I love your service!");
    expect(sentiment.label).toBe("positive");

    // Add message
    memoryService.addMessage("integration_test", {
      id: "msg1",
      role: "user",
      content: "What is your pricing?",
      timestamp: Date.now(),
      intent: nlpResult.intent,
      sentiment: sentiment.label,
    });

    // Track analytics
    analyticsService.trackMessageSent("integration_test", "user1", {
      intent: nlpResult.intent,
    });

    // Verify
    const messages = memoryService.getMessages("integration_test");
    expect(messages.length).toBe(1);

    const events = analyticsService.getConversationEvents("integration_test");
    expect(events.length).toBeGreaterThan(0);
  });
});
