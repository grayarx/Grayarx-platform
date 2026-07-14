/**
 * WhatsApp Message Queue Processor
 * Handles message delivery with retry logic and exponential backoff
 */

import {
  getPendingWhatsappMessages,
  updateWhatsappQueueStatus,
  incrementWhatsappQueueRetry,
  getWhatsappConversation,
} from "../db";
import { sendWhatsAppMessage } from "./whatsappService";
import { notifyOwner } from "./notification";

interface QueueProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  errors: string[];
}

function maskPhone(phone: string | null | undefined): string {
  const p = (phone ?? "").replace(/\D/g, "");
  if (p.length < 4) return "****";
  return `…${p.slice(-4)}`;
}

/** Page the founder when a WhatsApp outbound message exhausts retries. */
async function alertDeadLetter(opts: {
  queueId: number;
  conversationId: number;
  phone?: string | null;
  dealershipId?: number | null;
  reason: string;
}): Promise<void> {
  try {
    await notifyOwner({
      title: "WhatsApp dead-letter — outbound failed",
      content:
        `Queue #${opts.queueId} moved to dead_letter after max retries.\n` +
        `Dealership: ${opts.dealershipId ?? "unknown"} · Conversation: ${opts.conversationId}\n` +
        `To: ${maskPhone(opts.phone)}\n` +
        `Reason: ${opts.reason.slice(0, 400)}`,
      actionUrl: "/admin/fallback",
    });
  } catch (err) {
    console.warn(
      "[WhatsAppQueue] dead-letter notifyOwner failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Calculate next retry time with exponential backoff
 * Retry schedule: 1s, 5s, 30s, then dead-letter
 */
function getNextRetryTime(retryCount: number): Date {
  const delays = [1000, 5000, 30000]; // milliseconds
  const delay = delays[Math.min(retryCount, delays.length - 1)];
  return new Date(Date.now() + delay);
}

/**
 * Process pending messages in queue
 * Called periodically by heartbeat scheduler
 */
export async function processWhatsAppQueue(): Promise<QueueProcessResult> {
  const result: QueueProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    deadLettered: 0,
    errors: [],
  };

  try {
    // Get pending messages (limit to 100 per batch to avoid overwhelming the API)
    const pendingMessages = await getPendingWhatsappMessages(100);

    if (pendingMessages.length === 0) {
      console.log("[WhatsAppQueue] No pending messages to process");
      return result;
    }

    console.log(`[WhatsAppQueue] Processing ${pendingMessages.length} pending messages`);

    // Process each message
    for (const queueItem of pendingMessages) {
      result.processed++;

      try {
        // Update status to processing
        await updateWhatsappQueueStatus(queueItem.id, "processing");

        // Get conversation details
        const conversation = await getWhatsappConversation(queueItem.conversationId);
        if (!conversation) {
          throw new Error("Conversation not found");
        }

        // Attempt to send message
        const sendResult = await sendWhatsAppMessage({
          phone: queueItem.phoneNumber,
          message: queueItem.messageContent,
          type: "dealership_response",
          dealershipId: conversation.dealershipId.toString(),
        });

        if (sendResult.success) {
          // Message sent successfully
          await updateWhatsappQueueStatus(queueItem.id, "sent");
          result.succeeded++;
          console.log(`[WhatsAppQueue] Message ${queueItem.id} sent successfully`);
        } else {
          // Message failed, check retry count
          if (queueItem.retryCount < queueItem.maxRetries) {
            // Schedule retry
            const nextRetryTime = getNextRetryTime(queueItem.retryCount);
            await incrementWhatsappQueueRetry(queueItem.id, nextRetryTime);
            result.failed++;
            console.warn(
              `[WhatsAppQueue] Message ${queueItem.id} failed, scheduled retry ${queueItem.retryCount + 1}/${queueItem.maxRetries}`
            );
          } else {
            // Max retries exceeded, move to dead-letter queue
            const reason = `Failed after ${queueItem.maxRetries} retries: ${sendResult.error}`;
            await updateWhatsappQueueStatus(queueItem.id, "dead_letter", reason);
            result.deadLettered++;
            console.error(
              `[WhatsAppQueue] Message ${queueItem.id} moved to dead-letter queue: ${sendResult.error}`
            );
            await alertDeadLetter({
              queueId: queueItem.id,
              conversationId: queueItem.conversationId,
              phone: queueItem.phoneNumber,
              dealershipId: conversation.dealershipId,
              reason,
            });
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[WhatsAppQueue] Error processing message ${queueItem.id}:`, errorMsg);

        // Check retry count
        if (queueItem.retryCount < queueItem.maxRetries) {
          const nextRetryTime = getNextRetryTime(queueItem.retryCount);
          await incrementWhatsappQueueRetry(queueItem.id, nextRetryTime);
          result.failed++;
        } else {
          const reason = `Error: ${errorMsg}`;
          await updateWhatsappQueueStatus(queueItem.id, "dead_letter", reason);
          result.deadLettered++;
          let dealershipId: number | null = null;
          try {
            const conv = await getWhatsappConversation(queueItem.conversationId);
            dealershipId = conv?.dealershipId ?? null;
          } catch {
            /* ignore */
          }
          await alertDeadLetter({
            queueId: queueItem.id,
            conversationId: queueItem.conversationId,
            phone: queueItem.phoneNumber,
            dealershipId,
            reason,
          });
        }

        result.errors.push(`Message ${queueItem.id}: ${errorMsg}`);
      }
    }

    console.log(
      `[WhatsAppQueue] Batch complete: ${result.succeeded} succeeded, ${result.failed} scheduled for retry, ${result.deadLettered} dead-lettered`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsAppQueue] Error processing queue:", errorMsg);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  deadLettered: number;
}> {
  try {
    const pending = await getPendingWhatsappMessages(1000);
    return {
      pending: pending.filter((m) => m.status === "pending").length,
      processing: pending.filter((m) => m.status === "processing").length,
      deadLettered: pending.filter((m) => m.status === "dead_letter").length,
    };
  } catch (error) {
    console.error("[WhatsAppQueue] Error getting stats:", error);
    return {
      pending: 0,
      processing: 0,
      deadLettered: 0,
    };
  }
}

/**
 * Retry a dead-lettered message
 * Admin operation to manually retry failed messages
 */
export async function retryDeadLetteredMessage(queueId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Reset message to pending state with 0 retries
    await updateWhatsappQueueStatus(queueId, "pending");
    await incrementWhatsappQueueRetry(queueId, new Date()); // Will be retried immediately

    console.log(`[WhatsAppQueue] Dead-lettered message ${queueId} reset for retry`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[WhatsAppQueue] Error retrying message ${queueId}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}
