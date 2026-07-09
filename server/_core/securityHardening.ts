import { Request, Response, NextFunction } from 'express';

/**
 * Security Hardening Module
 * Implements CORS, CSRF, SQL injection prevention, XSS protection, and rate limiting
 */

// ============ CORS Configuration ============
export const corsConfig = {
  origin: [
    'https://www.grayarx.com',
    'https://grayarx.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400, // 24 hours
};

// ============ Security Headers ============
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Clickjacking protection
  res.setHeader('X-Frame-Options', 'DENY');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Feature Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
}

// ============ CSRF Protection ============
export class CSRFProtection {
  private tokens = new Map<string, string>();

  generateToken(sessionId: string): string {
    const token = require('crypto').randomBytes(32).toString('hex');
    this.tokens.set(sessionId, token);
    return token;
  }

  verifyToken(sessionId: string, token: string): boolean {
    const storedToken = this.tokens.get(sessionId);
    return storedToken === token;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const token = (req.headers['x-csrf-token'] as string) || '';
        const sessionId = (req as any).sessionID || 'anonymous';

        if (!this.verifyToken(sessionId, token)) {
          return res.status(403).json({ error: 'CSRF token invalid' });
        }
      }
      next();
    };
  }
}

// ============ SQL Injection Prevention ============
export const SQLInjectionPrevention = {
  /**
   * Validate and sanitize SQL identifiers
   */
  sanitizeIdentifier(identifier: string): string {
    if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
      throw new Error('Invalid SQL identifier');
    }
    return identifier;
  },

  /**
   * Validate input types
   */
  validateInput(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string' && value.length < 1000;
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^\+?[0-9\s\-()]+$/.test(value);
      default:
        return false;
    }
  },

  /**
   * Escape SQL strings
   */
  escapeString(str: string): string {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  },
};

// ============ XSS Prevention ============
export const XSSPrevention = {
  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return html.replace(/[&<>"']/g, (char) => map[char]);
  },

  /**
   * Validate URLs
   */
  isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Strip dangerous attributes
   */
  stripDangerousAttributes(html: string): string {
    return html
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/<script[^>]*>.*?<\/script>/gi, ''); // Remove script tags
  },
};

// ============ Authentication Rate Limiting ============
export class AuthRateLimiter {
  private attempts = new Map<string, { count: number; timestamp: number }>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 60000; // 1 minute

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now - record.timestamp > this.windowMs) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// ============ Input Validation ============
export const InputValidation = {
  /**
   * Validate dealership data
   */
  validateDealershipInput(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.length < 3) {
      errors.push('Invalid dealership name');
    }

    if (!data.email || !SQLInjectionPrevention.validateInput(data.email, 'email')) {
      errors.push('Invalid email address');
    }

    if (!data.phone || !SQLInjectionPrevention.validateInput(data.phone, 'phone')) {
      errors.push('Invalid phone number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate email data
   */
  validateEmailInput(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.to || !SQLInjectionPrevention.validateInput(data.to, 'email')) {
      errors.push('Invalid recipient email');
    }

    if (!data.subject || typeof data.subject !== 'string' || data.subject.length < 3) {
      errors.push('Invalid email subject');
    }

    if (!data.body || typeof data.body !== 'string' || data.body.length < 10) {
      errors.push('Invalid email body');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// ============ Secure Password Hashing ============
export const PasswordSecurity = {
  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, 12);
  },

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  },

  /**
   * Validate password strength
   */
  validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default {
  corsConfig,
  securityHeaders,
  CSRFProtection,
  SQLInjectionPrevention,
  XSSPrevention,
  AuthRateLimiter,
  InputValidation,
  PasswordSecurity,
};
