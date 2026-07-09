/**
 * OAuth Provider Configuration
 * Supports Google and Apple OAuth with test credentials
 */

import { ENV } from "./env";

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

// Google OAuth Configuration
export const googleOAuthConfig: OAuthProvider = {
  name: "google",
  clientId: ENV.googleOAuthClientId || "test-google-client-id",
  clientSecret: ENV.googleOAuthClientSecret || "test-google-client-secret",
  redirectUri: `${ENV.appUrl}/api/oauth/google/callback`,
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
};

// Apple OAuth Configuration
export const appleOAuthConfig: OAuthProvider = {
  name: "apple",
  clientId: ENV.appleOAuthClientId || "test-apple-client-id",
  clientSecret: ENV.appleOAuthClientSecret || "test-apple-client-secret",
  redirectUri: `${ENV.appUrl}/api/oauth/apple/callback`,
  authorizationUrl: "https://appleid.apple.com/auth/authorize",
  tokenUrl: "https://appleid.apple.com/auth/token",
  userInfoUrl: "https://appleid.apple.com/auth/userinfo",
};

/**
 * Generate OAuth authorization URL
 */
export function generateAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  scope: string[] = []
): string {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: "code",
    state,
    scope: scope.join(" "),
  });

  if (provider.name === "apple") {
    params.set("response_mode", "form_post");
  }

  return `${provider.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string
): Promise<{ accessToken: string; idToken?: string; expiresIn: number }> {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    client_secret: provider.clientSecret || "",
    code,
    grant_type: "authorization_code",
    redirect_uri: provider.redirectUri,
  });

  const response = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    expiresIn: data.expires_in || 3600,
  };
}

/**
 * Get user info from OAuth provider
 */
export async function getUserInfo(
  provider: OAuthProvider,
  accessToken: string
): Promise<{ id: string; email: string; name: string; picture?: string }> {
  const response = await fetch(provider.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize user info based on provider
  if (provider.name === "google") {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } else if (provider.name === "apple") {
    return {
      id: data.sub,
      email: data.email,
      name: data.name || "Apple User",
    };
  }

  throw new Error(`Unknown OAuth provider: ${provider.name}`);
}
