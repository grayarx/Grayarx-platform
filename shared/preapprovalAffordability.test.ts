import { describe, expect, it } from "vitest";
import {
  affordabilityLabel,
  computeAffordabilityHint,
  FI_BANK_PORTAL_NOTE,
  FI_DOCUMENT_CHECKLIST,
} from "./preapprovalAffordability";

describe("preapprovalAffordability", () => {
  it("flags stretched disposable income", () => {
    const hint = computeAffordabilityHint({
      netMonthlyIncome: 12000,
      totalMonthlyExpenses: 10000,
      existingDebtMonthly: 4000,
    });
    expect(hint.flag).toBe("stretched");
    expect(hint.monthlyDisposable).toBe(-2000);
  });

  it("flags tight but positive disposable", () => {
    const hint = computeAffordabilityHint({
      netMonthlyIncome: 18000,
      totalMonthlyExpenses: 15000,
      existingDebtMonthly: 2000,
    });
    expect(hint.flag).toBe("tight");
    expect(hint.monthlyDisposable).toBe(1000);
  });

  it("exposes F&I checklist and bank-portal note", () => {
    expect(FI_DOCUMENT_CHECKLIST.length).toBeGreaterThanOrEqual(4);
    expect(FI_BANK_PORTAL_NOTE).toMatch(/bank makes the credit decision/i);
    expect(affordabilityLabel("ok")).toMatch(/hint only/i);
  });
});
