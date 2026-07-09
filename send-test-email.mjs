import nodemailer from 'nodemailer';

// Initialize email transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'grayarx@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

const emailTemplate = `
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
        <h2>🎉 Welcome to GrayArx!</h2>
        <p>Hello,</p>
        <p>This is a test email to verify that your GrayArx branding and email templates are working correctly. This email demonstrates the professional design and layout that all dealership communications will use.</p>
        
        <div class="email-metrics">
          <div class="metric-row">
            <span class="metric-label">Platform</span>
            <span class="metric-value">GrayArx AI</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Status</span>
            <span class="metric-value">✓ Active</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Branding</span>
            <span class="metric-value">✓ Verified</span>
          </div>
        </div>
        
        <p>Your 24/7 AI Sales Team is now live and ready to help your dealership capture leads, qualify buyers, book test drives, and close more sales.</p>
        
        <p style="margin-top: 20px;">
          <a href="https://www.grayarx.com/dashboard" class="email-cta">View Your Dashboard</a>
        </p>
        
        <p>Best regards,<br><strong>GrayArx Team</strong></p>
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
          This is a test email from GrayArx. If you have questions, contact us at <a href="mailto:support@grayarx.com">support@grayarx.com</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;

async function sendTestEmail() {
  try {
    const recipientEmail = process.argv[2] || 'grayarx@gmail.com';
    
    console.log(`[Test Email] Sending test email to ${recipientEmail}...`);
    
    const result = await transporter.sendMail({
      from: `"GrayArx Team" <${process.env.EMAIL_USER || 'grayarx@gmail.com'}>`,
      to: recipientEmail,
      subject: '🎉 GrayArx Branding Test Email',
      html: emailTemplate,
      text: 'This is a test email from GrayArx. Please check the HTML version for the full branding.',
    });

    console.log(`[Test Email] ✓ Email sent successfully!`);
    console.log(`[Test Email] Message ID: ${result.messageId}`);
    console.log(`[Test Email] Recipient: ${recipientEmail}`);
    console.log(`[Test Email] Subject: GrayArx Branding Test Email`);
    console.log(`[Test Email] From: GrayArx Team <${process.env.EMAIL_USER || 'grayarx@gmail.com'}>`);
  } catch (error) {
    console.error(`[Test Email] ✗ Failed to send email:`, error);
    process.exit(1);
  }
}

sendTestEmail();
