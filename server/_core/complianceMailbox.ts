import { desc, eq, sql } from "drizzle-orm";
import { complianceInquiries, type InsertComplianceInquiry } from "../../drizzle/schema";
import { getDb } from "../db";
import { alertFounder } from "./founderAlert";
import { GRAYARX_LEGAL } from "../../shared/companyLegal";

export type ComplianceMailbox = "privacy" | "legal" | "hello" | "other";

const MAILBOX_LABELS: Record<ComplianceMailbox, string> = {
  privacy: GRAYARX_LEGAL.informationOfficerEmail,
  legal: GRAYARX_LEGAL.legalEmail,
  hello: GRAYARX_LEGAL.supportEmail,
  other: "hello@grayarx.com",
};

export function resolveMailboxFromAddress(to: string | string[] | undefined): ComplianceMailbox {
  const addrs = Array.isArray(to) ? to : to ? [to] : [];
  const joined = addrs.join(" ").toLowerCase();
  if (joined.includes("privacy@")) return "privacy";
  if (joined.includes("legal@")) return "legal";
  if (joined.includes("hello@")) return "hello";
  return "other";
}

export async function recordComplianceInquiry(
  input: Omit<InsertComplianceInquiry, "id" | "createdAt" | "status"> & {
    status?: InsertComplianceInquiry["status"];
  },
): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[complianceMailbox] DB unavailable — logging only:", input.subject);
    await alertFounder({
      title: `Compliance (${input.mailbox}) — ${input.subject}`,
      content: `From: ${input.senderName ?? input.senderEmail}\n${input.senderEmail}\n\n${input.message}`,
      category: "compliance",
      actionUrl: "https://www.grayarx.com/admin/compliance",
    });
    return null;
  }

  try {
    const result = await db.insert(complianceInquiries).values({
      mailbox: input.mailbox ?? "other",
      source: input.source ?? "web_form",
      senderName: input.senderName ?? null,
      senderEmail: input.senderEmail,
      subject: input.subject,
      message: input.message,
      status: input.status ?? "new",
      externalId: input.externalId ?? null,
      metadata: input.metadata ?? null,
    });

    // @ts-expect-error Drizzle MySQL returns insertId on result[0]
    const id = Number(result?.[0]?.insertId ?? result?.insertId ?? 0) || null;

    const mailboxLabel = MAILBOX_LABELS[(input.mailbox as ComplianceMailbox) ?? "other"];
    await alertFounder({
      title: `${mailboxLabel} — ${input.subject}`,
      content: [
        `Mailbox: ${input.mailbox ?? "other"}`,
        `From: ${input.senderName ?? "—"} <${input.senderEmail}>`,
        `Source: ${input.source ?? "web_form"}`,
        id ? `Inquiry #${id}` : "",
        "",
        input.message.slice(0, 4000),
      ]
        .filter(Boolean)
        .join("\n"),
      category: "compliance",
      actionUrl: "https://www.grayarx.com/admin/compliance",
    });

    return id;
  } catch (dbErr) {
    console.error("[complianceMailbox] DB insert failed, falling back to alertFounder:", dbErr);
    await alertFounder({
      title: `[DB-FALLBACK] Compliance (${input.mailbox ?? "other"}) — ${input.subject}`,
      content: `From: ${input.senderName ?? input.senderEmail}\n${input.senderEmail}\n\n${input.message}`,
      category: "compliance",
      actionUrl: "https://www.grayarx.com/admin/compliance",
    });
    return null;
  }
}

export async function listComplianceInquiries(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(complianceInquiries)
    .orderBy(desc(complianceInquiries.createdAt))
    .limit(limit);
}

export async function countUnreadComplianceInquiries(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(complianceInquiries)
    .where(eq(complianceInquiries.status, "new"));
  return Number(rows[0]?.c ?? 0);
}

export async function markComplianceInquiryRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(complianceInquiries)
    .set({ status: "read", readAt: new Date() })
    .where(eq(complianceInquiries.id, id));
}

export async function processResendInboundEmail(payload: {
  type?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
  };
}): Promise<{ ok: boolean; reason?: string }> {
  if (payload.type !== "email.received") {
    return { ok: false, reason: "ignored_event_type" };
  }
  const data = payload.data;
  if (!data?.from || !data.subject) {
    return { ok: false, reason: "missing_fields" };
  }

  const fromMatch = data.from.match(/^(.+?)\s*<([^>]+)>$/) ?? null;
  const senderName = fromMatch ? fromMatch[1].replace(/"/g, "").trim() : undefined;
  const senderEmail = fromMatch ? fromMatch[2].trim() : data.from.trim();
  const body = (data.text || stripHtml(data.html ?? "") || "(no body)").slice(0, 8000);
  const mailbox = resolveMailboxFromAddress(data.to);

  await recordComplianceInquiry({
    mailbox,
    source: "resend_inbound",
    senderName,
    senderEmail,
    subject: data.subject.slice(0, 500),
    message: body,
    externalId: data.email_id ?? null,
    metadata: { to: data.to },
  });

  return { ok: true };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
