/**
 * Chatbot Security & Rate Limiting Service
 * Protects against abuse and implements security measures
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

export interface SecurityConfig {
  enableRateLimit: boolean;
  enableInputValidation: boolean;
  enableOutputSanitization: boolean;
  maxInputLength: number;
  maxOutputLength: number;
  blockedKeywords: string[];
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Rate limiter using sliding window
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(key: string): RateLimitStatus {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get requests in current window
    let requests = this.requests.get(key) || [];
    requests = requests.filter((time) => time > windowStart);

    if (requests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...requests);
      const resetTime = oldestRequest + this.config.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    // Add current request
    requests.push(now);
    this.requests.set(key, requests);

    return {
      allowed: true,
      remaining: this.config.maxRequests - requests.length,
      resetTime: now + this.config.windowMs,
    };
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  resetAll(): void {
    this.requests.clear();
  }

  getStats(key: string): { requests: number; windowMs: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const requests = (this.requests.get(key) || []).filter((time) => time > windowStart);

    return {
      requests: requests.length,
      windowMs: this.config.windowMs,
    };
  }
}

// Default rate limiters
const globalLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

const userLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
});

const ipLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

// Default security config
const defaultSecurityConfig: SecurityConfig = {
  enableRateLimit: true,
  enableInputValidation: true,
  enableOutputSanitization: true,
  maxInputLength: 5000,
  maxOutputLength: 10000,
  blockedKeywords: [
    "delete",
    "drop",
    "exec",
    "execute",
    "script",
    "eval",
    "onclick",
    "onerror",
  ],
};

let securityConfig = { ...defaultSecurityConfig };

/**
 * Check global rate limit
 */
export function checkGlobalRateLimit(): RateLimitStatus {
  return globalLimiter.isAllowed("global");
}

/**
 * Check user rate limit
 */
export function checkUserRateLimit(userId: string): RateLimitStatus {
  return userLimiter.isAllowed(`user:${userId}`);
}

/**
 * Check IP rate limit
 */
export function checkIPRateLimit(ipAddress: string): RateLimitStatus {
  return ipLimiter.isAllowed(`ip:${ipAddress}`);
}

/**
 * Validate input
 */
export function validateInput(input: string): { valid: boolean; error?: string } {
  if (!securityConfig.enableInputValidation) {
    return { valid: true };
  }

  // Check length
  if (input.length > securityConfig.maxInputLength) {
    return {
      valid: false,
      error: `Input exceeds maximum length of ${securityConfig.maxInputLength} characters`,
    };
  }

  // Check for blocked keywords
  const inputLower = input.toLowerCase();
  for (const keyword of securityConfig.blockedKeywords) {
    if (inputLower.includes(keyword.toLowerCase())) {
      return {
        valid: false,
        error: "Input contains blocked keywords",
      };
    }
  }

  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(-{2}|\/\*|\*\/|;)/g,
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return {
        valid: false,
        error: "Input contains potentially dangerous patterns",
      };
    }
  }

  // Check for XSS patterns
  const xssPatterns = [/<script|javascript:|onerror=|onclick=|onload=/gi];
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return {
        valid: false,
        error: "Input contains potentially dangerous patterns",
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize output
 */
export function sanitizeOutput(output: string): string {
  if (!securityConfig.enableOutputSanitization) {
    return output;
  }

  // Remove script tags
  let sanitized = output.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Truncate if too long
  if (sanitized.length > securityConfig.maxOutputLength) {
    sanitized = sanitized.substring(0, securityConfig.maxOutputLength) + "...";
  }

  return sanitized;
}

/**
 * Encrypt sensitive data
 */
export function encryptSensitiveData(data: string, key: string): string {
  // Simple base64 encoding (production: use proper encryption)
  return Buffer.from(data).toString("base64");
}

/**
 * Decrypt sensitive data
 */
export function decryptSensitiveData(encrypted: string, key: string): string {
  // Simple base64 decoding (production: use proper decryption)
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

/**
 * Hash sensitive data
 */
export function hashSensitiveData(data: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Mask sensitive information
 */
export function maskSensitiveInfo(text: string): string {
  // Mask email addresses
  text = text.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, "***@***");

  // Mask phone numbers
  text = text.replace(/(\d{3})\d{3}(\d{4})/g, "$1***$2");

  // Mask credit card numbers
  text = text.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, "****-****-****-****");

  // Mask SSN/ID numbers
  text = text.replace(/\d{3}-\d{2}-\d{4}/g, "***-**-****");

  return text;
}

/**
 * Check for suspicious patterns
 */
export function checkSuspiciousPatterns(text: string): { suspicious: boolean; patterns: string[] } {
  const patterns: string[] = [];

  // Check for repeated characters (spam)
  if (/(.)\1{9,}/.test(text)) {
    patterns.push("repeated_characters");
  }

  // Check for excessive capitalization
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  if (upperCount > text.length * 0.5) {
    patterns.push("excessive_capitalization");
  }

  // Check for excessive punctuation
  const punctCount = (text.match(/[!?]{2,}/g) || []).length;
  if (punctCount > 3) {
    patterns.push("excessive_punctuation");
  }

  // Check for URL spam
  if (/(http|https|ftp):\/\/[^\s]+/g.test(text)) {
    patterns.push("url_spam");
  }

  // Check for mention spam
  if (/@\w+/g.test(text) && (text.match(/@\w+/g) || []).length > 5) {
    patterns.push("mention_spam");
  }

  return {
    suspicious: patterns.length > 0,
    patterns,
  };
}

/**
 * Generate security token
 */
export function generateSecurityToken(length: number = 32): string {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Verify security token
 */
export function verifySecurityToken(token: string, expectedToken: string): boolean {
  // Use constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Update security configuration
 */
export function updateSecurityConfig(config: Partial<SecurityConfig>): void {
  securityConfig = { ...securityConfig, ...config };
}

/**
 * Get current security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  return { ...securityConfig };
}

/**
 * Reset rate limiters
 */
export function resetRateLimiters(): void {
  globalLimiter.resetAll();
  userLimiter.resetAll();
  ipLimiter.resetAll();
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(userId: string, ipAddress: string) {
  return {
    global: globalLimiter.getStats("global"),
    user: userLimiter.getStats(`user:${userId}`),
    ip: ipLimiter.getStats(`ip:${ipAddress}`),
  };
}

/**
 * Create security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

/**
 * Log security event
 */
export function logSecurityEvent(
  eventType: string,
  userId: string | undefined,
  ipAddress: string | undefined,
  details: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    eventType,
    userId,
    ipAddress,
    details,
  }));
}
