export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const RETURN_PATH_KEY = "grayarx.returnPath";

/**
 * Login URL for dealer auth (email/password at /login).
 * Manus OAuth portal redirects were removed.
 */
export const getLoginUrl = (returnPath?: string) => {
  if (returnPath && typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(RETURN_PATH_KEY, returnPath);
    } catch {
      // Private mode / disabled storage — best-effort only.
    }
  }
  return `/login${returnPath ? `?returnPath=${encodeURIComponent(returnPath)}` : ""}`;
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
