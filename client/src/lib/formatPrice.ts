/** Format ZAR for display. Prices ≤ R1 show as POA (price on application). */
export function formatVehiclePrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "POA";
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num) || num <= 1) return "POA";
  return `R ${Math.round(num).toLocaleString("en-ZA")}`;
}

export function isSuspiciousPrice(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined || value === "") return true;
  const num = typeof value === "string" ? Number(value) : value;
  return !Number.isFinite(num) || num <= 1;
}

export function parsePriceInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}
