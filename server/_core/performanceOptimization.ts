/**
 * Performance Optimization Module
 * Implements caching, compression, and query optimization
 */

// Placeholder for Redis client (optional integration)
const redisClient = {
  get: async (key: string) => null as string | null,
  setEx: async (key: string, ttl: number, value: string) => {},
  incr: async (key: string) => 1,
  expire: async (key: string, ttl: number) => {},
};

/**
 * Cache decorator for functions
 */
export function withCache(ttl: number = 3600) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;

      try {
        // Try to get from cache
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          console.log(`[Cache] HIT: ${cacheKey}`);
          return JSON.parse(cached);
        }
      } catch (error: any) {
        console.warn('[Cache] Get error:', error);
      }

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      try {
        await redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
        console.log(`[Cache] SET: ${cacheKey} (TTL: ${ttl}s)`);
      } catch (error: any) {
        console.warn('[Cache] Set error:', error);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Query optimization helpers
 */
export const QueryOptimization = {
  /**
   * Add indexes to frequently queried columns
   */
  async createIndexes(db: any) {
    try {
      // Dealership indexes
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_dealership_status ON dealerships(status)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_dealership_created_at ON dealerships(created_at)`);

      // Email sequence indexes
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_email_sequences_scheduled_at ON post_signup_email_sequences(scheduled_at)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON post_signup_email_sequences(status)`);

      // Agent log indexes
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_type ON agent_logs(agent_type)`);

      console.log('[Optimization] Indexes created successfully');
    } catch (error) {
      console.error('[Optimization] Index creation error:', error);
    }
  },

  /**
   * Batch load related data to prevent N+1 queries
   */
  async batchLoadDealerships(ids: string[], db: any) {
    const placeholders = ids.map(() => '?').join(',');
    return db.query(
      `SELECT * FROM dealerships WHERE id IN (${placeholders})`,
      ids
    );
  },

  /**
   * Paginate results
   */
  paginate(query: string, limit: number = 20, offset: number = 0) {
    return `${query} LIMIT ${limit} OFFSET ${offset}`;
  },
};

/**
 * Rate limiting with Redis
 */
export const RateLimiter = {
  async checkLimit(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, window);
      }
      return current <= limit;
    } catch (error) {
      console.error('[RateLimiter] Error:', error);
      return true; // Fail open
    }
  },

  async getRemaining(key: string, limit: number): Promise<number> {
    try {
      const current = await redisClient.get(key);
      return Math.max(0, limit - (parseInt(current || '0')));
    } catch (error) {
      return limit;
    }
  },
};

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

/**
 * Connection pooling configuration
 */
export const ConnectionPool = {
  config: {
    min: 5,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  /**
   * Health check for connections
   */
  async healthCheck(pool: any): Promise<boolean> {
    try {
      const connection = await pool.connect();
      await connection.query('SELECT 1');
      connection.release();
      return true;
    } catch (error) {
      console.error('[ConnectionPool] Health check failed:', error);
      return false;
    }
  },
};

/**
 * Compression utilities
 */
export const Compression = {
  /**
   * Compress response data
   */
  shouldCompress(size: number): boolean {
    return size > 1024; // Compress if > 1KB
  },

  /**
   * Estimate compression ratio
   */
  estimateRatio(data: string): number {
    // JSON typically compresses to 30-40% of original size
    return 0.35;
  },
};

export default {
  withCache,
  QueryOptimization,
  RateLimiter,
  CircuitBreaker,
  ConnectionPool,
  Compression,
};
