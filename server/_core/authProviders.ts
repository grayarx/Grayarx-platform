/**
 * Multi-provider authentication service
 * Supports: Manus OAuth, Google, Email/Password, Phone OTP, Username/Password
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

export type AuthProvider = "manus" | "google" | "email" | "phone" | "username";

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  username?: string;
  provider: AuthProvider;
  name?: string;
  avatar?: string;
  createdAt: Date;
}

/**
 * Email/Password authentication
 */
export async function authenticateWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (!email || !password) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Email and password required",
    });
  }

  // TODO: Implement actual email/password authentication
  // For now, return mock user
  return {
    id: `email-${email}`,
    email,
    provider: "email",
    name: email.split("@")[0],
    createdAt: new Date(),
  };
}

/**
 * Phone OTP authentication
 */
export async function sendPhoneOTP(phone: string): Promise<{ sessionId: string }> {
  if (!phone) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Phone number required",
    });
  }

  // TODO: Integrate with SMS provider (Twilio, etc.)
  // For now, return mock session
  return {
    sessionId: `phone-${Date.now()}`,
  };
}

export async function verifyPhoneOTP(
  sessionId: string,
  otp: string,
  phone: string,
): Promise<AuthUser> {
  if (!otp || !sessionId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "OTP and session ID required",
    });
  }

  // TODO: Verify OTP against SMS provider
  // For now, accept any 6-digit code
  if (!/^\d{6}$/.test(otp)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid OTP format",
    });
  }

  return {
    id: `phone-${phone}`,
    phone,
    provider: "phone",
    createdAt: new Date(),
  };
}

/**
 * Username/Password authentication
 */
export async function authenticateWithUsername(
  username: string,
  password: string,
): Promise<AuthUser> {
  if (!username || !password) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Username and password required",
    });
  }

  // TODO: Implement actual username/password authentication
  // For now, return mock user
  return {
    id: `username-${username}`,
    username,
    provider: "username",
    name: username,
    createdAt: new Date(),
  };
}

/**
 * Google OAuth callback
 */
export async function handleGoogleCallback(googleUser: {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}): Promise<AuthUser> {
  if (!googleUser.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid Google user data",
    });
  }

  return {
    id: `google-${googleUser.id}`,
    email: googleUser.email,
    provider: "google",
    name: googleUser.name,
    avatar: googleUser.picture,
    createdAt: new Date(),
  };
}

/**
 * Validate authentication input
 */
export const emailAuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const phoneAuthSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
});

export const phoneOTPSchema = z.object({
  sessionId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
});

export const usernameAuthSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
