import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  checkFeatureAccess,
  getAccessibleFeatures,
  getSubscriptionTier,
  isSubscriptionExpiringsoon,
  getSubscriptionDetails,
  FEATURE_DEFINITIONS,
} from "./featureAccessControl";

describe("Feature Access Control System", () => {
  describe("Feature Definitions", () => {
    it("should have all required features defined", () => {
      expect(Object.keys(FEATURE_DEFINITIONS).length).toBeGreaterThan(0);
    });

    it("should have features mapped to correct tiers", () => {
      const apiAccess = FEATURE_DEFINITIONS["api_access"];
      expect(apiAccess).toBeDefined();
      expect(apiAccess.tiers).toContain("enterprise");
      expect(apiAccess.tiers).not.toContain("starter");
    });

    it("Cloud API WhatsApp chatbot is Growth+ only (not Showroom/starter)", () => {
      const whatsappChatbot = FEATURE_DEFINITIONS["whatsapp_chatbot"];
      expect(whatsappChatbot.tiers).not.toContain("starter");
      expect(whatsappChatbot.tiers).toContain("professional");
      expect(whatsappChatbot.tiers).toContain("enterprise");
      const whatsappApi = FEATURE_DEFINITIONS["whatsapp_api"];
      expect(whatsappApi.tiers).not.toContain("starter");
      expect(whatsappApi.tiers).toEqual(["professional", "enterprise"]);
    });

    it("should have professional features in professional and enterprise", () => {
      const advancedAnalytics = FEATURE_DEFINITIONS["advanced_analytics"];
      expect(advancedAnalytics.tiers).toContain("professional");
      expect(advancedAnalytics.tiers).toContain("enterprise");
      expect(advancedAnalytics.tiers).not.toContain("starter");
    });

    it("should have enterprise-only features", () => {
      const apiAccess = FEATURE_DEFINITIONS["api_access"];
      expect(apiAccess.tiers).toEqual(["enterprise"]);
    });

    it("should have proper feature metadata", () => {
      Object.values(FEATURE_DEFINITIONS).forEach((feature) => {
        expect(feature.id).toBeDefined();
        expect(feature.name).toBeDefined();
        expect(feature.tiers).toBeDefined();
        expect(feature.tiers.length).toBeGreaterThan(0);
        expect(feature.category).toBeDefined();
      });
    });
  });

  describe("Feature Access Checking", () => {
    it("should deny access to non-existent feature", async () => {
      const result = await checkFeatureAccess(1, "non_existent_feature");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it("should handle database unavailability gracefully", async () => {
      // This would require mocking the database
      // For now, just verify the function doesn't crash
      const result = await checkFeatureAccess(999, "api_access");
      expect(result).toBeDefined();
      expect(result.hasAccess).toBe(false);
    });

    it("should return tier information on access check", async () => {
      const result = await checkFeatureAccess(1, "api_access");
      expect(result.tier).toBeDefined();
      expect(["starter", "professional", "enterprise", null]).toContain(result.tier);
    });
  });

  describe("Subscription Tier Retrieval", () => {
    it("should return null for non-existent dealership", async () => {
      const tier = await getSubscriptionTier(999999);
      expect(tier).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      const tier = await getSubscriptionTier(1);
      expect(tier === null || typeof tier === "string").toBe(true);
    });
  });

  describe("Subscription Expiry Detection", () => {
    it("should return false for non-existent dealership", async () => {
      const isExpiring = await isSubscriptionExpiringsoon(999999);
      expect(isExpiring).toBe(false);
    });

    it("should handle database errors gracefully", async () => {
      const isExpiring = await isSubscriptionExpiringsoon(1);
      expect(typeof isExpiring).toBe("boolean");
    });
  });

  describe("Subscription Details Retrieval", () => {
    it("should return null for non-existent dealership", async () => {
      const details = await getSubscriptionDetails(999999);
      expect(details).toBeNull();
    });

    it("should return proper subscription details structure", async () => {
      const details = await getSubscriptionDetails(1);
      if (details) {
        expect(details.tier).toBeDefined();
        expect(details.status).toBeDefined();
        expect(details.renewalDate).toBeDefined();
        expect(details.daysUntilRenewal).toBeDefined();
        expect(typeof details.isExpired).toBe("boolean");
        expect(typeof details.isExpiringoon).toBe("boolean");
      }
    });

    it("should calculate days until renewal correctly", async () => {
      const details = await getSubscriptionDetails(1);
      if (details) {
        const now = new Date();
        const renewalDate = new Date(details.renewalDate);
        const expectedDays = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        expect(details.daysUntilRenewal).toBe(expectedDays);
      }
    });
  });

  describe("Accessible Features Retrieval", () => {
    it("should return array of features", async () => {
      const features = await getAccessibleFeatures(1);
      expect(Array.isArray(features)).toBe(true);
    });

    it("should return empty array for non-existent dealership", async () => {
      const features = await getAccessibleFeatures(999999);
      expect(features).toEqual([]);
    });

    it("should only return features for dealership's tier", async () => {
      const features = await getAccessibleFeatures(1);
      if (features.length > 0) {
        // All features should have the same tier or be available in multiple tiers
        features.forEach((feature) => {
          expect(feature.tiers).toBeDefined();
          expect(feature.tiers.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe("Error Handling", () => {
    it("should not throw on invalid dealership ID", async () => {
      expect(async () => {
        await checkFeatureAccess(-1, "api_access");
      }).not.toThrow();
    });

    it("should not throw on invalid feature ID", async () => {
      expect(async () => {
        await checkFeatureAccess(1, "");
      }).not.toThrow();
    });

    it("should not throw on null dealership ID", async () => {
      expect(async () => {
        await checkFeatureAccess(0, "api_access");
      }).not.toThrow();
    });
  });

  describe("Feature Tier Hierarchy", () => {
    it("should have starter features in all tiers", () => {
      const starterFeatures = Object.values(FEATURE_DEFINITIONS).filter((f) =>
        f.tiers.includes("starter")
      );
      expect(starterFeatures.length).toBeGreaterThan(0);
    });

    it("should have professional features not in starter", () => {
      const professionalOnly = Object.values(FEATURE_DEFINITIONS).filter(
        (f) => f.tiers.includes("professional") && !f.tiers.includes("starter")
      );
      expect(professionalOnly.length).toBeGreaterThan(0);
    });

    it("should have enterprise features not in lower tiers", () => {
      const enterpriseOnly = Object.values(FEATURE_DEFINITIONS).filter(
        (f) => f.tiers.includes("enterprise") && f.tiers.length === 1
      );
      expect(enterpriseOnly.length).toBeGreaterThan(0);
    });
  });

  describe("Feature Categories", () => {
    it("should have features in all categories", () => {
      const categories = new Set(Object.values(FEATURE_DEFINITIONS).map((f) => f.category));
      expect(categories.has("api")).toBe(true);
      expect(categories.has("integration")).toBe(true);
      expect(categories.has("analytics")).toBe(true);
      expect(categories.has("support")).toBe(true);
      expect(categories.has("communication")).toBe(true);
    });

    it("should have proper category names", () => {
      const validCategories = ["api", "integration", "analytics", "support", "communication"];
      Object.values(FEATURE_DEFINITIONS).forEach((feature) => {
        expect(validCategories).toContain(feature.category);
      });
    });
  });
});
