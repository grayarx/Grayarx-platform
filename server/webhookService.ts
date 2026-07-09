import { eq, and, lte, isNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  webhookEvents,
  webhookLogs,
  webhooks,
  type WebhookEvent,
} from "../drizzle/schema";
import { signWebhookPayload } from "./webhooks";

/**
 * Retry intervals (exponential backoff)
 * Attempt 1: immediate
 * Attempt 2: 1 minute
 * Attempt 3: 5 minutes
 * Attempt 4: 15 minutes
 * Attempt 5: 1 hour
 * Attempt 6: 24 hours
 */
const RETRY_INTERVALS_MS = [0, 60000, 300000, 900000, 3600000, 86400000];
const MAX_RETRIES = 6;

/**
 * Create a webhook event to be sent to all relevant webhooks
 */
export async function createWebhookEvent(
  dealershipId: number,
  eventType: string,
  resourceType: string,
  resourceId: number,
  payload: Record<string, any>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(webhookEvents).values({
      dealershipId,
      eventType,
      resourceType,
      resourceId,
      payload: JSON.stringify(payload),
      status: "pending",
      retryCount: 0,
    });
  } catch (error) {
    console.error("[WebhookService] Failed to create webhook event:", error);
  }
}

/**
 * Send a webhook event to all active webhooks that subscribe to it
 */
async function sendWebhookEvent(event: WebhookEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get all active webhooks for this dealership
    const dealershipWebhooks = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.dealershipId, event.dealershipId),
          eq(webhooks.active, 1)
        )
      );

    if (!dealershipWebhooks.length) {
      // No webhooks to send to, mark as delivered
      await db
        .update(webhookEvents)
        .set({ status: "delivered" })
        .where(eq(webhookEvents.id, event.id));
      return;
    }

    // Filter webhooks that subscribe to this event type
    const relevantWebhooks = dealershipWebhooks.filter((w) => {
      const events = JSON.parse(w.events as string);
      return events.includes(event.eventType);
    });

    if (!relevantWebhooks.length) {
      // No webhooks subscribe to this event, mark as delivered
      await db
        .update(webhookEvents)
        .set({ status: "delivered" })
        .where(eq(webhookEvents.id, event.id));
      return;
    }

    // Send to each webhook
    let successCount = 0;
    for (const webhook of relevantWebhooks) {
      const success = await sendToWebhook(webhook, event);
      if (success) successCount++;
    }

    // If all succeeded, mark as delivered
    if (successCount === relevantWebhooks.length) {
      await db
        .update(webhookEvents)
        .set({ status: "delivered" })
        .where(eq(webhookEvents.id, event.id));
    } else if (event.retryCount < MAX_RETRIES) {
      // Schedule retry
      const nextRetryMs = RETRY_INTERVALS_MS[event.retryCount + 1];
      const nextRetryAt = new Date(Date.now() + nextRetryMs);

      await db
        .update(webhookEvents)
        .set({
          status: "retrying",
          retryCount: event.retryCount + 1,
          nextRetryAt,
        })
        .where(eq(webhookEvents.id, event.id));
    } else {
      // Max retries exceeded
      await db
        .update(webhookEvents)
        .set({ status: "failed" })
        .where(eq(webhookEvents.id, event.id));
    }
  } catch (error) {
    console.error("[WebhookService] Error sending webhook event:", error);
  }
}

/**
 * Send webhook to a specific endpoint
 */
async function sendToWebhook(
  webhook: any,
  event: WebhookEvent
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const startTime = Date.now();

  try {
    const payloadString = JSON.stringify({
      event: event.eventType,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      data: JSON.parse(event.payload as string),
      timestamp: new Date().toISOString(),
    });

    const signature = signWebhookPayload(payloadString, webhook.secret);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-ID": webhook.id.toString(),
        "X-Webhook-Event": event.eventType,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    const responseBody = await response.text();

    // Log the attempt
    await db.insert(webhookLogs).values({
      webhookId: webhook.id,
      webhookEventId: event.id,
      attempt: event.retryCount + 1,
      statusCode: response.status,
      responseBody,
      duration,
    });

    // Update webhook's last triggered time
    if (response.ok) {
      await db
        .update(webhooks)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(webhooks.id, webhook.id));
    } else {
      // Increment failure count
      await db
        .update(webhooks)
        .set({ failureCount: webhook.failureCount + 1 })
        .where(eq(webhooks.id, webhook.id));
    }

    return response.ok;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the failed attempt
    await db.insert(webhookLogs).values({
      webhookId: webhook.id,
      webhookEventId: event.id,
      attempt: event.retryCount + 1,
      statusCode: 0,
      errorMessage,
      duration,
    });

    // Increment failure count
    await db
      .update(webhooks)
      .set({ failureCount: webhook.failureCount + 1 })
      .where(eq(webhooks.id, webhook.id));

    return false;
  }
}

/**
 * Process pending webhook events (called by heartbeat job)
 */
export async function processWebhookQueue(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get all pending events that are ready to send
    const pendingEvents = await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.status, "pending"),
          isNull(webhookEvents.nextRetryAt)
        )
      );

    // Get all retrying events that are ready for retry
    const retryingEvents = await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.status, "retrying"),
          lte(webhookEvents.nextRetryAt, new Date())
        )
      );

    const allEvents = [...pendingEvents, ...retryingEvents];

    console.log(
      `[WebhookService] Processing ${allEvents.length} webhook events`
    );

    for (const event of allEvents) {
      await sendWebhookEvent(event);
    }
  } catch (error) {
    console.error("[WebhookService] Error processing webhook queue:", error);
  }
}

/**
 * Get webhook statistics for a dealership
 */
export async function getWebhookStats(dealershipId: number): Promise<{
  totalWebhooks: number;
  activeWebhooks: number;
  totalEvents: number;
  deliveredEvents: number;
  failedEvents: number;
  retryingEvents: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalWebhooks: 0,
      activeWebhooks: 0,
      totalEvents: 0,
      deliveredEvents: 0,
      failedEvents: 0,
      retryingEvents: 0,
    };
  }

  try {
    const allWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.dealershipId, dealershipId));

    const activeWebhooks = allWebhooks.filter((w) => w.active === 1).length;

    const allEvents = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.dealershipId, dealershipId));

    const deliveredEvents = allEvents.filter(
      (e) => e.status === "delivered"
    ).length;
    const failedEvents = allEvents.filter((e) => e.status === "failed").length;
    const retryingEvents = allEvents.filter(
      (e) => e.status === "retrying"
    ).length;

    return {
      totalWebhooks: allWebhooks.length,
      activeWebhooks,
      totalEvents: allEvents.length,
      deliveredEvents,
      failedEvents,
      retryingEvents,
    };
  } catch (error) {
    console.error("[WebhookService] Error getting webhook stats:", error);
    return {
      totalWebhooks: 0,
      activeWebhooks: 0,
      totalEvents: 0,
      deliveredEvents: 0,
      failedEvents: 0,
      retryingEvents: 0,
    };
  }
}
