import crypto from "crypto";
import { TRPCError } from "@trpc/server";

interface CSRFToken {
  token: string;
  createdAt: number;
  expiresAt: number;
}

class CSRFProtectionService {
  private tokens: Map<string, CSRFToken> = new Map();
  private readonly tokenLifetime = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Clean up expired tokens every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    const now = Date.now();

    this.tokens.set(token, {
      token,
      createdAt: now,
      expiresAt: now + this.tokenLifetime,
    });

    return token;
  }

  validateToken(token: string): boolean {
    const csrfToken = this.tokens.get(token);
    if (!csrfToken) return false;

    // Check if token has expired
    if (Date.now() > csrfToken.expiresAt) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  consumeToken(token: string): boolean {
    const isValid = this.validateToken(token);
    if (isValid) {
      this.tokens.delete(token);
    }
    return isValid;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.tokens.forEach((csrfToken, token) => {
      if (now > csrfToken.expiresAt) {
        keysToDelete.push(token);
      }
    });
    keysToDelete.forEach((key) => this.tokens.delete(key));
  }
}

export const csrfProtection = new CSRFProtectionService();

export function validateCSRFToken(token: string | undefined): void {
  if (!token || !csrfProtection.validateToken(token)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invalid CSRF token. Please try again.",
    });
  }
}

export function consumeCSRFToken(token: string | undefined): void {
  if (!token || !csrfProtection.consumeToken(token)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invalid CSRF token. Please try again.",
    });
  }
}
