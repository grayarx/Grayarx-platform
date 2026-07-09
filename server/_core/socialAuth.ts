import { OAuth2Client } from "google-auth-library";
import { getDb } from "../db";
import { users, userSocialAccounts } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const googleClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

/**
 * Verify Google ID token and extract user info
 */
export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid token payload");

    return {
      providerId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    };
  } catch (error) {
    throw new Error(`Google token verification failed: ${error}`);
  }
}

/**
 * Verify Apple ID token (simplified - in production use apple-auth-token-verifier)
 */
export async function verifyAppleToken(idToken: string) {
  // In production, verify the JWT signature using Apple's public keys
  // For now, we'll just decode it (NOT SECURE - for demo only)
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new Error("Invalid token format");

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    return {
      providerId: payload.sub,
      email: payload.email,
      name: payload.name || "Apple User",
      avatarUrl: null,
    };
  } catch (error) {
    throw new Error(`Apple token verification failed: ${error}`);
  }
}

/**
 * Link social account to existing user
 */
export async function linkSocialAccount(
  userId: number,
  provider: "google" | "apple",
  providerId: string,
  email?: string,
  name?: string,
  avatarUrl?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if social account already linked to another user
  const existing = await db
    .select()
    .from(userSocialAccounts)
    .where(
      and(
        eq(userSocialAccounts.provider, provider),
        eq(userSocialAccounts.providerId, providerId)
      )
    )
    .limit(1);

  if (existing.length > 0 && existing[0].userId !== userId) {
    throw new Error("This social account is already linked to another user");
  }

  if (existing.length > 0) {
    // Update existing link
    await db
      .update(userSocialAccounts)
      .set({
        email,
        name,
        avatarUrl,
        linkedAt: new Date(),
      })
      .where(eq(userSocialAccounts.id, existing[0].id));
  } else {
    // Create new link
    await db.insert(userSocialAccounts).values({
      userId,
      provider,
      providerId,
      email,
      name,
      avatarUrl,
    });
  }
}

/**
 * Get or create user from social login
 */
export async function getOrCreateUserFromSocial(
  provider: "google" | "apple",
  providerId: string,
  email: string,
  name: string,
  avatarUrl?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if social account exists
  const socialAccount = await db
    .select()
    .from(userSocialAccounts)
    .where(
      and(
        eq(userSocialAccounts.provider, provider),
        eq(userSocialAccounts.providerId, providerId)
      )
    )
    .limit(1);

  if (socialAccount.length > 0) {
    // Return existing user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, socialAccount[0].userId))
      .limit(1);

    return user[0];
  }

  // Check if user exists by email
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    // Link social account to existing user
    await linkSocialAccount(
      existingUser[0].id,
      provider,
      providerId,
      email,
      name,
      avatarUrl
    );
    return existingUser[0];
  }

  // Create new user
  const openId = `${provider}-${providerId}`;
  await db.insert(users).values({
    openId,
    name,
    email,
    loginMethod: provider,
    role: "user",
  });

  // Get the newly created user
  const newUserResult = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  if (!newUserResult[0]) throw new Error("Failed to create user");
  const userId = newUserResult[0].id;
  await linkSocialAccount(userId, provider, providerId, email, name, avatarUrl);

  // Return new user
  return newUserResult[0];
}

/**
 * Unlink social account from user
 */
export async function unlinkSocialAccount(
  userId: number,
  provider: "google" | "apple"
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if user has other login methods
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) throw new Error("User not found");

  // Don't allow unlinking if it's the only login method
  if (
    user[0].loginMethod === provider &&
    !user[0].passwordHash &&
    !user[0].email
  ) {
    throw new Error(
      "Cannot unlink your only login method. Add a password first."
    );
  }

  // Delete social account link
  await db
    .delete(userSocialAccounts)
    .where(
      and(
        eq(userSocialAccounts.userId, userId),
        eq(userSocialAccounts.provider, provider)
      )
    );
}

/**
 * Get all social accounts linked to user
 */
export async function getSocialAccounts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return await db
    .select()
    .from(userSocialAccounts)
    .where(eq(userSocialAccounts.userId, userId));
}
