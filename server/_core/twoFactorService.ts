/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP-based 2FA with backup codes and audit logging
 */

import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import * as crypto from "crypto";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { twoFactorSecrets, twoFactorBackupCodes, twoFactorSessions, twoFactorAuditLog } from "../../drizzle/schema";

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const SESSION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a new TOTP secret and QR code for 2FA setup
 */
export async function generateTwoFactorSecret(
  userId: number,
  email: string
): Promise<{ secret: string; qrCode: string } | null> {
  try {
    const secret = speakeasy.generateSecret({
      name: `GrayArx (${email})`,
      issuer: "GrayArx",
      length: 32,
    });

    if (!secret.base32) {
      throw new Error("Failed to generate secret");
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

    // Store in database (not yet enabled)
    const db = await getDb();
    if (!db) return null;

    await db.insert(twoFactorSecrets).values({
      userId,
      secret: secret.base32,
      qrCode,
      isEnabled: 0,
    });

    // Log setup started
    await logTwoFactorAudit(userId, "setup_started", {
      email,
    });

    return {
      secret: secret.base32,
      qrCode,
    };
  } catch (error) {
    console.error("Error generating 2FA secret:", error);
    return null;
  }
}

/**
 * Verify a TOTP code and enable 2FA
 */
export async function verifyAndEnable2FA(
  userId: number,
  totpCode: string
): Promise<{ success: boolean; backupCodes?: string[] }> {
  try {
    const db = await getDb();
    if (!db) return { success: false };

    // Get the secret
    const secrets = await db
      .select()
      .from(twoFactorSecrets)
      .where(
        and(
          eq(twoFactorSecrets.userId, userId),
          eq(twoFactorSecrets.isEnabled, 0)
        )
      )
      .limit(1);

    if (!secrets || secrets.length === 0) {
      await logTwoFactorAudit(userId, "verification_failed", {
        reason: "No pending 2FA setup",
      });
      return { success: false };
    }

    const secret = secrets[0];

    // Verify TOTP code (allow 1 time window drift)
    const isValid = speakeasy.totp.verify({
      secret: secret.secret,
      encoding: "base32",
      token: totpCode,
      window: 1,
    });

    if (!isValid) {
      await logTwoFactorAudit(userId, "verification_failed", {
        reason: "Invalid TOTP code",
      });
      return { success: false };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map((code) =>
      crypto.createHash("sha256").update(code).digest("hex")
    );

    // Enable 2FA and store backup codes
    await db
      .update(twoFactorSecrets)
      .set({
        isEnabled: 1,
        enabledAt: new Date(),
        backupCodesGenerated: BACKUP_CODE_COUNT,
      })
      .where(eq(twoFactorSecrets.id, secret.id));

    // Insert backup codes
    for (const hashedCode of hashedCodes) {
      await db.insert(twoFactorBackupCodes).values({
        userId,
        code: hashedCode,
        isUsed: 0,
      });
    }

    // Log successful setup
    await logTwoFactorAudit(userId, "setup_completed", {
      backupCodesCount: BACKUP_CODE_COUNT,
    });

    return {
      success: true,
      backupCodes,
    };
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    await logTwoFactorAudit(userId, "verification_failed", {
      error: String(error),
    });
    return { success: false };
  }
}

/**
 * Verify a TOTP code for login
 */
export async function verifyTOTPCode(
  userId: number,
  totpCode: string
): Promise<{ success: boolean; sessionToken?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false };

    // Get the 2FA secret
    const secrets = await db
      .select()
      .from(twoFactorSecrets)
      .where(
        and(
          eq(twoFactorSecrets.userId, userId),
          eq(twoFactorSecrets.isEnabled, 1)
        )
      )
      .limit(1);

    if (!secrets || secrets.length === 0) {
      return { success: false };
    }

    const secret = secrets[0];

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: secret.secret,
      encoding: "base32",
      token: totpCode,
      window: 1,
    });

    if (!isValid) {
      await logTwoFactorAudit(userId, "verification_failed", {
        reason: "Invalid TOTP code",
        method: "totp",
      });
      return { success: false };
    }

    // Create 2FA session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

    await db.insert(twoFactorSessions).values({
      userId,
      sessionToken,
      isVerified: 1,
      verifiedAt: new Date(),
      expiresAt,
    });

    // Log successful verification
    await logTwoFactorAudit(userId, "verification_success", {
      method: "totp",
    });

    // Update last used
    await db
      .update(twoFactorSecrets)
      .set({ lastUsedAt: new Date() })
      .where(eq(twoFactorSecrets.id, secret.id));

    return {
      success: true,
      sessionToken,
    };
  } catch (error) {
    console.error("Error verifying TOTP code:", error);
    await logTwoFactorAudit(userId, "verification_failed", {
      error: String(error),
    });
    return { success: false };
  }
}

/**
 * Verify a backup code for login
 */
