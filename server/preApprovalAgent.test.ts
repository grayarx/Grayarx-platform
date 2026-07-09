import { describe, expect, it, vi } from "vitest";
import {
  computeAffordabilityHint,
  draftPreApprovalReply,
  maskSouthAfricanId,
  runPreApprovalAgent,
  validatePreApprovalInput,
} from "./_core/preApprovalAgent";

// Force the LLM polish to fail so tests are deterministic and stay offline.
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => {
    throw new Error("offline test");
  }),
}));

describe("Naledi · Pre-Approval Agent · helpers", () => {
  describe("maskSouthAfricanId", () => {
    it("returns null for empty input", () => {
      expect(maskSouthAfricanId(null)).toBeNull();
      expect(maskSouthAfricanId("")).toBeNull();
      expect(maskSouthAfricanId("   ")).toBeNull();
    });

    it("masks all but last 4 digits for a standard 13-digit SA ID", () => {
      const masked = maskSouthAfricanId("9001015800087");
      expect(masked).toBe("•••••••••0087");
      expect(masked).toHaveLength(13);
    });

    it("never echoes raw digits even when input is short", () => {
      expect(maskSouthAfricanId("12")).toBe("••");
      expect(maskSouthAfricanId("1234")).toBe("••••");
    });
  });

  describe("computeAffordabilityHint", () => {
    it("flags `insufficient_data` when both incomes missing", () => {
      const hint = computeAffordabilityHint({
        netMonthlyIncome: null,
        totalMonthlyExpenses: null,
        existingDebtMonthly: null,
        grossMonthlyIncome: null,
      });
      expect(hint.flag).toBe("insufficient_data");
      expect(hint.monthlyDisposable).toBeNull();
    });

    it("computes disposable income and debt-to-income", () => {
      const hint = computeAffordabilityHint({
        netMonthlyIncome: 30000,
        totalMonthlyExpenses: 18000,
        existingDebtMonthly: 5000,
        grossMonthlyIncome: 42000,
      });
      expect(hint.monthlyDisposable).toBe(7000);
      expect(hint.debtToIncomeRatio).toBeLessThanOrEqual(0.25);
      expect(hint.flag).toBe("ok");
    });

    it("flags `stretched` when expenses exceed net income", () => {
      const hint = computeAffordabilityHint({
        netMonthlyIncome: 15000,
        totalMonthlyExpenses: 17000,
        existingDebtMonthly: 0,
        grossMonthlyIncome: 18000,
      });
      expect(hint.flag).toBe("stretched");
      expect(hint.monthlyDisposable).toBeLessThan(0);
    });

    it("flags `tight` when disposable is small but positive", () => {
      const hint = computeAffordabilityHint({
        netMonthlyIncome: 12000,
        totalMonthlyExpenses: 10500,
        existingDebtMonthly: 0,
        grossMonthlyIncome: 14000,
      });
      expect(hint.flag).toBe("tight");
    });
  });

  describe("validatePreApprovalInput", () => {
    it("requires the basics", () => {
      const errs = validatePreApprovalInput({
        fullName: "",
        email: "",
        phone: "",
      } as any);
      expect(errs.some((e) => e.toLowerCase().includes("name"))).toBe(true);
      expect(errs.some((e) => e.toLowerCase().includes("email"))).toBe(true);
      expect(errs.some((e) => e.toLowerCase().includes("phone"))).toBe(true);
    });

    it("rejects an out-of-range term", () => {
      const errs = validatePreApprovalInput({
        fullName: "Henrique",
        email: "h@example.com",
        phone: "+27794915187",
        desiredTermMonths: 96,
      });
      expect(errs.length).toBeGreaterThan(0);
      expect(errs.some((e) => e.toLowerCase().includes("term"))).toBe(true);
    });

    it("passes a valid minimum payload", () => {
      const errs = validatePreApprovalInput({
        fullName: "Henrique",
        email: "h@example.com",
        phone: "+27794915187",
      });
      expect(errs).toHaveLength(0);
    });
  });
});

describe("Naledi · Pre-Approval Agent · reply invariants", () => {
  it("template falls back when LLM fails and never says approved", async () => {
    const { reply } = await draftPreApprovalReply(
      {
        fullName: "Henrique Marques",
        email: "h@example.com",
        phone: "+27794915187",
        language: "en",
        dealershipName: "Apex Motors",
      },
      "GA-K1-2026-05-23-AB12",
    );
    expect(reply).toContain("GA-K1-2026-05-23-AB12");
    expect(reply.toLowerCase()).not.toContain("approved");
    expect(reply.toLowerCase()).not.toContain("pre-approved");
    // The safety property is "a human is the next step" — our template phrases
    // it as "a member of our finance team will personally review".
    expect(reply.toLowerCase()).toMatch(/team|human|review|personally/);
  });

  it("uses the requested language template when supported", async () => {
    const af = await draftPreApprovalReply(
      {
        fullName: "Pieter Botha",
        email: "p@example.com",
        phone: "+27791234567",
        language: "af",
        dealershipName: "Apex Motors",
      },
      "GA-K1-2026-05-23-AB12",
    );
    expect(af.language).toBe("af");
    expect(af.reply).toMatch(/Hallo|verwysingsnommer|finansie/i);
  });

  it("falls back to English for unsupported languages", async () => {
    const xx = await draftPreApprovalReply(
      {
        fullName: "Pieter Botha",
        email: "p@example.com",
        phone: "+27791234567",
        language: "klingon",
        dealershipName: "Apex Motors",
      },
      "GA-K1-2026-05-23-AB12",
    );
    expect(xx.language).toBe("klingon"); // language tag is preserved
    expect(xx.reply.toLowerCase()).toContain("thank you");
  });
});

describe("Naledi · runPreApprovalAgent (end-to-end pure)", () => {
  it("rejects an invalid payload before any LLM/network call", async () => {
    await expect(
      runPreApprovalAgent(1, {
        fullName: "",
        email: "not-an-email",
        phone: "",
      } as any),
    ).rejects.toThrow();
  });

  it("returns a reference, masked id, and a non-binding hint for a valid payload", async () => {
    const result = await runPreApprovalAgent(7, {
      fullName: "Naledi Mokoena",
      idNumber: "8506235800082",
      email: "naledi@example.com",
      phone: "+27791234567",
      employmentStatus: "permanent",
      monthsEmployed: 24,
      grossMonthlyIncome: 45000,
      netMonthlyIncome: 32000,
      totalMonthlyExpenses: 22000,
      existingDebtMonthly: 4000,
      vehiclePrice: 350000,
      desiredDeposit: 60000,
      desiredTermMonths: 60,
      hasTradeIn: false,
      language: "en",
      dealershipName: "Apex Motors",
    });
    expect(result.referenceNumber).toMatch(/^GA-K7-\d{4}-\d{2}-\d{2}-[0-9A-F]{4}$/);
    expect(result.idNumberMasked).toBe("•••••••••0082");
    expect(result.agentReply).toContain(result.referenceNumber);
    expect(result.agentReply.toLowerCase()).not.toContain("approved");
    expect(["ok", "tight", "stretched", "insufficient_data"]).toContain(
      result.affordabilityHint.flag,
    );
  });
});
