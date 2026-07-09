/** Persist trade-in estimate for cross-page upgrade journey */
const KEY = "grayarx_trade_in_session";

/** Drop stale estimates so upgrade CTAs don't use week-old numbers. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type TradeInSession = {
  quoteId: number;
  estimateMid: number;
  estimateLow: number;
  estimateHigh: number;
  make: string;
  model: string;
  year: number;
  savedAt: string;
};

export function saveTradeInSession(data: TradeInSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadTradeInSession(): TradeInSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TradeInSession;
    if (!parsed.quoteId || !parsed.estimateMid) return null;

    const savedAt = Date.parse(parsed.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > SESSION_TTL_MS) {
      clearTradeInSession();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearTradeInSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
