# Error Tracking (Sentry)

**Audience:** Founder / ops.
**Why this doc exists:** the P1 audit found no Sentry-equivalent — bugs were only
caught via console logs (lost once Railway rotates logs) and Kagiso's 24h
self-audit cycle. This wires up real, always-on error tracking with a free tier
that's plenty for pilot scale.

## What Sentry is for

[Sentry](https://sentry.io) captures exceptions the moment they happen —
uncaught server crashes, unhandled promise rejections, Express route errors,
and circuit-breaker "service down" warnings (OpenAI/WhatsApp/Resend) — and puts
them in a dashboard with a stack trace, the request that triggered it, and an
email/Slack alert. It complements (doesn't replace) the existing
`alertFounder()` emails and the 24h Kagiso audit: Sentry is instant and keeps a
searchable history; the founder alert email is for "wake someone up now";
Kagiso is the slower, autonomous sweep.

Free tier: **5,000 error events/month**, which comfortably covers a pilot with
a handful of dealerships. Tracing/performance monitoring is intentionally left
off in this setup (`tracesSampleRate: 0`) so a busy day can't burn through the
quota on non-error data.

## How it's wired

- `server/_core/sentry.ts` — calls `Sentry.init()` if `SENTRY_DSN` is set;
  otherwise logs `Sentry disabled — SENTRY_DSN not set` once and every helper
  in the file becomes a safe no-op. **Nothing breaks if the founder hasn't
  created a Sentry account yet.**
- `server/_core/index.ts` — imports `./sentry` as the first module (before
  express) so init runs as early as possible; captures `uncaughtException` /
  `unhandledRejection` to Sentry alongside the existing `alertFounder()` email;
  registers a manual Sentry error middleware after all routes plus a JSON
  fallback error handler (so API clients get `{ error, sentryEventId }`
  instead of an HTML stack-trace page).
- `server/_core/agentResilience.ts` — when a circuit breaker (OpenAI, WhatsApp,
  Resend) opens after repeated failures, it now also reports a **warning**
  (not error) event to Sentry, so degraded service shows up immediately
  instead of waiting for the next audit cycle.
- `client/src/main.tsx` — optional browser-side tracking via `@sentry/react`,
  gated on `VITE_SENTRY_DSN`. Loaded lazily (dynamic `import()`) and wrapped in
  a `.catch()`, so a missing/blocked Sentry SDK can never break page load.

**Known limitation:** this project bundles the server into a single ESM file
via esbuild, so Sentry cannot auto-patch Express (that would need
`node --import ./instrument.mjs`, which we deliberately do **not** change on
Railway). Instead we:

1. Pass `skipOpenTelemetrySetup: true` in `Sentry.init()`
2. Attach a thin manual error middleware that calls `captureException`
   (instead of `setupExpressErrorHandler`, which prints
   `express is not instrumented` at boot)

Manual capture still covers uncaught exceptions, Express route errors, and
circuit-breaker warnings — all this setup needs for error tracking.

## Founder setup steps (one-time)

1. Go to [sentry.io](https://sentry.io) and create a free account.
2. Create a new project → platform **Node.js** (Express) → copy the DSN it
   gives you (looks like `https://<key>@o<org>.ingest.sentry.io/<project>`).
3. On Railway → your service → **Variables** → add:
   ```
   SENTRY_DSN=<the DSN from step 2>
   ```
4. Redeploy (Railway does this automatically when a variable changes, or
   trigger a manual redeploy). Check the deploy logs for
   `[Sentry] Error tracking enabled.` to confirm it picked up the DSN.
5. *(Optional, browser errors)* Create a second Sentry project with platform
   **React**, copy its DSN, and add on Railway:
   ```
   VITE_SENTRY_DSN=<the DSN from the React project>
   ```
   This one must be set at **build time** (Vite bakes `VITE_`-prefixed vars
   into the client bundle), so it needs a rebuild/redeploy to take effect —
   reusing the same DSN as step 3 also works if you'd rather not manage two
   projects yet.

Until step 3 is done, the server logs `Sentry disabled — SENTRY_DSN not set`
once at boot and behaves exactly as it did before this change — no crashes,
no missing functionality, just no error dashboard yet.

## Confirming it's working

After setting `SENTRY_DSN` and redeploying, force a test error (e.g. hit a
route that throws, or temporarily add a debug route that does
`throw new Error("Sentry test")`) and check the Sentry dashboard — the event
should appear within a few seconds, with the stack trace and request path
attached.
