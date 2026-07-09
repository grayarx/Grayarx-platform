import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import { onboardingDrafts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Onboarding Draft Feature", () => {
  let db: any;
  let testSessionId: string;

  beforeAll(async () => {
    db = await getDb();
    testSessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  afterAll(async () => {
    // Clean up test drafts
    if (db) {
      await db
        .delete(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, testSessionId));
    }
  });

  describe("Save Draft", () => {
    it("should create a new draft", async () => {
      const dealershipInfo = {
        dealershipName: "Test Motors",
        ownerName: "John Doe",
        email: "john@test.com",
        phone: "+27123456789",
        address: "123 Main St",
        city: "Johannesburg",
        province: "Gauteng",
        vehicleTypes: ["Sedan", "SUV"],
        estimatedMonthlyLeads: 100,
        languages: ["English"],
      };

      const result = await db.insert(onboardingDrafts).values({
        sessionId: testSessionId,
        step: 1,
        dealershipInfo: JSON.stringify(dealershipInfo),
        vehicleData: null,
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      expect(result).toBeDefined();

      // Verify it was saved
      const saved = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, testSessionId))
        .limit(1);

      expect(saved).toHaveLength(1);
      expect(saved[0].step).toBe(1);
      expect(JSON.parse(saved[0].dealershipInfo).dealershipName).toBe(
        "Test Motors"
      );
    });

    it("should update an existing draft", async () => {
      // First save
      await db.insert(onboardingDrafts).values({
        sessionId: `${testSessionId}_update`,
        step: 1,
        dealershipInfo: JSON.stringify({ dealershipName: "Original" }),
        vehicleData: null,
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      // Update
      const newInfo = { dealershipName: "Updated Motors" };
      await db
        .update(onboardingDrafts)
        .set({
          step: 2,
          dealershipInfo: JSON.stringify(newInfo),
          lastSavedAt: new Date(),
        })
        .where(eq(onboardingDrafts.sessionId, `${testSessionId}_update`));

      // Verify update
      const updated = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, `${testSessionId}_update`))
        .limit(1);

      expect(updated[0].step).toBe(2);
      expect(JSON.parse(updated[0].dealershipInfo).dealershipName).toBe(
        "Updated Motors"
      );

      // Cleanup
      await db
        .delete(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, `${testSessionId}_update`));
    });

    it("should save vehicle data as JSON", async () => {
      const csvContent = "make,model,year,price\nToyota,Corolla,2023,250000";

      await db.insert(onboardingDrafts).values({
        sessionId: `${testSessionId}_vehicles`,
        step: 2,
        dealershipInfo: null,
        vehicleData: JSON.stringify({ csv: csvContent }),
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const saved = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, `${testSessionId}_vehicles`))
        .limit(1);

      expect(saved[0].vehicleData).toBeDefined();
      const parsed = JSON.parse(saved[0].vehicleData);
      expect(parsed.csv).toContain("Toyota,Corolla");

      // Cleanup
      await db
        .delete(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, `${testSessionId}_vehicles`));
    });

    it("should save team members", async () => {
      const teamMembers = [
        { name: "John Doe", email: "john@test.com", role: "owner" },
        { name: "Jane Smith", email: "jane@test.com", role: "manager" },
      ];

      await db.insert(onboardingDrafts).values({
        sessionId: `${testSessionId}_team`,
        step: 3,
        dealershipInfo: null,
        vehicleData: null,
        teamMembers: JSON.stringify(teamMembers),
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const saved = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, `${testSessionId}_team`))
        .limit(1);

      expect(saved[0].teamMembers).toBeDefined();
      const parsed = JSON.parse(saved[0].teamMembers);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].role).toBe("owner");

      // Cleanup
      await db
        .delete(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, `${testSessionId}_team`));
    });
  });

  describe("Load Draft", () => {
    it("should retrieve a saved draft", async () => {
      const dealershipInfo = {
        dealershipName: "Load Test Motors",
        ownerName: "Test User",
        email: "test@example.com",
        phone: "+27987654321",
      };

      const sessionId = `${testSessionId}_load`;
      await db.insert(onboardingDrafts).values({
        sessionId,
        step: 1,
        dealershipInfo: JSON.stringify(dealershipInfo),
        vehicleData: null,
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const loaded = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, sessionId))
        .limit(1);

      expect(loaded).toHaveLength(1);
      expect(loaded[0].sessionId).toBe(sessionId);
      expect(JSON.parse(loaded[0].dealershipInfo).dealershipName).toBe(
        "Load Test Motors"
      );

      // Cleanup
      await db.delete(onboardingDrafts).where(eq(onboardingDrafts.sessionId, sessionId));
    });

    it("should return null for non-existent draft", async () => {
      const nonExistent = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, "nonexistent_session_id"))
        .limit(1);

      expect(nonExistent).toHaveLength(0);
    });

    it("should detect expired drafts", async () => {
      const sessionId = `${testSessionId}_expired`;
      const pastDate = new Date(Date.now() - 1000); // 1 second in the past

      await db.insert(onboardingDrafts).values({
        sessionId,
        step: 1,
        dealershipInfo: null,
        vehicleData: null,
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: pastDate,
        createdAt: new Date(),
      });

      const draft = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, sessionId))
        .limit(1);

      expect(draft).toHaveLength(1);
      expect(new Date(draft[0].expiresAt) < new Date()).toBe(true);

      // Cleanup
      await db.delete(onboardingDrafts).where(eq(onboardingDrafts.sessionId, sessionId));
    });
  });

  describe("Delete Draft", () => {
    it("should delete a draft", async () => {
      const sessionId = `${testSessionId}_delete`;

      // Create
      await db.insert(onboardingDrafts).values({
        sessionId,
        step: 1,
        dealershipInfo: null,
        vehicleData: null,
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      // Verify created
      let drafts = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, sessionId))
        .limit(1);
      expect(drafts).toHaveLength(1);

      // Delete
      await db
        .delete(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, sessionId));

      // Verify deleted
      drafts = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, sessionId))
        .limit(1);
      expect(drafts).toHaveLength(0);
    });
  });

  describe("Draft Lifecycle", () => {
    it("should handle complete draft lifecycle", async () => {
      const sessionId = `${testSessionId}_lifecycle`;

      // Step 1: Create draft
      await db.insert(onboardingDrafts).values({
        sessionId,
        step: 1,
        dealershipInfo: JSON.stringify({
          dealershipName: "Lifecycle Motors",
          ownerName: "Test",
          email: "test@lifecycle.com",
          phone: "+27123456789",
        }),
        vehicleData: null,
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      // Step 2: Update to step 2 with vehicles
      await db
        .update(onboardingDrafts)
        .set({
          step: 2,
          vehicleData: JSON.stringify({ csv: "make,model,year,price" }),
          lastSavedAt: new Date(),
        })
        .where(eq(onboardingDrafts.sessionId, sessionId));

      // Step 3: Update to step 3 with team
      await db
        .update(onboardingDrafts)
        .set({
          step: 3,
          teamMembers: JSON.stringify([
            { name: "John", email: "john@test.com", role: "owner" },
          ]),
          lastSavedAt: new Date(),
        })
        .where(eq(onboardingDrafts.sessionId, sessionId));

      // Verify final state
      const final = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, sessionId))
        .limit(1);

      expect(final[0].step).toBe(3);
      expect(final[0].dealershipInfo).toBeDefined();
      expect(final[0].vehicleData).toBeDefined();
      expect(final[0].teamMembers).toBeDefined();

      // Cleanup
      await db.delete(onboardingDrafts).where(eq(onboardingDrafts.sessionId, sessionId));
    });
  });

  describe("Session Management", () => {
    it("should support multiple concurrent drafts", async () => {
      const session1 = `${testSessionId}_concurrent_1`;
      const session2 = `${testSessionId}_concurrent_2`;

      // Create two drafts
      await db.insert(onboardingDrafts).values({
        sessionId: session1,
        step: 1,
        dealershipInfo: JSON.stringify({ dealershipName: "Motors 1" }),
        vehicleData: null,
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      await db.insert(onboardingDrafts).values({
        sessionId: session2,
        step: 2,
        dealershipInfo: JSON.stringify({ dealershipName: "Motors 2" }),
        vehicleData: null,
        teamMembers: null,
        lastSavedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      // Verify both exist independently
      const draft1 = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, session1))
        .limit(1);
      const draft2 = await db
        .select()
        .from(onboardingDrafts)
        .where(eq(onboardingDrafts.sessionId, session2))
        .limit(1);

      expect(draft1[0].step).toBe(1);
      expect(draft2[0].step).toBe(2);

      // Cleanup
      await db.delete(onboardingDrafts).where(eq(onboardingDrafts.sessionId, session1));
      await db.delete(onboardingDrafts).where(eq(onboardingDrafts.sessionId, session2));
    });
  });
});
