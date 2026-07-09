/**
 * Vitest coverage for the Phase 30 sprint:
 *  - Rate limiter + honeypot heuristics
 *  - Tumi trade-in deterministic estimator
 *  - Dealership module-toggle resolver
 *
 * These are pure-function tests (no DB, no LLM). The Tumi LLM memo is
 * not covered here — only the deterministic number that the founder needs
 * to be able to defend in court.
 */

import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  looksLikeBot,
  __resetRateLimiterForTests,
  RATE_LIMITS,
} from "./_core/rateLimit";
import { computeTradeInEstimate, type TumiInput } from "./_core/tumiAgent";
import { isModuleEnabled } from "../shared/dealershipModules";

describe("rate limiter", () => {
  beforeEach(() => __resetRateLimiterForTests());

  it("allows up to MAX within window then blocks", () => {
    const { max, windowMs } = RATE_LIMITS.LEAD_CREATE;
    for (let i = 0; i < max; i++) {
      const r = checkRateLimit("ip:1.2.3.4", max, windowMs);
      expect(r.ok).toBe(true);
    }
    const denied = checkRateLimit("ip:1.2.3.4", max, windowMs);
    expect(denied.ok).toBe(false);
  });

  it("isolates buckets per key", () => {
    const { max, windowMs } = RATE_LIMITS.LEAD_CREATE;
    for (let i = 0; i < max; i++) checkRateLimit("ip:A", max, windowMs);
    const other = checkRateLimit("ip:B", max, windowMs);
    expect(other.ok).toBe(true);
  });
});

describe("honeypot heuristics", () => {
  it("flags filled honeypot", () => {
    const r = looksLikeBot({ honeypot: "spam", renderedAtMs: Date.now() - 5_000 });
    expect(r.bot).toBe(true);
  });

  it("flags too-fast submissions", () => {
    const r = looksLikeBot({
      honeypot: "",
      renderedAtMs: Date.now() - 500, // 0.5s after form render
      submittedAtMs: Date.now(),
    });
    expect(r.bot).toBe(true);
  });

  it("passes normal human submissions", () => {
    const r = looksLikeBot({
      honeypot: "",
      renderedAtMs: Date.now() - 12_000, // 12s after render
      submittedAtMs: Date.now(),
    });
    expect(r.bot).toBe(false);
  });
});

describe("Tumi deterministic estimator", () => {
  const base: TumiInput = {
    make: "Toyota",
    model: "Corolla",
    year: 2018,
    mileageKm: 90_000,
    transmission: "manual",
    fuel: "petrol",
    bodyType: "sedan",
    condition: "good",
    serviceHistory: "full_dealer",
  };

  it("returns positive low/mid/high in correct order", () => {
    const r = computeTradeInEstimate(base);
    expect(r.estimateLow).toBeGreaterThan(0);
    expect(r.estimateLow).toBeLessThan(r.estimateMid);
    expect(r.estimateMid).toBeLessThan(r.estimateHigh);
  });

  it("excellent + full dealer history beats fair + none for same vehicle", () => {
    const better = computeTradeInEstimate({
      ...base,
      condition: "excellent",
      serviceHistory: "full_dealer",
    });
    const worse = computeTradeInEstimate({
      ...base,
      condition: "fair",
      serviceHistory: "none",
    });
    expect(better.estimateMid).toBeGreaterThan(worse.estimateMid);
  });

  it("older car valued lower than newer same-model", () => {
    const newer = computeTradeInEstimate({ ...base, year: 2022 });
    const older = computeTradeInEstimate({ ...base, year: 2010 });
    expect(newer.estimateMid).toBeGreaterThan(older.estimateMid);
  });

  it("higher mileage reduces value", () => {
    const lowKm = computeTradeInEstimate({ ...base, mileageKm: 40_000 });
    const highKm = computeTradeInEstimate({ ...base, mileageKm: 220_000 });
    expect(lowKm.estimateMid).toBeGreaterThan(highKm.estimateMid);
  });

  it("never produces a negative or absurd value", () => {
    const wreck = computeTradeInEstimate({
      ...base,
      year: 2005,
      mileageKm: 380_000,
      condition: "poor",
      serviceHistory: "none",
    });
    expect(wreck.estimateLow).toBeGreaterThan(0);
    expect(wreck.estimateHigh).toBeLessThan(2_000_000);
  });
});

describe("dealership module toggles", () => {
  it("defaults to enabled when modulesEnabled is null", () => {
    expect(isModuleEnabled(null, "trade_in")).toBe(true);
  });

  it("defaults to enabled when key missing", () => {
    expect(isModuleEnabled({ showroom: true }, "trade_in")).toBe(true);
  });

  it("respects explicit false", () => {
    expect(isModuleEnabled({ trade_in: false }, "trade_in")).toBe(false);
  });

  it("respects explicit true", () => {
    expect(isModuleEnabled({ trade_in: true }, "trade_in")).toBe(true);
  });
});
