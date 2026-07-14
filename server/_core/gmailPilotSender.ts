/**
 * Send pilot/outreach mail via Gmail SMTP (for Edward Sturm inbox avatar).
 * Resend cannot show a custom Gmail profile photo — only Google SMTP can.
 *
 * Uses, in order:
 *   1. PILOT_GMAIL_USER + PILOT_GMAIL_APP_PASSWORD (e.g. pilot@ if you have Workspace)
 *   2. EMAIL_USER + EMAIL_PASSWORD (e.g. grayarx@gmail.com + App Password)
 */
import nodemailer from "nodemailer";
import { existsSync } from "fs";
import { join } from "path";
import { GRAYARX_EMAIL_LOGO_CID, shouldAttachInlineEmailLogo } from "../../shared/emailBranding";

export function resolveGmailCredentials(): { user: string; pass: string } | null {
  const pilotUser = process.env.PILOT_GMAIL_USER?.trim();
  const pilotPass = process.env.PILOT_GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (pilotUser && pilotPass) return { user: pilotUser, pass: pilotPass };

  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASSWORD?.replace(/\s/g, "");
  if (emailUser && emailPass) return { user: emailUser, pass: emailPass };

  return null;
}

export function isPilotGmailConfigured(): boolean {
  return resolveGmailCredentials() !== null;
}

function pilotTransporter() {
  const creds = resolveGmailCredentials()!;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: creds,
  });
}

function logoAttachment() {
  if (!shouldAttachInlineEmailLogo()) return undefined;
  const icon = join(process.cwd(), "client/public/logo-icon-132.png");
  const fallback = join(process.cwd(), "client/public/logo-icon.png");
  const path = existsSync(icon) ? icon : fallback;
  if (!existsSync(path)) return undefined;
  return {
    filename: "logo-icon-132.png",
    path,
    cid: GRAYARX_EMAIL_LOGO_CID,
    contentType: "image/png",
  };
}

export async function sendEmailViaPilotGmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isPilotGmailConfigured()) {
    return { success: false, error: "PILOT_GMAIL_USER / PILOT_GMAIL_APP_PASSWORD not set" };
  }

  try {
    const creds = resolveGmailCredentials()!;
    const from = creds.user;
    const attachment = logoAttachment();
    const info = await pilotTransporter().sendMail({
      from: `"GrayArx Pilot" <${from}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo ?? "hello@grayarx.com",
      attachments: attachment ? [attachment] : undefined,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
