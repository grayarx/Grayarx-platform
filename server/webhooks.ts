import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { getDb } from "./db";
import {
  webhooks,
  webhookEvents,
  webhookLogs,
  type Webhook,
  type InsertWebhook,
  type WebhookEvent,
  type WebhookLog,
} from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Generate a random webhook secret for HMAC signing
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Sign webhook payload with HMAC-SHA256
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Webhook router — manage webhooks and view delivery logs
 */
export const webhookRouter = router({
  /**
   * List all webhooks for the current dealership
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.dealershipId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not associated with a dealership",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.dealershipId, ctx.user.dealershipId));

    return userWebhooks;
  }),

  /**
   * Create a new webhook
   */
  create: protectedProcedure
    .input(
      z.object({
        url: z.string().url("Invalid webhook URL"),
        events: z.array(
          z.enum([
            "lead.created",
            "lead.updated",
            "booking.created",
            "booking.updated",
            "vehicle.created",
            "vehicle.updated",
            "vehicle.deleted",
          ])
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not associated with a dealership",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const secret = generateWebhookSecret();

      const newWebhook = await db.insert(webhooks).values({
        dealershipId: ctx.user.dealershipId,
        url: input.url,
        events: JSON.stringify(input.events),
        secret,
        active: 1,
      });

      return {
        id: newWebhook[0],
        message: "Webhook created successfully",
        secret: "Save this secret securely. You'll need it to verify webhook signatures.",
      };
    }),

  /**
   * Update webhook settings
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        url: z.string().url().optional(),
        events: z
          .array(
            z.enum([
              "lead.created",
              "lead.updated",
              "booking.created",
              "booking.updated",
              "vehicle.created",
              "vehicle.updated",
              "vehicle.deleted",
            ])
          )
          .optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not associated with a dealership",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify ownership
      const webhook = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.dealershipId, ctx.user.dealershipId)
          )
        );

      if (!webhook.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook not found",
        });
      }

      const updateData: any = {};
      if (input.url) updateData.url = input.url;
      if (input.events) updateData.events = JSON.stringify(input.events);
      if (input.active !== undefined) updateData.active = input.active ? 1 : 0;

      await db
        .update(webhooks)
        .set(updateData)
        .where(eq(webhooks.id, input.id));

      return { message: "Webhook updated successfully" };
    }),

  /**
   * Delete a webhook
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not associated with a dealership",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify ownership
      const webhook = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.dealershipId, ctx.user.dealershipId)
          )
        );

      if (!webhook.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook not found",
        });
      }

      await db.delete(webhooks).where(eq(webhooks.id, input.id));

      return { message: "Webhook deleted successfully" };
    }),

  /**
   * Get webhook logs (delivery history)
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        webhookId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not associated with a dealership",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify webhook ownership
      const webhook = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.id, input.webhookId),
            eq(webhooks.dealershipId, ctx.user.dealershipId)
          )
        );

      if (!webhook.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook not found",
        });
      }

      const logs = await db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.webhookId, input.webhookId))
        .orderBy((t: any) => [desc(t.createdAt)])
        .limit(input.limit)
        .offset(input.offset);

      return logs;
    }),

  /**
   * Test webhook by sending a test event
   */
  test: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not associated with a dealership",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify ownership
      const webhook = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.dealershipId, ctx.user.dealershipId)
          )
        );

      if (!webhook.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook not found",
        });
      }

      const testPayload = {
        event: "webhook.test",
        timestamp: new Date().toISOString(),
        data: {
          message: "This is a test webhook event",
          dealershipId: ctx.user.dealershipId,
        },
      };

      try {
        const payloadString = JSON.stringify(testPayload);
        const signature = signWebhookPayload(payloadString, webhook[0].secret);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(webhook[0].url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-ID": webhook[0].id.toString(),
          },
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseBody = await response.text();

        // Log the test attempt
        await db.insert(webhookLogs).values({
          webhookId: webhook[0].id,
          webhookEventId: 0, // Test event
          attempt: 1,
          statusCode: response.status,
          responseBody,
          duration: 0,
        });

        return {
          success: response.ok,
          statusCode: response.status,
          message: response.ok
            ? "Test webhook sent successfully"
            : `Webhook returned status ${response.status}`,
        };
      } catch (error: any) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Log the failed attempt
        await db.insert(webhookLogs).values({
          webhookId: webhook[0].id,
          webhookEventId: 0,
          attempt: 1,
          statusCode: 0,
          errorMessage,
          duration: 0,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send test webhook: ${errorMessage}`,
        });
      }
    }),
});
