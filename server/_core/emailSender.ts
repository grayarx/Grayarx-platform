/**
 * Email Sender — Sends emails via Resend
 * Used for sales outreach, test emails, and transactional messages
 */

import { invokeLLM } from "./llm";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp";
const RESEND_API_URL = "https://api.resend.com/emails";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    if (!forgeApiKey) {
      return {
        success: false,
        error: "Forge API key not configured",
      };
    }

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${forgeApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GrayArx <notify@grayarx.com>",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Resend API error: ${response.status} - ${error}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error("[EmailSender] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send test email with animated logo
 */
export async function sendTestEmailWithLogo(recipientEmail: string): Promise<{ success: boolean; message: string }> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #0a0e27; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0e27; }
        .header { text-align: center; padding: 40px 20px; }
        .logo { width: 150px; height: auto; margin-bottom: 20px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
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
            <img src="${LOGO_URL}" alt="GrayArx" class="logo">
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
            
            <p><strong>The result?</strong> Dealerships see 3-5x more leads captured, 40% faster response times, and 25% higher conversion rates.</p>
            
            <p>We're inviting a small group of SA dealerships to the <strong>GrayArx pilot</strong> — Growth-level features, terms we agree on a call. Outbound AI calling is not part of the pilot.</p>
            
            <a href="https://www.grayarx.com/onboarding" class="cta-button">Join the Pilot</a>
            
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

  const result = await sendEmail({
    to: recipientEmail,
    subject: "Your 24/7 AI Sales Team is Ready",
    html: htmlContent,
  });

  if (result.success) {
    return {
      success: true,
      message: `✅ Test email sent successfully to ${recipientEmail}. Check your inbox and verify the animated logo renders correctly.`,
    };
  } else {
    return {
      success: false,
      message: `❌ Failed to send test email: ${result.error}`,
    };
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<{ configured: boolean; message: string }> {
  const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!forgeApiKey) {
    return {
      configured: false,
      message: "Forge API key not configured",
    };
  }

  return {
    configured: true,
    message: "Email configuration verified successfully (using Resend)",
  };
}
