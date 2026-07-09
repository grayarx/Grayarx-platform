import type { Express } from "express";

// Stub functions for custom auth
export function registerCustomAuthRoutes(_app: Express) {
  console.log("Custom auth disabled");
}

export async function generatePasswordResetToken(_userId: number): Promise<string> {
  return "stub-token";
}

export async function verifyPasswordResetToken(_token: string): Promise<number | null> {
  return null;
}

export async function consumePasswordResetToken(_token: string): Promise<boolean> {
  return false;
}

export async function generateEmailVerificationToken(_userId: number, _email: string): Promise<string> {
  return "stub-token";
}

export async function verifyEmailToken(_token: string): Promise<{ userId: number; email: string } | null> {
  return null;
}

export async function markEmailAsVerified(_userId: number, _token: string): Promise<boolean> {
  return false;
}

export async function autoVerifyEmailForDevelopment(_userId: number): Promise<boolean> {
  return false;
}

export function registerEmailVerificationRoutes(_app: Express) {
  console.log("Email verification disabled");
}

export async function requestEmailChange(_userId: number, _currentEmail: string, _newEmail: string): Promise<string | null> {
  return null;
}

export async function verifyEmailChange(_token: string): Promise<boolean> {
  return false;
}

export async function getPendingEmailChange(_userId: number): Promise<any> {
  return null;
}

export async function cancelEmailChange(_userId: number): Promise<boolean> {
  return false;
}
