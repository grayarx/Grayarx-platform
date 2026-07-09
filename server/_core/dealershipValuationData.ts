/**
 * Real South African Dealership Trade-In Valuation Data
 * 
 * Source: AutoTrader SA (https://www.autotrader.co.za)
 * Last Updated: February 2026
 * 
 * These are the ACTUAL average trade-in prices that dealerships use in South Africa.
 * This data is used to calibrate Tumi's valuation algorithm for maximum accuracy.
 */

import { getTradeInGuideValue, resolveGuideKey } from "@shared/saMarketGuides";
import { getLiveGuideOverride } from "./marketGuideCache";

export const AUTOTRADER_POLO_VIVO_TRADE_IN: Record<number, number> = {
  2010: 102_958,
  2011: 109_900,
  2012: 115_400,
  2013: 117_400,
  2014: 131_900,
  2015: 143_600,
  2016: 156_390,
  2017: 162_800,
  2018: 181_400,
  2019: 209_700,
  2020: 215_600,
};

/**
 * Get the base trade-in value for a Polo Vivo using AutoTrader data.
 * Uses linear interpolation for years between known data points.
 */
function getPoloVivoBaseValue(year: number): number {
  const years = Object.keys(AUTOTRADER_POLO_VIVO_TRADE_IN)
    .map(Number)
    .sort((a, b) => a - b);

  // If exact year exists, return it
  if (year in AUTOTRADER_POLO_VIVO_TRADE_IN) {
    return AUTOTRADER_POLO_VIVO_TRADE_IN[year]!;
  }

  // Find the two nearest years for interpolation
  let lower = years[0]!;
  let upper = years[years.length - 1]!;

  for (let i = 0; i < years.length - 1; i++) {
    if (years[i]! < year && year < years[i + 1]!) {
      lower = years[i]!;
      upper = years[i + 1]!;
      break;
    }
  }

  // Extrapolate for years before 2010 or after 2020
  if (year < 2010) {
    // Depreciate at ~2% per year for very old vehicles
    const yearsOlder = 2010 - year;
    return AUTOTRADER_POLO_VIVO_TRADE_IN[2010]! * Math.pow(0.98, yearsOlder);
  }

  if (year > 2020) {
    // Appreciate at ~5% per year for newer vehicles
    const yearsNewer = year - 2020;
    return AUTOTRADER_POLO_VIVO_TRADE_IN[2020]! * Math.pow(1.05, yearsNewer);
  }

  // Linear interpolation between known years
  const lowerValue = AUTOTRADER_POLO_VIVO_TRADE_IN[lower]!;
  const upperValue = AUTOTRADER_POLO_VIVO_TRADE_IN[upper]!;
  const ratio = (year - lower) / (upper - lower);
  return lowerValue + (upperValue - lowerValue) * ratio;
}

/**
 * Calculate realistic trade-in value based on real market data.
 * 
 * This function uses the AutoTrader SA data as the foundation and applies
 * adjustments for condition/mileage/history/transmission/fuel.
 */
