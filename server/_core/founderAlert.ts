import { notifyOwner } from "./notification";
import { sendEmailViaResend } from "./resendEmailService";
import { grayArxEmailFooter, grayArxEmailHeader } from "../../shared/emailBranding";
import { ENV } from "./env";

/** Where urgent founder alerts land (Gmail inbox you already check). */
export function founderAlertEmail(): string {
  return ENV.founderAlertEmail;
}

/**
 * Page the founder via Resend email + optional Manus notification.
 * Never throws — lead capture and webhooks must not fail if Forge is down.
 */
export async function alertFounder(opts: {
  title: string;
  content: string;
  category?: "lead" | "compliance" | "onboarding" | "billing" | "ops";
  actionUrl?: string;
}): Promise<{ emailSent: boolean; pushSent: boolean }> {
  const to = founderAlertEmail();
  const category = opts.category ?? "ops";
  const subject = `[GrayArx ${category}] ${opts.title}`.slice(0, 180);

  const actionBlock = opts.actionUrl
    ? `<p style="margin:24px 0;"><a href="${opts.actionUrl}" style="background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">Open in console</a></p>`
    : "";

  const html = `
    <html><body style="font-family:Inter,sans-serif;background:#0a0a0a;padding:24px;margin:0;">
      <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #d4af3744;border-radius:12px;overflow:hidden;">
        ${grayArxEmailHeader(opts.title)}
        <div style="padding:28px;color:#e8e8e8;">
          <pre style="white-space:pre-wrap;font-family:Inter,sans-serif;font-size:14px;line-height:1.6;color:#ccc;margin:0;">${escapeHtml(opts.content)}</pre>
          ${actionBlock}
        </div>
        ${grayArxEmailFooter()}
      </div>
    </body></html>
  `;

  let emailSent = false;
  try {
    const res = await sendEmailViaResend({
      to,
      subject,
      html,
      from: "alerts@grayarx.com",
      replyTo: "hello@grayarx.com",
    });
    emailSent = res.success;
    if (!res.success) {
      console.warn("[founderAlert] Resend failed:", res.error);
    }
  } catch (e) {
    console.warn("[founderAlert] email error:", e);
  }

  let pushSent = false;
  try {
    pushSent = await notifyOwner({ title: opts.title, content: opts.content });
  } catch {
    // Forge not configured in production — email is the primary channel.
  }

  if (!emailSent && !pushSent) {
    console.error(
      "[founderAlert] CRITICAL: Both email and push failed for alert:",
      opts.title,
      "| content:",
      opts.content.slice(0, 200),
    );
  }

  return { emailSent, pushSent };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
