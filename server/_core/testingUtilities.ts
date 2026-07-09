import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testing utilities for authentication system
 */

export interface TestUser {
  id: number;
  email: string;
  password: string;
  name: string;
}

/**
 * Create a test user for testing
 */
export async function createTestUser(email: string, password: string, name: string): Promise<TestUser | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    await db
      .insert(users)
      .values({
        openId: `test-${Date.now()}`,
        email,
        passwordHash: password, // In tests, we use plain password
        name,
        role: "user",
        createdAt: new Date(),
      });

    // Get the created user
    const result = await db.select().from(users).where(eq(users.email, email));

    if (result.length > 0) {
      return {
        id: result[0].id,
        email: result[0].email || "",
        password,
        name: result[0].name || "",
      };
    }
  } catch (error) {
    console.error("[TestingUtilities] Failed to create test user:", error);
  }
  return null;
}

/**
 * Delete a test user
 */
export async function deleteTestUser(email: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.delete(users).where(eq(users.email, email));
    return true;
  } catch (error) {
    console.error("[TestingUtilities] Failed to delete test user:", error);
  }
  return false;
}

/**
 * Get a test user by email
 */
export async function getTestUser(email: string): Promise<TestUser | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(users).where(eq(users.email, email));

    if (result.length > 0) {
      return {
        id: result[0].id,
        email: result[0].email || "",
        password: "", // Not returned from DB
        name: result[0].name || "",
      };
    }
  } catch (error) {
    console.error("[TestingUtilities] Failed to get test user:", error);
  }
  return null;
}

/**
 * Generate test OTP code
 */
export function generateTestOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate test token
 */
export function generateTestToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate test email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@grayarx.test`;
}

/**
 * Mock SMS sending
 */
export const mockSMSService = {
  sentMessages: [] as Array<{ phone: string; message: string }>,
  send: function (phone: string, message: string) {
    this.sentMessages.push({ phone, message });
    return { success: true, messageId: `mock-${Date.now()}` };
  },
  clear: function () {
    this.sentMessages = [];
  },
  getLastMessage: function () {
    return this.sentMessages[this.sentMessages.length - 1] || null;
  },
};

/**
 * Mock email sending
 */
export const mockEmailService = {
  sentEmails: [] as Array<{ to: string; subject: string; html: string }>,
  send: function (to: string, subject: string, html: string) {
    this.sentEmails.push({ to, subject, html });
    return { success: true, messageId: `mock-${Date.now()}` };
  },
  clear: function () {
    this.sentEmails = [];
  },
  getLastEmail: function () {
    return this.sentEmails[this.sentEmails.length - 1] || null;
  },
};

/**
 * Wait for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert function for tests
 */
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
