import type { Express, Request, Response, NextFunction } from "express";

/**
 * Baseline security headers for production. Skipped in development so Vite HMR works.
 */
export function registerSecurityHeaders(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === "production") {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    }
    next();
  });
}

/**
 * Canonical host redirect — www.grayarx.com over bare apex when APP_URL is set.
 */
export function registerCanonicalRedirect(app: Express): void {
  const appUrl = (process.env.APP_URL || "").replace(/\/+$/, "");
  if (!appUrl || process.env.NODE_ENV !== "production") return;

  let canonicalHost: string;
  try {
    canonicalHost = new URL(appUrl).host;
  } catch {
    return;
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers.host;
    if (!host || host === canonicalHost) return next();

    const proto =
      (req.headers["x-forwarded-proto"] as string | undefined) ??
      (req.secure ? "https" : "http");
    return res.redirect(301, `${proto}://${canonicalHost}${req.originalUrl}`);
  });
}