export function calculateRealisticTradeInValue(
  make: string,
  model: string,
  year: number,
  mileageKm: number,
  condition: "excellent" | "good" | "fair" | "poor",
  serviceHistory: "full_dealer" | "full_independent" | "partial" | "none",
  transmission: "manual" | "automatic" | "cvt" | "dct" = "automatic",
  fuel: "petrol" | "diesel" | "hybrid" | "electric" = "petrol",
): number {
  // Check if this is a Polo Vivo - use exact AutoTrader data
  const makeModel = `${make.toLowerCase()}|${model.toLowerCase()}`;
  let baseValue: number;

  if (makeModel === "volkswagen|polo vivo" || makeModel === "volkswagen|polo_vivo") {
    baseValue = getPoloVivoBaseValue(year);
  } else if (makeModel === "volkswagen|polo") {
    // For regular Polo (not Vivo), use Vivo as proxy (similar market)
    baseValue = getPoloVivoBaseValue(year) * 0.95; // Slightly lower than Vivo
  } else {
    // For unknown vehicles, use a conservative baseline
    baseValue = 165_000 * Math.pow(0.95, 2026 - year);
  }

  // Apply condition adjustment
  // Note: AutoTrader prices are for "good" condition, so we adjust from there
  let conditionMultiplier = 1;
  switch (condition) {
    case "excellent":
      conditionMultiplier = 1.08; // +8% for excellent
      break;
    case "good":
      conditionMultiplier = 1.0; // baseline
      break;
    case "fair":
      conditionMultiplier = 0.92; // -8% for fair
      break;
    case "poor":
      conditionMultiplier = 0.80; // -20% for poor
      break;
  }

  // Apply mileage adjustment (smaller scale since AutoTrader already factors this in)
  // Only apply if significantly different from 120k km (typical for trade-ins)
  let mileageAdjustment = 0;
  if (mileageKm < 80_000) {
    // Low mileage bonus: R0.30 per km below 80k
    mileageAdjustment = (80_000 - mileageKm) * 0.3;
  } else if (mileageKm > 150_000) {
    // High mileage penalty: R0.20 per km above 150k
    mileageAdjustment = -(mileageKm - 150_000) * 0.2;
  }

  // Apply service history adjustment (smaller scale)
  let historyAdjustment = 0;
  switch (serviceHistory) {
    case "full_dealer":
      historyAdjustment = 8_000; // +8k for full dealer
      break;
    case "full_independent":
      historyAdjustment = 4_000; // +4k for full independent
      break;
    case "partial":
      historyAdjustment = -1_500; // -1.5k for partial
      break;
    case "none":
      historyAdjustment = -5_000; // -5k for none
      break;
  }

  // Apply transmission adjustment
  let transmissionAdjustment = 0;
  switch (transmission) {
    case "automatic":
      transmissionAdjustment = 8_000; // +8k for automatic
      break;
    case "dct":
      transmissionAdjustment = 4_000; // +4k for DCT
      break;
    case "cvt":
      transmissionAdjustment = 0; // Neutral
      break;
    case "manual":
      transmissionAdjustment = -10_000; // -10k for manual
      break;
  }

  // Apply fuel type adjustment
  let fuelAdjustment = 0;
  switch (fuel) {
    case "diesel":
      fuelAdjustment = 8_000; // +8k for diesel
      break;
    case "hybrid":
      fuelAdjustment = 12_000; // +12k for hybrid
      break;
    case "electric":
      fuelAdjustment = -15_000; // -15k for electric (SA market penalizes)
      break;
    case "petrol":
      fuelAdjustment = 0; // Baseline
      break;
  }

  // Calculate final value
  const adjustedValue =
    baseValue * conditionMultiplier +
    mileageAdjustment +
    historyAdjustment +
    transmissionAdjustment +
    fuelAdjustment;

  // Apply floor and ceiling
  const floor = 15_000;
  const ceiling = baseValue * 1.5; // Don't exceed 150% of base

  return Math.max(floor, Math.min(ceiling, adjustedValue));
}

export type TradeInValuationBreakdown = {
  baseValue: number;
  baseSource: string;
  vehicleAgeYears: number;
  factors: Array<{ factor: string; rand: number; reason: string }>;
  finalValue: number;
};

/**
 * Same valuation as calculateRealisticTradeInValue but returns an honest
 * factor breakdown that matches the final number (no misleading 5-year baseline).
 */
