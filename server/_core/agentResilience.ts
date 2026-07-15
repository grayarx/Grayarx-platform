/**
 * Agent Resilience Utilities
 *
 * Provides:
 *  - retryWithBackoff   — exponential back-off retry for transient failures
 *  - CircuitBreaker     — per-service open/half-open/closed state machine
 *  - circuitBreakers    — singleton map (openai, whatsapp, resend)
 *  - isQuotaError       — detects OpenAI 429 / quota exhaustion
 *  - isTransientError   — detects retriable network / server errors
 *  - withCircuitBreaker — wraps a call with the named circuit breaker
 *  - getResilienceStatus — snapshot of all breakers (for health endpoint)
 */

// ── Retry ────────────────────────────────────────────────────────────────────

/**
 * Retry `fn` up to `maxAttempts` times with exponential back-off.
 * Throws the last error if every attempt fails.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}

// ── Circuit Breaker ──────────────────────────────────────────────────────────

type BreakerState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private state: BreakerState = "closed";
  private consecutiveFailures = 0;
  private lastFailureTs: number | null = null;

  constructor(
    public readonly name: string,
    private readonly failureThreshold = 5,
    private readonly recoveryWindowMs = 60_000,
  ) {}

  isOpen(): boolean {
    if (this.state === "open") {
      // Transition to half-open if recovery window has elapsed
      if (
        this.lastFailureTs !== null &&
        Date.now() - this.lastFailureTs >= this.recoveryWindowMs
      ) {
        this.state = "half-open";
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "closed";
  }

  /** Founder / Kagiso remediation — clear failures and close the breaker. */
  reset(): void {
    this.consecutiveFailures = 0;
    this.lastFailureTs = null;
    this.state = "closed";
  }

  recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTs = Date.now();
    if (this.consecutiveFailures >= this.failureThreshold) {
      const wasAlreadyOpen = this.state === "open";
      if (!wasAlreadyOpen) {
        console.error(
          `[CircuitBreaker] "${this.name}" OPENED after ${this.consecutiveFailures} consecutive failures`,
        );
        // Dynamic import avoids circular dependency (agentLearning → db → agentResilience)
        const name = this.name;
        import("./agentLearning")
          .then(({ reportCircuitBreakerOpen }) => reportCircuitBreakerOpen(name))
          .catch((err) =>
            console.error("[CircuitBreaker] reportCircuitBreakerOpen failed:", err),
          );
        // Warning-level Sentry event (not a fatal error) so the founder sees
        // degraded service (OpenAI/WhatsApp/Resend down) without waiting for
        // the 24h self-audit cycle. No-ops when SENTRY_DSN isn't set.
        import("./sentry")
          .then(({ captureMessage }) =>
            captureMessage(
              `Circuit breaker "${name}" opened after ${this.consecutiveFailures} consecutive failures`,
              "warning",
              { breaker: name, consecutiveFailures: this.consecutiveFailures },
            ),
          )
          .catch(() => {});
      }
      this.state = "open";
    }
  }

  getState(): BreakerState {
    // Re-evaluate open → half-open transition when state is queried
    if (this.state === "open" && !this.isOpen()) {
      return "half-open";
    }
    return this.state;
  }
}

// ── Singleton map ─────────────────────────────────────────────────────────────

export const circuitBreakers = new Map<string, CircuitBreaker>([
  ["openai", new CircuitBreaker("openai")],
  ["whatsapp", new CircuitBreaker("whatsapp")],
  ["resend", new CircuitBreaker("resend")],
]);

// ── Error classification ─────────────────────────────────────────────────────

/**
 * Returns true when the error is an OpenAI quota / billing exhaustion (HTTP 429
 * with a quota message, not a simple rate-limit that auto-clears).
 */
export function isQuotaError(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase();
  return (
    msg.includes("insufficient_quota") ||
    msg.includes("you exceeded your current quota") ||
    msg.includes("billing") ||
    (msg.includes("429") && (msg.includes("quota") || msg.includes("billing")))
  );
}

/**
 * Returns true for errors that are transient and safe to retry:
 * network resets, timeouts, 502/503/504 gateway errors, or a plain rate-limit
 * 429 that is NOT a quota exhaustion.
 */
export function isTransientError(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase();
  if (
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("econnrefused") ||
    msg.includes("socket hang up") ||
    msg.includes("network error") ||
    msg.includes("fetch failed")
  ) {
    return true;
  }
  if (msg.includes("502") || msg.includes("503") || msg.includes("504")) {
    return true;
  }
  // 429 that is NOT a hard quota exhaustion is transient
  if (msg.includes("429") && !isQuotaError(err)) {
    return true;
  }
  return false;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// ── Circuit-breaker wrapper ──────────────────────────────────────────────────

export class CircuitOpenError extends Error {
  constructor(breakerName: string) {
    super(`Circuit breaker "${breakerName}" is open — service temporarily unavailable`);
    this.name = "CircuitOpenError";
  }
}

/**
 * Execute `fn` only if the named circuit breaker is closed (or half-open).
 * On success, records success. On failure, records failure.
 * Throws `CircuitOpenError` immediately when the breaker is open.
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  let breaker = circuitBreakers.get(name);
  if (!breaker) {
    // Auto-create unknown breakers so callers don't have to pre-register
    breaker = new CircuitBreaker(name);
    circuitBreakers.set(name, breaker);
  }
  if (breaker.isOpen()) {
    throw new CircuitOpenError(name);
  }
  try {
    const result = await fn();
    breaker.recordSuccess();
    return result;
  } catch (err) {
    breaker.recordFailure();
    throw err;
  }
}

// ── Health snapshot ──────────────────────────────────────────────────────────

export function getResilienceStatus(): Record<
  string,
  { state: string; failures: number; lastFailure: number | null }
> {
  const out: Record<string, { state: string; failures: number; lastFailure: number | null }> = {};
  for (const [name, breaker] of circuitBreakers) {
    const raw = breaker as unknown as {
      state: string;
      consecutiveFailures: number;
      lastFailureTs: number | null;
    };
    out[name] = {
      state: breaker.getState(),
      failures: raw.consecutiveFailures,
      lastFailure: raw.lastFailureTs,
    };
  }
  return out;
}

/** Reset a named circuit breaker (openai | whatsapp | resend). */
export function resetCircuitBreaker(name: string): boolean {
  const breaker = circuitBreakers.get(name);
  if (!breaker) return false;
  breaker.reset();
  return true;
}
