import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import { subscriptions, invoices, payments, dealerships } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { TIER_PRICES_ZAR } from "../../shared/subscriptionTiers";

const PRICING_TIERS = {
  starter: TIER_PRICES_ZAR.starter,
  professional: TIER_PRICES_ZAR.professional,
  enterprise: TIER_PRICES_ZAR.enterprise,
};

/**
 * Billing router — manage subscriptions and invoices.
 * Supports manual bank transfer billing (no PayFast for now).
 */
export const billingRouter = router({
  /**
   * Get current subscription for a dealership
   */
  getSubscription: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.dealershipId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not associated with a dealership",
        });
      }

      const sub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.dealershipId, ctx.user.dealershipId))
        .limit(1);

      return sub[0] || null;
    }),

  /**
   * Create or update subscription for a dealership (founder only)
   */
  createSubscription: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        plan: z.enum(["starter", "professional", "enterprise"]),
        monthlyPriceZar: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not initialized",
        });
      }

      // Founder-only check
      if (ctx.user.role !== "founder") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only founders can create subscriptions",
        });
      }

      const monthlyPrice =
        input.monthlyPriceZar || PRICING_TIERS[input.plan] || 0;

      // Check if subscription already exists
      const existing = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.dealershipId, input.dealershipId))
        .limit(1);

      const today = new Date();
      const billingCycleStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const billingCycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const nextRenewalDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(subscriptions)
          .set({
            plan: input.plan,
            monthlyPriceZar: monthlyPrice.toString() as any,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existing[0].id));

        return existing[0];
      }

      // Create new
      const result = await db.insert(subscriptions).values({
        dealershipId: input.dealershipId,
        plan: input.plan,
        monthlyPriceZar: monthlyPrice.toString() as any,
        billingCycleStart: billingCycleStart,
        billingCycleEnd: billingCycleEnd,
        nextRenewalDate: nextRenewalDate,
        status: "active",
        autoRenew: 1,
      });

      return {
        id: result[0],
        dealershipId: input.dealershipId,
        plan: input.plan,
        monthlyPriceZar: monthlyPrice,
        billingCycleStart,
        billingCycleEnd,
        nextRenewalDate,
        status: "active",
        autoRenew: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  /**
   * Generate monthly invoice for a dealership
   */
  generateInvoice: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not initialized",
        });
      }

      // Founder-only check
      if (ctx.user.role !== "founder") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only founders can generate invoices",
        });
      }

      // Get subscription
      const sub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.dealershipId, input.dealershipId))
        .limit(1);

      if (!sub.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No subscription found for this dealership",
        });
      }

      // Get dealership details
      const dealership = await db
        .select()
        .from(dealerships)
        .where(eq(dealerships.id, input.dealershipId))
        .limit(1);

      if (!dealership.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dealership not found",
        });
      }

      // Generate invoice number (GRAYARX-YYYYMM-XXXXX)
      const today = new Date();
      const yearMonth = today.toISOString().slice(0, 7).replace("-", "");
      const invoiceNumber = `GRAYARX-${yearMonth}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30); // Net 30

      const subtotal = parseFloat(sub[0].monthlyPriceZar.toString());
      const vatAmount = 0; // No VAT (not VAT registered)
      const totalAmount = subtotal;

      // Create invoice
      const result = await db.insert(invoices).values({
        dealershipId: input.dealershipId,
        leadId: 0, // Not linked to a specific lead
        invoiceNumber,
        invoiceDate: today,
        dueDate,
        vehicleId: 0, // Subscription invoice, not vehicle-specific
        subtotal: subtotal.toString() as any,
        vatAmount: vatAmount.toString() as any,
        totalAmount: totalAmount.toString() as any,
        status: "sent",
        pdfUrl: null,
      });

      const invoiceId = Number((result as any)?.[0]?.insertId ?? result?.[0]?.insertId ?? 0);
      const pdfUrl = invoiceId ? `/admin/invoices/${invoiceId}/print` : null;
      if (invoiceId && pdfUrl) {
        await db
          .update(invoices)
          .set({ pdfUrl })
          .where(eq(invoices.id, invoiceId));
      }

      return {
        id: invoiceId,
        invoiceNumber,
        dealershipName: dealership[0].name,
        subtotal,
        vatAmount: 0,
        totalAmount: subtotal,
        dueDate,
        status: "sent",
        pdfUrl,
      };
    }),

  /**
   * Record a manual bank transfer payment
   */
  recordBankTransfer: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        amount: z.number(),
        reference: z.string(), // Bank reference/description
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not initialized",
        });
      }

      // Founder-only check
      if (ctx.user.role !== "founder") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only founders can record payments",
        });
      }

      // Get invoice
      const invoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      if (!invoice.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Record payment
      const result = await db.insert(payments).values({
        invoiceId: input.invoiceId,
        amount: input.amount.toString() as any,
        paymentDate: new Date(),
        paymentMethod: "bank_transfer",
        reference: input.reference,
      });

      // Update invoice status if fully paid
      const totalPaid = await db
        .select()
        .from(payments)
        .where(eq(payments.invoiceId, input.invoiceId));

      const totalPaymentAmount = totalPaid.reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0);

      if (totalPaymentAmount >= parseFloat(invoice[0].totalAmount.toString())) {
        await db
          .update(invoices)
          .set({ status: "paid" })
          .where(eq(invoices.id, input.invoiceId));
      }

      return {
        id: result[0],
        invoiceId: input.invoiceId,
        amount: input.amount,
        reference: input.reference,
        paymentDate: new Date(),
        status: "completed",
      };
    }),

  /**
   * List all invoices for a dealership
   */
  listInvoices: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not initialized",
        });
      }

      const dealershipId = input.dealershipId || ctx.user.dealershipId;

      if (!dealershipId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not associated with a dealership",
        });
      }

      return await db
        .select()
        .from(invoices)
        .where(eq(invoices.dealershipId, dealershipId))
        .orderBy(invoices.invoiceDate);
    }),

  /**
   * Get pricing tiers
   */
  getPricingTiers: protectedProcedure.query(async () => {
    return PRICING_TIERS;
  }),

  /** Whether Stripe Checkout is available (STRIPE_SECRET_KEY set). */
  stripeAvailable: protectedProcedure.query(async () => {
    const { isStripeConfigured } = await import("./stripeCheckout");
    return { available: isStripeConfigured() };
  }),

  /**
   * Platform EFT details from env (for Thandi UI / founders).
   * Account number is included — founders already have Railway access.
   */
  platformBankDetails: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "founder" && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Founder/admin only" });
    }
    const { getGrayArxBankDetailsFromEnv } = await import("./grayArxBank");
    return getGrayArxBankDetailsFromEnv();
  }),

  /**
   * Email an invoice to the dealership contact with EFT payment instructions.
   */
  emailInvoicePaymentInstructions: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number().int(),
        toEmail: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "founder" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder/admin only" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not initialized",
        });
      }

      const invoiceRows = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);
      const invoice = invoiceRows[0];
      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      const dealerRows = await db
        .select()
        .from(dealerships)
        .where(eq(dealerships.id, invoice.dealershipId))
        .limit(1);
      const dealership = dealerRows[0];
      if (!dealership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dealership not found" });
      }

      const to =
        input.toEmail?.trim() ||
        dealership.contactEmail?.trim() ||
        null;
      if (!to) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No dealership contact email — pass toEmail",
        });
      }

      const { getGrayArxBankDetailsFromEnv } = await import("./grayArxBank");
      const { buildInvoicePaymentEmail } = await import("./invoicePaymentEmail");
      const { ENV } = await import("./env");
      const bank = getGrayArxBankDetailsFromEnv();
      if (!bank.configured) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "BANK_ACCOUNT_NUMBER not set — add platform EFT vars on Railway first",
        });
      }

      const appUrl = (ENV.appUrl || "https://www.grayarx.com").replace(/\/+$/, "");
      const printUrl = `${appUrl}/admin/invoices/${invoice.id}/print`;
      const due =
        invoice.dueDate instanceof Date
          ? invoice.dueDate.toLocaleDateString("en-ZA")
          : String(invoice.dueDate ?? "");

      const email = buildInvoicePaymentEmail({
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        dueDate: due,
        dealershipName: dealership.name,
        platformBank: bank,
        printUrl,
      });
      if (!email) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not build invoice email",
        });
      }

      const { sendEmailViaResend } = await import("./resendEmailService");
      const result = await sendEmailViaResend({
        to,
        subject: email.subject,
        html: email.html,
        replyTo: "hello@grayarx.com",
      });
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to send invoice email",
        });
      }

      return { ok: true as const, to, messageId: result.id };
    }),

  /**
   * Create a Stripe Checkout session for an existing invoice (ZAR).
   * Falls back gracefully when Stripe is not configured.
   */
  createStripeCheckout: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number().int(),
        successPath: z.string().optional(),
        cancelPath: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "founder" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder/admin only" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });
      }

      const invoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      if (!invoice.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      const inv = invoice[0];
      if (inv.status === "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invoice already paid" });
      }

      const dealer = await db
        .select()
        .from(dealerships)
        .where(eq(dealerships.id, inv.dealershipId))
        .limit(1);

      const origin = (process.env.APP_URL || "https://www.grayarx.com").replace(/\/+$/, "");
      const successPath = input.successPath || `/admin/invoices?paid=${inv.id}`;
      const cancelPath = input.cancelPath || `/admin/invoices?cancelled=${inv.id}`;

      const { createInvoiceCheckoutSession } = await import("./stripeCheckout");
      const result = await createInvoiceCheckoutSession({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        dealershipName: dealer[0]?.name || "Dealership",
        amountZar: parseFloat(inv.totalAmount.toString()),
        customerEmail: dealer[0]?.contactEmail,
        successUrl: `${origin}${successPath.startsWith("/") ? successPath : `/${successPath}`}`,
        cancelUrl: `${origin}${cancelPath.startsWith("/") ? cancelPath : `/${cancelPath}`}`,
      });

      if ("error" in result) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: result.error });
      }

      return result;
    }),

  /**
   * Create Stripe Checkout for a subscription plan (one-time monthly payment link).
   * Bank invoice path remains available via generateInvoice + recordBankTransfer.
   */
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number().int(),
        plan: z.enum(["starter", "professional", "enterprise"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "founder" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder/admin only" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });
      }

      const dealer = await db
        .select()
        .from(dealerships)
        .where(eq(dealerships.id, input.dealershipId))
        .limit(1);

      if (!dealer.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dealership not found" });
      }

      const origin = (process.env.APP_URL || "https://www.grayarx.com").replace(/\/+$/, "");
      const { createSubscriptionCheckoutSession } = await import("./stripeCheckout");
      const result = await createSubscriptionCheckoutSession({
        dealershipId: input.dealershipId,
        plan: input.plan,
        dealershipName: dealer[0].name,
        customerEmail: dealer[0].contactEmail,
        successUrl: `${origin}/admin/invoices?stripe=success&dealershipId=${input.dealershipId}`,
        cancelUrl: `${origin}/admin/invoices?stripe=cancelled`,
      });

      if ("error" in result) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: result.error });
      }

      return result;
    }),
});
