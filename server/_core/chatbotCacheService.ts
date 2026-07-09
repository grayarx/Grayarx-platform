/**
 * Advanced Response Caching Service
 * Caches responses for performance optimization
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  averageHits: number;
  memoryUsage: number;
}

/**
 * LRU Cache with TTL support
 */
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttl: number = 60 * 60 * 1000): void {
    // Remove expired entries
    this.removeExpired();

    // If cache is full, remove least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      let lruKey: string | null = null;
      let lruTime = Infinity;

      for (const [k, entry] of this.cache.entries()) {
        if (entry.lastAccessed < lruTime) {
          lruTime = entry.lastAccessed;
          lruKey = k;
        }
      }

      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now(),
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Update access info
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.hits++;

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  private removeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): CacheStats {
    this.removeExpired();
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    const missRate = total > 0 ? (this.misses / total) * 100 : 0;
    const avgHits =
      this.cache.size > 0
        ? Array.from(this.cache.values()).reduce((sum, e) => sum + e.hits, 0) / this.cache.size
        : 0;

    // Rough memory estimation
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry).length;
    }

    return {
      totalEntries: this.cache.size,
      hitRate,
      missRate,
      averageHits: Math.round(avgHits),
      memoryUsage,
    };
  }

  getSize(): number {
    return this.cache.size;
  }

  getEntries(): CacheEntry<T>[] {
    return Array.from(this.cache.values());
  }
}

// Global caches
const responseCache = new LRUCache<string>(1000);
const faqCache = new LRUCache<any>(500);
const entityCache = new LRUCache<any>(500);
const intentCache = new LRUCache<any>(500);

/**
 * Generate cache key for response
 */
function generateResponseKey(
  userMessage: string,
  language: string,
  userId?: string
): string {
  const hash = userMessage.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
  return `response:${language}:${hash}:${userId || "anon"}`;
}

/**
 * Generate cache key for FAQ
 */
function generateFAQKey(query: string, language: string): string {
  const hash = query.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
  return `faq:${language}:${hash}`;
}

/**
 * Generate cache key for entity extraction
 */
function generateEntityKey(text: string): string {
  const hash = text.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
  return `entity:${hash}`;
}

/**
 * Generate cache key for intent detection
 */
function generateIntentKey(text: string): string {
  const hash = text.toLowerCase().replace(/\s+/g, "_").substring(0, 50);
  return `intent:${hash}`;
}

/**
 * Cache response
 */
export function cacheResponse(
  userMessage: string,
  response: string,
  language: string,
  userId?: string,
  ttl?: number
): void {
  const key = generateResponseKey(userMessage, language, userId);
  responseCache.set(key, response, ttl || 24 * 60 * 60 * 1000); // 24 hours default
}

/**
 * Get cached response
 */
export function getCachedResponse(
  userMessage: string,
  language: string,
  userId?: string
): string | undefined {
  const key = generateResponseKey(userMessage, language, userId);
  return responseCache.get(key);
}

/**
 * Cache FAQ results
 */
export function cacheFAQ(query: string, results: any[], language: string, ttl?: number): void {
  const key = generateFAQKey(query, language);
  faqCache.set(key, results, ttl || 7 * 24 * 60 * 60 * 1000); // 7 days default
}

/**
 * Get cached FAQ results
 */
export function getCachedFAQ(query: string, language: string): any[] | undefined {
  const key = generateFAQKey(query, language);
  return faqCache.get(key);
}

/**
 * Cache entity extraction results
 */
export function cacheEntities(text: string, entities: any[], ttl?: number): void {
  const key = generateEntityKey(text);
  entityCache.set(key, entities, ttl || 24 * 60 * 60 * 1000); // 24 hours default
}

/**
 * Get cached entities
 */
export function getCachedEntities(text: string): any[] | undefined {
  const key = generateEntityKey(text);
  return entityCache.get(key);
}

/**
 * Cache intent detection results
 */
export function cacheIntent(text: string, intent: any, ttl?: number): void {
  const key = generateIntentKey(text);
  intentCache.set(key, intent, ttl || 24 * 60 * 60 * 1000); // 24 hours default
}

/**
 * Get cached intent
 */
export function getCachedIntent(text: string): any | undefined {
  const key = generateIntentKey(text);
  return intentCache.get(key);
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  responseCache.clear();
  faqCache.clear();
  entityCache.clear();
  intentCache.clear();
}

/**
 * Clear specific cache
 */
export function clearCache(type: "response" | "faq" | "entity" | "intent"): void {
  switch (type) {
    case "response":
      responseCache.clear();
      break;
    case "faq":
      faqCache.clear();
      break;
    case "entity":
      entityCache.clear();
      break;
    case "intent":
      intentCache.clear();
      break;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): Record<string, CacheStats> {
  return {
    response: responseCache.getStats(),
    faq: faqCache.getStats(),
    entity: entityCache.getStats(),
    intent: intentCache.getStats(),
  };
}

/**
 * Get total cache size
 */
export function getTotalCacheSize(): number {
  return (
    responseCache.getSize() +
    faqCache.getSize() +
    entityCache.getSize() +
    intentCache.getSize()
  );
}

/**
 * Invalidate response cache for user
 */
export function invalidateUserCache(userId: string): void {
  // This would require tracking user-specific cache keys
  // For now, clear all response cache
  responseCache.clear();
}

/**
 * Warm cache with common queries
 */
export function warmCache(
  commonQueries: Array<{ query: string; response: string; language: string }>
): void {
  for (const item of commonQueries) {
    cacheResponse(item.query, item.response, item.language, undefined, 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Export cache data for backup
 */
export function exportCacheData(): {
  responses: CacheEntry<string>[];
  faqs: CacheEntry<any>[];
  entities: CacheEntry<any>[];
  intents: CacheEntry<any>[];
} {
  return {
    responses: responseCache.getEntries(),
    faqs: faqCache.getEntries(),
    entities: entityCache.getEntries(),
    intents: intentCache.getEntries(),
  };
}

/**
 * Import cache data from backup
 */
export function importCacheData(data: {
  responses?: CacheEntry<string>[];
  faqs?: CacheEntry<any>[];
  entities?: CacheEntry<any>[];
  intents?: CacheEntry<any>[];
}): void {
  if (data.responses) {
    for (const entry of data.responses) {
      responseCache.set(entry.key, entry.value, entry.ttl);
    }
  }

  if (data.faqs) {
    for (const entry of data.faqs) {
      faqCache.set(entry.key, entry.value, entry.ttl);
    }
  }

  if (data.entities) {
    for (const entry of data.entities) {
      entityCache.set(entry.key, entry.value, entry.ttl);
    }
  }

  if (data.intents) {
    for (const entry of data.intents) {
      intentCache.set(entry.key, entry.value, entry.ttl);
    }
  }
}
