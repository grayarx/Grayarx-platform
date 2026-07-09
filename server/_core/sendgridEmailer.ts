import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY not set. Email sending will not work.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error("❌ SendGrid API key not configured");
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
    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
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
        .logo { width: 150px; height: auto; margin-bottom: 20px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .content { padding: 30px 20px; background-color: #1a1f3a; border-radius: 8px; margin: 20px; }
        .content h2 { color: #d4af37; margin-top: 0; }
        .content p { line-height: 1.6; color: #ffffff; }
        .footer { text-align: center; padding: 30px 20px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp" alt="GrayArx" class="logo" style="display: inline-block;">
        </div>
        
        <div class="content">
            <h2>Your 24/7 AI Sales Team is Ready</h2>
            <p>Hi there,</p>
            <p><strong>✅ Email system is working!</strong></p>
            <p>This test email confirms that SendGrid is properly configured and the animated logo is rendering.</p>
            <p><strong>Check if the logo above is animated (pulsing effect).</strong></p>
            <p>Your agents can now send emails to prospects 24/7.</p>
            <p>Best regards,<br><strong>GrayArx Team</strong></p>
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

  return sendEmail({
    to: recipientEmail,
    subject: "✅ GrayArx Email System Test — Animated Logo Verification",
    html,
  });
}
