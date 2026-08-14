/**
 * ICP "no-brainer" ROI math — after-hours leakage vs recovering one deal.
 * Used on /for-dealers and founder call kits. Keep assumptions editable.
 *
 * "Covers the month" anchors to Showroom list / pilot bill (R3 999) — the
 * cheapest plan. Pilot partners get Growth features at that same price.
 * Growth list (R7 999) still clears on ~one deal at default gross.
 */

import { PILOT_PARTNER, TIER_PRICES_ZAR } from "./subscriptionTiers";

/** Cheapest billable month: Showroom list === pilot partner rate. */
export const CHEAPEST_MONTHLY_ZAR = TIER_PRICES_ZAR.starter; // 3999

export const ICP_ROI_DEFAULTS = {
  deadLeadsPerWeek: 8,
  /** Share of ignored after-hours leads that would book if answered same night */
  bookRatePct: 15,
  /** Typical gross profit on one closed used-car deal (ZAR) */
  grossProfitPerDealZar: 12_000,
  /**
   * Public "covers the month" threshold — Showroom / pilot (not Growth list).
   * Soft-rounded display still uses formatZarWhole; compare against exact rand.
   */
  coversMonthBelowZar: CHEAPEST_MONTHLY_ZAR,
  /** Growth list — use on calls when upselling off pilot */
  growthListZar: TIER_PRICES_ZAR.professional,
  pilotBillZar: PILOT_PARTNER.monthlyPriceZar,
} as const;

export type IcpRoiInput = {
  deadLeadsPerWeek: number;
  bookRatePct: number;
  grossProfitPerDealZar: number;
};

export type IcpRoiResult = {
  recoverableDealsPerMonth: number;
  monthlyLeakageZar: number;
  /** True when recovering ~1 deal/month of their gross beats the soft cover threshold */
  noBrainer: boolean;
  oneDealCoversMonth: boolean;
};

export function computeIcpRoi(input: IcpRoiInput): IcpRoiResult {
  const weeks = 4;
  const rate = Math.min(100, Math.max(0, input.bookRatePct)) / 100;
  const leads = Math.max(0, input.deadLeadsPerWeek);
  const gross = Math.max(0, input.grossProfitPerDealZar);
  const recoverableDealsPerMonth = leads * weeks * rate;
  const monthlyLeakageZar = Math.round(recoverableDealsPerMonth * gross);
  const oneDealCoversMonth = gross >= ICP_ROI_DEFAULTS.coversMonthBelowZar;
  const noBrainer =
    oneDealCoversMonth && monthlyLeakageZar >= ICP_ROI_DEFAULTS.coversMonthBelowZar;
  return {
    recoverableDealsPerMonth: Math.round(recoverableDealsPerMonth * 10) / 10,
    monthlyLeakageZar,
    noBrainer,
    oneDealCoversMonth,
  };
}

export function formatZarWhole(n: number): string {
  return `R${Math.round(n).toLocaleString("en-ZA")}`;
}
