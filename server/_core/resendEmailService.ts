import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  grayArxEmailHeader,
  grayArxEmailFooter,
  GRAYARX_EMAIL_LOGO_CID,
  shouldAttachInlineEmailLogo,
} from "../../shared/emailBranding";
import { ENV } from "./env";

/**
 * Resend Email Service Integration
 * Modern, developer-friendly email service for transactional emails
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface EmailResponse {
  success: boolean;
  id?: string;
  error?: string;
}

function loadInlineLogoAttachment():
  | { filename: string; content: string; content_id: string; content_type: string }
  | null {
  if (!shouldAttachInlineEmailLogo()) return null;

  const candidates = [
    join(process.cwd(), "client/public/logo-icon.png"),
    join(process.cwd(), "dist/public/logo-icon.png"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      const content = readFileSync(path).toString("base64");
      return {
        filename: "logo-icon.png",
        content,
        content_id: GRAYARX_EMAIL_LOGO_CID,
        content_type: "image/png",
      };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Send email via Resend
 */
export async function sendEmailViaResend(data: EmailData): Promise<EmailResponse> {
  try {
    const apiKey = ENV.resendApiKey;
    if (!apiKey) {
      console.error("[Resend] API key not configured");
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    const inlineLogo = loadInlineLogoAttachment();

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: data.from || "noreply@grayarx.com",
        to: data.to,
        subject: data.subject,
        html: data.html,
        reply_to: data.replyTo,
        cc: data.cc,
        bcc: data.bcc,
        ...(inlineLogo ? { attachments: [inlineLogo] } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Resend] Email send failed:", error);
      return { success: false, error: JSON.stringify(error) };
    }

    const result = await response.json();
    console.log("[Resend] Email sent successfully:", result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error("[Resend] Error sending email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send lead acknowledgment email
 */
export async function sendLeadAcknowledgmentEmail(
  customerEmail: string,
  customerName: string,
  dealershipName: string,
  leadType?: string
): Promise<EmailResponse> {
  const html = `
    <html>
      <body style="font-family: Inter, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; margin: 0;">GrayArx</h1>
          </div>
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Thank you for your interest, ${customerName}!</h2>
          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
            We've received your inquiry at <strong>${dealershipName}</strong> and our team is reviewing your request.
          </p>
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            A member of our team will contact you shortly to discuss your needs and schedule a convenient time.
          </p>
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              ${dealershipName} | Powered by GrayArx AI Platform
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailViaResend({
    to: customerEmail,
    subject: `Thank you for your interest - ${dealershipName}`,
    html,
    from: "noreply@grayarx.com",
  });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  customerEmail: string,
  customerName: string,
  dealershipName: string,
  bookingDetails: {
    date: string;
    time: string;
    vehicleDescription: string;
    location: string;
  }
): Promise<EmailResponse> {
  const html = `
    <html>
      <body style="font-family: Inter, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; margin: 0;">GrayArx</h1>
          </div>
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Test Drive Confirmed! 🎉</h2>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #333; margin: 5px 0;"><strong>Date:</strong> ${bookingDetails.date}</p>
            <p style="color: #333; margin: 5px 0;"><strong>Time:</strong> ${bookingDetails.time}</p>
            <p style="color: #333; margin: 5px 0;"><strong>Vehicle:</strong> ${bookingDetails.vehicleDescription}</p>
            <p style="color: #333; margin: 5px 0;"><strong>Location:</strong> ${bookingDetails.location}</p>
          </div>
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              ${dealershipName} | Powered by GrayArx AI Platform
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailViaResend({
    to: customerEmail,
    subject: `Test Drive Confirmed - ${bookingDetails.vehicleDescription}`,
    html,
    from: "noreply@grayarx.com",
  });
}

/**
 * Send trade-in valuation email
 */
export async function sendTradeInValuationEmail(
  customerEmail: string,
  customerName: string,
  dealershipName: string,
  valuationDetails: {
    vehicleDescription: string;
    marketValue: number;
    estimatedTradeIn: number;
    condition: string;
  }
): Promise<EmailResponse> {
  const html = `
    <html>
      <body style="font-family: Inter, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; margin: 0;">GrayArx</h1>
          </div>
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Your Trade-In Valuation</h2>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #333; margin: 5px 0;"><strong>Vehicle:</strong> ${valuationDetails.vehicleDescription}</p>
            <p style="color: #333; margin: 5px 0;"><strong>Market Value:</strong> R${valuationDetails.marketValue.toLocaleString()}</p>
            <p style="color: #d4af37; margin: 10px 0 0 0; font-size: 18px; font-weight: bold;"><strong>Estimated Trade-In:</strong> R${valuationDetails.estimatedTradeIn.toLocaleString()}</p>
          </div>
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              ${dealershipName} | Powered by GrayArx AI Platform
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailViaResend({
    to: customerEmail,
    subject: `Trade-In Valuation for Your ${valuationDetails.vehicleDescription}`,
    html,
    from: "noreply@grayarx.com",
  });
}

/**
 * Send dealership notification email
 */
export async function sendDealershipNotificationEmail(
  dealerEmail: string,
  dealershipName: string,
  notificationType: "new_lead" | "booking" | "trade_in",
  details: Record<string, string>
): Promise<EmailResponse> {
  const typeLabels = {
    new_lead: "New Lead Received",
    booking: "New Test Drive Booking",
    trade_in: "Trade-In Inquiry",
  };

  const html = `
    <html>
      <body style="font-family: Inter, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; margin: 0;">GrayArx</h1>
          </div>
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">${typeLabels[notificationType]}</h2>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0;">
            ${Object.entries(details)
              .map(([key, value]) => `<p style="color: #333; margin: 5px 0;"><strong>${key}:</strong> ${value}</p>`)
              .join("")}
          </div>
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              ${dealershipName} | Powered by GrayArx AI Platform
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailViaResend({
    to: dealerEmail,
    subject: `[${dealershipName}] ${typeLabels[notificationType]}`,
    html,
    from: "noreply@grayarx.com",
  });
}

/**
 * Send brute force alert email with action button
 */
export async function sendBruteForceAlertEmail(
  customerEmail: string,
  attempts: number,
  ip: string,
  actionLink: string
): Promise<EmailResponse> {
  const html = `
    <html>
      <body style="font-family: Inter, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d32f2f; margin: 0;">🚨 Security Alert</h1>
          </div>
          <h2 style="color: #d32f2f; margin-bottom: 20px;">Suspicious Login Activity Detected</h2>
          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
            We detected <strong>${attempts} failed login attempts</strong> on your GrayArx account from IP address: <strong>${ip}</strong>
          </p>
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
              <strong>If this wasn't you:</strong> Click the button below to activate our security agent and secure your account immediately.
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              🔒 Activate Security Agent
            </a>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Our security team has been notified and is monitoring your account. The security agent will automatically:
          </p>
          <ul style="color: #666; font-size: 12px; margin: 10px 0;">
            <li>Lock suspicious login attempts</li>
            <li>Block the attacking IP address</li>
            <li>Send you verification codes</li>
            <li>Monitor for further threats</li>
          </ul>
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Powered by GrayArx AI Platform | Security Team
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailViaResend({
    to: customerEmail,
    subject: `🚨 SECURITY ALERT: ${attempts} Failed Login Attempts - Action Required`,
    html,
    from: "security@grayarx.com",
  });
}

/**
 * Send account locked email
 */
export async function sendAccountLockedEmail(
  customerEmail: string,
  unlockLink: string
): Promise<EmailResponse> {
  const html = `
    <html>
      <body style="font-family: Inter, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d32f2f; margin: 0;">🔒 Account Locked</h1>
          </div>
          <h2 style="color: #d32f2f; margin-bottom: 20px;">Your Account Has Been Secured</h2>
          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
            Your GrayArx account has been temporarily locked due to multiple failed login attempts. This is a security measure to protect your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${unlockLink}" style="background-color: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              🔓 Unlock My Account
            </a>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Click the button above to verify your identity and unlock your account. You'll need to provide:
          </p>
          <ul style="color: #666; font-size: 12px; margin: 10px 0;">
            <li>Your email address</li>
            <li>A verification code sent to your email</li>
            <li>Your password</li>
          </ul>
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Powered by GrayArx AI Platform | Security Team
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailViaResend({
    to: customerEmail,
    subject: "Your GrayArx Account Has Been Locked for Security",
    html,
    from: "security@grayarx.com",
  });
}

/**
 * Test email delivery
 */
export async function testEmailDelivery(testEmail: string): Promise<EmailResponse> {
  const html = `
    <html>
      <body style="font-family: Inter, sans-serif; background-color: #f5f5f5; padding: 20px; margin:0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${grayArxEmailHeader("Email delivery test")}
          <div style="padding: 40px;">
            <h2 style="color: #1a1a1a; margin-bottom: 20px;">Email Delivery Test</h2>
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              If you received this email, the Resend integration is working and the GrayArx logo loaded correctly above.
            </p>
            <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0;"><strong>Status: Email service is operational</strong></p>
            </div>
          </div>
          ${grayArxEmailFooter()}
        </div>
      </body>
    </html>
  `;

  return sendEmailViaResend({
    to: testEmail,
    subject: "GrayArx Email Delivery Test",
    html,
    from: "noreply@grayarx.com",
  });
}

export async function sendTradeInInspectionInviteEmail(opts: {
  to: string;
  contactName: string;
  dealershipName: string;
  vehicleLabel: string;
  inviteMessage: string;
  indicativeOfferZar?: number;
  quoteId: number;
}): Promise<EmailResponse> {
  const offerBlock = opts.indicativeOfferZar
    ? `<p style="color:#d4af37;font-size:18px;font-weight:bold;">Indicative offer: R${opts.indicativeOfferZar.toLocaleString("en-ZA")} <span style="font-size:12px;color:#888;">(subject to inspection)</span></p>`
    : "";

  const html = `
    <html><body style="font-family:Inter,sans-serif;background:#0a0a0a;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #d4af3744;border-radius:12px;padding:32px;color:#e8e8e8;">
        <h1 style="color:#d4af37;margin:0 0 8px;font-size:22px;">A dealership wants to see your car</h1>
        <p style="color:#aaa;margin:0 0 20px;">Reference #${opts.quoteId} · ${opts.vehicleLabel}</p>
        <p style="line-height:1.6;">Hi ${opts.contactName},</p>
        <p style="line-height:1.6;"><strong>${opts.dealershipName}</strong> found your listing on the GrayArx trade-in network and would like to invite you for an inspection and test drive before confirming a written offer.</p>
        ${offerBlock}
        <div style="background:#1a1a1a;border-left:3px solid #d4af37;padding:16px;margin:20px 0;border-radius:4px;">
          <p style="margin:0;font-style:italic;color:#ccc;">"${opts.inviteMessage}"</p>
        </div>
        <p style="font-size:13px;color:#888;">Final value is only confirmed after in-person inspection — never from an online estimate alone.</p>
        <p style="font-size:12px;color:#666;margin-top:24px;">GrayArx Trade-In Network · You choose which dealership to visit</p>
      </div>
    </body></html>
  `;

  return sendEmailViaResend({
    to: opts.to,
    subject: `${opts.dealershipName} invited you to inspect your ${opts.vehicleLabel}`,
    html,
    from: "noreply@grayarx.com",
  });
}
