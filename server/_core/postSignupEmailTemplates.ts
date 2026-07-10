/**
 * Post-signup email templates for new dealerships
 * Includes: Welcome, Setup Guide, First Lead Tips
 */

interface EmailTemplate {
  subject: string;
  bodyHtml: string;
}

export function getWelcomeEmailTemplate(dealershipName: string, ownerName: string): EmailTemplate {
  return {
    subject: `Welcome to GrayArx, ${dealershipName}! 🎉`,
    bodyHtml: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 30px; text-align: center; border-radius: 8px; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px 0; }
            .section { margin: 20px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #d4af37; border-radius: 4px; }
            .section h2 { color: #1a1a1a; margin-top: 0; }
            .cta-button { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; text-align: center; }
            .logo-text { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-text">GRAYARX</div>
              <h1>Welcome, ${ownerName}!</h1>
            </div>

            <div class="content">
              <p>Your dealership, <strong>${dealershipName}</strong>, is now live on GrayArx — the AI Operating System built for South African dealerships.</p>

              <div class="section">
                <h2>🚀 You're All Set</h2>
                <p>Your dealership is ready to:</p>
                <ul>
                  <li><strong>Engage buyers 24/7</strong> with Nala, your WhatsApp AI agent</li>
                  <li><strong>Qualify buyers</strong> with intelligent pre-approval screening</li>
                  <li><strong>Book test drives</strong> automatically through your AI booking agent</li>
                  <li><strong>Reach customers</strong> in all 11 South African languages</li>
                </ul>
              </div>

              <div class="section">
                <h2>📚 Next Steps</h2>
                <ol>
                  <li>Log in to your dealer dashboard</li>
                  <li>Upload your vehicle inventory (CSV import available)</li>
                  <li>Customize your brand kit (logo, colors, signature)</li>
                  <li>Go live with your AI agents</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.grayarx.com/dashboard" class="cta-button">Go to Your Dashboard</a>
              </div>

              <div class="section">
                <h2>💡 Pro Tip</h2>
                <p>Your AI agents are learning from every interaction. The more leads you capture, the smarter they become. Start with your showroom page and watch the conversions flow in.</p>
              </div>
            </div>

            <div class="footer">
              <p>GrayArx (Pty) Ltd &mdash; The Dealership AI Operating System</p>
              <p>Built for South African dealerships. Powered by AI. Trusted by dealership owners.</p>
              <p style="font-size: 11px; color: #888; margin-top: 8px;">
                Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). GrayArx is POPIA-compliant &mdash; your dealership remains the Responsible Party for customer data. We do not sell or monetise your data.
              </p>
              <p><a href="https://www.grayarx.com/privacy-policy" style="color: #d4af37; text-decoration: none;">Privacy Policy</a> | <a href="https://www.grayarx.com/terms" style="color: #d4af37; text-decoration: none;">Terms of Service</a> | <a href="https://www.grayarx.com/legal" style="color: #d4af37; text-decoration: none;">Legal Centre</a></p>
              <p style="font-size: 11px; color: #888;">Questions? <a href="mailto:legal@grayarx.com" style="color: #d4af37; text-decoration: none;">legal@grayarx.com</a> | <a href="mailto:privacy@grayarx.com" style="color: #d4af37; text-decoration: none;">privacy@grayarx.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getSetupGuideEmailTemplate(dealershipName: string): EmailTemplate {
  return {
    subject: `Setup Guide: Get Your ${dealershipName} Showroom Live (Day 1)`,
    bodyHtml: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 30px; text-align: center; border-radius: 8px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 0; }
            .step { margin: 20px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #d4af37; border-radius: 4px; }
            .step h3 { color: #1a1a1a; margin-top: 0; }
            .step-number { display: inline-block; background: #d4af37; color: #1a1a1a; width: 30px; height: 30px; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 10px; }
            .cta-button { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Setup Guide for ${dealershipName}</h1>
              <p>Complete these 4 steps to go live</p>
            </div>

            <div class="content">
              <div class="step">
                <h3><span class="step-number">1</span>Upload Your Inventory</h3>
                <p>Import your vehicle stock via CSV from your DMS or stock export. This takes 5 minutes.</p>
                <a href="https://www.grayarx.com/dashboard/inventory/import" class="cta-button">Import Vehicles</a>
              </div>

              <div class="step">
                <h3><span class="step-number">2</span>Customize Your Brand</h3>
                <p>Add your logo, colors, and signature. Your AI agents will use these in every customer interaction.</p>
                <a href="https://www.grayarx.com/dashboard/brand-kit" class="cta-button">Customize Brand</a>
              </div>

              <div class="step">
                <h3><span class="step-number">3</span>Configure Business Hours</h3>
                <p>Set your operating hours. Nala (your WhatsApp AI agent) will use this to send smarter follow-ups at the right time.</p>
                <a href="https://www.grayarx.com/dashboard/settings" class="cta-button">Set Hours</a>
              </div>

              <div class="step">
                <h3><span class="step-number">4</span>Launch Your Showroom</h3>
                <p>Your public showroom is live! Share your unique showroom link with customers.</p>
                <a href="https://www.grayarx.com/dashboard/showroom" class="cta-button">View Showroom</a>
              </div>

              <div style="background: #e8f5e9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <p><strong>✅ Estimated time: 15 minutes</strong></p>
                <p>Once complete, your AI agents will start capturing leads, qualifying buyers, and booking test drives — 24/7.</p>
              </div>
            </div>

            <div class="footer">
              <p>Questions? Reply to this email or visit our <a href="https://www.grayarx.com/help" style="color: #d4af37; text-decoration: none;">Help Centre</a></p>
              <p>GrayArx (Pty) Ltd &mdash; The Dealership AI Operating System</p>
              <p style="font-size: 11px; color: #888; margin-top: 8px;">
                Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). POPIA-compliant &mdash; we do not sell or monetise your data.
              </p>
              <p><a href="https://www.grayarx.com/legal" style="color: #d4af37; text-decoration: none;">Legal Centre</a> | <a href="mailto:privacy@grayarx.com" style="color: #d4af37; text-decoration: none;">privacy@grayarx.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getFirstLeadTipsEmailTemplate(dealershipName: string): EmailTemplate {
  return {
    subject: `Your First Lead Arrived! 🎯 (Day 3 Tips)`,
    bodyHtml: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 30px; text-align: center; border-radius: 8px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 0; }
            .tip { margin: 20px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #d4af37; border-radius: 4px; }
            .tip h3 { color: #1a1a1a; margin-top: 0; }
            .cta-button { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .stat-box { background: #d4af37; color: #1a1a1a; padding: 20px; border-radius: 4px; text-align: center; margin: 20px 0; }
            .stat-box h2 { margin: 0; font-size: 32px; }
            .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Congrats, ${dealershipName}! 🎉</h1>
              <p>Your first lead just arrived</p>
            </div>

            <div class="content">
              <p>Your AI agents are working! Here are 3 tips to convert this lead into a sale:</p>

              <div class="tip">
                <h3>💬 Tip #1: Respond Fast</h3>
                <p>Nala (your WhatsApp AI agent) has already sent an intelligent reply. Check your leads dashboard to see the conversation.</p>
                <a href="https://www.grayarx.com/dashboard/leads" class="cta-button">View Leads</a>
              </div>

              <div class="tip">
                <h3>📞 Tip #2: Follow Up Within 24 Hours</h3>
                <p>The first 24 hours are critical. Your AI booking agent can schedule a test drive automatically. Enable WhatsApp booking in your settings.</p>
                <a href="https://www.grayarx.com/dashboard/settings/agents" class="cta-button">Enable Booking</a>
              </div>

              <div class="tip">
                <h3>🎯 Tip #3: Personalize the Experience</h3>
                <p>Use the lead's browsing history to recommend similar vehicles. Customers love when you remember what they looked at.</p>
                <a href="https://www.grayarx.com/dashboard/inventory" class="cta-button">View Inventory</a>
              </div>

              <div class="stat-box">
                <h2>48%</h2>
                <p>Dealerships that respond within 1 hour see 48% higher conversion rates</p>
              </div>

              <div style="background: #fff3cd; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <p><strong>Pro Tip:</strong> Enable SMS/WhatsApp notifications so you never miss a lead. Go to Settings → Notifications.</p>
              </div>

              <p style="text-align: center;">
                <a href="https://www.grayarx.com/dashboard" class="cta-button">Go to Dashboard</a>
              </p>
            </div>

            <div class="footer">
              <p>Questions? We're here to help. Reply to this email anytime.</p>
              <p>GrayArx (Pty) Ltd &mdash; The Dealership AI Operating System</p>
              <p style="font-size: 11px; color: #888; margin-top: 8px;">
                Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). POPIA-compliant &mdash; we do not sell or monetise your data.
              </p>
              <p><a href="https://www.grayarx.com/legal" style="color: #d4af37; text-decoration: none;">Legal Centre</a> | <a href="mailto:privacy@grayarx.com" style="color: #d4af37; text-decoration: none;">privacy@grayarx.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Get email template by sequence type
 */
export function getEmailTemplate(
  sequenceType: "welcome" | "setup_guide" | "first_lead_tips",
  dealershipName: string,
  ownerName?: string
): EmailTemplate {
  switch (sequenceType) {
    case "welcome":
      return getWelcomeEmailTemplate(dealershipName, ownerName || "Valued Partner");
    case "setup_guide":
      return getSetupGuideEmailTemplate(dealershipName);
    case "first_lead_tips":
      return getFirstLeadTipsEmailTemplate(dealershipName);
    default:
      throw new Error(`Unknown sequence type: ${sequenceType}`);
  }
}
