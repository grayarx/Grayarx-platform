import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { apiKeys, type ApiKey } from "../drizzle/schema";

/**
 * Generate a new API key (format: grayarx_<random>)
 * Returns the plaintext key (only shown once to user)
 */
export function generateApiKey(): string {
  const randomPart = crypto.randomBytes(32).toString("hex");
  return `grayarx_${randomPart}`;
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Create a new API key for a dealership
 */
export async function createApiKey(
  dealershipId: number,
  name: string,
  scopes: string[] = ["read_leads", "write_leads", "read_inventory"]
): Promise<{ key: string; keyId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const plainKey = generateApiKey();
    const keyHash = hashApiKey(plainKey);

    const result = await db.insert(apiKeys).values({
      dealershipId,
      keyHash,
      name,
      scopes: JSON.stringify(scopes),
      active: 1,
    });

    return {
      key: plainKey,
      keyId: (result as any).insertId || result[0],
    };
  } catch (error) {
    console.error("[ApiKeyService] Failed to create API key:", error);
    return null;
  }
}

/**
 * Validate an API key and return the associated dealership
 */
export async function validateApiKey(
  key: string
): Promise<{ dealershipId: number; scopes: string[]; keyId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const keyHash = hashApiKey(key);

    const result = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.active, 1)));

    if (!result.length) {
      return null;
    }

    const apiKey = result[0];

    // Check expiration
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return null;
    }

    // Update last used time
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    const scopes = JSON.parse(apiKey.scopes as string);

    return {
      dealershipId: apiKey.dealershipId,
      scopes,
      keyId: apiKey.id,
    };
  } catch (error) {
    console.error("[ApiKeyService] Failed to validate API key:", error);
    return null;
  }
}

/**
 * List all API keys for a dealership
 */
export async function listApiKeys(dealershipId: number): Promise<
  Array<{
    id: number;
    name: string;
    scopes: string[];
    active: boolean;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  try {
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.dealershipId, dealershipId));

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      scopes: JSON.parse(k.scopes as string),
      active: k.active === 1,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
    }));
  } catch (error) {
    console.error("[ApiKeyService] Failed to list API keys:", error);
    return [];
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(apiKeys)
      .set({ active: 0 })
      .where(eq(apiKeys.id, keyId));

    return true;
  } catch (error) {
    console.error("[ApiKeyService] Failed to revoke API key:", error);
    return false;
  }
}

/**
 * Check if a key has a specific scope
 */
export function hasScope(scopes: string[], requiredScope: string): boolean {
  return scopes.includes(requiredScope) || scopes.includes("*");
}

/**
 * Rate limiter for API keys (simple in-memory implementation)
 * In production, use Redis for distributed rate limiting
 */
const rateLimitMap = new Map<number, { count: number; resetAt: number }>();

export function checkRateLimit(keyId: number, limit = 1000): boolean {
  const now = Date.now();
  const hourMs = 3600000;

  if (!rateLimitMap.has(keyId)) {
    rateLimitMap.set(keyId, { count: 1, resetAt: now + hourMs });
    return true;
  }

  const current = rateLimitMap.get(keyId)!;

  if (now > current.resetAt) {
    // Reset the limit
    rateLimitMap.set(keyId, { count: 1, resetAt: now + hourMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(
  keyId: number,
  limit = 1000
): { remaining: number; resetAt: Date } {
  const hourMs = 3600000;
  const now = Date.now();

  if (!rateLimitMap.has(keyId)) {
    return {
      remaining: limit,
      resetAt: new Date(now + hourMs),
    };
  }

  const current = rateLimitMap.get(keyId)!;

  if (now > current.resetAt) {
    return {
      remaining: limit,
      resetAt: new Date(now + hourMs),
    };
  }

  return {
    remaining: Math.max(0, limit - current.count),
    resetAt: new Date(current.resetAt),
  };
}
