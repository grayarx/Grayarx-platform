import { sendEmailViaResend } from "./resendEmailService";
import { grayArxEmailFooter, grayArxEmailHeader } from "../../shared/emailBranding";

/** Pilot onboarding confirmation — drives conversion to signed agreement. */
export async function sendOnboardingWelcomeEmail(opts: {
  to: string;
  ownerName: string;
  dealershipName: string;
  reference: string;
}) {
  const html = `
    <html><body style="font-family:Inter,sans-serif;background:#0a0a0a;padding:24px;margin:0;">
      <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #d4af3744;border-radius:12px;overflow:hidden;">
        ${grayArxEmailHeader("Application received")}
        <div style="padding:32px;color:#e8e8e8;">
          <p style="line-height:1.6;">Hi ${escapeHtml(opts.ownerName)},</p>
          <p style="line-height:1.6;color:#ccc;">
            Thanks — we received your pilot application for <strong>${escapeHtml(opts.dealershipName)}</strong>.
            Our team reviews every dealership within <strong>one business day</strong>.
          </p>
          <p style="font-family:monospace;color:#d4af37;font-size:18px;margin:24px 0;">${escapeHtml(opts.reference)}</p>
          <p style="line-height:1.6;color:#ccc;font-size:14px;">Before your kickoff call, preview our legal pack (Dealer Agreement + POPIA form):</p>
          <p style="margin:20px 0;">
            <a href="https://www.grayarx.com/legal" style="background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">Open legal centre</a>
          </p>
          <p style="line-height:1.6;color:#888;font-size:13px;">
            Questions? Reply to this email or WhatsApp +27 79 491 5187.
          </p>
        </div>
        ${grayArxEmailFooter()}
      </div>
    </body></html>
  `;

  return sendEmailViaResend({
    to: opts.to,
    subject: `GrayArx pilot application — ${opts.reference}`,
    html,
    from: "pilot@grayarx.com",
    replyTo: "hello@grayarx.com",
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
