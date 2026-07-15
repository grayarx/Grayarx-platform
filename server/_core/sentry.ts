/**
 * Sentry error tracking — free-tier friendly, no-op when SENTRY_DSN isn't set.
 *
 * Import this module FIRST (before express/other business modules) in the
 * server entry so Sentry's auto-instrumentation wraps as much as possible.
 * Everything here is safe to call even when Sentry was never initialized —
 * callers never need to check `sentryEnabled` themselves.
 */
import * as Sentry from "@sentry/node";
import type { Express } from "express";

const dsn = process.env.SENTRY_DSN?.trim();

export const sentryEnabled = Boolean(dsn);

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    // Free tier (5k events/month) is for *errors*, not traces — keep tracing off
    // so a busy pilot dealership can't burn quota on performance data. This also
    // means we don't need Sentry's automatic HTTP/Express instrumentation (which
    // requires a `node --import` loader hook and doesn't apply cleanly to this
    // project's single-file esbuild ESM bundle) — manual capture below plus
    // `setupExpressErrorHandler` is enough for error tracking alone.
    tracesSampleRate: 0,
    beforeSend(event) {
      // Health checks / uptime pings hit this constantly — never worth an event.
      if (event.request?.url?.includes("/api/health")) return null;
      return event;
    },
  });
  console.log("[Sentry] Error tracking enabled.");
} else {
  console.log("Sentry disabled — SENTRY_DSN not set");
}

/** Attach Sentry's Express error handler. Call after all routes are mounted. */
export function attachSentryErrorHandler(app: Express): void {
  if (!dsn) return;
  Sentry.setupExpressErrorHandler(app);
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
