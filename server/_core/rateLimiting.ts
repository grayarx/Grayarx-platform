/**
 * API Rate Limiting & Throttling Module
 * Implements token bucket, sliding window, and endpoint-specific limits
 */

/**
 * Token Bucket Rate Limiter
 */
export class TokenBucketLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(capacity: number = 100, refillRate: number = 10) {
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  isAllowed(key: string, tokensNeeded: number = 1): boolean {
    const now = Date.now() / 1000; // Convert to seconds
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if we have enough tokens
    if (bucket.tokens >= tokensNeeded) {
      bucket.tokens -= tokensNeeded;
      return true;
    }

    return false;
  }

  getRemaining(key: string): number {
    const bucket = this.buckets.get(key);
    return bucket ? Math.floor(bucket.tokens) : this.capacity;
  }

  reset(key: string) {
    this.buckets.delete(key);
  }

  cleanup() {
    const now = Date.now() / 1000;
    const bucketsArray = Array.from(this.buckets.entries());
    for (const [key, bucket] of bucketsArray) {
      if (now - bucket.lastRefill > 3600) { // Remove buckets older than 1 hour
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * Sliding Window Rate Limiter
 */
export class SlidingWindowLimiter {
  private windows = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    let requests = this.windows.get(key) || [];

    // Remove old requests outside the window
    requests = requests.filter(timestamp => now - timestamp < this.windowMs);

    if (requests.length < this.limit) {
      requests.push(now);
      this.windows.set(key, requests);
      return true;
    }

    this.windows.set(key, requests);
    return false;
  }

  getRemaining(key: string): number {
    const now = Date.now();
    let requests = this.windows.get(key) || [];
    requests = requests.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.limit - requests.length);
  }

  getResetTime(key: string): number {
    const requests = this.windows.get(key) || [];
    if (requests.length === 0) return 0;
    return requests[0] + this.windowMs;
  }

  reset(key: string) {
    this.windows.delete(key);
  }
}

/**
 * Endpoint-specific rate limiters
 */
export const EndpointLimiters = {
  // Global limiter: 1000 requests/minute per IP
  global: new TokenBucketLimiter(1000, 16.67), // ~1000 per minute

  // User limiter: 100 requests/minute per user
  perUser: new TokenBucketLimiter(100, 1.67), // ~100 per minute

  // Dealership signup: 10/hour per IP
  dealershipSignup: new SlidingWindowLimiter(10, 3600000),

  // Email sending: 100/hour per dealership
  emailSending: new SlidingWindowLimiter(100, 3600000),

  // Agent queries: 1000/hour per user
  agentQueries: new SlidingWindowLimiter(1000, 3600000),

  // Login attempts: 5/minute per email
  loginAttempts: new SlidingWindowLimiter(5, 60000),

  // Password reset: 3/hour per email
  passwordReset: new SlidingWindowLimiter(3, 3600000),

  // API key generation: 10/day per user
  apiKeyGeneration: new SlidingWindowLimiter(10, 86400000),
};

/**
 * Rate limit middleware
 */
export function createRateLimitMiddleware(
  limiter: TokenBucketLimiter | SlidingWindowLimiter,
  keyExtractor: (req: any) => string
) {
  return (req: any, res: any, next: any) => {
    const key = keyExtractor(req);
    const remaining = (limiter as any).getRemaining(key);

    if (!limiter.isAllowed(key)) {
      const resetTime = limiter instanceof SlidingWindowLimiter ? limiter.getResetTime(key) : Date.now() + 60000;
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 60);

    next();
  };
}

/**
 * Distributed rate limiting (for multi-instance deployments)
 */
export class DistributedRateLimiter {
  private localCache = new Map<string, { count: number; timestamp: number }>();
  private readonly syncInterval = 5000; // Sync every 5 seconds

  constructor(private redisClient?: any) {
    setInterval(() => this.syncWithRemote(), this.syncInterval);
  }

  async isAllowed(key: string, limit: number, window: number): Promise<boolean> {
    const now = Date.now();
    let record = this.localCache.get(key);

    if (!record || now - record.timestamp > window) {
      record = { count: 0, timestamp: now };
      this.localCache.set(key, record);
    }

    if (record.count < limit) {
      record.count++;
      return true;
    }

    return false;
  }

  private async syncWithRemote() {
    if (!this.redisClient) return;

    const cacheArray = Array.from(this.localCache.entries());
    for (const [key, record] of cacheArray) {
      try {
        // Sync with Redis
        await this.redisClient.setEx(
          `ratelimit:${key}`,
          300, // 5 minute TTL
          JSON.stringify(record)
        );
      } catch (error) {
        console.error('[DistributedRateLimiter] Sync error:', error);
      }
    }
  }

  reset(key: string) {
    this.localCache.delete(key);
  }

  cleanup() {
    const now = Date.now();
    const cacheArray = Array.from(this.localCache.entries());
    for (const [key, record] of cacheArray) {
      if (now - record.timestamp > 3600000) { // Remove old records
        this.localCache.delete(key);
      }
    }
  }
}

/**
 * Graceful degradation under overload
 */
export class OverloadProtection {
  private requestQueue: Array<{ fn: () => Promise<any>; resolve: any; reject: any }> = [];
  private isProcessing = false;
  private readonly maxQueueSize = 1000;
  private readonly processingRate = 100; // requests per second

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.length >= this.maxQueueSize) {
      throw new Error('Server overloaded - request queue full');
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { fn, resolve, reject } = this.requestQueue.shift()!;

      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Rate limiting: wait before processing next request
      await new Promise(resolve => setTimeout(resolve, 1000 / this.processingRate));
    }

    this.isProcessing = false;
  }

  getQueueStats() {
    return {
      queueSize: this.requestQueue.length,
      isProcessing: this.isProcessing,
      utilizationPercent: (this.requestQueue.length / this.maxQueueSize) * 100,
    };
  }
}

// Global instances
export const globalLimiter = EndpointLimiters.global;
export const userLimiter = EndpointLimiters.perUser;
export const overloadProtection = new OverloadProtection();

export default {
  TokenBucketLimiter,
  SlidingWindowLimiter,
  EndpointLimiters,
  createRateLimitMiddleware,
  DistributedRateLimiter,
  OverloadProtection,
  globalLimiter,
  userLimiter,
  overloadProtection,
};
