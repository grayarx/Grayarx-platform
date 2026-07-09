/**
 * SA retail & trade-in market guides — buyer deal scores + Tumi valuations.
 * Retail asking ≈ trade-in × RETAIL_VS_TRADE_IN.
 */

export const RETAIL_VS_TRADE_IN = 1.32;

/** Trade-in guides (ZAR) — AutoTrader SA / dealer desk medians 2025–2026 */
export const TRADE_IN_GUIDES: Record<string, Record<number, number>> = {
  "volkswagen|polo vivo": {
    2010: 102_958, 2011: 109_900, 2012: 115_400, 2013: 117_400, 2014: 131_900,
    2015: 143_600, 2016: 156_390, 2017: 162_800, 2018: 181_400, 2019: 209_700,
    2020: 215_600, 2021: 226_000, 2022: 245_000, 2023: 265_000,
  },
  "volkswagen|polo": {
    2016: 165_000, 2017: 175_000, 2018: 195_000, 2019: 220_000, 2020: 235_000,
    2021: 255_000, 2022: 275_000, 2023: 295_000,
  },
  "volkswagen|golf": {
    2016: 195_000, 2017: 220_000, 2018: 265_000, 2019: 290_000, 2020: 315_000,
    2021: 340_000, 2022: 365_000, 2023: 390_000,
  },
  "volkswagen|tiguan": {
    2018: 320_000, 2019: 355_000, 2020: 385_000, 2021: 420_000, 2022: 455_000, 2023: 490_000,
  },
  "volkswagen|amarok": {
    2018: 380_000, 2019: 415_000, 2020: 450_000, 2021: 490_000, 2022: 530_000, 2023: 575_000,
  },
  "toyota|corolla": {
    2016: 165_000, 2017: 180_000, 2018: 195_000, 2019: 215_000, 2020: 235_000,
    2021: 255_000, 2022: 275_000, 2023: 295_000,
  },
  "toyota|yaris": {
    2018: 145_000, 2019: 158_000, 2020: 172_000, 2021: 188_000, 2022: 205_000, 2023: 220_000,
  },
  "toyota|hilux": {
    2016: 340_000, 2017: 360_000, 2018: 385_000, 2019: 420_000, 2020: 455_000,
    2021: 495_000, 2022: 540_000, 2023: 585_000,
  },
  "toyota|fortuner": {
    2016: 360_000, 2017: 390_000, 2018: 420_000, 2019: 465_000, 2020: 510_000,
    2021: 555_000, 2022: 600_000, 2023: 645_000,
  },
  "toyota|avanza": {
    2018: 195_000, 2019: 215_000, 2020: 235_000, 2021: 255_000, 2022: 275_000,
  },
  "ford|ranger": {
    2016: 320_000, 2017: 350_000, 2018: 380_000, 2019: 415_000, 2020: 450_000,
    2021: 490_000, 2022: 535_000, 2023: 580_000,
  },
  "ford|everest": {
    2018: 380_000, 2019: 415_000, 2020: 450_000, 2021: 490_000, 2022: 530_000,
  },
  "bmw|3 series": {
    2018: 380_000, 2019: 415_000, 2020: 450_000, 2021: 490_000, 2022: 530_000, 2023: 575_000,
  },
  "bmw|x3": {
    2018: 420_000, 2019: 460_000, 2020: 500_000, 2021: 545_000, 2022: 590_000,
  },
  "mercedes-benz|c-class": {
    2018: 395_000, 2019: 430_000, 2020: 470_000, 2021: 510_000, 2022: 555_000,
  },
  "mercedes-benz|a-class": {
    2019: 320_000, 2020: 350_000, 2021: 385_000, 2022: 420_000,
  },
  "hyundai|tucson": {
    2018: 265_000, 2019: 290_000, 2020: 315_000, 2021: 340_000, 2022: 370_000,
  },
  "hyundai|creta": {
    2019: 235_000, 2020: 255_000, 2021: 275_000, 2022: 295_000, 2023: 315_000,
  },
  "hyundai|i20": {
    2018: 135_000, 2019: 148_000, 2020: 162_000, 2021: 178_000, 2022: 195_000,
  },
  "kia|sportage": {
    2018: 255_000, 2019: 280_000, 2020: 305_000, 2021: 330_000, 2022: 360_000,
  },
  "kia|picanto": {
    2018: 125_000, 2019: 138_000, 2020: 152_000, 2021: 168_000, 2022: 185_000,
  },
  "nissan|navara": {
    2018: 360_000, 2019: 395_000, 2020: 430_000, 2021: 470_000, 2022: 510_000,
  },
  "nissan|qashqai": {
    2018: 245_000, 2019: 268_000, 2020: 292_000, 2021: 318_000, 2022: 345_000,
  },
  "suzuki|swift": {
    2018: 135_000, 2019: 148_000, 2020: 162_000, 2021: 178_000, 2022: 195_000,
  },
  "suzuki|vitara": {
    2018: 215_000, 2019: 235_000, 2020: 255_000, 2021: 278_000, 2022: 302_000,
  },
  "mazda|cx-5": {
    2018: 285_000, 2019: 310_000, 2020: 335_000, 2021: 365_000, 2022: 395_000,
  },
  "mazda|3": {
    2018: 175_000, 2019: 192_000, 2020: 210_000, 2021: 230_000, 2022: 250_000,
  },
  "audi|a3": {
    2018: 295_000, 2019: 320_000, 2020: 350_000, 2021: 380_000, 2022: 410_000,
  },
  "audi|q5": {
    2018: 420_000, 2019: 460_000, 2020: 500_000, 2021: 545_000, 2022: 590_000,
  },
};

