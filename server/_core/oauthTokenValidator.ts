import { TRPCError } from "@trpc/server";

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  provider: string;
  userId: number;
}

interface TokenStore {
  [key: string]: OAuthToken;
}

class OAuthTokenValidator {
  private tokens: TokenStore = {};
  private readonly refreshThreshold = 5 * 60 * 1000; // Refresh if expires in 5 minutes

  storeToken(userId: number, provider: string, accessToken: string, refreshToken?: string, expiresIn?: number): OAuthToken {
    const expiresAt = Date.now() + (expiresIn || 60 * 60 * 1000); // Default 1 hour
    const tokenKey = `${provider}:${userId}`;

    const token: OAuthToken = {
      accessToken,
      refreshToken,
      expiresAt,
      provider,
      userId,
    };

    this.tokens[tokenKey] = token;
    return token;
  }

  getToken(userId: number, provider: string): OAuthToken | null {
    const tokenKey = `${provider}:${userId}`;
    return this.tokens[tokenKey] || null;
  }

  isTokenExpired(token: OAuthToken): boolean {
    return Date.now() > token.expiresAt;
  }

  needsRefresh(token: OAuthToken): boolean {
    return Date.now() > token.expiresAt - this.refreshThreshold;
  }

  validateToken(userId: number, provider: string): OAuthToken {
    const token = this.getToken(userId, provider);
    if (!token) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "OAuth token not found. Please sign in again.",
      });
    }

    if (this.isTokenExpired(token)) {
      this.revokeToken(userId, provider);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "OAuth token has expired. Please sign in again.",
      });
    }

    return token;
  }

  refreshToken(userId: number, provider: string, newAccessToken: string, newRefreshToken?: string, expiresIn?: number): OAuthToken {
    const token = this.getToken(userId, provider);
    if (!token) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "OAuth token not found.",
      });
    }

    return this.storeToken(userId, provider, newAccessToken, newRefreshToken, expiresIn);
  }

  revokeToken(userId: number, provider: string): void {
    const tokenKey = `${provider}:${userId}`;
    delete this.tokens[tokenKey];
  }

  revokeAllUserTokens(userId: number): void {
    for (const key of Object.keys(this.tokens)) {
      if (this.tokens[key].userId === userId) {
        delete this.tokens[key];
      }
    }
  }
}

export const oauthTokenValidator = new OAuthTokenValidator();
