import { TRPCError } from "@trpc/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  check(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count < this.maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }

  getRemaining(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(key: string): number {
    const entry = this.store.get(key);
    return entry?.resetTime || Date.now();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.store.forEach((entry, token) => {
      if (now > entry.resetTime) {
        keysToDelete.push(token);
      }
    });
    keysToDelete.forEach((key) => this.store.delete(key));
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}

// Global rate limiters
export const loginLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
export const signupLimiter = new RateLimiter(60 * 60 * 1000, 3); // 3 attempts per hour
export const passwordResetLimiter = new RateLimiter(60 * 60 * 1000, 3); // 3 attempts per hour
export const otpLimiter = new RateLimiter(5 * 60 * 1000, 3); // 3 attempts per 5 minutes

export function checkRateLimit(limiter: RateLimiter, key: string): void {
  if (!limiter.check(key)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later.",
    });
  }
}