/** Map common title fragments → guide key suffix */
const MODEL_ALIASES: Record<string, string> = {
  "polo vivo": "polo vivo",
  "polo_vivo": "polo vivo",
  "3 series": "3 series",
  "3_series": "3 series",
  "320i": "3 series",
  "330i": "3 series",
  "c-class": "c-class",
  "c class": "c-class",
  "c200": "c-class",
  "c220": "c-class",
  "a-class": "a-class",
  "a200": "a-class",
  "cx-5": "cx-5",
  "cx5": "cx-5",
  "golf gti": "golf",
  "gti": "golf",
  "gd-6": "hilux",
  "double cab": "hilux",
};

export function normalizeMakeModel(make: string, model: string): string {
  const m = make.toLowerCase().trim().replace(/^vw$/, "volkswagen");
  let mod = model.toLowerCase().trim().replace(/\s+/g, " ");
  const combined = `${m} ${mod}`;
  for (const [alias, target] of Object.entries(MODEL_ALIASES)) {
    if (combined.includes(alias) || mod.includes(alias)) {
      mod = target;
      break;
    }
  }
  if (mod.includes("polo vivo")) return "volkswagen|polo vivo";
  return `${m}|${mod}`;
}

export function resolveGuideKey(make: string, model: string, title?: string | null): string | null {
  const direct = normalizeMakeModel(make, model);
  if (TRADE_IN_GUIDES[direct]) return direct;

  const hay = `${make} ${model} ${title ?? ""}`.toLowerCase();
  for (const key of Object.keys(TRADE_IN_GUIDES)) {
    const [, guideModel] = key.split("|");
    if (hay.includes(guideModel)) return key;
  }
  for (const [alias, target] of Object.entries(MODEL_ALIASES)) {
    if (hay.includes(alias)) {
      const m = make.toLowerCase().replace(/^vw$/, "volkswagen");
      const candidate = `${m}|${target}`;
      if (TRADE_IN_GUIDES[candidate]) return candidate;
    }
  }
  return null;
}

export function interpolateGuide(table: Record<number, number>, year: number): number {
  const years = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (year in table) return table[year]!;
  const minY = years[0]!;
  const maxY = years[years.length - 1]!;
  if (year < minY) return Math.round(table[minY]! * Math.pow(0.96, minY - year));
  if (year > maxY) return Math.round(table[maxY]! * Math.pow(1.04, year - maxY));
  for (let i = 0; i < years.length - 1; i++) {
    const lo = years[i]!;
    const hi = years[i + 1]!;
    if (year > lo && year < hi) {
      const t = (year - lo) / (hi - lo);
      return Math.round(table[lo]! + (table[hi]! - table[lo]!) * t);
    }
  }
  return table[minY]!;
}

