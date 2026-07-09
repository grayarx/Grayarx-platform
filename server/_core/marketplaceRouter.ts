import { z } from "zod";
import { getDb } from "../db";
import {
  dealerships,
  vehicles,
  marketplaceSales,
  dealershipPayouts,
  showroomInquiries,
  supportTickets,
  supportAgents,
  onboardingSubmissions,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { invokeLLM } from "./llm";
import { publicProcedure, protectedProcedure, router } from "./trpc";

export const marketplaceRouter = router({
  // ===== DEALERSHIP ONBOARDING =====
  submitOnboarding: publicProcedure
    .input(
      z.object({
        dealershipName: z.string().min(1),
        ownerName: z.string().min(1),
        ownerEmail: z.string().email(),
        ownerPhone: z.string().min(1),
        region: z.string().optional(),
        monthlyVolume: z.number().optional(),
        vehicleTypes: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
        csvUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(onboardingSubmissions).values({
        dealershipName: input.dealershipName,
        ownerName: input.ownerName,
        ownerEmail: input.ownerEmail,
        ownerPhone: input.ownerPhone,
        region: input.region || null,
        monthlyVolume: input.monthlyVolume || null,
        vehicleTypes: input.vehicleTypes ? JSON.stringify(input.vehicleTypes) : null,
        languages: input.languages ? JSON.stringify(input.languages) : null,
        csvUrl: input.csvUrl || null,
        notes: input.notes || null,
        status: "new",
      }) as any;

      return {
        success: true,
        submissionId: result?.insertId ?? result?.[0]?.insertId ?? 0,
        message: "Application submitted successfully. We'll review it within 24 hours.",
      };
    }),

  // ===== SHOWROOM =====
  getShowroomVehicles: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        make: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        bodyType: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions: any[] = [eq(vehicles.status, "available")];

      if (input.search) {
        conditions.push(
          sql`CONCAT(${vehicles.make}, ' ', ${vehicles.model}, ' ', ${vehicles.year}) LIKE ${`%${input.search}%`}`
        );
      }

      if (input.make) {
        conditions.push(eq(vehicles.make, input.make));
      }

      if (input.minPrice) {
        conditions.push(gte(vehicles.price, input.minPrice.toString()));
      }

      if (input.maxPrice) {
        conditions.push(lte(vehicles.price, input.maxPrice.toString()));
      }

      if (input.bodyType) {
        conditions.push(eq(vehicles.bodyType, input.bodyType));
      }

      const results = await db
        .select()
        .from(vehicles)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  getVehicleDetail: publicProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const vehicleList = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, input.vehicleId))
        .limit(1);

      const vehicle = vehicleList.length > 0 ? vehicleList[0] : null;
      if (!vehicle) throw new Error("Vehicle not found");

      // Get dealership info if ownerUserId is set
      let dealership = null;
      if (vehicle.ownerUserId) {
        const dealershipList = await db
          .select()
          .from(dealerships)
          .where(eq(dealerships.id, vehicle.ownerUserId))
          .limit(1);
        dealership = dealershipList.length > 0 ? dealershipList[0] : null;
      }

      return { vehicle, dealership };
    }),

  // ===== SHOWROOM INQUIRIES =====
  createInquiry: publicProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        vehicleId: z.number(),
        customerName: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        inquiryText: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get vehicle details
      const vehicleList = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, input.vehicleId))
        .limit(1);

      const vehicle = vehicleList.length > 0 ? vehicleList[0] : null;
      if (!vehicle) throw new Error("Vehicle not found");

      // Generate AI response
      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a helpful car sales assistant. Respond to customer inquiries about vehicles in a friendly, professional manner. Keep responses concise (2-3 sentences).`,
          },
          {
            role: "user",
            content: `Customer is interested in: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color}, ${vehicle.bodyType})
Price: R${vehicle.price}
Mileage: ${vehicle.km}km
Condition: ${vehicle.condition}

Customer question: ${input.inquiryText}

