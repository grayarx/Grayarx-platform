import { z } from "zod";
import { protectedProcedure, router, publicProcedure } from "./trpc";
import { getDb } from "../db";
import { landingPages, landingPageSections, landingPageConversions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const landingPagesRouter = router({
  // Create new landing page
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        headline: z.string().min(1),
        subheadline: z.string().optional(),
        ctaText: z.string().optional(),
        templateType: z.enum(["lead_magnet", "demo_request", "vehicle_showcase"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .insert(landingPages)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          slug: `${input.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          title: input.title,
          headline: input.headline,
          subheadline: input.subheadline || null,
          ctaText: input.ctaText || "Get Started",
          templateType: input.templateType,
          publishedAt: null,
        } as any);

      const pageId = (result as any)[0]?.insertId || 1;
      return { id: pageId, ...input };
    }),

  // List landing pages
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const pages = await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.dealershipId, ctx.user?.dealershipId || 0))
      .orderBy(desc(landingPages.createdAt));

    return pages;
  }),

  // Get landing page details
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const page = await db
        .select()
        .from(landingPages)
        .where(
          and(
            eq(landingPages.id, input.id),
            eq(landingPages.dealershipId, ctx.user?.dealershipId || 0)
          )
        )
        .limit(1);

      if (!page || page.length === 0) {
        throw new Error("Landing page not found");
      }

      const sections = await db
        .select()
        .from(landingPageSections)
        .where(eq(landingPageSections.pageId, input.id))
        .orderBy(landingPageSections.order);

      return { ...page[0], sections };
    }),

  // Get public landing page
  getPublic: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const page = await db
        .select()
        .from(landingPages)
        .where(eq(landingPages.slug, input.slug))
        .limit(1);

      if (!page || page.length === 0) {
        throw new Error("Landing page not found");
      }

      const sections = await db
        .select()
        .from(landingPageSections)
        .where(eq(landingPageSections.pageId, page[0].id))
        .orderBy(landingPageSections.order);

      return { ...page[0], sections };
    }),

  // Publish landing page
  publish: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(landingPages)
        .set({ publishedAt: new Date() })
        .where(
          and(
            eq(landingPages.id, input.id),
            eq(landingPages.dealershipId, ctx.user?.dealershipId || 0)
          )
        );

      return { success: true };
    }),

  // Update landing page
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        headline: z.string().optional(),
        subheadline: z.string().optional(),
        ctaText: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(landingPages)
        .set({
          title: input.title,
          headline: input.headline,
          subheadline: input.subheadline,
          ctaText: input.ctaText,
        })
        .where(
          and(
            eq(landingPages.id, input.id),
            eq(landingPages.dealershipId, ctx.user?.dealershipId || 0)
          )
        );

      return { success: true };
    }),

  // Track conversion
  trackConversion: publicProcedure
    .input(
      z.object({
        pageId: z.number(),
        visitorId: z.string(),
        actionType: z.enum(["view", "click", "form_submit", "call"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .insert(landingPageConversions)
        .values({
          pageId: input.pageId,
          visitorId: input.visitorId,
          actionType: input.actionType,
          convertedAt: new Date(),
        } as any);

      return { success: true };
    }),

  // Get metrics
  getMetrics: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conversions = await db
        .select()
        .from(landingPageConversions)
        .where(eq(landingPageConversions.pageId, input.id));

      const views = conversions.filter((c) => c.actionType === "view").length;
      const clicks = conversions.filter((c) => c.actionType === "click").length;
      const submissions = conversions.filter((c) => c.actionType === "form_submit").length;
      const calls = conversions.filter((c) => c.actionType === "call").length;

      return {
        totalViews: views,
        totalClicks: clicks,
        totalSubmissions: submissions,
        totalCalls: calls,
        conversionRate: views > 0 ? ((submissions + calls) / views) * 100 : 0,
        clickThroughRate: views > 0 ? (clicks / views) * 100 : 0,
      };
    }),

  // Delete landing page
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete conversions first
      await db.delete(landingPageConversions).where(eq(landingPageConversions.pageId, input.id));

      // Delete sections
      await db.delete(landingPageSections).where(eq(landingPageSections.pageId, input.id));

      // Delete page
      await db
        .delete(landingPages)
        .where(
          and(
            eq(landingPages.id, input.id),
            eq(landingPages.dealershipId, ctx.user?.dealershipId || 0)
          )
        );

      return { success: true };
    }),
});
