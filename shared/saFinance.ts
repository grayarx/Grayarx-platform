/**
 * South African vehicle finance reference data (indicative planning only).
 *
 * Sources (2025–2026):
 * - SARB prime ~10.25% (repo 6.75% + 3.5% bank margin)
 * - Typical VAF spreads: prime +1% to +4% (good credit, new car)
 * - NCA max for instalment agreements: repo rate + 17% (~23.75% at current repo)
 * - Affordability: instalment ≤ ~25% gross income; total debt ≤ 36% (NCA Reg 23A)
 */

export const SA_PRIME_RATE_PCT = 10.25;
export const SA_REPO_RATE_PCT = 6.75;
/** NCA cap: RR + 17% for vehicle instalment sale agreements */
export const SA_VAF_MAX_RATE_PCT = SA_REPO_RATE_PCT + 17; // 23.75
/** Developmental / sub-prime ceiling sometimes quoted in market (RR + 27) */
export const SA_DEVELOPMENTAL_MAX_RATE_PCT = SA_REPO_RATE_PCT + 27; // 33.75 — rarely for VAF

export type CreditProfile = {
  id: string;
  label: string;
  ratePct: number;
  hint: string;
};

/** Typical WesBank / MFC / Standard Bank VAF spreads over prime */
export const SA_CREDIT_PROFILES: CreditProfile[] = [
  {
    id: "excellent",
    label: "Excellent credit",
    ratePct: SA_PRIME_RATE_PCT + 0.75,
    hint: "Top score, 20%+ deposit, new car",
  },
  {
    id: "good",
    label: "Good credit",
    ratePct: SA_PRIME_RATE_PCT + 1.5,
    hint: "Solid history, 10–15% deposit",
  },
  {
    id: "average",
    label: "Average (most buyers)",
    ratePct: SA_PRIME_RATE_PCT + 2,
    hint: "Typical quote — prime + 2%",
  },
  {
    id: "used",
    label: "Used car / weaker file",
    ratePct: SA_PRIME_RATE_PCT + 3.5,
    hint: "Older vehicle or thinner credit",
  },
  {
    id: "subprime",
    label: "Sub-prime (near NCA cap)",
    ratePct: SA_PRIME_RATE_PCT + 6,
    hint: "Impaired credit — many lenders decline above ~18%",
  },
];

export const SA_FINANCE_DEFAULTS = {
  ratePct: SA_PRIME_RATE_PCT + 2,
  minRatePct: 9,
  /** Slider extends to 26% — above NCA VAF cap; useful for stress-testing sub-prime quotes */
  maxRatePct: 26,
  ncaCapPct: Math.ceil(SA_VAF_MAX_RATE_PCT),
  defaultTermMonths: 60,
  minTermMonths: 12,
  maxTermMonths: 72,
  /** NCA guideline: car instalment ≤ 25% gross monthly income */
  maxInstalmentIncomeRatio: 0.25,
};

export function calcMonthlyInstalment(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
}
