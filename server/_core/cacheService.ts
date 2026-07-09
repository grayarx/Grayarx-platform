/**
 * Comprehensive Caching Service
 * Handles all caching needs: audit logs, security data, user sessions, compliance reports
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
      hits: 0,
    });
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry.data).length;
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * Cache audit logs
 */
export function cacheAuditLogs(userId: string, logs: any[], ttlSeconds: number = 600) {
  cacheService.set(`audit_logs_${userId}`, logs, ttlSeconds);
}

/**
 * Get cached audit logs
 */
export function getCachedAuditLogs(userId: string): any[] | null {
  return cacheService.get(`audit_logs_${userId}`);
}

/**
 * Cache security metrics
 */
export function cacheSecurityMetrics(dealershipId: string, metrics: any, ttlSeconds: number = 300) {
  cacheService.set(`security_metrics_${dealershipId}`, metrics, ttlSeconds);
}

/**
 * Get cached security metrics
 */
export function getCachedSecurityMetrics(dealershipId: string): any | null {
  return cacheService.get(`security_metrics_${dealershipId}`);
}

/**
 * Cache compliance reports
 */
export function cacheComplianceReport(framework: string, report: any, ttlSeconds: number = 1800) {
  cacheService.set(`compliance_${framework}`, report, ttlSeconds);
}

/**
 * Get cached compliance report
 */
export function getCachedComplianceReport(framework: string): any | null {
  return cacheService.get(`compliance_${framework}`);
}

/**
 * Cache user sessions
 */
export function cacheUserSession(userId: string, session: any, ttlSeconds: number = 3600) {
  cacheService.set(`session_${userId}`, session, ttlSeconds);
}

/**
 * Get cached user session
 */
export function getCachedUserSession(userId: string): any | null {
  return cacheService.get(`session_${userId}`);
}

/**
 * Invalidate user cache
 */
export function invalidateUserCache(userId: string): void {
  cacheService.delete(`audit_logs_${userId}`);
  cacheService.delete(`session_${userId}`);
}

/**
 * Invalidate dealership cache
 */
export function invalidateDealershipCache(dealershipId: string): void {
  cacheService.delete(`security_metrics_${dealershipId}`);
}

/**
 * Invalidate all compliance cache
 */
export function invalidateComplianceCache(): void {
  const keys = cacheService.keys();
  for (const key of keys) {
    if (key.startsWith("compliance_")) {
      cacheService.delete(key);
    }
  }
}

export default cacheService;
