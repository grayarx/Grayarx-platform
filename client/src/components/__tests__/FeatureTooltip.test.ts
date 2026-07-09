import { describe, it, expect } from "vitest";
import { featureDescriptions, getFeatureDescription, getAllFeatures, getFeaturesByTier } from "@/lib/featureDescriptions";

describe("Feature Descriptions & Tooltips", () => {
  describe("featureDescriptions object", () => {
    it("should contain all expected features", () => {
      const expectedFeatures = [
        "whatsapp_chatbot",
        "email_notifications",
        "lead_capture",
        "dashboard",
        "advanced_analytics",
        "lead_prioritization",
        "inventory_sync",
        "webhook_support",
        "priority_support",
        "api_access",
        "custom_webhooks",
        "crm_integration",
        "phone_support",
        "dedicated_account_manager",
        "bulk_lead_import",
        "lead_scoring",
        "audit_logging",
        "custom_branding",
        "sso_integration",
        "multi_location",
      ];

      expectedFeatures.forEach((feature) => {
        expect(featureDescriptions).toHaveProperty(feature);
      });
    });

    it("should have correct structure for each feature", () => {
      Object.values(featureDescriptions).forEach((feature) => {
        expect(feature).toHaveProperty("name");
        expect(feature).toHaveProperty("description");
        expect(feature).toHaveProperty("tiers");
        expect(feature).toHaveProperty("icon");
        expect(typeof feature.name).toBe("string");
        expect(typeof feature.description).toBe("string");
        expect(Array.isArray(feature.tiers)).toBe(true);
        expect(typeof feature.icon).toBe("string");
      });
    });

    it("should have non-empty descriptions", () => {
      Object.values(featureDescriptions).forEach((feature) => {
        expect(feature.name.length).toBeGreaterThan(0);
        expect(feature.description.length).toBeGreaterThan(0);
        expect(feature.tiers.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Tier Distribution", () => {
    it("should have features in starter tier", () => {
      const starterFeatures = Object.values(featureDescriptions).filter((f) =>
        f.tiers.includes("starter")
      );
      expect(starterFeatures.length).toBeGreaterThan(0);
    });

    it("should have features in professional tier", () => {
      const professionalFeatures = Object.values(featureDescriptions).filter((f) =>
        f.tiers.includes("professional")
      );
      expect(professionalFeatures.length).toBeGreaterThan(0);
    });

    it("should have features in enterprise tier", () => {
      const enterpriseFeatures = Object.values(featureDescriptions).filter((f) =>
        f.tiers.includes("enterprise")
      );
      expect(enterpriseFeatures.length).toBeGreaterThan(0);
    });

    it("should have enterprise features >= professional features", () => {
      const professionalFeatures = Object.values(featureDescriptions).filter((f) =>
        f.tiers.includes("professional")
      );
      const enterpriseFeatures = Object.values(featureDescriptions).filter((f) =>
        f.tiers.includes("enterprise")
      );
      expect(enterpriseFeatures.length).toBeGreaterThanOrEqual(professionalFeatures.length);
    });

    it("should have professional features >= starter features", () => {
      const starterFeatures = Object.values(featureDescriptions).filter((f) =>
        f.tiers.includes("starter")
      );
      const professionalFeatures = Object.values(featureDescriptions).filter((f) =>
        f.tiers.includes("professional")
      );
      expect(professionalFeatures.length).toBeGreaterThanOrEqual(starterFeatures.length);
    });
  });

  describe("getFeatureDescription", () => {
    it("should return correct feature description", () => {
      const desc = getFeatureDescription("whatsapp_chatbot");
      expect(desc).toBeDefined();
      expect(desc.name).toBe("WhatsApp Chatbot");
      expect(desc.tiers).toContain("starter");
    });

    it("should work for all features", () => {
      Object.keys(featureDescriptions).forEach((key) => {
        const desc = getFeatureDescription(key as keyof typeof featureDescriptions);
        expect(desc).toBeDefined();
        expect(desc.name).toBeTruthy();
        expect(desc.description).toBeTruthy();
      });
    });
  });

  describe("getAllFeatures", () => {
    it("should return array of all features", () => {
      const features = getAllFeatures();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
    });

    it("should include id property for each feature", () => {
      const features = getAllFeatures();
      features.forEach((feature) => {
        expect(feature).toHaveProperty("id");
        expect(feature.id).toBeTruthy();
      });
    });

    it("should have correct count", () => {
      const features = getAllFeatures();
      const descCount = Object.keys(featureDescriptions).length;
      expect(features.length).toBe(descCount);
    });
  });

  describe("getFeaturesByTier", () => {
    it("should return features for starter tier", () => {
      const starterFeatures = getFeaturesByTier("starter");
      expect(Array.isArray(starterFeatures)).toBe(true);
      expect(starterFeatures.length).toBeGreaterThan(0);
      starterFeatures.forEach((feature) => {
        expect(feature.tiers).toContain("starter");
      });
    });

    it("should return features for professional tier", () => {
      const professionalFeatures = getFeaturesByTier("professional");
      expect(Array.isArray(professionalFeatures)).toBe(true);
      expect(professionalFeatures.length).toBeGreaterThan(0);
      professionalFeatures.forEach((feature) => {
        expect(feature.tiers).toContain("professional");
      });
    });

    it("should return features for enterprise tier", () => {
      const enterpriseFeatures = getFeaturesByTier("enterprise");
      expect(Array.isArray(enterpriseFeatures)).toBe(true);
      expect(enterpriseFeatures.length).toBeGreaterThan(0);
      enterpriseFeatures.forEach((feature) => {
        expect(feature.tiers).toContain("enterprise");
      });
    });

    it("should have correct tier progression", () => {
      const starter = getFeaturesByTier("starter");
      const professional = getFeaturesByTier("professional");
      const enterprise = getFeaturesByTier("enterprise");

      expect(professional.length).toBeGreaterThanOrEqual(starter.length);
      expect(enterprise.length).toBeGreaterThanOrEqual(professional.length);
    });

    it("should include all starter features in professional", () => {
      const starter = getFeaturesByTier("starter");
      const professional = getFeaturesByTier("professional");

      starter.forEach((starterFeature) => {
        const found = professional.find((pf) => pf.id === starterFeature.id);
        expect(found).toBeDefined();
      });
    });

    it("should include all professional features in enterprise", () => {
      const professional = getFeaturesByTier("professional");
      const enterprise = getFeaturesByTier("enterprise");

      professional.forEach((profFeature) => {
        const found = enterprise.find((ef) => ef.id === profFeature.id);
        expect(found).toBeDefined();
      });
    });
  });

  describe("Feature Specific Tests", () => {
    it("API access should be enterprise only", () => {
      const apiAccess = getFeatureDescription("api_access");
      expect(apiAccess.tiers).toEqual(["enterprise"]);
    });

    it("WhatsApp chatbot should be in all tiers", () => {
      const whatsapp = getFeatureDescription("whatsapp_chatbot");
      expect(whatsapp.tiers).toContain("starter");
      expect(whatsapp.tiers).toContain("professional");
      expect(whatsapp.tiers).toContain("enterprise");
    });

    it("Advanced analytics should be professional+", () => {
      const analytics = getFeatureDescription("advanced_analytics");
      expect(analytics.tiers).not.toContain("starter");
      expect(analytics.tiers).toContain("professional");
      expect(analytics.tiers).toContain("enterprise");
    });

    it("Webhook support should be professional+", () => {
      const webhooks = getFeatureDescription("webhook_support");
      expect(webhooks.tiers).not.toContain("starter");
      expect(webhooks.tiers).toContain("professional");
      expect(webhooks.tiers).toContain("enterprise");
    });

    it("Phone support should be enterprise only", () => {
      const phone = getFeatureDescription("phone_support");
      expect(phone.tiers).toEqual(["enterprise"]);
    });
  });

  describe("Tooltip Content Quality", () => {
    it("should have descriptions longer than feature names", () => {
      Object.values(featureDescriptions).forEach((feature) => {
        expect(feature.description.length).toBeGreaterThan(feature.name.length);
      });
    });

    it("should have descriptive content (not just repeating name)", () => {
      Object.values(featureDescriptions).forEach((feature) => {
        const descLower = feature.description.toLowerCase();
        const nameLower = feature.name.toLowerCase();
        // Description should add value beyond just the name
        expect(feature.description.length).toBeGreaterThan(feature.name.length + 10);
      });
    });

    it("should have valid icon names", () => {
      const validIcons = [
        "MessageCircle",
        "Mail",
        "Users",
        "BarChart3",
        "TrendingUp",
        "Zap",
        "Package",
        "Headphones",
        "Code",
        "Workflow",
        "Database",
        "Phone",
        "User",
        "Upload",
        "Star",
        "FileText",
        "Palette",
        "Lock",
        "MapPin",
      ];

      Object.values(featureDescriptions).forEach((feature) => {
        expect(validIcons).toContain(feature.icon);
      });
    });
  });
});
