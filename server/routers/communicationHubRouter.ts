import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { customers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const communicationHubRouter = router({
  // Get conversation history for customer
  getConversationHistory: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      dealershipId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      // In production, would query from conversations table
      return {
        customerId: input.customerId,
        messages: [
          {
            id: 1,
            type: "sms",
            direction: "outbound",
            content: "Thank you for your interest! We have a great vehicle for you.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: "delivered",
          },
          {
            id: 2,
            type: "sms",
            direction: "inbound",
            content: "Yes, I'd like to schedule a test drive",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: "read",
          },
          {
            id: 3,
            type: "email",
            direction: "outbound",
            content: "Test drive scheduled for Saturday at 10 AM",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            status: "delivered",
          },
        ],
      };
    }),

  // Send message to customer
  sendMessage: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      dealershipId: z.number(),
      type: z.enum(["sms", "email", "call"]),
      content: z.string(),
      scheduledFor: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const customer = await db.select().from(customers).where(eq(customers.id, input.customerId));

      if (!customer[0]) throw new Error("Customer not found");

      // In production, would save to conversations table and send via SMS/email service
      return {
        success: true,
        messageId: Math.random(),
        type: input.type,
        recipient: input.type === "sms" ? customer[0].phone : customer[0].email,
        status: input.scheduledFor ? "scheduled" : "sent",
        scheduledFor: input.scheduledFor,
      };
    }),

  // Get customer communication summary
  getCommunicationSummary: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      dealershipId: z.number(),
    }))
    .query(async ({ input }) => {
      // In production, would aggregate from conversations table
      return {
        customerId: input.customerId,
        totalMessages: 12,
        lastContact: new Date(Date.now() - 2 * 60 * 60 * 1000),
        preferredChannel: "sms",
        channels: {
          sms: { count: 8, lastMessage: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          email: { count: 3, lastMessage: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          call: { count: 1, lastMessage: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        responseRate: 75,
        averageResponseTime: "2 hours",
      };
    }),

  // Get team inbox
  getTeamInbox: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      status: z.enum(["unread", "pending", "resolved", "all"]).default("all"),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      // In production, would query from conversations table
      return {
        total: 24,
        conversations: [
          {
            id: 1,
            customerId: 101,
            customerName: "John Doe",
            lastMessage: "When can I schedule a test drive?",
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            status: "unread",
            type: "sms",
            assignedTo: null,
          },
          {
            id: 2,
            customerId: 102,
            customerName: "Jane Smith",
            lastMessage: "Thanks for the follow-up!",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: "pending",
            type: "email",
            assignedTo: 5,
          },
        ],
      };
    }),

  // Assign conversation to team member
  assignConversation: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      dealershipId: z.number(),
      assignTo: z.number(),
    }))
    .mutation(({ input }) => {
      return {
        success: true,
        conversationId: input.conversationId,
        assignedTo: input.assignTo,
        timestamp: new Date(),
      };
    }),

  // Mark conversation as resolved
  resolveConversation: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      dealershipId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => {
      return {
        success: true,
        conversationId: input.conversationId,
        status: "resolved",
        resolvedAt: new Date(),
      };
    }),

  // Get conversation notes
  getConversationNotes: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      dealershipId: z.number(),
    }))
    .query(async ({ input }) => {
      // In production, would query from notes table
      return {
        customerId: input.customerId,
        notes: [
          {
            id: 1,
            author: "John Sales",
            content: "Customer interested in sedan models",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: 2,
            author: "Jane Manager",
            content: "Budget around R250k, needs financing",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      };
    }),

  // Add note to conversation
  addNote: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      dealershipId: z.number(),
      content: z.string(),
    }))
    .mutation(({ input }) => {
      return {
        success: true,
        noteId: Math.random(),
        customerId: input.customerId,
        content: input.content,
        timestamp: new Date(),
      };
    }),

  // Get communication analytics
  getCommunicationAnalytics: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      days: z.number().default(30),
    }))
    .query(({ input }) => {
      return {
        period: `Last ${input.days} days`,
        totalMessages: 342,
        messagesByType: {
          sms: 210,
          email: 98,
          call: 34,
        },
        averageResponseTime: "1.5 hours",
        responseRate: 82,
        topResponders: [
          { name: "John Sales", messages: 45, responseTime: "45 min" },
          { name: "Jane Manager", messages: 38, responseTime: "1 hour" },
          { name: "Bob Support", messages: 32, responseTime: "2 hours" },
        ],
        customerSentiment: {
          positive: 65,
          neutral: 25,
          negative: 10,
        },
      };
    }),

  // Bulk send messages
  bulkSendMessages: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      customerIds: z.array(z.number()),
      type: z.enum(["sms", "email"]),
      content: z.string(),
      scheduledFor: z.date().optional(),
    }))
    .mutation(({ input }) => {
      return {
        success: true,
        messagesSent: input.customerIds.length,
        type: input.type,
        status: input.scheduledFor ? "scheduled" : "sent",
        timestamp: new Date(),
      };
    }),
});
