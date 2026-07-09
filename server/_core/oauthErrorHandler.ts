import { TRPCError } from "@trpc/server";

export type OAuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "INVALID_TOKEN"
  | "PROVIDER_ERROR"
  | "ACCOUNT_LINKED"
  | "ACCOUNT_NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "INVALID_REDIRECT_URI";

export const oauthErrorMessages: Record<OAuthErrorCode, string> = {
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  INVALID_TOKEN: "Invalid authentication token. Please sign in again.",
  PROVIDER_ERROR: "Authentication provider is temporarily unavailable. Please try again later.",
  ACCOUNT_LINKED: "This account is already linked to another provider.",
  ACCOUNT_NOT_FOUND: "Account not found. Please sign up first.",
  RATE_LIMIT_EXCEEDED: "Too many login attempts. Please try again in 15 minutes.",
  INVALID_REDIRECT_URI: "Invalid redirect URI. Please contact support.",
};

export function handleOAuthError(code: OAuthErrorCode, details?: string): TRPCError {
  const message = oauthErrorMessages[code];
  console.error(`[OAuth Error] ${code}: ${details || message}`);

  return new TRPCError({
    code: code === "RATE_LIMIT_EXCEEDED" ? "TOO_MANY_REQUESTS" : "UNAUTHORIZED",
    message,
    cause: details,
  });
}

export function validateOAuthProvider(provider: string): boolean {
  const validProviders = ["google", "apple"];
  return validProviders.includes(provider.toLowerCase());
}

export function validateOAuthToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  if (token.length < 10 || token.length > 5000) return false;
  return true;
}