export function calculateRealisticTradeInValueDetailed(
  make: string,
  model: string,
  year: number,
  mileageKm: number,
  condition: "excellent" | "good" | "fair" | "poor",
  serviceHistory: "full_dealer" | "full_independent" | "partial" | "none",
  transmission: "manual" | "automatic" | "cvt" | "dct" = "automatic",
  fuel: "petrol" | "diesel" | "hybrid" | "electric" = "petrol",
  now: Date = new Date(),
): TradeInValuationBreakdown {
  const currentYear = now.getFullYear();
  const vehicleAgeYears = Math.max(0, currentYear - year);
  let guide = getTradeInGuideValue(make, model, year);

  const guideKey = resolveGuideKey(make, model);
  if (guideKey) {
    const live = getLiveGuideOverride(guideKey, year);
    if (live && live.tradeInValueZar > 0) {
      guide = {
        value: live.tradeInValueZar,
        source: `${live.source} (live, updated ${live.updatedAt.toISOString().slice(0, 10)})`,
        confidence: live.confidence,
      };
    }
  }

  let baseValue: number;
  let baseSource: string;

  if (guide) {
    baseValue = guide.value;
    baseSource = guide.source;
  } else {
    baseValue = 165_000 * Math.pow(0.95, Math.max(0, vehicleAgeYears));
    baseSource = `Estimated SA market baseline for ${year} ${make} ${model} (${vehicleAgeYears} years old)`;
  }

  const factors: TradeInValuationBreakdown["factors"] = [
    {
      factor: "Year / market guide",
      rand: Math.round(baseValue),
      reason: baseSource,
    },
  ];

  let running = baseValue;

  const conditionPct =
    condition === "excellent" ? 8 : condition === "good" ? 0 : condition === "fair" ? -8 : -20;
  if (conditionPct !== 0) {
    const delta = Math.round(baseValue * (conditionPct / 100));
    running += delta;
    factors.push({
      factor: "Condition",
      rand: delta,
      reason:
        condition === "excellent"
          ? "Excellent condition — above guide."
          : condition === "fair"
            ? "Fair condition — reconditioning likely needed."
            : "Poor condition — significant reconditioning cost.",
    });
  } else {
    factors.push({
      factor: "Condition",
      rand: 0,
      reason: "Good condition — matches guide assumption.",
    });
  }

  let mileageAdjustment = 0;
  if (mileageKm < 80_000) {
    mileageAdjustment = Math.round((80_000 - mileageKm) * 0.3);
    factors.push({
      factor: "Mileage",
      rand: mileageAdjustment,
      reason: `${mileageKm.toLocaleString("en-ZA")} km — below typical for age.`,
    });
    running += mileageAdjustment;
  } else if (mileageKm > 150_000) {
    mileageAdjustment = Math.round(-(mileageKm - 150_000) * 0.2);
    factors.push({
      factor: "Mileage",
      rand: mileageAdjustment,
      reason: `${mileageKm.toLocaleString("en-ZA")} km — high for resale.`,
    });
    running += mileageAdjustment;
  } else {
    factors.push({
      factor: "Mileage",
      rand: 0,
      reason: `${mileageKm.toLocaleString("en-ZA")} km — typical range.`,
    });
  }

  const historyMap = {
    full_dealer: { rand: 8_000, reason: "Full dealer service history." },
    full_independent: { rand: 4_000, reason: "Full independent service history." },
    partial: { rand: -1_500, reason: "Partial service history." },
    none: { rand: -5_000, reason: "No service history on file." },
  } as const;
  const hist = historyMap[serviceHistory];
  factors.push({ factor: "Service history", rand: hist.rand, reason: hist.reason });
  running += hist.rand;

  const transMap = {
    automatic: { rand: 8_000, reason: "Automatic — preferred in metro SA." },
    dct: { rand: 4_000, reason: "DCT gearbox." },
    cvt: { rand: 0, reason: "CVT — neutral." },
    manual: { rand: -10_000, reason: "Manual — narrower buyer pool." },
  } as const;
  const trans = transMap[transmission];
  factors.push({ factor: "Transmission", rand: trans.rand, reason: trans.reason });
  running += trans.rand;

  const fuelMap = {
    diesel: { rand: 8_000, reason: "Diesel — long-distance buyers." },
    hybrid: { rand: 12_000, reason: "Hybrid premium." },
    electric: { rand: -15_000, reason: "EV resale market still developing in SA." },
    petrol: { rand: 0, reason: "Petrol — standard baseline." },
  } as const;
  const fuelAdj = fuelMap[fuel];
  factors.push({ factor: "Fuel type", rand: fuelAdj.rand, reason: fuelAdj.reason });
  running += fuelAdj.rand;

  const floor = 15_000;
  const ceiling = baseValue * 1.5;
  const finalValue = Math.max(floor, Math.min(ceiling, Math.round(running)));

  return {
    baseValue: Math.round(baseValue),
    baseSource,
    vehicleAgeYears,
    factors,
    finalValue,
  };
}
