import { describe, it, expect } from "vitest";

import { AUDIT_INTERVAL_MS } from "./_core/autonomousAudit";

describe("autonomousAudit", () => {
  it("AUDIT_INTERVAL_MS is exactly 24h", () => {
    expect(AUDIT_INTERVAL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("shape: AUDIT_INTERVAL_MS is a positive integer", () => {
    expect(Number.isInteger(AUDIT_INTERVAL_MS)).toBe(true);
    expect(AUDIT_INTERVAL_MS).toBeGreaterThan(0);
  });
});
