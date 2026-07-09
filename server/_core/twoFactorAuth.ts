import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { getDb } from "../db";
import { user2faSettings, otpCodes } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Generate a TOTP secret for authenticator apps
 */
export async function generateTotpSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `GrayArx (${email})`,
    issuer: "GrayArx",
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes: generateBackupCodes(),
  };
}

/**
 * Verify TOTP code from authenticator app
 */
export function verifyTotpCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow 30 seconds before/after
  });
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Enable 2FA for a user
 */
export async function enable2FA(
  userId: number,
  method: "authenticator" | "sms" | "email",
  secret?: string,
  backupCodes?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if 2FA already exists
  const existing = await db
    .select()
    .from(user2faSettings)
    .where(eq(user2faSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(user2faSettings)
      .set({
        method,
        secret,
        backupCodes: backupCodes ? JSON.stringify(backupCodes) : null,
        enabled: 1,
        enabledAt: new Date(),
      })
      .where(eq(user2faSettings.userId, userId));
  } else {
    // Create new
    await db.insert(user2faSettings).values({
      userId,
      method,
      secret,
      backupCodes: backupCodes ? JSON.stringify(backupCodes) : null,
      enabled: 1,
      enabledAt: new Date(),
    });
  }
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db
    .update(user2faSettings)
    .set({
      enabled: 0,
      secret: null,
      backupCodes: null,
    })
    .where(eq(user2faSettings.userId, userId));
}

/**
 * Get 2FA settings for a user
 */
export async function get2FASettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const settings = await db
    .select()
    .from(user2faSettings)
    .where(eq(user2faSettings.userId, userId))
    .limit(1);

  return settings[0] || null;
}

/**
 * Create OTP code for SMS/Email
 */
export async function createOTPCode(
  userId: number,
  method: "sms" | "email",
  ipAddress?: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(otpCodes).values({
    userId,
    code,
    method,
    expiresAt,
    ipAddress,
  });

  return code;
}

/**
 * Verify OTP code
 */
export async function verifyOTPCode(
  userId: number,
  code: string,
  method: "sms" | "email"
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const otpRecord = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, userId),
        eq(otpCodes.code, code),
        eq(otpCodes.method, method)
      )
    )
    .limit(1);

  if (otpRecord.length === 0) {
    return false;
  }

  const otp = otpRecord[0];

  // Check if expired
  if (otp.expiresAt < new Date()) {
    return false;
  }

  // Check if already used
  if (otp.usedAt) {
    return false;
  }

  // Mark as used
  await db
    .update(otpCodes)
    .set({ usedAt: new Date() })
    .where(eq(otpCodes.id, otp.id));

  return true;
}

/**
 * Use backup code for recovery
 */
export async function useBackupCode(
  userId: number,
  backupCode: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const settings = await get2FASettings(userId);
  if (!settings || !settings.backupCodes) {
    return false;
  }

  const codes = JSON.parse(settings.backupCodes) as string[];
  const index = codes.indexOf(backupCode);

  if (index === -1) {
    return false;
  }

  // Remove used code
  codes.splice(index, 1);

  // Update settings
  await db
    .update(user2faSettings)
    .set({
      backupCodes: JSON.stringify(codes),
    })
    .where(eq(user2faSettings.userId, userId));

  return true;
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: number): Promise<boolean> {
  const settings = await get2FASettings(userId);
  return (settings?.enabled ?? 0) === 1;
}
