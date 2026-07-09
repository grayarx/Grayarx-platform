import { getDb } from "../db";
import { emailSequences, emailTemplates, prospects, leads } from "../../drizzle/schema";
import { eq, and, lt, gte } from "drizzle-orm";
import { notifyOwner } from "./notification";
import { sendCampaignEmail } from "./emailService";

/**
 * Email Sequence Automation - Runs via Heartbeat jobs
 * Sends scheduled emails from active sequences to leads
 */

interface SequenceStep {
  stepNumber: number;
  subject: string;
  bodyHtml: string;
  delayHours: number;
}

interface LeadEmailState {
  leadId: number;
  sequenceId: number;
  lastEmailStep: number;
  lastEmailSentAt: Date;
}

/**
 * Process all active email sequences
 * Called by Heartbeat job every hour
 */
export async function processEmailSequences() {
  const db = await getDb();
  if (!db) {
    console.error("[EmailSequenceAutomation] Database not available");
    return;
  }

  try {
    // Get all active sequences
    const activeSequences = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.status, "active"));

    console.log(`[EmailSequenceAutomation] Processing ${activeSequences.length} active sequences`);

    for (const sequence of activeSequences) {
      await processSequence(db, sequence);
    }

    // Notify owner of completion
    await notifyOwner({
      title: "Email Sequences Processed",
      content: `Processed ${activeSequences.length} active email sequences. Check dashboard for metrics.`,
    });
  } catch (error) {
    console.error("[EmailSequenceAutomation] Error:", error);
    await notifyOwner({
      title: "Email Sequence Processing Failed",
      content: `Error processing email sequences: ${error}`,
    });
  }
}

/**
 * Process a single sequence for all eligible leads
 */
async function processSequence(db: any, sequence: any) {
  try {
    // Get sequence templates ordered by step
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.sequenceId, sequence.id));

    if (templates.length === 0) {
      console.log(`[EmailSequenceAutomation] No templates for sequence ${sequence.id}`);
      return;
    }

    // Get leads for this dealership that haven't completed the sequence
    const leads = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.dealershipId, sequence.dealershipId));

    // For each lead, determine which email to send next
    for (const lead of leads) {
      await sendNextEmailInSequence(db, sequence, templates, lead);
    }

    console.log(
      `[EmailSequenceAutomation] Processed sequence ${sequence.id} for ${leads.length} leads`
    );
  } catch (error) {
    console.error(`[EmailSequenceAutomation] Error processing sequence ${sequence.id}:`, error);
  }
}

/**
 * Send the next email in sequence to a lead
 */
async function sendNextEmailInSequence(db: any, sequence: any, templates: any[], lead: any) {
  try {
    // Get lead's current position in sequence (mock - in production, track in DB)
    const currentStep = 0; // Start from first email
    const nextTemplate = templates.find((t) => t.stepNumber === currentStep + 1);

    if (!nextTemplate) {
      // Sequence complete
      return;
    }

    // Check if enough time has passed since last email
    const delayMs = nextTemplate.delayHours * 60 * 60 * 1000;
    const now = Date.now();
    const lastEmailTime = lead.lastEmailSentAt ? new Date(lead.lastEmailSentAt).getTime() : 0;

    if (now - lastEmailTime < delayMs) {
      // Not enough time has passed yet
      return;
    }

    // Send email (mock implementation)
    const emailResult = await mockSendEmail(
      lead.email,
      nextTemplate.subject,
      nextTemplate.bodyHtml
    );

    if (emailResult.success) {
      console.log(
        `[EmailSequenceAutomation] Sent email step ${nextTemplate.stepNumber} to lead ${lead.id}`
      );

      // Track email sent (would update DB in production)
      // await db.update(leads).set({
      //   lastEmailStep: nextTemplate.stepNumber,
      //   lastEmailSentAt: new Date(),
      // }).where(eq(leads.id, lead.id));
    }
  } catch (error) {
    console.error("[EmailSequenceAutomation] Error sending email:", error);
  }
}

/**
 * Send email with GrayArx branding
 * Uses SendGrid API with proper from address and branding
 */
async function mockSendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const messageId = `grayarx_email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const success = await sendCampaignEmail(to, subject, body);
    if (success) {
      console.log(`[EmailSequenceAutomation] Email sent to ${to}: "${subject}"`);
      return { success: true, messageId };
    } else {
      console.error(`[EmailSequenceAutomation] Failed to send email to ${to}`);
      return { success: false, error: "Email send failed" };
    }
  } catch (error) {
    console.error(`[EmailSequenceAutomation] Error sending email: ${error}`);
    return { success: false, error: String(error) };
  }
}

/**
 * Get sequence metrics for a dealership
 */
export async function getSequenceMetrics(dealershipId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const sequences = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.dealershipId, dealershipId));

    const metrics = {
      totalSequences: sequences.length,
      activeSequences: sequences.filter((s: any) => s.status === "active").length,
      pausedSequences: sequences.filter((s: any) => s.status === "paused").length,
      totalEmailsSent: 0, // Would aggregate from email logs
      averageOpenRate: 0, // Would calculate from email logs
      averageClickRate: 0, // Would calculate from email logs
    };

    return metrics;
  } catch (error) {
    console.error("[EmailSequenceAutomation] Error getting metrics:", error);
    return null;
  }
}

/**
 * Schedule email sequence automation job
 * This is called during server startup
 */
export function scheduleEmailSequenceJobs() {
  // Run every hour
  const intervalId = setInterval(() => {
    console.log("[EmailSequenceAutomation] Running scheduled job...");
    processEmailSequences();
  }, 60 * 60 * 1000); // 1 hour

  // Also run on startup after 5 seconds
  setTimeout(() => {
    console.log("[EmailSequenceAutomation] Running initial job...");
    processEmailSequences();
  }, 5000);

  return intervalId;
}
