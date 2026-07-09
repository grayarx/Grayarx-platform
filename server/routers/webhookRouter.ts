/**
 * Webhook Integration Router
 * Handles Slack, PagerDuty, and custom webhook integrations for security alerts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { webhookIntegrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface WebhookConfig {
  id: string;
  type: "slack" | "pagerduty" | "custom";
  url: string;
  apiKey?: string;
  channel?: string;
  enabled: boolean;
  createdAt: Date;
}

interface AlertPayload {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  userId?: string;
  ipAddress?: string;
  timestamp: Date;
  actionsTaken?: string[];
}

/**
 * Send alert to Slack webhook
 */
async function sendSlackAlert(webhookUrl: string, alert: AlertPayload): Promise<boolean> {
  try {
    const color = {
      critical: "#FF0000",
      high: "#FF6600",
      medium: "#FFAA00",
      low: "#0099FF",
    }[alert.severity];

    const payload = {
      attachments: [
        {
          color,
          title: `🚨 ${alert.title}`,
          text: alert.description,
          fields: [
            {
              title: "Severity",
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: "Timestamp",
              value: alert.timestamp.toISOString(),
              short: true,
            },
            ...(alert.userId
              ? [
                  {
                    title: "User ID",
                    value: alert.userId,
                    short: true,
                  },
                ]
              : []),
            ...(alert.ipAddress
              ? [
                  {
                    title: "IP Address",
                    value: alert.ipAddress,
                    short: true,
                  },
                ]
              : []),
            ...(alert.actionsTaken && alert.actionsTaken.length > 0
              ? [
                  {
                    title: "Actions Taken",
                    value: alert.actionsTaken.join(", "),
                    short: false,
                  },
                ]
              : []),
          ],
          footer: "GrayArx Security Agent",
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send Slack alert:", error);
    return false;
  }
}

/**
 * Send alert to PagerDuty webhook
 */
async function sendPagerDutyAlert(
  webhookUrl: string,
  apiKey: string,
  alert: AlertPayload
): Promise<boolean> {
  try {
    const severity = {
      critical: "critical",
      high: "error",
      medium: "warning",
      low: "info",
    }[alert.severity];

    const payload = {
      routing_key: apiKey,
      event_action: "trigger",
      dedup_key: `${alert.userId}-${alert.timestamp.getTime()}`,
      payload: {
        summary: alert.title,
        severity,
        source: "GrayArx Security Agent",
        custom_details: {
          description: alert.description,
          userId: alert.userId,
          ipAddress: alert.ipAddress,
          actionsTaken: alert.actionsTaken,
        },
      },
    };

    const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token token=${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send PagerDuty alert:", error);
    return false;
  }
}

/**
 * Send alert to custom webhook
 */
async function sendCustomWebhookAlert(webhookUrl: string, alert: AlertPayload): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "security_alert",
        ...alert,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send custom webhook alert:", error);
    return false;
  }
}

export const webhookRouter = router({
  /**
   * Get all webhook integrations for the user
   */
  listIntegrations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const integrations = await db
        .select()
        .from(webhookIntegrations)
        .where(eq(webhookIntegrations.userId, String(ctx.user.id)));

      return integrations.map((i) => ({
        id: i.id,
        type: i.type as "slack" | "pagerduty" | "custom",
        url: i.webhookUrl,
        channel: i.channel,
        enabled: i.enabled === 1,
        createdAt: i.createdAt,
      }));
    } catch (error) {
      console.error("Failed to list webhook integrations:", error);
      return [];
    }
  }),

  /**
   * Add a new webhook integration
   */
  addIntegration: protectedProcedure
    .input(
      z.object({
        type: z.enum(["slack", "pagerduty", "custom"]),
        url: z.string().url(),
        apiKey: z.string().optional(),
        channel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const id = `webhook_${Date.now()}`;

        await db.insert(webhookIntegrations).values({
          id,
          userId: String(ctx.user.id),
          type: input.type,
          webhookUrl: input.url,
          apiKey: input.apiKey || null,
          channel: input.channel || null,
          enabled: 1,
          createdAt: new Date(),
        });

        return {
          success: true,
          id,
          message: `${input.type} webhook added successfully`,
        };
      } catch (error) {
        console.error("Failed to add webhook integration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add webhook integration",
        });
      }
    }),

  /**
   * Update webhook integration
   */
  updateIntegration: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean().optional(),
        url: z.string().url().optional(),
        channel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db
          .update(webhookIntegrations)
          .set({
            webhookUrl: input.url,
            channel: input.channel,
            enabled: input.enabled ? 1 : 0,
          })
          .where(
            eq(webhookIntegrations.id, input.id) && eq(webhookIntegrations.userId, String(ctx.user.id))
          );

        return { success: true, message: "Webhook integration updated" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update webhook integration",
        });
      }
    }),

  /**
   * Delete webhook integration
   */
  deleteIntegration: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db
          .delete(webhookIntegrations)
          .where(
            eq(webhookIntegrations.id, input.id) && eq(webhookIntegrations.userId, String(ctx.user.id))
          );

        return { success: true, message: "Webhook integration deleted" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete webhook integration",
        });
      }
    }),

  /**
   * Test webhook connection
   */
  testWebhook: protectedProcedure
    .input(
      z.object({
        type: z.enum(["slack", "pagerduty", "custom"]),
        url: z.string().url(),
        apiKey: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const testAlert: AlertPayload = {
        severity: "high",
        title: "Test Alert from GrayArx",
        description: "This is a test alert to verify your webhook integration is working correctly.",
        timestamp: new Date(),
        actionsTaken: ["test_sent"],
      };

      let success = false;

      if (input.type === "slack") {
        success = await sendSlackAlert(input.url, testAlert);
      } else if (input.type === "pagerduty" && input.apiKey) {
        success = await sendPagerDutyAlert(input.url, input.apiKey, testAlert);
      } else if (input.type === "custom") {
        success = await sendCustomWebhookAlert(input.url, testAlert);
      }

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send test alert. Please check your webhook URL and credentials.",
        });
      }

      return {
        success: true,
        message: "Test alert sent successfully!",
      };
    }),

  /**
   * Send security alert to all configured webhooks
   */
  sendSecurityAlert: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        severity: z.enum(["critical", "high", "medium", "low"]),
        title: z.string(),
        description: z.string(),
        ipAddress: z.string().optional(),
        actionsTaken: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get all enabled webhooks for this user
        const integrations = await db
          .select()
          .from(webhookIntegrations)
          .where(eq(webhookIntegrations.userId, input.userId) && eq(webhookIntegrations.enabled, 1));

        const alert: AlertPayload = {
          severity: input.severity,
          title: input.title,
          description: input.description,
          userId: input.userId,
          ipAddress: input.ipAddress,
          timestamp: new Date(),
          actionsTaken: input.actionsTaken,
        };

        const results = await Promise.all(
          integrations.map(async (integration) => {
            if (integration.type === "slack") {
              return sendSlackAlert(integration.webhookUrl, alert);
            } else if (integration.type === "pagerduty" && integration.apiKey) {
              return sendPagerDutyAlert(integration.webhookUrl, integration.apiKey, alert);
            } else if (integration.type === "custom") {
              return sendCustomWebhookAlert(integration.webhookUrl, alert);
            }
            return false;
          })
        );

        const successCount = results.filter((r) => r).length;

        return {
          success: successCount > 0,
          sentTo: successCount,
          total: integrations.length,
          message: `Alert sent to ${successCount}/${integrations.length} webhooks`,
        };
      } catch (error) {
        console.error("Failed to send security alert:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send security alert",
        });
      }
    }),
});
