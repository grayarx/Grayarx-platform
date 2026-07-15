import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { getUserById, updateUserLastSignedIn } from "../db";

/**
 * Session / auth SDK for GrayArx dealer login.
 * Auth is local email/password cookies (base64 JSON session) via authEnhancedRouter.
 * Manus OAuth was removed — do not reintroduce OAUTH_SERVER_URL.
 */

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);

    const customSession = this.verifyCustomSessionToken(sessionCookie);
    if (customSession) {
      const user = await getUserById(customSession.userId);
      if (user) {
        await updateUserLastSignedIn(user.id);
        return user;
      }
    }

    throw ForbiddenError("Invalid session cookie");
  }

  /**
   * Verify a custom auth session token (for email/password login)
   */
  private verifyCustomSessionToken(
    token: string | undefined | null
  ): { userId: number; email: string } | null {
    if (!token) {
      return null;
    }

    try {
      const decoded = JSON.parse(
        Buffer.from(token, "base64").toString("utf-8")
      );
      if (decoded.exp < Date.now()) {
        return null; // Token expired
      }
      return { userId: decoded.userId, email: decoded.email };
    } catch {
      return null; // Not a custom auth token
    }
  }
}

/** Result of `sdk.authenticateRequest`. */
export type AuthenticatedUser = User & {
  taskUid?: string;
  isCron?: boolean;
};

export const sdk = new SDKServer();
