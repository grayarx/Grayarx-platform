/**
 * Sentry error tracking — free-tier friendly, no-op when SENTRY_DSN isn't set.
 *
 * Import this module FIRST (before express/other business modules) in the
 * server entry so init runs as early as possible.
 * Everything here is safe to call even when Sentry was never initialized —
 * callers never need to check `sentryEnabled` themselves.
 *
 * Note: we intentionally skip Sentry's Express auto-instrumentation
 * (`setupExpressErrorHandler` / OpenTelemetry). This app ships as a single
 * esbuild ESM bundle (`node dist/index.js`), so auto-patching Express would
 * require changing Railway's start command to `node --import …`. Manual
 * capture below is enough for error tracking and keeps boot logs clean.
 */
import * as Sentry from "@sentry/node";
import type { Express, NextFunction, Request, Response } from "express";

const dsn = process.env.SENTRY_DSN?.trim();

export const sentryEnabled = Boolean(dsn);

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    // Free tier (5k events/month) is for *errors*, not traces — keep tracing off
    // so a busy pilot dealership can't burn quota on performance data.
    tracesSampleRate: 0,
    // Bundled ESM: don't try (and fail) to auto-patch Express via OTel.
    skipOpenTelemetrySetup: true,
    beforeSend(event) {
      // Health checks / uptime pings hit this constantly — never worth an event.
      if (event.request?.url?.includes("/api/health")) return null;
      return event;
    },
  });
  console.log(
    "[Sentry] Error tracking enabled (manual capture; Express auto-instrumentation skipped for ESM bundle)."
  );
} else {
  console.log("Sentry disabled — SENTRY_DSN not set");
}

/**
 * Attach a Sentry-aware Express error middleware (after all routes).
 * Uses captureException directly instead of setupExpressErrorHandler so we
 * never log the scary "express is not instrumented" boot warning.
 */
export function attachSentryErrorHandler(app: Express): void {
  if (!dsn) return;
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = Sentry.captureException(err);
      (res as Response & { sentry?: string }).sentry = eventId;
    } catch {
      /* telemetry must never take down the app */
    }
    next(err);
  });
}

/** Capture an exception. No-ops safely when SENTRY_DSN isn't set. */
export function captureException(err: unknown, extra?: Record<string, unknown>): void {
  if (!dsn) return;
  try {
    Sentry.captureException(err, extra ? { extra } : undefined);
  } catch {
    /* telemetry must never take down the app */
  }
}

/** Capture a non-fatal message (e.g. a circuit breaker opening). Defaults to "warning". */
export function captureMessage(
  message: string,
  level: "warning" | "error" | "info" = "warning",
  extra?: Record<string, unknown>,
): void {
  if (!dsn) return;
  try {
    Sentry.captureMessage(message, { level, extra });
  } catch {
    /* telemetry must never take down the app */
  }
}
