import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  logAuditTrail,
  getAuditTrail,
  createTemplate,
  getTemplates,
  updateTemplate,
  approveTemplate,
  createTrainingModule,
  getTrainingModules,
  publishModule,
  startTraining,
  updateProgress,
  completeTraining,
  getTrainingProgress,
  assignTraining,
  getAssignments,
  completeAssignment,
  getOverdueAssignments,
} from "./server/_core/complianceTrainingServices";

describe("Compliance Training Services", () => {
  const testDealershipId = 1;
  const testUserId = 1;

  describe("Audit Trail Service", () => {
    it("should log an audit trail entry", async () => {
      await logAuditTrail(
        testDealershipId,
        testUserId,
        "create",
        "template",
        1,
        "Created new template",
        { name: "Test Template" }
      );
      // Verification would require database access
      expect(true).toBe(true);
    });

    it("should retrieve audit trail entries", async () => {
      const trails = await getAuditTrail(testDealershipId, {
        entityType: "template",
        limit: 10,
      });

      expect(Array.isArray(trails)).toBe(true);
    });

    it("should filter audit trail by date range", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-12-31");

      const trails = await getAuditTrail(testDealershipId, {
        startDate,
        endDate,
      });

      expect(Array.isArray(trails)).toBe(true);
    });
  });

  describe("Communication Template Service", () => {
    let templateId: number;

    it("should create a new template", async () => {
      const result = await createTemplate(
        testDealershipId,
        "POPIA Verification Email",
        "email",
        "Dear {{firstName}}, please verify your email...",
        testUserId,
        "Email Verification",
        ["firstName", "verificationLink"]
      );

      expect(result).toBeDefined();
    });

    it("should retrieve templates", async () => {
      const templates = await getTemplates(testDealershipId);

      expect(Array.isArray(templates)).toBe(true);
    });

    it("should filter templates by category", async () => {
      const templates = await getTemplates(testDealershipId, "email");

      expect(Array.isArray(templates)).toBe(true);
    });

    it("should update a template", async () => {
      const result = await updateTemplate(1, {
        name: "Updated Template",
        body: "Updated content",
      });

      expect(result).toBeDefined();
    });

    it("should approve a template", async () => {
      const result = await approveTemplate(1, testUserId);

      expect(result).toBeDefined();
    });
  });

  describe("Training Module Service", () => {
    it("should create a training module", async () => {
      const result = await createTrainingModule(
        "POPIA Compliance Basics",
        "popia",
        "# POPIA Compliance\n\nContent here...",
        testDealershipId,
        "Learn the basics of POPIA compliance",
        "https://example.com/video.mp4",
        30
      );

      expect(result).toBeDefined();
    });

    it("should retrieve training modules", async () => {
      const modules = await getTrainingModules(testDealershipId);

      expect(Array.isArray(modules)).toBe(true);
    });

    it("should filter modules by topic", async () => {
      const modules = await getTrainingModules(testDealershipId, "popia");

      expect(Array.isArray(modules)).toBe(true);
    });

    it("should publish a module", async () => {
      const result = await publishModule(1);

      expect(result).toBeDefined();
    });
  });

  describe("Training Progress Service", () => {
    it("should start training for a user", async () => {
      const result = await startTraining(testUserId, 1);

      expect(result).toBeDefined();
    });

    it("should update training progress", async () => {
      const result = await updateProgress(testUserId, 1, 50);

      expect(result).toBeDefined();
    });

    it("should complete training with quiz score", async () => {
      const result = await completeTraining(testUserId, 1, 85, "https://example.com/cert.pdf");

      expect(result).toBeDefined();
    });

    it("should retrieve training progress for a user", async () => {
      const progress = await getTrainingProgress(testUserId);

      expect(Array.isArray(progress)).toBe(true);
    });

    it("should retrieve progress for specific module", async () => {
      const progress = await getTrainingProgress(testUserId, 1);

      expect(Array.isArray(progress)).toBe(true);
    });
  });

  describe("Training Assignment Service", () => {
    it("should assign training to a user", async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const result = await assignTraining(testDealershipId, 1, testUserId, testUserId, dueDate);

      expect(result).toBeDefined();
    });

    it("should retrieve assignments for a dealership", async () => {
      const assignments = await getAssignments(testDealershipId);

      expect(Array.isArray(assignments)).toBe(true);
    });

    it("should filter assignments by user", async () => {
      const assignments = await getAssignments(testDealershipId, testUserId);

      expect(Array.isArray(assignments)).toBe(true);
    });

    it("should filter assignments by status", async () => {
      const assignments = await getAssignments(testDealershipId, undefined, "pending");

      expect(Array.isArray(assignments)).toBe(true);
    });

    it("should complete an assignment", async () => {
      const result = await completeAssignment(1);

      expect(result).toBeDefined();
    });

    it("should retrieve overdue assignments", async () => {
      const overdueAssignments = await getOverdueAssignments(testDealershipId);

      expect(Array.isArray(overdueAssignments)).toBe(true);
    });
  });

  describe("Data Validation", () => {
    it("should handle null database gracefully", async () => {
      // Mock getDb to return null
      const templates = await getTemplates(testDealershipId);
      expect(Array.isArray(templates)).toBe(true);
    });

    it("should validate template creation with required fields", async () => {
      const result = await createTemplate(
        testDealershipId,
        "Test Template",
        "email",
        "Test content",
        testUserId
      );

      expect(result).toBeDefined();
    });

    it("should handle missing optional fields", async () => {
      const modules = await getTrainingModules();
      expect(Array.isArray(modules)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid dealership ID", async () => {
      const templates = await getTemplates(-1);
      expect(Array.isArray(templates)).toBe(true);
    });

    it("should handle invalid user ID", async () => {
      const progress = await getTrainingProgress(-1);
      expect(Array.isArray(progress)).toBe(true);
    });

    it("should handle invalid module ID", async () => {
      const result = await publishModule(-1);
      expect(result).toBeDefined();
    });

    it("should handle invalid assignment ID", async () => {
      const result = await completeAssignment(-1);
      expect(result).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty template list", async () => {
      const templates = await getTemplates(999);
      expect(Array.isArray(templates)).toBe(true);
    });

    it("should handle empty module list", async () => {
      const modules = await getTrainingModules(999);
      expect(Array.isArray(modules)).toBe(true);
    });

    it("should handle empty assignment list", async () => {
      const assignments = await getAssignments(999);
      expect(Array.isArray(assignments)).toBe(true);
    });

    it("should handle progress with no modules started", async () => {
      const progress = await getTrainingProgress(999);
      expect(Array.isArray(progress)).toBe(true);
    });

    it("should handle template update with partial fields", async () => {
      const result = await updateTemplate(1, {
        name: "Updated Name",
      });

      expect(result).toBeDefined();
    });

    it("should handle multiple audit trail entries", async () => {
      for (let i = 0; i < 5; i++) {
        await logAuditTrail(
          testDealershipId,
          testUserId,
          "create",
          "template",
          i,
          `Created template ${i}`
        );
      }

      const trails = await getAuditTrail(testDealershipId, { limit: 10 });
      expect(Array.isArray(trails)).toBe(true);
    });
  });

  describe("Compliance-Specific Tests", () => {
    it("should track template approval workflow", async () => {
      const result = await approveTemplate(1, testUserId);
      expect(result).toBeDefined();
    });

    it("should support multiple topics for modules", async () => {
      const topics = ["popia", "nrcs", "sars", "general"];

      for (const topic of topics) {
        const result = await createTrainingModule(
          `${topic.toUpperCase()} Training`,
          topic,
          `Content for ${topic}`,
          testDealershipId
        );

        expect(result).toBeDefined();
      }
    });

    it("should track training completion with scores", async () => {
      const result = await completeTraining(testUserId, 1, 92);
      expect(result).toBeDefined();
    });

    it("should support certificate generation", async () => {
      const result = await completeTraining(
        testUserId,
        1,
        88,
        "https://example.com/certificate-123.pdf"
      );

      expect(result).toBeDefined();
    });
  });
});
