import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { alertPreferences, globalAlertSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const alertPreferencesRouter = router({
  // Get user's alert preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) return { preferences: [], settings: null };

      const prefs = await db.select().from(alertPreferences).where(eq(alertPreferences.userId, ctx.user.id));
      const settings = await db.select().from(globalAlertSettings).where(eq(globalAlertSettings.userId, ctx.user.id));

      return { preferences: prefs, settings: settings[0] || null };
    } catch (error) {
      console.error("Failed to get alert preferences:", error);
      return { preferences: [], settings: null };
    }
  }),

  // Create alert preference
  createPreference: protectedProcedure
    .input(z.object({
      ruleName: z.string(),
      eventTypes: z.array(z.string()),
      severity: z.enum(["low", "medium", "high", "critical"]),
      channels: z.array(z.enum(["email", "sms", "webhook", "in_app"])),
      webhookId: z.string().optional(),
      cooldownMinutes: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database not available" };

        await db.insert(alertPreferences).values({
          userId: ctx.user.id,
          ruleName: input.ruleName,
          eventTypes: JSON.stringify(input.eventTypes),
          severity: input.severity,
          channels: JSON.stringify(input.channels),
          webhookId: input.webhookId,
          cooldownMinutes: input.cooldownMinutes || 5,
          createdAt: new Date(),
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to create alert preference:", error);
        return { success: false, error: String(error) };
      }
    }),

  // Update global settings
  updateGlobalSettings: protectedProcedure
    .input(z.object({
      quietHoursStart: z.string().optional(),
      quietHoursEnd: z.string().optional(),
      enableDeduplication: z.boolean().optional(),
      deduplicationWindowMinutes: z.number().optional(),
      autoCreateIncidents: z.boolean().optional(),
      incidentSeverityThreshold: z.enum(["low", "medium", "high", "critical"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database not available" };

        const existing = await db.select().from(globalAlertSettings).where(eq(globalAlertSettings.userId, ctx.user.id));

        if (existing.length === 0) {
          await db.insert(globalAlertSettings).values({
            userId: ctx.user.id,
            quietHoursStart: input.quietHoursStart,
            quietHoursEnd: input.quietHoursEnd,
            enableDeduplication: input.enableDeduplication ? 1 : 0,
            deduplicationWindowMinutes: input.deduplicationWindowMinutes || 10,
            autoCreateIncidents: input.autoCreateIncidents ? 1 : 0,
            incidentSeverityThreshold: input.incidentSeverityThreshold || "high",
            createdAt: new Date(),
          });
        } else {
          await db.update(globalAlertSettings)
            .set({
              quietHoursStart: input.quietHoursStart,
              quietHoursEnd: input.quietHoursEnd,
              enableDeduplication: input.enableDeduplication ? 1 : 0,
              deduplicationWindowMinutes: input.deduplicationWindowMinutes,
              autoCreateIncidents: input.autoCreateIncidents ? 1 : 0,
              incidentSeverityThreshold: input.incidentSeverityThreshold,
            })
            .where(eq(globalAlertSettings.userId, ctx.user.id));
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to update global settings:", error);
        return { success: false, error: String(error) };
      }
    }),

  // Delete alert preference
  deletePreference: protectedProcedure
    .input(z.object({ preferenceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };

        await db.delete(alertPreferences).where(eq(alertPreferences.id, input.preferenceId));
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    }),
});
