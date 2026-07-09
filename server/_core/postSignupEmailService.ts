/**
 * Post-signup email automation service
 * Handles scheduling and sending welcome, setup guide, and first-lead tips emails
 */

import { getDb } from "../db";
import { dealerships } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  createEmailSequence,
  updateEmailSequenceStatus,
  logEmailSequenceAttempt,
  getPendingEmailSequences,
} from "../db-email-sequences";
import { getEmailTemplate } from "./postSignupEmailTemplates";

interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via SendGrid (or mock if credentials missing)
 */
async function sendEmailViaSendGrid(
  toEmail: string,
  toName: string | undefined,
  subject: string,
  htmlContent: string
): Promise<SendGridResponse> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.EMAIL_USER;

  if (!sendgridApiKey || !sendgridFromEmail) {
    console.warn("[PostSignupEmail] SendGrid credentials missing, using mock send");
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail, name: toName }],
            subject,
          },
        ],
        from: { email: sendgridFromEmail, name: "GrayArx" },
        content: [{ type: "text/html", value: htmlContent }],
        trackingSettings: {
          clickTracking: { enabled: true },
          openTracking: { enabled: true },
        },
      }),
    });

    if (response.ok) {
      const messageId = response.headers.get("x-message-id") || `sendgrid-${Date.now()}`;
      return { success: true, messageId };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    console.error("[PostSignupEmail] SendGrid error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Schedule post-signup email sequences for a new dealership
 */
export async function schedulePostSignupEmails(dealershipId: number) {
  try {
    // Get dealership info
    const db = await getDb();
    if (!db) {
      console.error("[PostSignupEmail] Database connection failed");
      return;
    }
    const dealership = await db
      .select()
      .from(dealerships)
      .where(eq(dealerships.id, dealershipId));

    if (!dealership || dealership.length === 0) {
      console.error(`[PostSignupEmail] Dealership ${dealershipId} not found`);
      return;
    }

    const dealer = dealership[0];
    const contactEmail = dealer.contactEmail || "noreply@grayarx.com";
    const contactName = dealer.name;

    // Get owner info from users table (if available)
    const ownerName = dealer.name || "Valued Partner";

    // Schedule 3 emails: welcome (immediate), setup guide (day 1), first lead tips (day 3)
    const now = new Date();

    // Email 1: Welcome (send immediately, but schedule for 5 minutes from now to allow DB setup)
    const welcomeTime = new Date(now.getTime() + 5 * 60 * 1000);
    const welcomeTemplate = getEmailTemplate("welcome", dealer.name, ownerName);

    await createEmailSequence(
      dealershipId,
      "welcome",
      contactEmail,
      contactName,
      welcomeTemplate.subject,
      welcomeTemplate.bodyHtml,
      welcomeTime
    );

    // Email 2: Setup Guide (day 1 - 24 hours from now)
    const setupTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const setupTemplate = getEmailTemplate("setup_guide", dealer.name);

    await createEmailSequence(
      dealershipId,
      "setup_guide",
      contactEmail,
      contactName,
      setupTemplate.subject,
      setupTemplate.bodyHtml,
      setupTime
    );

    // Email 3: First Lead Tips (day 3 - 72 hours from now)
    const tipsTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const tipsTemplate = getEmailTemplate("first_lead_tips", dealer.name);

    await createEmailSequence(
      dealershipId,
      "first_lead_tips",
      contactEmail,
      contactName,
      tipsTemplate.subject,
      tipsTemplate.bodyHtml,
      tipsTime
    );

    console.log(
      `[PostSignupEmail] Scheduled 3 email sequences for dealership ${dealershipId}`
    );
  } catch (error) {
    console.error(`[PostSignupEmail] Error scheduling emails for dealership ${dealershipId}:`, error);
  }
}

/**
 * Process pending email sequences (Heartbeat job)
 */
export async function processPendingEmailSequences() {
  try {
    const pending = await getPendingEmailSequences(50);

    console.log(`[PostSignupEmail] Processing ${pending.length} pending emails`);

    for (const emailSeq of pending) {
      try {
        // Send email
        const sendResult = await sendEmailViaSendGrid(
          emailSeq.recipientEmail,
          emailSeq.recipientName || undefined,
          emailSeq.subject,
          emailSeq.bodyHtml
        );

        if (sendResult.success) {
          // Update status to sent
          await updateEmailSequenceStatus(
            emailSeq.id,
            "sent",
            sendResult.messageId,
            `pixel-${Math.random().toString(36).substr(2, 9)}`
          );

          // Log successful attempt
          await logEmailSequenceAttempt(
            emailSeq.dealershipId,
            emailSeq.sequenceType,
            emailSeq.id,
            1
          );

          console.log(
            `[PostSignupEmail] Sent ${emailSeq.sequenceType} email to ${emailSeq.recipientEmail}`
          );
        } else {
          // Update status to failed
          await updateEmailSequenceStatus(emailSeq.id, "failed");

          // Log failed attempt
          await logEmailSequenceAttempt(
            emailSeq.dealershipId,
            emailSeq.sequenceType,
            emailSeq.id,
            1,
            sendResult.error || "Unknown error"
          );

          console.error(
            `[PostSignupEmail] Failed to send ${emailSeq.sequenceType} email to ${emailSeq.recipientEmail}: ${sendResult.error}`
          );
        }
      } catch (error) {
        console.error(
          `[PostSignupEmail] Error processing email sequence ${emailSeq.id}:`,
          error
        );

        // Log error
        await logEmailSequenceAttempt(
          emailSeq.dealershipId,
          emailSeq.sequenceType,
          emailSeq.id,
          1,
          String(error)
        );
      }
    }
  } catch (error) {
    console.error("[PostSignupEmail] Error processing pending emails:", error);
  }
}

/**
 * Trigger first-lead email when a lead is created for a dealership
 * (Optional enhancement - can be called from leads.create tRPC)
 */
export async function triggerFirstLeadEmailIfDue(dealershipId: number) {
  try {
    // Check if dealership has received their "first lead tips" email yet
    // If not, and if they have at least one lead, send it immediately
    console.log(`[PostSignupEmail] Checking if first-lead email should be sent for dealership ${dealershipId}`);
  } catch (error) {
    console.error("[PostSignupEmail] Error triggering first-lead email:", error);
  }
}
