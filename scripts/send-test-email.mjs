#!/usr/bin/env node

/**
 * Send test sales email with animated logo to verify email delivery and logo animation.
 */

import nodemailer from "nodemailer";

const EMAIL_TO = "grayarx@gmail.com";
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp";

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

async function sendTestEmail() {
  try {
    console.log("📧 Preparing test email with animated logo...\n");

    // For demo purposes, we'll use a test transporter
    // In production, configure with your email service (Gmail, SendGrid, etc.)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "GrayArx <grayarx@gmail.com>",
      to: EMAIL_TO,
      subject: "Your 24/7 AI Sales Team is Ready",
      html: htmlContent,
    };

    console.log(`Sending to: ${EMAIL_TO}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Logo URL: ${LOGO_URL}\n`);

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${result.messageId}\n`);
    console.log("Check your inbox at grayarx@gmail.com for the test email with animated logo.");
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    process.exit(1);
  }
}

sendTestEmail();
