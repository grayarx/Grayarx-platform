/**
 * ISO 3779 VIN validation (format + check digit).
 * VIN remains optional for pilot — empty / whitespace is valid.
 * Optional later: NHTSA (or local) decode for make/model/year enrichment.
 */

export type VinValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; normalized?: string; reason: string };

/** VIN charset: A–Z and 0–9 excluding I, O, Q. */
const VIN_CHAR = /^[A-HJ-NPR-Z0-9]$/;
const VIN_BODY = /^[A-HJ-NPR-Z0-9]{17}$/;

const TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

/** Weights for positions 1–17 (ISO 3779). Position 9 (check digit) has weight 0. */
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export function normalizeVin(raw: string | null | undefined): string {
  if (raw == null) return "";
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");
}

function charValue(ch: string): number | null {
  if (ch >= "0" && ch <= "9") return Number(ch);
  const n = TRANSLITERATION[ch];
  return n === undefined ? null : n;
}

/** Expected check digit character for a 17-char normalized VIN body. */
export function vinCheckDigit(vin17: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const v = charValue(vin17[i]);
    if (v === null) return "?";
    sum += v * WEIGHTS[i];
  }
  const rem = sum % 11;
  return rem === 10 ? "X" : String(rem);
}

/**
 * Validate an optional VIN.
 * - Empty after normalize → ok (optional field)
 * - Non-empty must be 17 chars, valid charset, matching ISO 3779 check digit
 */
export function validateVin(raw: string | null | undefined): VinValidationResult {
  const normalized = normalizeVin(raw);
  if (!normalized) {
    return { ok: true, normalized: "" };
  }

  if (normalized.length !== 17) {
    return {
      ok: false,
      normalized,
      reason: `VIN must be exactly 17 characters (got ${normalized.length}).`,
    };
  }

  if (!VIN_BODY.test(normalized)) {
    const bad = [...normalized].filter((c) => !VIN_CHAR.test(c));
    const unique = [...new Set(bad)].join(", ");
    return {
      ok: false,
      normalized,
      reason: unique
        ? `VIN contains invalid character(s): ${unique}. Letters I, O, and Q are not allowed.`
        : "VIN contains invalid characters. Letters I, O, and Q are not allowed.",
    };
  }

  const expected = vinCheckDigit(normalized);
  if (normalized[8] !== expected) {
    return {
      ok: false,
      normalized,
      reason: `VIN check digit is invalid (position 9 should be ${expected}).`,
    };
  }

  return { ok: true, normalized };
}

/** Zod-friendly helper: empty → undefined; valid → normalized; invalid → throw message. */
export function parseOptionalVin(raw: string | null | undefined): string | undefined {
  const result = validateVin(raw);
  if (!result.ok) {
    throw new Error(result.reason);
  }
  return result.normalized || undefined;
}
