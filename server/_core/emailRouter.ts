/**
 * Email Router — Handles email operations
 * Uses Manus notification API for sending test emails
 */

import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp";

export const emailRouter = router({
  /**
   * Send test email with animated logo
   * This sends a notification to the project owner with the email content
   * In production, this would be replaced with actual email sending
   */
  sendTestEmail: publicProcedure
    .input(
      z.object({
        recipientEmail: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
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
            <img src="${LOGO_URL}" alt="GrayArx" class="logo" style="display: inline-block;">
        </div>
        
        <div class="content">
            <h2>Your 24/7 AI Sales Team is Ready</h2>
            <p>Hi there,</p>
            <p>I'm Henrique Marx, founder of GrayArx. We've built an AI operating system specifically for South African dealerships.</p>
            
            <p><strong>Here's what our autonomous agents do:</strong></p>
            <ul>
                <li><strong>Mia (Email Agent)</strong> — Captures leads 24/7 and sends personalized follow-ups</li>
                <li><strong>Themba (Calling Agent)</strong> — Places outbound calls to prospects and qualifies buyers</li>
                <li><strong>Lerato (Booking Agent)</strong> — Schedules test drives across WhatsApp, email, and web</li>
                <li><strong>Sipho (Prospector)</strong> — Generates qualified dealership leads from your market</li>
                <li><strong>Tumi (Trade-In Agent)</strong> — Provides instant valuations on trade-in vehicles</li>
                <li><strong>Bongi (Fallback Agent)</strong> — Handles after-hours inquiries with professionalism</li>
            </ul>
            
            <p>All agents speak all 11 South African official languages and comply with POPIA.</p>
            
            <p><strong>The result?</strong> Dealerships see 3-5x more leads captured, 40% faster response times, and 25% higher conversion rates.</p>
            
            <p>We're offering a <strong>free 30-day trial</strong> — no credit card required.</p>
            
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

      try {
        // Send notification to project owner with email content
        const delivered = await notifyOwner({
          title: `Test Email Sent to ${input.recipientEmail}`,
          content: `Email Subject: Your 24/7 AI Sales Team is Ready\n\nThis is a test email with animated logo. Check your inbox at ${input.recipientEmail} to verify the animated logo renders correctly.\n\nEmail HTML:\n${htmlContent}`,
        });

        return {
          success: delivered,
          message: delivered
            ? `✅ Test email notification sent. Check your Manus inbox for the email preview.`
            : `❌ Failed to send test email notification`,
        };
      } catch (error) {
        return {
          success: false,
          message: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }),

  /**
   * Get email template preview
   */
  getEmailTemplate: publicProcedure.query(() => {
    return {
      subject: "Your 24/7 AI Sales Team is Ready",
      from: "GrayArx <notify@grayarx.com>",
      logoUrl: LOGO_URL,
      hasAnimation: true,
      animationType: "pulse",
      animationDuration: "2s",
    };
  }),
});
