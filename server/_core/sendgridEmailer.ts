/**
 * Legacy SendGrid helper — kept for optional local scripts only.
 * Production email uses Resend (`resendEmailService.ts` / `emailService.ts`).
 * Do not import this at server boot; `setApiKey("")` triggers
 * `API key does not start with "SG."` from the SendGrid SDK.
 */

import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY?.trim() ?? "";
const sendgridReady = SENDGRID_API_KEY.startsWith("SG.");

if (sendgridReady) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!sendgridReady) {
    console.warn(
      "[SendGrid] Skipped — SENDGRID_API_KEY missing or invalid. Use Resend (RESEND_API_KEY) for production email."
    );
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: options.from || "GrayArx <notify@grayarx.com>",
      subject: options.subject,
      html: options.html,
    };

    await sgMail.send(msg);
    console.log(`[SendGrid] Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error("[SendGrid] Error sending email:", error);
    return false;
  }
}

export async function sendTestEmail(recipientEmail: string): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%); color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0e27; }
        .header { text-align: center; padding: 40px 20px; }
        .logo { width: 150px; height: auto; margin-bottom: 20px; }
        .content { padding: 30px 20px; background-color: #1a1f3a; border-radius: 8px; margin: 20px; }
        .content h2 { color: #d4af37; margin-top: 0; }
        .content p { line-height: 1.6; color: #ffffff; }
        .footer { text-align: center; padding: 30px 20px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.grayarx.com/logo-crest.png" alt="GrayArx" class="logo" style="display: inline-block;">
        </div>
        <div class="content">
            <h2>Your 24/7 AI Sales Team is Ready</h2>
            <p>Hi there,</p>
            <p><strong>Email system test (legacy SendGrid path).</strong></p>
            <p>Production transactional mail should use Resend.</p>
            <p>Best regards,<br><strong>GrayArx Team</strong></p>
        </div>
        <div class="footer">
            <p>GrayArx — The Dealership AI Operating System</p>
            <p>www.grayarx.com</p>
        </div>
    </div>
</body>
</html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: "GrayArx Email System Test (SendGrid legacy)",
    html,
  });
}
