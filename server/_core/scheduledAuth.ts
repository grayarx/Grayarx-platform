import type { Request } from "express";

/**
 * Shared-secret auth for `/api/scheduled/*` endpoints.
 *
 * These endpoints used to be gated exclusively by the Manus platform's
 * `sdk.authenticateRequest()` → `isCron` flow (a special session cookie the
 * Manus Heartbeat scheduler attached to its callback requests) or by a
 * `x-manus-heartbeat: true` header. On Railway there is no Manus platform
 * calling these routes, so both of those checks are permanently false and
 * every one of these jobs is silently dead — the DB never gets touched,
 * the WhatsApp queue never drains, etc.
 *
 * This module adds a platform-agnostic alternative: set `SCHEDULED_TASK_SECRET`
 * on Railway and have your external cron (cron-job.org, GitHub Actions, etc.)
 * send it back as the `X-Scheduled-Task-Secret` header. See
 * docs/SCHEDULED_TASKS.md for exact setup steps and schedules.
 */

const SECRET_HEADER = "x-scheduled-task-secret";

/** True if the request carries the correct `X-Scheduled-Task-Secret` header. */
export function hasScheduledTaskSecret(req: Request): boolean {
  const configured = process.env.SCHEDULED_TASK_SECRET;
  if (!configured) return false;
  const provided = req.headers[SECRET_HEADER];
  if (typeof provided !== "string" || provided.length === 0) return false;
  // Lengths differ trivially in practice for a misconfigured secret; timing
  // safety isn't critical here (low-value, non-auth-bypass target), but we
  // still avoid a naive substring/prefix comparison bug.
  return provided === configured;
}

/** True if the legacy Manus heartbeat header is present (kept for backward compat). */
function hasLegacyHeartbeatHeader(req: Request): boolean {
  return (req.headers["x-manus-heartbeat"] as string | undefined) === "true";
}

/**
 * True if the legacy Manus `sdk.authenticateRequest().isCron` flow authorizes
 * this request. Never throws — `authenticateRequest` throws `ForbiddenError`
 * when there's no session cookie (the normal case outside Manus), which we
 * treat as "not authorized" rather than letting it bubble up as a 500.
 */
async function hasLegacyCronSession(req: Request): Promise<boolean> {
  try {
    const { sdk } = await import("./sdk");
    const user = await sdk.authenticateRequest(req);
    return Boolean(user.isCron);
  } catch {
    return false;
  }
}

/**
 * Resolve whether a `/api/scheduled/*` request is authorized to run.
 * Checks, in order: shared secret header → legacy Manus heartbeat header →
 * legacy Manus cron session. Safe to call unauthenticated; never throws.
 */
export async function isAuthorizedScheduledTask(req: Request): Promise<boolean> {
  if (hasScheduledTaskSecret(req)) return true;
  if (hasLegacyHeartbeatHeader(req)) return true;
  return hasLegacyCronSession(req);
}
