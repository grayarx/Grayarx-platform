/**
 * Email Notification Service
 * 
 * Sends automated emails to customers and dealerships using SendGrid.
 * Handles lead confirmations, booking notifications, follow-ups, and more.
 */

import { ENV } from "./env";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  content: EmailContent;
  tags?: string[];
  trackingSettings?: {
    clickTracking?: boolean;
    openTracking?: boolean;
  };
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!ENV.sendgridApiKey) {
    console.warn("SendGrid API key not configured. Email not sent.");
    return { success: false, error: "SendGrid not configured" };
  }

  const toArray = Array.isArray(options.to) ? options.to : [options.to];
  const fromEmail = options.from?.email || "noreply@grayarx.com";
  const fromName = options.from?.name || "GrayArx";

  const payload = {
    personalizations: [
      {
        to: toArray.map((recipient) => ({
          email: recipient.email,
          name: recipient.name || recipient.email,
        })),
        subject: options.content.subject,
      },
    ],
    from: {
      email: fromEmail,
      name: fromName,
    },
    replyTo: options.replyTo
      ? {
          email: options.replyTo.email,
          name: options.replyTo.name,
        }
      : undefined,
    content: [
      {
        type: "text/html",
        value: options.content.html,
      },
      ...(options.content.text
        ? [
            {
              type: "text/plain",
              value: options.content.text,
            },
          ]
        : []),
    ],
    categories: options.tags || [],
    trackingSettings: {
      clickTracking: {
        enable: options.trackingSettings?.clickTracking ?? true,
      },
      openTracking: {
        enable: options.trackingSettings?.openTracking ?? true,
      },
    },
  };

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("SendGrid error:", error);
      return { success: false, error: `SendGrid error: ${response.status}` };
    }

    const messageId = response.headers.get("x-message-id");
    return { success: true, messageId: messageId || undefined };
  } catch (error) {
    console.error("Email send error:", error);
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
  leadType: "trade_in" | "finance" | "showroom_enquiry"
): Promise<{ success: boolean; error?: string }> {
  const subject = `Thank you for your interest in ${dealershipName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">GrayArx</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">AI Platform for Dealerships</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Hi ${customerName},</h2>
        
        <p style="color: #333; line-height: 1.6;">
          Thank you for your interest in ${dealershipName}! We've received your ${leadType.replace(/_/g, " ")} request and our team is reviewing it.
        </p>
        
        <p style="color: #333; line-height: 1.6;">
          You can expect to hear from us within 24 hours. In the meantime, if you have any questions, feel free to reach out.
        </p>
        
        <div style="background: #d4af37; color: #1a1a1a; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-weight: bold;">Your Lead Reference</p>
          <p style="margin: 5px 0 0 0; font-size: 18px; font-family: monospace;">GX-${Date.now().toString().slice(-8)}</p>
        </div>
        
        <p style="color: #666; font-size: 12px; line-height: 1.6;">
          This email was sent because you submitted a request through ${dealershipName}. If you didn't make this request, please ignore this email.
        </p>
      </div>
      
      <div style="background: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2026 GrayArx. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; opacity: 0.7;">Powered by AI. Trusted by dealerships.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: { email: customerEmail, name: customerName },
    content: { subject, html },
    tags: ["lead_acknowledgment", leadType],
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
    vehicleDescription: string;
    testDriveDate: string;
    testDriveTime: string;
    dealershipAddress: string;
    dealershipPhone: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const subject = `Test Drive Confirmed - ${dealershipName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">GrayArx</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">AI Platform for Dealerships</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Your Test Drive is Confirmed! 🎉</h2>
        
        <p style="color: #333; line-height: 1.6;">
          Hi ${customerName}, your test drive has been confirmed. Here are the details:
        </p>
        
        <div style="background: white; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #666;"><strong>Vehicle:</strong> ${bookingDetails.vehicleDescription}</p>
          <p style="margin: 0 0 10px 0; color: #666;"><strong>Date:</strong> ${bookingDetails.testDriveDate}</p>
          <p style="margin: 0 0 10px 0; color: #666;"><strong>Time:</strong> ${bookingDetails.testDriveTime}</p>
          <p style="margin: 0 0 10px 0; color: #666;"><strong>Location:</strong> ${bookingDetails.dealershipAddress}</p>
          <p style="margin: 0; color: #666;"><strong>Contact:</strong> ${bookingDetails.dealershipPhone}</p>
        </div>
        
        <p style="color: #333; line-height: 1.6;">
          Please arrive 10 minutes early. If you need to reschedule, contact us as soon as possible.
        </p>
      </div>
      
      <div style="background: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2026 GrayArx. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: { email: customerEmail, name: customerName },
    content: { subject, html },
    tags: ["booking_confirmation"],
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
    estimatedTradeInValue: number;
    currency: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const subject = `Your Trade-In Valuation - ${dealershipName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">GrayArx</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">AI Platform for Dealerships</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Your Trade-In Valuation</h2>
        
        <p style="color: #333; line-height: 1.6;">
          Hi ${customerName}, we've completed the initial valuation for your ${valuationDetails.vehicleDescription}.
        </p>
        
        <div style="background: white; border: 2px solid #d4af37; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0 0 15px 0; color: #666; font-size: 12px;">ESTIMATED MARKET VALUE</p>
          <p style="margin: 0 0 20px 0; font-size: 28px; color: #d4af37; font-weight: bold;">
            ${valuationDetails.currency} ${valuationDetails.marketValue.toLocaleString()}
          </p>
          
          <p style="margin: 0 0 15px 0; color: #666; font-size: 12px;">ESTIMATED TRADE-IN OFFER</p>
          <p style="margin: 0; font-size: 28px; color: #1a1a1a; font-weight: bold;">
            ${valuationDetails.currency} ${valuationDetails.estimatedTradeInValue.toLocaleString()}
          </p>
        </div>
        
        <p style="color: #333; line-height: 1.6;">
          <strong>Important:</strong> This is an AI-estimated value based on market data. Our salesperson will provide a final accurate price after inspecting your vehicle in person.
        </p>
        
        <p style="color: #333; line-height: 1.6;">
          Ready to move forward? Contact us to schedule a test drive and final inspection.
        </p>
      </div>
      
      <div style="background: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2026 GrayArx. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: { email: customerEmail, name: customerName },
    content: { subject, html },
    tags: ["trade_in_valuation"],
  });
}

/**
 * Send dealership notification email
 */
export async function sendDealershipNotificationEmail(
  dealershipEmail: string,
  dealershipName: string,
  notificationType: "new_lead" | "booking_created" | "trade_in_submitted",
  details: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  let subject = "";
  let html = "";

  switch (notificationType) {
    case "new_lead":
      subject = `New Lead - ${dealershipName}`;
      html = `
        <p>A new lead has been submitted:</p>
        <ul>
          <li>Name: ${details.customerName}</li>
          <li>Email: ${details.customerEmail}</li>
          <li>Phone: ${details.customerPhone}</li>
          <li>Type: ${details.leadType}</li>
        </ul>
      `;
      break;

    case "booking_created":
      subject = `Test Drive Booking - ${dealershipName}`;
      html = `
        <p>A test drive has been booked:</p>
        <ul>
          <li>Customer: ${details.customerName}</li>
          <li>Vehicle: ${details.vehicleDescription}</li>
          <li>Date: ${details.testDriveDate}</li>
          <li>Time: ${details.testDriveTime}</li>
        </ul>
      `;
      break;

    case "trade_in_submitted":
      subject = `Trade-In Submission - ${dealershipName}`;
      html = `
        <p>A trade-in has been submitted:</p>
        <ul>
          <li>Customer: ${details.customerName}</li>
          <li>Vehicle: ${details.vehicleDescription}</li>
          <li>Estimated Value: ${details.estimatedValue}</li>
        </ul>
      `;
      break;
  }

  return sendEmail({
    to: { email: dealershipEmail, name: dealershipName },
    content: { subject, html },
    tags: [notificationType, "dealership_notification"],
  });
}