/** Trade-in desk value before condition/mileage adjustments */
export function getTradeInGuideValue(
  make: string,
  model: string,
  year: number,
  title?: string | null,
  nowYear = new Date().getFullYear(),
): { value: number; source: string; confidence: "high" | "medium" | "low" } | null {
  if (!year || year < 1995 || year > nowYear + 1) return null;

  const key = resolveGuideKey(make, model, title);
  if (key) {
    let table = TRADE_IN_GUIDES[key]!;
    // Regular Polo before 2016 tracks Polo Vivo in SA market
    if (key === "volkswagen|polo") {
      const minYear = Math.min(...Object.keys(table).map(Number));
      if (year < minYear && TRADE_IN_GUIDES["volkswagen|polo vivo"]) {
        const vivoVal = interpolateGuide(TRADE_IN_GUIDES["volkswagen|polo vivo"], year);
        return {
          value: Math.round(vivoVal * 0.95),
          source: `SA market guide — ${year} ${make} Polo (Polo Vivo proxy)`,
          confidence: "high",
        };
      }
    }
    const value = interpolateGuide(table, year);
    const [, guideModel] = key.split("|");
    return {
      value,
      source: `SA market guide — ${year} ${make} ${guideModel}`,
      confidence: "high",
    };
  }

  const age = Math.max(0, nowYear - year);
  return {
    value: Math.round(165_000 * Math.pow(0.95, age)),
    source: `Estimated SA baseline — ${year} ${make} ${model}`,
    confidence: "low",
  };
}

export type RetailGuideInput = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileageKm?: number | null;
  title?: string | null;
};

export function estimateRetailMarketMid(input: RetailGuideInput, nowYear = new Date().getFullYear()): {
  mid: number;
  source: "model_guide" | "title_parse" | "generic";
  confidence: "high" | "medium" | "low";
} {
  const year = input.year ?? 0;
  if (!year || year < 1995 || year > nowYear + 1) {
    return { mid: 0, source: "generic", confidence: "low" };
  }

  let make = input.make ?? "";
  let model = input.model ?? "";
  if ((!make || !model) && input.title) {
    const parts = input.title.split(/\s+/);
    if (parts.length >= 2) {
      make = make || parts[0];
      model = model || parts.slice(1, 3).join(" ");
    }
  }

  const guide = getTradeInGuideValue(make, model, year, input.title, nowYear);
  if (!guide) return { mid: 0, source: "generic", confidence: "low" };

  let mid = Math.round(guide.value * RETAIL_VS_TRADE_IN);
  const km = input.mileageKm ?? 80_000;
  if (km > 80_000) mid -= Math.round((km - 80_000) * 0.35);
  else if (km < 80_000) mid += Math.round((80_000 - km) * 0.25);

  const key = resolveGuideKey(make, model, input.title);
  return {
    mid: Math.max(50_000, mid),
    source: key ? "model_guide" : "title_parse",
    confidence: guide.confidence === "high" ? "high" : "medium",
  };
}

export type DealRating = "great" | "fair" | "above" | "premium" | "unknown";

export type DealScore = {
  rating: DealRating;
  label: string;
  listingPrice: number;
  marketMid: number;
  deltaZar: number;
  deltaPct: number;
  confidence: "high" | "medium" | "low";
};

export function scoreListingDeal(
  listingPrice: number,
  input: RetailGuideInput,
): DealScore | null {
  if (!listingPrice || listingPrice <= 1) return null;

  const { mid, confidence } = estimateRetailMarketMid(input);
  if (mid <= 0) return null;

  const ratio = listingPrice / mid;
  const deltaZar = mid - listingPrice;
  const deltaPct = Math.round((deltaZar / mid) * 100);

  let rating: DealRating;
  let label: string;
  if (ratio <= 0.93) {
    rating = "great";
    label = "Great deal";
  } else if (ratio <= 1.05) {
    rating = "fair";
    label = "Fair price";
  } else if (ratio <= 1.15) {
    rating = "above";
    label = "Above market";
  } else {
    rating = "premium";
    label = "Premium priced";
  }

  return {
    rating,
    label,
    listingPrice,
    marketMid: mid,
    deltaZar,
    deltaPct,
    confidence,
  };
}

export function calcUpgradeGap(replacementPrice: number, tradeInMid: number, deposit = 0): {
  netCashRequired: number;
  tradeInApplied: number;
  depositApplied: number;
} {
  const tradeInApplied = Math.max(0, tradeInMid);
  const depositApplied = Math.max(0, deposit);
  const netCashRequired = Math.max(0, replacementPrice - tradeInApplied - depositApplied);
  return { netCashRequired, tradeInApplied, depositApplied };
}

/** Normalize SA phone to digits for verification */
export function normalizeSaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length >= 11) return digits.slice(-9);
  if (digits.startsWith("0") && digits.length >= 10) return digits.slice(-9);
  return digits.slice(-9);
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizeSaPhone(a);
  const nb = normalizeSaPhone(b);
  return na.length >= 9 && nb.length >= 9 && na === nb;
}
