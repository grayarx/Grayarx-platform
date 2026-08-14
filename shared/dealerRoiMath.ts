/**
 * Dealer-facing ROI math for ICP conversion.
 * Conservative used-yard assumptions — one recovered close vs monthly software cost.
 */

import { PILOT_PARTNER, TIER_PRICES_ZAR } from "./subscriptionTiers";

/** Default illustrative unit price for an independent SA used yard (ZAR). */
export const ROI_DEFAULT_AVG_SALE_ZAR = 280_000;

/** Conservative gross profit on a mid-market used unit (ZAR). */
export const ROI_DEFAULT_GROSS_PROFIT_ZAR = 12_000;

/** Soft public floor after pilot (Showroom list / Pilot Partner billing ref). */
export const ROI_DEFAULT_MONTHLY_COST_ZAR = PILOT_PARTNER.monthlyPriceZar;

/** After-hours / weekend leads a busy independent often leaves cold. */
export const ROI_DEFAULT_MISSED_LEADS_PER_MONTH = 6;

/** Assumed close rate once a recovered lead books a drive (conservative). */
export const ROI_DEFAULT_CLOSE_RATE = 0.25;

export type DealerRoiInput = {
  /** Expected gross profit if one recovered lead becomes a sale (ZAR). */
  grossProfitPerSaleZar: number;
  /** Monthly GrayArx cost after pilot (ZAR). Defaults to Showroom / pilot floor. */
  monthlyCostZar?: number;
  /** Missed after-hours leads per month (volume for annual projection). */
  missedLeadsPerMonth?: number;
  /** Fraction of recovered leads that close a sale (0–1). */
  closeRate?: number;
};

export type DealerRoiResult = {
  monthlyCostZar: number;
  grossProfitPerSaleZar: number;
  /** How many closes pay for one month of GrayArx (usually ≤ 1). */
  closesToPayMonth: number;
  /** True when one recovered close covers ≥ 1 month. */
  oneClosePaysMonth: boolean;
  /** Months of GrayArx covered by a single close. */
  monthsCoveredByOneClose: number;
  missedLeadsPerMonth: number;
  closeRate: number;
  /** Expected recovered sales / month from missed-lead volume. */
  expectedSalesPerMonth: number;
  /** Expected monthly GP from recovering those leads. */
  expectedMonthlyGpZar: number;
  /** expectedMonthlyGp − monthlyCost (can be negative). */
  netMonthlyZar: number;
  headline: string;
  subline: string;
};

function clampPositive(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function clampRate(n: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0.01, n));
}

export function formatZar(amount: number, opts?: { compact?: boolean }): string {
  const rounded = Math.round(amount);
  if (opts?.compact && Math.abs(rounded) >= 1000) {
    const k = rounded / 1000;
    const kStr = Number.isInteger(k) ? String(k) : k.toFixed(1);
    return `R ${kStr}k`;
  }
  // Force ASCII grouping so marketing copy matches across Node locales (en-ZA uses NBSP).
  return `R ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Core ICP proof: one recovered lead that closes usually pays for the month.
 * Uses Pilot Partner / Showroom floor as the default software cost.
 */
export function computeDealerRoi(input: DealerRoiInput): DealerRoiResult {
  const grossProfitPerSaleZar = clampPositive(
    input.grossProfitPerSaleZar,
    ROI_DEFAULT_GROSS_PROFIT_ZAR,
  );
  const monthlyCostZar = clampPositive(
    input.monthlyCostZar ?? ROI_DEFAULT_MONTHLY_COST_ZAR,
    ROI_DEFAULT_MONTHLY_COST_ZAR,
  );
  const missedLeadsPerMonth = clampPositive(
    input.missedLeadsPerMonth ?? ROI_DEFAULT_MISSED_LEADS_PER_MONTH,
    ROI_DEFAULT_MISSED_LEADS_PER_MONTH,
  );
  const closeRate = clampRate(
    input.closeRate ?? ROI_DEFAULT_CLOSE_RATE,
    ROI_DEFAULT_CLOSE_RATE,
  );

  const closesToPayMonth = Math.max(1, Math.ceil(monthlyCostZar / grossProfitPerSaleZar));
  const monthsCoveredByOneClose = grossProfitPerSaleZar / monthlyCostZar;
  const oneClosePaysMonth = grossProfitPerSaleZar >= monthlyCostZar;
  const expectedSalesPerMonth = missedLeadsPerMonth * closeRate;
  const expectedMonthlyGpZar = expectedSalesPerMonth * grossProfitPerSaleZar;
  const netMonthlyZar = expectedMonthlyGpZar - monthlyCostZar;

  const headline = oneClosePaysMonth
    ? `One recovered lead pays for ${monthsCoveredByOneClose >= 2 ? `${Math.floor(monthsCoveredByOneClose)}+ months` : "the month"}`
    : `${closesToPayMonth} recovered closes pay for the month`;

  const subline = oneClosePaysMonth
    ? `${formatZar(grossProfitPerSaleZar)} gross on one close vs ${formatZar(monthlyCostZar)}/mo after pilot.`
    : `At ${formatZar(grossProfitPerSaleZar)} GP per close, ${closesToPayMonth} closes cover ${formatZar(monthlyCostZar)}/mo.`;

  return {
    monthlyCostZar,
    grossProfitPerSaleZar,
    closesToPayMonth,
    oneClosePaysMonth,
    monthsCoveredByOneClose,
    missedLeadsPerMonth,
    closeRate,
    expectedSalesPerMonth,
    expectedMonthlyGpZar,
    netMonthlyZar,
    headline,
    subline,
  };
}

/** Static default used on Home / Pricing without interaction. */
export function defaultDealerRoiProof(): DealerRoiResult {
  return computeDealerRoi({
    grossProfitPerSaleZar: ROI_DEFAULT_GROSS_PROFIT_ZAR,
    monthlyCostZar: ROI_DEFAULT_MONTHLY_COST_ZAR,
    missedLeadsPerMonth: ROI_DEFAULT_MISSED_LEADS_PER_MONTH,
    closeRate: ROI_DEFAULT_CLOSE_RATE,
  });
}

/** Showroom list for reference — Multi-site list stays off public soft pages. */
export function publicSoftPriceFloorZar(): number {
  return TIER_PRICES_ZAR.starter;
}
