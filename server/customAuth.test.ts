import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as customAuth from "./_core/customAuth";

describe("Custom Authentication", () => {
  const testEmail = `test-${Date.now()}@grayarx.com`;
  const testPassword = "TestPassword123";
  const testName = "Test User";

  beforeAll(async () => {
    // Ensure database is initialized
    await db.getDb();
  });

  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const hash = await customAuth.hashPassword(testPassword);
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(testPassword);
      expect(hash.length).toBeGreaterThan(20);
    });

    it("should verify a correct password", async () => {
      const hash = await customAuth.hashPassword(testPassword);
      const isValid = await customAuth.verifyPassword(testPassword, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const hash = await customAuth.hashPassword(testPassword);
      const isValid = await customAuth.verifyPassword("WrongPassword123", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("Signup", () => {
    it("should successfully sign up a new user", async () => {
      const result = await customAuth.signupWithEmail(testEmail, testPassword, testName);
      expect(result.success).toBe(true);
      expect(result.userId).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid email format", async () => {
      const result = await customAuth.signupWithEmail(
        "invalid-email",
        testPassword,
        testName
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email format");
    });

    it("should reject short password", async () => {
      const result = await customAuth.signupWithEmail(
        `short-${Date.now()}@grayarx.com`,
        "Short1",
        testName
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("at least 8 characters");
    });

    it("should reject password without uppercase", async () => {
      const result = await customAuth.signupWithEmail(
        `noupper-${Date.now()}@grayarx.com`,
        "nouppercase123",
        testName
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("uppercase");
    });

    it("should reject password without number", async () => {
      const result = await customAuth.signupWithEmail(
        `nonumber-${Date.now()}@grayarx.com`,
        "NoNumberPassword",
        testName
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("number");
    });

    it("should reject duplicate email", async () => {
      // First signup should succeed
      const firstResult = await customAuth.signupWithEmail(
        `duplicate-${Date.now()}@grayarx.com`,
        testPassword,
        testName
      );
      expect(firstResult.success).toBe(true);

      // Second signup with same email should fail
      const secondResult = await customAuth.signupWithEmail(
        firstResult.userId ? (await db.getUserById(firstResult.userId))?.email || "" : "",
        testPassword,
        testName
      );
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain("already registered");
    });
  });

  describe("Login", () => {
    let loginTestEmail: string;
    let loginTestPassword = "LoginTest123";

    beforeAll(async () => {
      loginTestEmail = `login-${Date.now()}@grayarx.com`;
      const signupResult = await customAuth.signupWithEmail(
        loginTestEmail,
        loginTestPassword,
        "Login Test User"
      );
      expect(signupResult.success).toBe(true);
    });

    it("should successfully login with correct credentials", async () => {
      const result = await customAuth.loginWithEmail(loginTestEmail, loginTestPassword);
      expect(result.success).toBe(true);
      expect(result.user).toBeTruthy();
      expect(result.user.email).toBe(loginTestEmail);
    });

    it("should reject login with incorrect password", async () => {
      const result = await customAuth.loginWithEmail(loginTestEmail, "WrongPassword123");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email or password");
    });

    it("should reject login with non-existent email", async () => {
      const result = await customAuth.loginWithEmail(
        "nonexistent@grayarx.com",
        loginTestPassword
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email or password");
    });
  });

  describe("Session Tokens", () => {
    it("should create a valid session token", async () => {
      const token = await customAuth.createCustomSessionToken(1, testEmail);
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("should verify a valid session token", async () => {
      const token = await customAuth.createCustomSessionToken(123, testEmail);
      const decoded = customAuth.verifyCustomSessionToken(token);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(123);
      expect(decoded?.email).toBe(testEmail);
    });

    it("should reject an invalid session token", async () => {
      const decoded = customAuth.verifyCustomSessionToken("invalid-token");
      expect(decoded).toBeNull();
    });

    it("should reject an expired session token", async () => {
      // Create a token with past expiration
      const pastToken = Buffer.from(
        JSON.stringify({
          userId: 1,
          email: testEmail,
          iat: Date.now() - 1000000,
          exp: Date.now() - 1000, // Expired 1 second ago
        })
      ).toString("base64");

      const decoded = customAuth.verifyCustomSessionToken(pastToken);
      expect(decoded).toBeNull();
    });
  });

  describe("Database Integration", () => {
    it("should store user with password hash", async () => {
      const email = `dbtest-${Date.now()}@grayarx.com`;
      const result = await customAuth.signupWithEmail(email, testPassword, testName);
      expect(result.success).toBe(true);

      const user = await db.getUserByEmail(email);
      expect(user).toBeTruthy();
      expect(user?.email).toBe(email);
      expect(user?.passwordHash).toBeTruthy();
      expect(user?.loginMethod).toBe("email");
    });

    it("should retrieve user by email", async () => {
      const email = `retrieve-${Date.now()}@grayarx.com`;
      const signupResult = await customAuth.signupWithEmail(
        email,
        testPassword,
        testName
      );
      expect(signupResult.success).toBe(true);

      const user = await db.getUserByEmail(email);
      expect(user).toBeTruthy();
      expect(user?.id).toBe(signupResult.userId);
    });

    it("should update last signed in timestamp", async () => {
      const email = `lastsignin-${Date.now()}@grayarx.com`;
      const signupResult = await customAuth.signupWithEmail(
        email,
        testPassword,
        testName
      );
      expect(signupResult.success).toBe(true);

      const userBefore = await db.getUserById(signupResult.userId!);
      const timestampBefore = userBefore?.lastSignedIn?.getTime() || 0;

      // Wait a bit and update
      await new Promise((resolve) => setTimeout(resolve, 100));
      await db.updateUserLastSignedIn(signupResult.userId!);

      const userAfter = await db.getUserById(signupResult.userId!);
      const timestampAfter = userAfter?.lastSignedIn?.getTime() || 0;

      expect(timestampAfter).toBeGreaterThanOrEqual(timestampBefore);
    });
  });
});
