export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const RETURN_PATH_KEY = "grayarx.returnPath";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Optional `returnPath` is stashed in sessionStorage so the app can redirect
// to it after OAuth completes (the OAuth portal only echoes back our state).
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Fall back to the internal login page when the OAuth portal is not
  // configured (development / local environments without OAuth set up).
  if (!oauthPortalUrl) {
    if (returnPath && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(RETURN_PATH_KEY, returnPath);
      } catch {
        // Private mode / disabled storage — best-effort only.
      }
    }
    return `/login${returnPath ? `?returnPath=${encodeURIComponent(returnPath)}` : ""}`;
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  if (returnPath && typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(RETURN_PATH_KEY, returnPath);
    } catch {
      // Private mode / disabled storage — best-effort only.
    }
  }

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/** Consume the stashed return path (one-shot). */
export const consumeReturnPath = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(RETURN_PATH_KEY);
    window.sessionStorage.removeItem(RETURN_PATH_KEY);
    return v;
  } catch {
    return null;
  }
};
