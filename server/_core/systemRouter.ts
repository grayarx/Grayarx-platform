import { z } from "zod";
import { notifyOwner } from "./notification";
import { sendTestEmailWithLogo, verifyEmailConfig } from "./emailSender";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import { leads } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  sendTestEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      return await sendTestEmailWithLogo(input.email);
    }),

  verifyEmailConfig: publicProcedure.query(async () => {
    return await verifyEmailConfig();
  }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allLeads = await db.select().from(leads);
    
    const stats = {
      totalLeads: allLeads.length,
      newLeads: allLeads.filter(l => l.status === "new").length,
      qualifiedLeads: allLeads.filter(l => l.status === "qualified").length,
      convertedLeads: allLeads.filter(l => l.status === "converted").length,
      lostLeads: allLeads.filter(l => l.status === "lost").length,
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
    };

    return stats;
  }),

  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const recentLeads = await db
        .select()
        .from(leads)
        .orderBy(desc(leads.createdAt))
        .limit(input.limit);

      return recentLeads.map((lead) => ({
        type: `New lead from ${lead.source || "website"}`,
        description: `${lead.contactName} - ${lead.email}`,
        timestamp: new Date(lead.createdAt).toLocaleString(),
      }));
    }),
});