Respond helpfully and offer to book a test drive.`,
          },
        ],
      });

      const responseText = typeof aiResponse.choices[0]?.message?.content === 'string' 
        ? aiResponse.choices[0].message.content 
        : "Thank you for your interest!";

      // Create inquiry
      const result = await db.insert(showroomInquiries).values({
        dealershipId: input.dealershipId,
        vehicleId: input.vehicleId,
        customerName: input.customerName || null,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone || null,
        inquiryText: input.inquiryText,
        aiResponse: responseText,
        status: "responded",
      }) as any;

      return {
        inquiryId: result?.insertId ?? result?.[0]?.insertId ?? 0,
        aiResponse: responseText,
      };
    }),

  // ===== MARKETPLACE SALES TRACKING =====
  recordSale: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        vehicleId: z.number(),
        customerName: z.string(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        salePrice: z.number(),
        source: z.enum(["showroom", "walk_in", "direct_call"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const grayarxCommission = (input.salePrice * 0.2).toString();
      const dealershipRevenue = (input.salePrice * 0.8).toString();

      const result = await db.insert(marketplaceSales).values({
        dealershipId: input.dealershipId,
        vehicleId: input.vehicleId,
        customerName: input.customerName,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone || null,
        salePrice: input.salePrice.toString(),
        grayarxCommission: grayarxCommission,
        dealershipRevenue: dealershipRevenue,
        source: input.source,
        status: "sold",
        saleDate: new Date(),
      }) as any;

      return {
        saleId: result?.insertId ?? result?.[0]?.insertId ?? 0,
        grayarxCommission: parseFloat(grayarxCommission),
        dealershipRevenue: parseFloat(dealershipRevenue),
      };
    }),

  getDealershipSales: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions: any[] = [eq(marketplaceSales.dealershipId, input.dealershipId)];

      if (input.startDate) {
        conditions.push(gte(marketplaceSales.createdAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(marketplaceSales.createdAt, input.endDate));
      }

      const sales = await db
        .select()
        .from(marketplaceSales)
        .where(and(...conditions))
        .orderBy(desc(marketplaceSales.createdAt));

      const totalSales = sales.length;
      const totalAmount = sales.reduce((sum, s) => sum + parseFloat(s.salePrice.toString()), 0);
      const dealershipTotal = sales.reduce((sum, s) => sum + parseFloat(s.dealershipRevenue.toString()), 0);
      const grayarxTotal = sales.reduce((sum, s) => sum + parseFloat(s.grayarxCommission.toString()), 0);

      return {
        sales,
        metrics: {
          totalSales,
          totalAmount,
          dealershipTotal,
          grayarxTotal,
          averageSalePrice: totalSales > 0 ? totalAmount / totalSales : 0,
        },
      };
    }),

  // ===== SUPPORT AGENT =====
  getSupportAgent: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const agents = await db
        .select()
        .from(supportAgents)
        .where(eq(supportAgents.dealershipId, input.dealershipId))
        .limit(1);

      let agent = agents.length > 0 ? agents[0] : null;

      if (!agent) {
        // Create default agent
        const result = await db.insert(supportAgents).values({
          dealershipId: input.dealershipId,
          name: "Support Agent",
          brandColor: "#d4af37",
          personalityTone: "friendly",
          customGreeting: "Hi! I'm here to help.",
          isActive: 1,
        }) as any;

        const insertId = result?.insertId ?? result?.[0]?.insertId ?? 0;
        const newAgents = await db
          .select()
          .from(supportAgents)
          .where(eq(supportAgents.id, insertId))
          .limit(1);

        agent = newAgents.length > 0 ? newAgents[0] : null;
      }

      return agent;
    }),

  updateSupportAgent: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        name: z.string().optional(),
        avatarUrl: z.string().optional(),
        brandColor: z.string().optional(),
        personalityTone: z.enum(["formal", "casual", "friendly", "urgent"]).optional(),
        customGreeting: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: Record<string, any> = {};
      if (input.name) updates.name = input.name;
      if (input.avatarUrl) updates.avatarUrl = input.avatarUrl;
      if (input.brandColor) updates.brandColor = input.brandColor;
      if (input.personalityTone) updates.personalityTone = input.personalityTone;
      if (input.customGreeting) updates.customGreeting = input.customGreeting;

      await db
        .update(supportAgents)
        .set(updates)
        .where(eq(supportAgents.dealershipId, input.dealershipId));

      return { success: true };
    }),

  createSupportTicket: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        title: z.string().min(1),
        description: z.string().min(1),
        category: z.enum(["bug", "feature_request", "user_error", "performance", "other"]),
        severity: z.enum(["critical", "high", "medium", "low"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(supportTickets).values({
        dealershipId: input.dealershipId,
        title: input.title,
        description: input.description,
        category: input.category,
        severity: input.severity,
        status: "open",
      }) as any;

      return {
        ticketId: result?.insertId ?? result?.[0]?.insertId ?? 0,
        message: "Support ticket created. Our team will review it shortly.",
      };
    }),

  getDealershipTickets: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.dealershipId, input.dealershipId))
        .orderBy(desc(supportTickets.createdAt));

      return tickets;
    }),
});
