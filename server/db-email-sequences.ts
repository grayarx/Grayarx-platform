import { getDb } from "./db";
import { postSignupEmailSequences, emailSequenceLogs } from "../drizzle/schema";
import { eq, and, lt, isNull, desc } from "drizzle-orm";

export type EmailSequenceType = "welcome" | "setup_guide" | "first_lead_tips";

let cachedDb: any = null;

async function ensureDb() {
  if (!cachedDb) {
    cachedDb = await getDb();
  }
  return cachedDb;
}

/**
 * Create a new post-signup email sequence
 */
export async function createEmailSequence(
  dealershipId: number,
  sequenceType: EmailSequenceType,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  bodyHtml: string,
  scheduledFor: Date
) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  const result = await database.insert(postSignupEmailSequences).values({
    dealershipId,
    sequenceType,
    emailTemplateId: `${sequenceType}-${Date.now()}`,
    recipientEmail,
    recipientName,
    subject,
    bodyHtml,
    scheduledFor,
    status: "scheduled",
  });

  return result;
}

/**
 * Get pending email sequences ready to send
 */
export async function getPendingEmailSequences(limit: number = 50) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  const now = new Date();
  return database
    .select()
    .from(postSignupEmailSequences)
    .where(
      and(
        eq(postSignupEmailSequences.status, "scheduled"),
        lt(postSignupEmailSequences.scheduledFor, now)
      )
    )
    .limit(limit);
}

/**
 * Update email sequence status after sending
 */
export async function updateEmailSequenceStatus(
  emailSequenceId: number,
  status: "sent" | "failed" | "bounced" | "opened" | "clicked",
  sendgridMessageId?: string,
  trackingPixelId?: string
) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "sent") {
    updates.sentAt = new Date();
  } else if (status === "bounced") {
    updates.bouncedAt = new Date();
  } else if (status === "opened") {
    updates.openedAt = new Date();
  } else if (status === "clicked") {
    updates.clickedAt = new Date();
  }

  if (sendgridMessageId) {
    updates.sendgridMessageId = sendgridMessageId;
  }

  if (trackingPixelId) {
    updates.trackingPixelId = trackingPixelId;
  }

  return database
    .update(postSignupEmailSequences)
    .set(updates)
    .where(eq(postSignupEmailSequences.id, emailSequenceId));
}

/**
 * Log email sequence delivery attempt
 */
export async function logEmailSequenceAttempt(
  dealershipId: number,
  sequenceType: EmailSequenceType,
  emailSequenceId: number,
  attemptNumber: number,
  errorMessage?: string
) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  return database.insert(emailSequenceLogs).values({
    dealershipId,
    sequenceType,
    emailSequenceId,
    attemptNumber,
    errorMessage,
    sentAt: errorMessage ? undefined : new Date(),
  });
}

/**
 * Get email sequences for a dealership
 */
export async function getDealershipEmailSequences(
  dealershipId: number,
  sequenceType?: EmailSequenceType
) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  let query = database
    .select()
    .from(postSignupEmailSequences)
    .where(eq(postSignupEmailSequences.dealershipId, dealershipId));

  if (sequenceType) {
    query = query.where(eq(postSignupEmailSequences.sequenceType, sequenceType));
  }

  return query.orderBy(desc(postSignupEmailSequences.createdAt));
}

/**
 * Get email sequence by ID
 */
export async function getEmailSequenceById(emailSequenceId: number) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  const result = await database
    .select()
    .from(postSignupEmailSequences)
    .where(eq(postSignupEmailSequences.id, emailSequenceId));

  return result[0] || null;
}

/**
 * Get email sequence delivery logs
 */
export async function getEmailSequenceLogs(emailSequenceId: number) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  return database
    .select()
    .from(emailSequenceLogs)
    .where(eq(emailSequenceLogs.emailSequenceId, emailSequenceId))
    .orderBy(desc(emailSequenceLogs.createdAt));
}

/**
 * Get email sequences that failed and need retry
 */
export async function getFailedEmailSequencesForRetry(maxRetries: number = 3) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  return database
    .select()
    .from(postSignupEmailSequences)
    .where(eq(postSignupEmailSequences.status, "failed"));
}

/**
 * Get email sequence stats for a dealership
 */
export async function getEmailSequenceStats(dealershipId: number) {
  const database = await ensureDb();
  if (!database) throw new Error("Database connection failed");
  const sequences = await database
    .select()
    .from(postSignupEmailSequences)
    .where(eq(postSignupEmailSequences.dealershipId, dealershipId));

  const stats = {
    total: sequences.length,
    scheduled: sequences.filter((s: any) => s.status === "scheduled").length,
    sent: sequences.filter((s: any) => s.status === "sent").length,
    opened: sequences.filter((s: any) => s.status === "opened").length,
    clicked: sequences.filter((s: any) => s.status === "clicked").length,
    failed: sequences.filter((s: any) => s.status === "failed").length,
    bounced: sequences.filter((s: any) => s.status === "bounced").length,
  };

  return stats;
}
