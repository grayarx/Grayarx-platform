import sgMail from "@sendgrid/mail";

/**
 * Email Service Integration with SendGrid
 * Sends branded GrayArx emails with logo and professional templates
 */

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Send branded GrayArx email via SendGrid
 */
export async function sendBrandedEmail(options: EmailOptions): Promise<boolean> {
  try {
    const result = await sgMail.send({
      from: {
        email: "noreply@grayarx.com",
        name: "GrayArx Team",
      },
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: wrapEmailTemplate(options.htmlContent),
      text: options.textContent,
      replyTo: process.env.EMAIL_USER || "support@grayarx.com",
    });

    console.log(
      `[Email Service] Email sent successfully to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`
    );
    return true;
  } catch (error) {
    console.error("[Email Service] Failed to send email:", error);
    return false;
  }
}

/**
 * Wrap email content with GrayArx branding
 */
function wrapEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .email-header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #d4af37;
          }
          .email-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
            filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.6));
          }
          .email-header h1 {
            color: #d4af37;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .email-body {
            padding: 30px 20px;
            color: #333;
            line-height: 1.6;
          }
          .email-body h2 {
            color: #1a1a1a;
            font-size: 18px;
            margin-top: 0;
            margin-bottom: 15px;
          }
          .email-body p {
            margin: 0 0 15px 0;
            font-size: 14px;
          }
          .email-cta {
            display: inline-block;
            background-color: #d4af37;
            color: #1a1a1a;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          .email-cta:hover {
            background-color: #e5c158;
          }
          .email-metrics {
            background-color: #f9f9f9;
            border-left: 4px solid #d4af37;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .metric-row:last-child {
            border-bottom: none;
          }
          .metric-label {
            font-weight: 600;
            color: #666;
          }
          .metric-value {
            color: #d4af37;
            font-weight: 700;
          }
          .email-footer {
            background-color: #1a1a1a;
            color: #999;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #333;
          }
          .email-footer a {
            color: #d4af37;
            text-decoration: none;
          }
          .email-footer a:hover {
            text-decoration: underline;
          }
          .divider {
            height: 1px;
            background-color: #eee;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <svg class="email-logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <!-- GrayArx Glowing Logo -->
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <!-- Outer circle with glow -->
              <circle cx="100" cy="100" r="95" fill="none" stroke="#d4af37" stroke-width="2" filter="url(#glow)" opacity="0.8"/>
              <!-- Inner circle -->
              <circle cx="100" cy="100" r="85" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.6"/>
              <!-- GA Text -->
              <text x="100" y="115" font-size="60" font-weight="bold" fill="#d4af37" text-anchor="middle" font-family="serif" filter="url(#glow)">GA</text>
              <!-- Car silhouette -->
              <path d="M 70 85 Q 70 75 80 75 L 120 75 Q 130 75 130 85 L 130 95 Q 130 100 125 100 L 75 100 Q 70 100 70 95 Z" fill="#d4af37" opacity="0.7"/>
            </svg>
            <h1>GrayArx</h1>
            <p style="color: #999; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">AI PLATFORM FOR DEALERSHIPS</p>
          </div>
          
          <div class="email-body">
            ${content}
          </div>
          
          <div class="email-footer">
            <p style="margin: 0 0 10px 0;">
              <strong>GrayArx - The Dealership AI Operating System</strong>
            </p>
            <p style="margin: 0 0 10px 0;">
              Your 24/7 AI Sales Team | <a href="https://www.grayarx.com">www.grayarx.com</a>
            </p>
            <p style="margin: 0;">
              © 2026 GrayArx. All rights reserved. | <a href="https://www.grayarx.com/privacy">Privacy Policy</a> | <a href="https://www.grayarx.com/terms">Terms of Service</a>
            </p>
            <p style="margin: 10px 0 0 0; color: #666;">
              This email was sent to you by GrayArx. If you have questions, contact us at <a href="mailto:support@grayarx.com">support@grayarx.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send campaign email
 */
export async function sendCampaignEmail(
  recipientEmail: string,
  campaignName: string,
  emailContent: string
): Promise<boolean> {
  return sendBrandedEmail({
    to: recipientEmail,
    subject: `${campaignName} - From GrayArx`,
    htmlContent: `
      <h2>${campaignName}</h2>
      <p>Hello,</p>
      ${emailContent}
      <p>Best regards,<br><strong>GrayArx Team</strong></p>
    `,
  });
}

/**
 * Send report email
 */
export async function sendReportEmail(
  recipientEmails: string[],
  reportTitle: string,
  metrics: Record<string, any>,
  insights: string
): Promise<boolean> {
  const metricsHtml = Object.entries(metrics)
    .map(
      ([key, value]) =>
        `<div class="metric-row">
          <span class="metric-label">${key}</span>
          <span class="metric-value">${value}</span>
        </div>`
    )
    .join("");

  return sendBrandedEmail({
    to: recipientEmails,
    subject: `${reportTitle} - GrayArx Report`,
    htmlContent: `
      <h2>${reportTitle}</h2>
      <p>Hello,</p>
      <p>Your automated report is ready. Here's a summary of your performance:</p>
      
      <div class="email-metrics">
        ${metricsHtml}
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: #d4af37; margin-top: 20px;">Key Insights</h3>
      <p>${insights}</p>
      
      <p style="margin-top: 20px;">
        <a href="https://www.grayarx.com/dashboard" class="email-cta">View Full Report</a>
      </p>
      
      <p>Best regards,<br><strong>GrayArx Team</strong></p>
    `,
  });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  recipientEmail: string,
  dealershipName: string,
  bookingDetails: {
    date: string;
    time: string;
    vehicleName: string;
    contactPerson: string;
  }
): Promise<boolean> {
  return sendBrandedEmail({
    to: recipientEmail,
    subject: "Booking Confirmed - GrayArx",
    htmlContent: `
      <h2>Your Test Drive is Confirmed! 🎉</h2>
      <p>Hello ${bookingDetails.contactPerson},</p>
      <p>Your test drive booking with <strong>${dealershipName}</strong> has been confirmed.</p>
      
      <div class="email-metrics">
        <div class="metric-row">
          <span class="metric-label">Vehicle</span>
          <span class="metric-value">${bookingDetails.vehicleName}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Date</span>
          <span class="metric-value">${bookingDetails.date}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Time</span>
          <span class="metric-value">${bookingDetails.time}</span>
        </div>
      </div>
      
      <p>We're excited to show you this vehicle! If you need to reschedule, please contact the dealership directly.</p>
      
      <p>Best regards,<br><strong>GrayArx Team</strong></p>
    `,
  });
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  recipientEmail: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<boolean> {
  return sendBrandedEmail({
    to: recipientEmail,
    subject: `${title} - GrayArx Notification`,
    htmlContent: `
      <h2>${title}</h2>
      <p>${message}</p>
      ${actionUrl && actionText ? `<p><a href="${actionUrl}" class="email-cta">${actionText}</a></p>` : ""}
      <p>Best regards,<br><strong>GrayArx Team</strong></p>
    `,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetLink: string
): Promise<boolean> {
  return sendBrandedEmail({
    to: recipientEmail,
    subject: "Reset Your GrayArx Password",
    htmlContent: `
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your GrayArx account associated with <strong>${recipientEmail}</strong>.</p>
      <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
      
      <p style="text-align: center;">
        <a href="${resetLink}" class="email-cta">Reset Password</a>
      </p>
      
      <p style="color: #999; font-size: 13px;">Or copy and paste this link in your browser:</p>
      <p style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #666; font-family: monospace;">${resetLink}</p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; color: #856404;">
        <strong>⚠️ Security Note:</strong> If you didn't request this password reset, please ignore this email. Your account is safe. Never share this link with anyone.
      </div>
      
      <p style="margin-top: 30px; color: #999; font-size: 13px;">This is an automated email. Please do not reply to this message.</p>
      <p>Best regards,<br><strong>GrayArx Team</strong></p>
    `,
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  name: string
): Promise<boolean> {
  return sendBrandedEmail({
    to: recipientEmail,
    subject: "Welcome to GrayArx!",
    htmlContent: `
      <h2>Welcome to GrayArx, ${name}! 🎉</h2>
      <p>Your account has been created successfully. You're now part of the GrayArx community of dealership professionals.</p>
      
      <p>Get started with these features:</p>
      <ul style="color: #666; line-height: 1.8;">
        <li><strong>Lead Management</strong> - Capture and track dealership leads</li>
        <li><strong>Demo Bookings</strong> - Schedule and manage product demonstrations</li>
        <li><strong>Inventory Management</strong> - Organize your vehicle inventory</li>
        <li><strong>AI-Powered Insights</strong> - Get actionable business intelligence</li>
      </ul>
      
      <p>Log in to your dashboard to start exploring:</p>
      <p style="text-align: center;">
        <a href="https://grayarx.com/dashboard" class="email-cta">Go to Dashboard</a>
      </p>
      
      <p style="color: #999; font-size: 13px; margin-top: 30px;">Have questions? Check out our documentation or contact support@grayarx.com</p>
      <p>Best regards,<br><strong>GrayArx Team</strong></p>
    `,
  });
}


/**
 * Send email change verification email
 */
export async function sendEmailChangeEmail(
  currentEmail: string,
  newEmail: string,
  verificationLink: string
): Promise<boolean> {
  try {
    const { html, text } = getEmailChangeTemplate(newEmail, verificationLink);
    return sendBrandedEmail({
      to: newEmail,
      subject: "Confirm Your Email Change - GrayArx",
      htmlContent: html,
      textContent: text,
    });
  } catch (error) {
    console.error("[Email Service] Failed to send email change email:", error);
    return false;
  }
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail(
  email: string,
  verificationLink: string
): Promise<boolean> {
  try {
    const { html, text } = getEmailVerificationTemplate(verificationLink);
    return sendBrandedEmail({
      to: email,
      subject: "Verify Your Email - GrayArx",
      htmlContent: html,
      textContent: text,
    });
  } catch (error) {
    console.error("[Email Service] Failed to send email verification email:", error);
    return false;
  }
}

// Import email templates
import { getEmailChangeTemplate, getEmailVerificationTemplate } from "./emailTemplates";
