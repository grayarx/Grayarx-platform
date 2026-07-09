/**
 * Email Verification Workflow
 * Manages email verification process with reminders and status tracking
 */

import crypto from "crypto";

export interface VerificationToken {
  token: string;
  userId: number;
  email: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

export interface VerificationStatus {
  userId: number;
  email: string;
  isVerified: boolean;
  verifiedAt?: Date;
  lastReminderSent?: Date;
  reminderCount: number;
}

/**
 * Generate email verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create verification token with expiry
 */
export function createVerificationToken(userId: number, email: string): VerificationToken {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

  return {
    token: generateVerificationToken(),
    userId,
    email,
    expiresAt,
    verified: false,
    createdAt: new Date(),
  };
}

/**
 * Verify email token
 */
export function verifyEmailToken(token: string, storedToken: VerificationToken): boolean {
  // Check if token matches
  if (token !== storedToken.token) {
    return false;
  }

  // Check if token has expired
  if (new Date() > storedToken.expiresAt) {
    return false;
  }

  // Check if already verified
  if (storedToken.verified) {
    return false;
  }

  return true;
}

/**
 * Check if verification reminder should be sent
 */
export function shouldSendReminder(status: VerificationStatus): boolean {
  // Don't send if already verified
  if (status.isVerified) {
    return false;
  }

  // Don't send more than 2 reminders
  if (status.reminderCount >= 2) {
    return false;
  }

  // Send reminder if no reminder sent yet
  if (!status.lastReminderSent) {
    return true;
  }

  // Send reminder 24 hours after last reminder
  const lastReminderTime = new Date(status.lastReminderSent);
  const timeSinceLastReminder = new Date().getTime() - lastReminderTime.getTime();
  const hoursElapsed = timeSinceLastReminder / (1000 * 60 * 60);

  return hoursElapsed >= 24;
}

/**
 * Get verification status badge
 */
export function getVerificationBadge(isVerified: boolean): {
  label: string;
  color: string;
  icon: string;
} {
  return isVerified
    ? {
        label: "Verified",
        color: "bg-green-100 text-green-800",
        icon: "✓",
      }
    : {
        label: "Unverified",
        color: "bg-yellow-100 text-yellow-800",
        icon: "!",
      };
}

/**
 * Check if user can access premium features
 */
export function canAccessPremiumFeatures(status: VerificationStatus): boolean {
  return status.isVerified;
}

/**
 * Get verification progress percentage
 */
export function getVerificationProgress(status: VerificationStatus): number {
  if (status.isVerified) {
    return 100;
  }

  // Calculate based on time elapsed since creation
  // This is a mock implementation
  return 0;
}

/**
 * Format verification expiry time
 */
export function formatVerificationExpiry(expiresAt: Date): string {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m remaining`;
  }

  return `${diffMinutes}m remaining`;
}

/**
 * Get verification email template
 */
export function getVerificationEmailTemplate(
  email: string,
  verificationLink: string,
  userName?: string
): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome${userName ? ` ${userName}` : ""}!</h2>
        <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
        
        <div style="margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>
        
        <p style="color: #999; font-size: 12px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
    text: `
      Welcome${userName ? ` ${userName}` : ""}!
      
      Thank you for signing up. Please verify your email address to complete your registration.
      
      Click this link to verify: ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
    `,
  };
}

/**
 * Get verification reminder email template
 */
export function getVerificationReminderTemplate(
  email: string,
  verificationLink: string,
  reminderNumber: number
): {
  subject: string;
  html: string;
  text: string;
} {
  const reminderText = reminderNumber === 1 ? "first" : "second";

  return {
    subject: `Reminder: Verify your email address (${reminderText} reminder)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification Reminder</h2>
        <p>We noticed you haven't verified your email address yet. This is your ${reminderText} reminder.</p>
        
        <p>Verifying your email helps us keep your account secure and ensures you don't miss important updates.</p>
        
        <div style="margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address Now
          </a>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>
      </div>
    `,
    text: `
      Email Verification Reminder
      
      We noticed you haven't verified your email address yet. This is your ${reminderText} reminder.
      
      Click this link to verify: ${verificationLink}
      
      This link will expire in 24 hours.
    `,
  };
}
