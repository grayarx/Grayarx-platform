import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import { emailSequences, emailTemplates, emailCampaignLogs } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const emailSequencesRouter = router({
  // Create new email sequence
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        triggerType: z.enum(["new_lead", "inactive_lead", "test_drive_completed", "inquiry_received"]),
        templates: z.array(
          z.object({
            stepNumber: z.number(),
            subject: z.string(),
            bodyHtml: z.string(),
            delayHours: z.number(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .insert(emailSequences)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          name: input.name,
          description: input.description || null,
          triggerType: input.triggerType,
          status: "draft",
        } as any);

      const sequenceId = (result as any)[0]?.insertId || 1;

      // Create templates if provided
      if (input.templates && input.templates.length > 0) {
        await db.insert(emailTemplates).values(
          input.templates.map((t) => ({
            sequenceId,
            stepNumber: t.stepNumber,
            subject: t.subject,
            bodyHtml: t.bodyHtml,
            delayHours: t.delayHours,
          }))
        );
      }

      return { id: sequenceId, ...input };
    }),

  // List sequences for dealership
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sequences = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.dealershipId, ctx.user?.dealershipId || 0))
      .orderBy(desc(emailSequences.createdAt));

    return sequences;
  }),

  // Get sequence details
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sequence = await db
        .select()
        .from(emailSequences)
        .where(
          and(
            eq(emailSequences.id, input.id),
            eq(emailSequences.dealershipId, ctx.user?.dealershipId || 0)
          )
        )
        .limit(1);

      if (!sequence || sequence.length === 0) {
        throw new Error("Sequence not found");
      }

      const templates = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.sequenceId, input.id))
        .orderBy(emailTemplates.stepNumber);

      return { ...sequence[0], templates };
    }),

  // Update sequence
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "active", "paused"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(emailSequences)
        .set({
          name: input.name,
          description: input.description,
          status: input.status,
        })
        .where(
          and(
            eq(emailSequences.id, input.id),
            eq(emailSequences.dealershipId, ctx.user?.dealershipId || 0)
          )
        );

      return { success: true };
    }),

  // Activate sequence
  activate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(emailSequences)
        .set({ status: "active" })
        .where(
          and(
            eq(emailSequences.id, input.id),
            eq(emailSequences.dealershipId, ctx.user?.dealershipId || 0)
          )
        );

      return { success: true };
    }),

  // Pause sequence
  pause: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(emailSequences)
        .set({ status: "paused" })
        .where(
          and(
            eq(emailSequences.id, input.id),
            eq(emailSequences.dealershipId, ctx.user?.dealershipId || 0)
          )
        );

      return { success: true };
    }),

  // Delete sequence
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete templates first
      await db.delete(emailTemplates).where(eq(emailTemplates.sequenceId, input.id));

      // Delete sequence
      await db
        .delete(emailSequences)
        .where(
          and(
            eq(emailSequences.id, input.id),
            eq(emailSequences.dealershipId, ctx.user?.dealershipId || 0)
          )
        );

      return { success: true };
    }),

  // Get campaign metrics
  getMetrics: protectedProcedure
    .input(
      z.object({
        sequenceId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db
        .select()
        .from(emailCampaignLogs)
        .where(eq(emailCampaignLogs.templateId, input.sequenceId));

      const totalSent = logs.length;
      const opened = logs.filter((l) => l.openedAt).length;
      const clicked = logs.filter((l) => l.clickedAt).length;
      const bounced = logs.filter((l) => l.bouncedAt).length;

      return {
        totalSent,
        openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
        bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
        conversionRate: totalSent > 0 ? ((clicked - bounced) / totalSent) * 100 : 0,
      };
    }),
});
