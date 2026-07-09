import { z } from "zod";
import { protectedProcedure, router, publicProcedure } from "./trpc";
import { getDb } from "../db";
import { stripeCustomers, stripeSubscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Stripe integration router for payment processing
 * Handles customer creation, subscription management, and payment webhooks
 */
export const stripeRouter = router({
  // Create or get Stripe customer for dealership
  createCustomer: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if customer already exists
      const existing = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.dealershipId, ctx.user?.dealershipId || 0))
        .limit(1);

      if (existing && existing.length > 0) {
        return {
          customerId: existing[0].stripeCustomerId,
          email: existing[0].email,
        };
      }

      // In production, this would call Stripe API to create customer
      // For now, generate a mock Stripe customer ID
      const mockStripeCustomerId = `cus_${Math.random().toString(36).substr(2, 9)}`;

      await db
        .insert(stripeCustomers)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          stripeCustomerId: mockStripeCustomerId,
          email: input.email,
        } as any);

      return {
        customerId: mockStripeCustomerId,
        email: input.email,
      };
    }),

  // Create subscription for dealership
  createSubscription: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["basic", "professional", "enterprise"]),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // First, ensure customer exists
      const customer = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.dealershipId, ctx.user?.dealershipId || 0))
        .limit(1);

      let customerId: string;
      if (customer && customer.length > 0) {
        customerId = customer[0].stripeCustomerId;
      } else {
        // Create new customer
        const mockStripeCustomerId = `cus_${Math.random().toString(36).substr(2, 9)}`;
        await db
          .insert(stripeCustomers)
          .values({
            dealershipId: ctx.user?.dealershipId || 0,
            stripeCustomerId: mockStripeCustomerId,
            email: input.email,
          } as any);
        customerId = mockStripeCustomerId;
      }

      // Create subscription
      const mockSubscriptionId = `sub_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await db
        .insert(stripeSubscriptions)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          stripeSubscriptionId: mockSubscriptionId,
          planId: input.planId,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        } as any);

      return {
        subscriptionId: mockSubscriptionId,
        planId: input.planId,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
      };
    }),

  // Get subscription details
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subscription = await db
      .select()
      .from(stripeSubscriptions)
      .where(eq(stripeSubscriptions.dealershipId, ctx.user?.dealershipId || 0))
      .limit(1);

    if (!subscription || subscription.length === 0) {
      return null;
    }

    return subscription[0];
  }),

  // Update subscription plan
  updateSubscription: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["basic", "professional", "enterprise"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const subscription = await db
        .select()
        .from(stripeSubscriptions)
        .where(eq(stripeSubscriptions.dealershipId, ctx.user?.dealershipId || 0))
        .limit(1);

      if (!subscription || subscription.length === 0) {
        throw new Error("No subscription found");
      }

      // In production, this would call Stripe API to update subscription
      // For now, just update the local record
      await db
        .update(stripeSubscriptions)
        .set({ planId: input.planId })
        .where(eq(stripeSubscriptions.dealershipId, ctx.user?.dealershipId || 0));

      return { success: true, planId: input.planId };
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subscription = await db
      .select()
      .from(stripeSubscriptions)
      .where(eq(stripeSubscriptions.dealershipId, ctx.user?.dealershipId || 0))
      .limit(1);

    if (!subscription || subscription.length === 0) {
      throw new Error("No subscription found");
    }

    await db
      .update(stripeSubscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
      })
      .where(eq(stripeSubscriptions.dealershipId, ctx.user?.dealershipId || 0));

    return { success: true };
  }),

  // Get pricing plans
  getPricingPlans: publicProcedure.query(async () => {
    return [
      {
        id: "basic",
        name: "Basic",
        price: 99,
        currency: "USD",
        interval: "month",
        features: [
          "Up to 100 leads/month",
          "Basic analytics",
          "Email support",
          "1 user account",
        ],
      },
      {
        id: "professional",
        name: "Professional",
        price: 299,
        currency: "USD",
        interval: "month",
        features: [
          "Up to 500 leads/month",
          "Advanced analytics",
          "Priority support",
          "5 user accounts",
          "Custom branding",
          "API access",
        ],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 999,
        currency: "USD",
        interval: "month",
        features: [
          "Unlimited leads",
          "Custom analytics",
          "24/7 phone support",
          "Unlimited user accounts",
          "White-label solution",
          "Dedicated account manager",
          "Custom integrations",
        ],
      },
    ];
  }),

  // Handle webhook from Stripe
  handleWebhook: publicProcedure
    .input(
      z.object({
        event: z.string(),
        data: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      // In production, this would verify the webhook signature
      // For now, just acknowledge receipt
      console.log(`[Stripe Webhook] ${input.event}:`, input.data);

      // Handle different webhook events
      switch (input.event) {
        case "customer.subscription.updated":
          // Handle subscription update
          break;
        case "customer.subscription.deleted":
          // Handle subscription cancellation
          break;
        case "invoice.payment_succeeded":
          // Handle successful payment
          break;
        case "invoice.payment_failed":
          // Handle failed payment
          break;
      }

      return { received: true };
    }),
});
