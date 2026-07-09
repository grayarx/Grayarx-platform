/**
 * Dealer photography standards — Daytona-tier listings need volume + quality.
 */

import { isStockPhotoUrl, parseMultiPhotoField } from "./imagePipeline";

export const RECOMMENDED_PHOTO_COUNT = 8;
export const MIN_PHOTO_COUNT_SOFT = 3;
export const MIN_DISPLAY_WIDTH = 1200;

export type PhotoValidation = {
  warnings: string[];
  errors: string[];
  photoCount: number;
  score: number;
};

export function validatePhotoUrl(url: string | null | undefined): string[] {
  const warnings: string[] = [];
  if (!url?.trim()) {
    warnings.push("No photo — listing will show a placeholder (hurts conversion)");
    return warnings;
  }
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
    warnings.push("Photo URL format looks invalid");
  }
  if (isStockPhotoUrl(url)) {
    warnings.push("Stock photo detected — use your own showroom photography for trust");
  }
  const lowResHint = /w=\d+/i.exec(url);
  if (lowResHint) {
    const w = Number(lowResHint[0].replace(/\D/g, ""));
    if (w > 0 && w < MIN_DISPLAY_WIDTH) {
      warnings.push(`Photo width ~${w}px — recommend at least ${MIN_DISPLAY_WIDTH}px wide`);
    }
  }
  return warnings;
}

export function validatePhotoSet(urls: string[]): PhotoValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
  const count = unique.length;

  if (count === 0) {
    errors.push("At least one photo is required for a premium listing");
  } else if (count < MIN_PHOTO_COUNT_SOFT) {
    warnings.push(
      `Only ${count} photo${count === 1 ? "" : "s"} — aim for ${RECOMMENDED_PHOTO_COUNT}+ angles (front 3/4, rear, interior, dash, wheels)`,
    );
  } else if (count < RECOMMENDED_PHOTO_COUNT) {
    warnings.push(
      `${count} photos — ${RECOMMENDED_PHOTO_COUNT}+ recommended for luxury showroom parity`,
    );
  }

  for (const url of unique) {
    warnings.push(...validatePhotoUrl(url));
  }

  let score = 100;
  if (count === 0) score = 0;
  else {
    score -= Math.max(0, RECOMMENDED_PHOTO_COUNT - count) * 8;
    if (unique.some(isStockPhotoUrl)) score -= 25;
    if (count < MIN_PHOTO_COUNT_SOFT) score -= 15;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    warnings: [...new Set(warnings)],
    errors,
    photoCount: count,
    score,
  };
}

export function validateCsvPhotoField(raw: string | null | undefined): PhotoValidation {
  return validatePhotoSet(parseMultiPhotoField(raw ?? null));
}

export function photoQualityLabel(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 65) return "good";
  if (score >= 40) return "fair";
  return "poor";
}