export async function verifyBackupCode(
  userId: number,
  backupCode: string
): Promise<{ success: boolean; sessionToken?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false };

    // Hash the backup code
    const hashedCode = crypto
      .createHash("sha256")
      .update(backupCode)
      .digest("hex");

    // Find unused backup code
    const codes = await db
      .select()
      .from(twoFactorBackupCodes)
      .where(
        and(
          eq(twoFactorBackupCodes.userId, userId),
          eq(twoFactorBackupCodes.code, hashedCode),
          eq(twoFactorBackupCodes.isUsed, 0)
        )
      )
      .limit(1);

    if (!codes || codes.length === 0) {
      await logTwoFactorAudit(userId, "verification_failed", {
        reason: "Invalid or used backup code",
        method: "backup_code",
      });
      return { success: false };
    }

    const code = codes[0];

    // Mark backup code as used
    await db
      .update(twoFactorBackupCodes)
      .set({
        isUsed: 1,
        usedAt: new Date(),
      })
      .where(eq(twoFactorBackupCodes.id, code.id));

    // Create 2FA session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

    await db.insert(twoFactorSessions).values({
      userId,
      sessionToken,
      isVerified: 1,
      verifiedAt: new Date(),
      expiresAt,
    });

    // Log successful verification
    await logTwoFactorAudit(userId, "backup_code_used", {
      method: "backup_code",
    });

    return {
      success: true,
      sessionToken,
    };
  } catch (error) {
    console.error("Error verifying backup code:", error);
    await logTwoFactorAudit(userId, "verification_failed", {
      error: String(error),
    });
    return { success: false };
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  userId: number
): Promise<string[] | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map((code) =>
      crypto.createHash("sha256").update(code).digest("hex")
    );

    // Delete old backup codes
    await db
      .delete(twoFactorBackupCodes)
      .where(eq(twoFactorBackupCodes.userId, userId));

    // Insert new backup codes
    for (const hashedCode of hashedCodes) {
      await db.insert(twoFactorBackupCodes).values({
        userId,
        code: hashedCode,
        isUsed: 0,
      });
    }

    // Update backup codes count
    await db
      .update(twoFactorSecrets)
      .set({ backupCodesGenerated: BACKUP_CODE_COUNT })
      .where(eq(twoFactorSecrets.userId, userId));

    // Log regeneration
    await logTwoFactorAudit(userId, "backup_codes_generated", {
      count: BACKUP_CODE_COUNT,
    });

    return backupCodes;
  } catch (error) {
    console.error("Error regenerating backup codes:", error);
    return null;
  }
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Delete 2FA secret
    await db
      .delete(twoFactorSecrets)
      .where(eq(twoFactorSecrets.userId, userId));

    // Delete backup codes
    await db
      .delete(twoFactorBackupCodes)
      .where(eq(twoFactorBackupCodes.userId, userId));

    // Delete active sessions
    await db
      .delete(twoFactorSessions)
      .where(eq(twoFactorSessions.userId, userId));

    // Log disabling
    await logTwoFactorAudit(userId, "disabled", {});

    return true;
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return false;
  }
}

/**
 * Check if 2FA is enabled for a user
 */
export async function is2FAEnabled(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const secrets = await db
      .select()
      .from(twoFactorSecrets)
      .where(
        and(
          eq(twoFactorSecrets.userId, userId),
          eq(twoFactorSecrets.isEnabled, 1)
        )
      )
      .limit(1);

    return secrets && secrets.length > 0;
  } catch (error) {
    console.error("Error checking 2FA status:", error);
    return false;
  }
}

/**
 * Verify 2FA session token
 */
export async function verify2FASession(
  userId: number,
  sessionToken: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const sessions = await db
      .select()
      .from(twoFactorSessions)
      .where(
        and(
          eq(twoFactorSessions.userId, userId),
          eq(twoFactorSessions.sessionToken, sessionToken),
          eq(twoFactorSessions.isVerified, 1)
        )
      )
      .limit(1);

    if (!sessions || sessions.length === 0) {
      return false;
    }

    const session = sessions[0];

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying 2FA session:", error);
    return false;
  }
}

/**
 * Generate random backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = crypto
      .randomBytes(BACKUP_CODE_LENGTH / 2)
      .toString("hex")
      .toUpperCase()
      .substring(0, BACKUP_CODE_LENGTH);
    codes.push(code);
  }
  return codes;
}

/**
 * Log 2FA audit event
 */
async function logTwoFactorAudit(
  userId: number,
  action: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(twoFactorAuditLog).values({
      userId,
      action: action as any,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error logging 2FA audit:", error);
  }
}

/**
 * Get 2FA audit log for a user
 */
export async function get2FAauditLog(userId: number): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const logs = await db
      .select()
      .from(twoFactorAuditLog)
      .where(eq(twoFactorAuditLog.userId, userId))
      .orderBy((t) => t.timestamp);

    return logs;
  } catch (error) {
    console.error("Error fetching 2FA audit log:", error);
    return [];
  }
}
