/**
 * Email templates for GrayArx authentication system
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function getPasswordResetTemplate(resetLink: string, userName: string): EmailTemplate {
  return {
    subject: "Reset Your GrayArx Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GrayArx</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>We received a request to reset your GrayArx password. Click the button below to create a new password.</p>
              <a href="${resetLink}" class="button">Reset Password</a>
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this, you can ignore this email. Your password will remain unchanged.</p>
              <p>Best regards,<br>The GrayArx Team</p>
            </div>
            <div class="footer">
              <p>© 2026 GrayArx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${userName},
      
      We received a request to reset your GrayArx password. Click the link below to create a new password:
      
      ${resetLink}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this, you can ignore this email. Your password will remain unchanged.
      
      Best regards,
      The GrayArx Team
    `,
  };
}

export function getWelcomeTemplate(userName: string): EmailTemplate {
  return {
    subject: "Welcome to GrayArx",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to GrayArx</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Welcome to GrayArx - Your 24/7 AI Sales Team That Never Sleeps!</p>
              <p>Your account has been successfully created. You can now sign in to access the dealer console.</p>
              <a href="https://grayarx.com/login" class="button">Sign In to Dashboard</a>
              <p>Next steps:</p>
              <ul>
                <li>Complete your profile information</li>
                <li>Enable two-factor authentication for security</li>
                <li>Connect your social accounts</li>
                <li>Explore the dealer console features</li>
              </ul>
              <p>If you have any questions, contact our support team at support@grayarx.com</p>
              <p>Best regards,<br>The GrayArx Team</p>
            </div>
            <div class="footer">
              <p>© 2026 GrayArx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to GrayArx!
      
      Hi ${userName},
      
      Your account has been successfully created. You can now sign in to access the dealer console at:
      https://grayarx.com/login
      
      Next steps:
      - Complete your profile information
      - Enable two-factor authentication for security
      - Connect your social accounts
      - Explore the dealer console features
      
      If you have any questions, contact our support team at support@grayarx.com
      
      Best regards,
      The GrayArx Team
    `,
  };
}

export function getTwoFactorTemplate(code: string): EmailTemplate {
  return {
    subject: "Your GrayArx 2FA Code",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .code { background: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; border-radius: 4px; margin: 20px 0; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GrayArx 2FA Code</h1>
            </div>
            <div class="content">
              <p>Your two-factor authentication code is:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email and contact support immediately.</p>
            </div>
            <div class="footer">
              <p>© 2026 GrayArx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Your GrayArx 2FA Code: ${code}
      
      This code will expire in 10 minutes.
      
      If you didn't request this code, please ignore this email and contact support immediately.
    `,
  };
}

export function getSecurityAlertTemplate(alertMessage: string): EmailTemplate {
  return {
    subject: "GrayArx Security Alert",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .alert { background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Security Alert</h1>
            </div>
            <div class="content">
              <div class="alert">
                <strong>⚠️ ${alertMessage}</strong>
              </div>
              <p>If this wasn't you, please change your password immediately and contact support.</p>
              <p>Review your account activity and security settings.</p>
            </div>
            <div class="footer">
              <p>© 2026 GrayArx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      GrayArx Security Alert
      
      ${alertMessage}
      
      If this wasn't you, please change your password immediately and contact support.
    `,
  };
}

/**
 * Email verification template (enhanced version)
 */
export function getEmailVerificationTemplate(verificationLink: string): EmailTemplate {
  return {
    subject: "Verify Your Email - GrayArx",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #f59e0b; }
            .logo { font-size: 28px; font-weight: bold; color: #ffffff; margin-bottom: 10px; }
            .logo-subtitle { color: #f59e0b; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
            .content { padding: 40px 30px; }
            .title { font-size: 22px; color: #1e293b; margin-bottom: 20px; font-weight: 600; }
            .body-text { color: #475569; margin-bottom: 20px; font-size: 14px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .link-text { color: #f59e0b; text-decoration: none; font-weight: 600; }
            .footer { background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer-text { color: #64748b; font-size: 12px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚗 GrayArx</div>
              <div class="logo-subtitle">AI Platform for Dealerships</div>
            </div>
            <div class="content">
              <div class="title">Verify Your Email Address</div>
              <p class="body-text">Click the button below to verify your email address and activate your GrayArx account:</p>
              <div style="text-align: center;">
                <a href="${verificationLink}" class="cta-button">Verify Email</a>
              </div>
              <p class="body-text" style="font-size: 12px; color: #94a3b8;">Or copy and paste this link:<br><a href="${verificationLink}" class="link-text">${verificationLink}</a></p>
              <p class="body-text" style="margin-top: 30px; color: #64748b; font-size: 12px;">This link will expire in 24 hours. If you didn't request this verification, please ignore this email.</p>
            </div>
            <div class="footer">
              <p class="footer-text">© 2026 GrayArx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Verify Your Email Address\n\nClick the link below to verify your email:\n${verificationLink}\n\nThis link will expire in 24 hours.\n\n© 2026 GrayArx. All rights reserved.`,
  };
}

/**
 * Email change verification template
 */
export function getEmailChangeTemplate(
  newEmail: string,
  verificationLink: string
): EmailTemplate {
  return {
    subject: "Confirm Your Email Change - GrayArx",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #f59e0b; }
            .logo { font-size: 28px; font-weight: bold; color: #ffffff; margin-bottom: 10px; }
            .logo-subtitle { color: #f59e0b; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
            .content { padding: 40px 30px; }
            .title { font-size: 22px; color: #1e293b; margin-bottom: 20px; font-weight: 600; }
            .body-text { color: #475569; margin-bottom: 20px; font-size: 14px; }
            .email-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .email-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .email-value { color: #1e293b; font-weight: 600; font-size: 16px; margin-top: 5px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .link-text { color: #f59e0b; text-decoration: none; font-weight: 600; }
            .footer { background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer-text { color: #64748b; font-size: 12px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚗 GrayArx</div>
              <div class="logo-subtitle">AI Platform for Dealerships</div>
            </div>
            <div class="content">
              <div class="title">Confirm Your Email Change</div>
              <p class="body-text">We received a request to change your email address. Please confirm by clicking the button below:</p>
              <div class="email-box">
                <div class="email-label">New Email Address</div>
                <div class="email-value">${newEmail}</div>
              </div>
              <div style="text-align: center;">
                <a href="${verificationLink}" class="cta-button">Confirm Email Change</a>
              </div>
              <p class="body-text" style="font-size: 12px; color: #94a3b8;">Or copy and paste this link:<br><a href="${verificationLink}" class="link-text">${verificationLink}</a></p>
              <p class="body-text">This link will expire in 24 hours. If you didn't request this change, please ignore this email.</p>
            </div>
            <div class="footer">
              <p class="footer-text">© 2026 GrayArx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Confirm Your Email Change\n\nNew Email: ${newEmail}\n\nClick the link below to confirm:\n${verificationLink}\n\nThis link will expire in 24 hours.\n\n© 2026 GrayArx. All rights reserved.`,
  };
}
