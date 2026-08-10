/**
 * In-memory per-IP rate limiter for the public lead and chat paths.
 *
 * Why in-memory and not the DB:
 *   - The brief asks for "5 leads/hr, 30 chats/min". At those rates a DB-backed
 *     counter is overkill and would add a round-trip to every public submission.
 *   - The platform runs on a single Cloud Run instance with min-instances=0; on
 *     cold start the counters reset, which is exactly the behaviour you want
 *     for a bot-protection layer (genuine traffic survives, bots restart their
 *     budget from zero on every new instance).
 *
 * Why also a honeypot:
 *   - Rate limits stop volume attacks; honeypots stop scripted single-shot bots
 *     that would otherwise just submit one lead and disappear.
 *   - The brief specifies "honeypot + 2s timing threshold". Both are checked
 *     here so the lead procedure stays declarative.
 */

type Bucket = {
  /** Unix-ms timestamps of recent hits, oldest first. */
  hits: number[];
};

const BUCKETS = new Map<string, Bucket>();

/**
 * Enforce a sliding-window rate limit for `key` (typically `<endpoint>:<ip>`).
 * Returns true if the request is allowed; false if it should be rejected.
 *
 * @param key       Unique key, e.g. `"leads.create:1.2.3.4"`.
 * @param max       Maximum hits permitted within the window.
 * @param windowMs  Window size in milliseconds.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now(),
): { ok: boolean; remaining: number; retryAfterMs: number } {
  const bucket = BUCKETS.get(key) ?? { hits: [] };
  const cutoff = now - windowMs;
  bucket.hits = bucket.hits.filter((t) => t > cutoff);
  if (bucket.hits.length >= max) {
    const oldest = bucket.hits[0];
    BUCKETS.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + windowMs - now),
    };
  }
  bucket.hits.push(now);
  BUCKETS.set(key, bucket);
  return { ok: true, remaining: max - bucket.hits.length, retryAfterMs: 0 };
}

/**
 * Pre-configured ceilings the brief calls for. Exported as constants so tests
 * and future tuning have a single source of truth.
 */
export const RATE_LIMITS = Object.freeze({
  LEAD_CREATE: { max: 5, windowMs: 60 * 60 * 1000 }, // 5 leads/hr/IP
  CHAT_MESSAGE: { max: 30, windowMs: 60 * 1000 }, // 30 chats/min/IP
  PUBLIC_FALLBACK_INBOUND: { max: 20, windowMs: 60 * 1000 }, // shortcode spam
  PREAPPROVAL_SUBMIT: { max: 5, windowMs: 60 * 60 * 1000 }, // POPIA-heavy
  BOOKING_SUBMIT: { max: 10, windowMs: 60 * 60 * 1000 },
  // Chunked bulk imports (1000 cars ÷ 40) need many commits per session.
  INVENTORY_CSV: { max: 120, windowMs: 60 * 60 * 1000 },
});

/**
 * Honeypot + timing guard. Returns true if the submission looks like a bot.
 *
 * @param honeypot       The value of the invisible honeypot field — real users
 *                       leave it empty; bots fill every input.
 * @param renderedAtMs   Client-supplied timestamp from when the form rendered.
 * @param submittedAtMs  Server-side `Date.now()` at submission time.
 * @param minDelayMs     Minimum acceptable fill time. Default 2 000 ms — the
 *                       brief's "2 s timing threshold".
 */
export function looksLikeBot(args: {
  honeypot?: string | null;
  renderedAtMs?: number | null;
  submittedAtMs?: number;
  minDelayMs?: number;
}): { bot: boolean; reason: string } {
  const { honeypot, renderedAtMs, submittedAtMs = Date.now(), minDelayMs = 2000 } = args;
  if (honeypot && honeypot.trim().length > 0) {
    return { bot: true, reason: "honeypot_filled" };
  }
  if (typeof renderedAtMs === "number" && Number.isFinite(renderedAtMs)) {
    const elapsed = submittedAtMs - renderedAtMs;
    if (elapsed >= 0 && elapsed < minDelayMs) {
      return { bot: true, reason: "submitted_too_fast" };
    }
  }
  return { bot: false, reason: "" };
}

/**
 * Best-effort caller IP extractor. tRPC context provides the raw `req`; this
 * helper centralises the X-Forwarded-For parsing so every public procedure
 * uses the same logic.
 */
export function callerIp(req: unknown): string {
  type ReqLike = {
    headers?: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
  };
  const r = (req ?? {}) as ReqLike;
  const xff = r.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0]!.trim();
  }
  if (Array.isArray(xff) && xff.length > 0 && typeof xff[0] === "string") {
    return xff[0]!.split(",")[0]!.trim();
  }
  return r.socket?.remoteAddress ?? "unknown";
}

/** Test-only: wipes all in-memory buckets between runs. */
export function __resetRateLimiterForTests() {
  BUCKETS.clear();
}
