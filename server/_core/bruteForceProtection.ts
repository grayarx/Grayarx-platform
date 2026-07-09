/**
 * Brute Force Protection Service
 * Detects and prevents brute force login attempts
 */

export interface BruteForceAttempt {
  ipAddress: string;
  email?: string;
  timestamp: Date;
  success: boolean;
}

export interface BruteForceStatus {
  ipAddress: string;
  failedAttempts: number;
  lastAttemptTime: Date;
  isLocked: boolean;
  lockExpiresAt?: Date;
}

export interface BruteForceConfig {
  maxFailedAttempts: number; // Max failed attempts before lockout
  lockoutDuration: number; // Lockout duration in minutes
  resetWindow: number; // Time window in minutes to reset counter
  suspiciousThreshold: number; // Attempts to trigger alert
}

// Default configuration
export const DEFAULT_CONFIG: BruteForceConfig = {
  maxFailedAttempts: 5,
  lockoutDuration: 15,
  resetWindow: 15,
  suspiciousThreshold: 3,
};

/**
 * Check if IP is currently locked
 */
export function isIPLocked(status: BruteForceStatus): boolean {
  if (!status.isLocked) {
    return false;
  }

  if (!status.lockExpiresAt) {
    return true;
  }

  // Check if lockout has expired
  if (new Date() > status.lockExpiresAt) {
    return false;
  }

  return true;
}

/**
 * Record failed login attempt
 */
export function recordFailedAttempt(
  status: BruteForceStatus,
  config: BruteForceConfig = DEFAULT_CONFIG
): BruteForceStatus {
  const now = new Date();
  const lastAttemptMs = status.lastAttemptTime.getTime();
  const nowMs = now.getTime();
  const timeSinceLastAttempt = (nowMs - lastAttemptMs) / (1000 * 60); // Convert to minutes

  // Reset counter if outside reset window
  if (timeSinceLastAttempt > config.resetWindow) {
    return {
      ipAddress: status.ipAddress,
      failedAttempts: 1,
      lastAttemptTime: now,
      isLocked: false,
    };
  }

  // Increment failed attempts
  const newFailedAttempts = status.failedAttempts + 1;

  // Check if should lock
  const shouldLock = newFailedAttempts >= config.maxFailedAttempts;

  return {
    ipAddress: status.ipAddress,
    failedAttempts: newFailedAttempts,
    lastAttemptTime: now,
    isLocked: shouldLock,
    lockExpiresAt: shouldLock ? new Date(nowMs + config.lockoutDuration * 60 * 1000) : undefined,
  };
}

/**
 * Record successful login
 */
export function recordSuccessfulAttempt(status: BruteForceStatus): BruteForceStatus {
  return {
    ipAddress: status.ipAddress,
    failedAttempts: 0,
    lastAttemptTime: new Date(),
    isLocked: false,
  };
}

/**
 * Check if activity is suspicious
 */
export function isSuspiciousActivity(
  status: BruteForceStatus,
  config: BruteForceConfig = DEFAULT_CONFIG
): boolean {
  return status.failedAttempts >= config.suspiciousThreshold;
}

/**
 * Get lockout remaining time
 */
export function getLockoutRemainingTime(status: BruteForceStatus): number | null {
  if (!status.isLocked || !status.lockExpiresAt) {
    return null;
  }

  const now = new Date();
  const remainingMs = status.lockExpiresAt.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return null;
  }

  return Math.ceil(remainingMs / 1000); // Return in seconds
}

/**
 * Format lockout message
 */
export function formatLockoutMessage(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (minutes > 0) {
    return `Account locked. Try again in ${minutes}m ${seconds}s`;
  }

  return `Account locked. Try again in ${seconds}s`;
}

/**
 * Create brute force alert
 */
export function createBruteForceAlert(status: BruteForceStatus): {
  type: string;
  severity: "high" | "critical";
  description: string;
  ipAddress: string;
  attemptCount: number;
} {
  const severity = status.failedAttempts >= 10 ? "critical" : "high";

  return {
    type: "brute_force_attempt",
    severity,
    description: `${status.failedAttempts} failed login attempts from IP ${status.ipAddress}`,
    ipAddress: status.ipAddress,
    attemptCount: status.failedAttempts,
  };
}

/**
 * Get brute force status badge
 */
export function getBruteForceStatusBadge(status: BruteForceStatus): {
  label: string;
  color: string;
  icon: string;
} {
  if (status.isLocked) {
    return {
      label: "Locked",
      color: "bg-red-100 text-red-800",
      icon: "🔒",
    };
  }

  if (status.failedAttempts >= 3) {
    return {
      label: "Suspicious",
      color: "bg-orange-100 text-orange-800",
      icon: "⚠️",
    };
  }

  if (status.failedAttempts > 0) {
    return {
      label: "Caution",
      color: "bg-yellow-100 text-yellow-800",
      icon: "⚡",
    };
  }

  return {
    label: "Normal",
    color: "bg-green-100 text-green-800",
    icon: "✓",
  };
}

/**
 * Check if IP should be whitelisted
 */
export function shouldWhitelistIP(attempts: BruteForceAttempt[]): boolean {
  // Check if all recent attempts were successful
  const recentAttempts = attempts.slice(-10); // Last 10 attempts
  const successfulAttempts = recentAttempts.filter((a) => a.success).length;

  // Whitelist if 100% successful in recent attempts
  return successfulAttempts === recentAttempts.length && recentAttempts.length >= 5;
}

/**
 * Get brute force statistics
 */
export function getBruteForceStats(attempts: BruteForceAttempt[]): {
  totalAttempts: number;
  failedAttempts: number;
  successfulAttempts: number;
  failureRate: number;
  averageAttemptsPerHour: number;
} {
  const failed = attempts.filter((a) => !a.success).length;
  const successful = attempts.filter((a) => a.success).length;

  // Calculate time span
  const oldestAttempt = attempts[0];
  const newestAttempt = attempts[attempts.length - 1];
  const timeSpanHours = (newestAttempt.timestamp.getTime() - oldestAttempt.timestamp.getTime()) / (1000 * 60 * 60);

  return {
    totalAttempts: attempts.length,
    failedAttempts: failed,
    successfulAttempts: successful,
    failureRate: attempts.length > 0 ? (failed / attempts.length) * 100 : 0,
    averageAttemptsPerHour: timeSpanHours > 0 ? attempts.length / timeSpanHours : 0,
  };
}
