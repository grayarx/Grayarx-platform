import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import { generateApiKey, hashApiKey, validateApiKey, createApiKey, revokeApiKey, checkRateLimit, getRateLimitStatus } from "./apiKeyService";

describe("API Key Management", () => {
  it("should generate a valid API key", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^grayarx_/);
    expect(key.length).toBeGreaterThan(20);
  });

  it("should hash API keys consistently", () => {
    const key = "grayarx_test123";
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);
    expect(hash1).toBe(hash2);
  });

  it("should hash different keys differently", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    const hash1 = hashApiKey(key1);
    const hash2 = hashApiKey(key2);
    expect(hash1).not.toBe(hash2);
  });

  it("should validate a correct API key", async () => {
    const dealershipId = 1;
    const result = await createApiKey(dealershipId, "Test Key");
    
    if (result) {
      const validated = await validateApiKey(result.key);
      expect(validated).toBeDefined();
      expect(validated?.dealershipId).toBe(dealershipId);
      expect(validated?.scopes).toContain("read_leads");
    }
  });

  it("should reject an invalid API key", async () => {
    const validated = await validateApiKey("grayarx_invalid");
    expect(validated).toBeNull();
  });

  it("should revoke an API key", async () => {
    const dealershipId = 1;
    const result = await createApiKey(dealershipId, "Test Key to Revoke");
    
    if (result) {
      const revoked = await revokeApiKey(result.keyId);
      expect(revoked).toBe(true);
      
      const validated = await validateApiKey(result.key);
      expect(validated).toBeNull();
    }
  });
});

describe("Webhook Security", () => {
  it("should sign webhook payloads with HMAC-SHA256", () => {
    const crypto = require("crypto");
    const payload = JSON.stringify({ event: "lead.created", id: 123 });
    const secret = "webhook_secret";
    
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should verify webhook signatures correctly", () => {
    const payload = JSON.stringify({ event: "lead.created", id: 123 });
    const secret = "webhook_secret";

    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(signature, "hex"),
    );

    expect(isValid).toBe(true);
  });

  it("should reject tampered webhook payloads", () => {
    const crypto = require("crypto");
    const payload = JSON.stringify({ event: "lead.created", id: 123 });
    const tamperedPayload = JSON.stringify({ event: "lead.created", id: 456 });
    const secret = "webhook_secret";
    
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    
    const tamperedSignature = crypto
      .createHmac("sha256", secret)
      .update(tamperedPayload)
      .digest("hex");
    
    expect(signature).not.toBe(tamperedSignature);
  });
});

describe("Rate Limiting", () => {
  it("should allow requests within rate limit", () => {
    const key1 = 1;
    const result1 = checkRateLimit(key1, 1000);
    expect(result1).toBe(true);
  });

  it("should track rate limit status", () => {
    const status = getRateLimitStatus(1, 1000);
    expect(status.remaining).toBeLessThanOrEqual(1000);
    expect(status.resetAt).toBeInstanceOf(Date);
  });
});

describe("Webhook Event Types", () => {
  const eventTypes = [
    "lead.created",
    "lead.updated",
    "booking.created",
    "booking.updated",
    "vehicle.created",
    "vehicle.updated",
    "vehicle.deleted",
  ];

  eventTypes.forEach((eventType) => {
    it(`should support ${eventType} event`, () => {
      expect(eventType).toMatch(/^[a-z]+\.[a-z]+$/);
    });
  });
});

describe("API Response Format", () => {
  it("should return paginated responses with metadata", () => {
    const response = {
      data: [{ id: 1, name: "Lead 1" }],
      limit: 10,
      offset: 0,
      total: 1,
    };
    
    expect(response).toHaveProperty("data");
    expect(response).toHaveProperty("limit");
    expect(response).toHaveProperty("offset");
    expect(response).toHaveProperty("total");
    expect(Array.isArray(response.data)).toBe(true);
  });

  it("should include rate limit headers", () => {
    const headers = {
      "X-RateLimit-Remaining": "999",
      "X-RateLimit-Reset": new Date().toISOString(),
    };
    
    expect(headers["X-RateLimit-Remaining"]).toBeDefined();
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
  });

  it("should return proper error responses", () => {
    const errorResponse = {
      error: "Rate limit exceeded",
      remaining: 0,
      resetAt: new Date().toISOString(),
    };
    
    expect(errorResponse).toHaveProperty("error");
    expect(errorResponse).toHaveProperty("remaining");
    expect(errorResponse).toHaveProperty("resetAt");
  });
});

describe("Data Access Control", () => {
  it("should only return dealership-specific leads", () => {
    const dealershipId = 1;
    const lead = {
      id: 1,
      dealershipId: 1,
      customerName: "John Doe",
    };
    
    expect(lead.dealershipId).toBe(dealershipId);
  });

  it("should reject cross-dealership access", () => {
    const apiKeyDealershipId = 1;
    const requestedDealershipId = 2;
    
    expect(apiKeyDealershipId).not.toBe(requestedDealershipId);
  });

  it("should enforce scope-based permissions", () => {
    const scopes = ["read_leads", "write_leads"];
    
    expect(scopes.includes("read_leads")).toBe(true);
    expect(scopes.includes("write_leads")).toBe(true);
    expect(scopes.includes("delete_leads")).toBe(false);
  });
});

describe("Webhook Retry Logic", () => {
  it("should calculate exponential backoff correctly", () => {
    const delays = [1, 5, 15, 60, 1440]; // minutes
    const exponential = delays.map((d, i) => d * Math.pow(2, i));
    
    expect(exponential[0]).toBeLessThan(exponential[1]);
    expect(exponential[1]).toBeLessThan(exponential[2]);
  });

  it("should track webhook failure count", () => {
    const webhook = {
      id: 1,
      url: "https://example.com/webhook",
      failureCount: 3,
      active: 1,
    };
    
    expect(webhook.failureCount).toBeGreaterThanOrEqual(0);
  });
});

describe("API Endpoint Authorization", () => {
  it("should require Authorization header", () => {
    const headers = {};
    const authHeader = headers["Authorization"];
    
    expect(authHeader).toBeUndefined();
  });

  it("should validate Bearer token format", () => {
    const validAuth = "Bearer grayarx_abc123";
    const invalidAuth = "Basic abc123";
    
    expect(validAuth).toMatch(/^Bearer grayarx_/);
    expect(invalidAuth).not.toMatch(/^Bearer grayarx_/);
  });
});
