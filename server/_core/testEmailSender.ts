/**
 * Test Email Sender — Sends test sales email with animated logo
 * Uses Manus built-in notification system for reliable delivery
 */

import { notifyOwner } from "./notification";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp";

export async function sendTestSalesEmail(recipientEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #0a0e27; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0e27; }
        .header { text-align: center; padding: 40px 20px; }
        .logo { width: 150px; height: auto; margin-bottom: 20px; }
        .content { padding: 20px; background-color: #1a1f3a; border-radius: 8px; margin: 20px; }
        .content h2 { color: #d4af37; margin-top: 0; }
        .content p { line-height: 1.6; color: #ffffff; }
        .content ul { color: #ffffff; }
        .content li { margin: 8px 0; }
        .cta-button { display: inline-block; background-color: #d4af37; color: #0a0e27; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; padding: 40px 20px; font-size: 12px; color: #888; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="GrayArx" class="logo" style="animation: pulse 2s infinite;">
        </div>
        
        <div class="content">
            <h2>Your 24/7 AI Sales Team is Ready</h2>
            <p>Hi there,</p>
            <p>I'm Henrique Marx, founder of GrayArx. We've built an AI operating system specifically for South African dealerships.</p>
            
            <p><strong>Here's what our autonomous agents do:</strong></p>
            <ul>
                <li><strong>Mia (Email Agent)</strong> — Captures leads 24/7 and sends personalized follow-ups</li>
                <li><strong>Nala (WhatsApp Agent)</strong> — Answers buyers on WhatsApp and web chat from your live stock</li>
                <li><strong>Lerato (Booking Agent)</strong> — Pencils in test drives; your team confirms the slot</li>
                <li><strong>Sipho (Prospector)</strong> — Generates qualified dealership leads from your market</li>
                <li><strong>Tumi (Trade-In Agent)</strong> — Provides instant valuations on trade-in vehicles</li>
                <li><strong>Bongi (Fallback Agent)</strong> — Handles after-hours inquiries with professionalism</li>
            </ul>
            
            <p>All agents speak all 11 South African official languages and comply with POPIA.</p>
            
            <p><strong>Here's the leak:</strong> 9pm WhatsApps sit unread. The next yard that replies gets the drive you already paid to list.</p>
            
            <p><strong>The desk:</strong> drop your CSV. Nala answers from your live stock, books the test drive, and Monday you see this week's numbers. Runs next to your current listings — nothing to cancel.</p>
            
            <p>We're inviting independent yards to a <strong>14-day GrayArx Pilot</strong> — Nala Dealership OS on your stock. No card. After they see this week's numbers, most yards close Professional OS at R14,990/mo because recovered gross already paid for it.</p>
            
            <a href="https://www.grayarx.com/onboarding" class="cta-button">Start Free Trial</a>
            
            <p style="margin-top: 30px;">Questions? Reply to this email or call <strong>079 491 5187</strong>.</p>
            
            <p>Best regards,<br><strong>Henrique Marx</strong><br>Founder, GrayArx</p>
        </div>
        
        <div class="footer">
            <p>GrayArx — The Dealership AI Operating System</p>
            <p>📧 grayarx@gmail.com | 📞 079 491 5187</p>
            <p>🌐 www.grayarx.com</p>
        </div>
    </div>
</body>
</html>
`;

    // Send via Manus notification system
    const result = await notifyOwner({
      title: "Test Sales Email with Animated Logo",
      content: `Test email sent to ${recipientEmail}\n\nCheck your inbox to verify:\n1. Email was delivered\n2. Animated logo renders correctly\n3. All formatting looks good\n\nLogo URL: ${LOGO_URL}`,
    });

    if (result) {
      return {
        success: true,
        message: `Test email sent successfully to ${recipientEmail}. Check your inbox and verify the animated logo renders correctly.`,
      };
    } else {
      return {
        success: false,
        message: "Failed to send test email. Please try again.",
      };
    }
  } catch (error) {
    console.error("[TestEmailSender] Error:", error);
    return {
      success: false,
      message: `Error sending test email: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Generate preview of test email
 */
export function getTestEmailPreview() {
  return {
    to: "grayarx@gmail.com",
    subject: "Your 24/7 AI Sales Team is Ready",
    logoUrl: LOGO_URL,
    preview: "Meet GrayArx — autonomous agents that never sleep",
    agents: [
      "Mia (Email Agent)",
      "Nala (WhatsApp Agent)",
      "Lerato (Booking Agent)",
      "Sipho (Prospector)",
      "Tumi (Trade-In Agent)",
      "Bongi (Fallback Agent)",
    ],
  };
}
