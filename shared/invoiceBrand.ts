/**
 * GrayArx customer-facing invoice brand tokens + POPIA helpers.
 * Used by the printable invoice page (and any future HTML→PDF path).
 */

export const INVOICE_BRAND = {
  gold: "#C9A24A",
  goldSoft: "#D4AF37",
  black: "#0B0B0B",
  ink: "#1A1A1A",
  muted: "#5C5C5C",
  rule: "#E8E0D0",
  paper: "#FFFFFF",
  paperTint: "#FAF8F4",
  logoIconPath: "/logo-crest.png?v=14",
  logoFullPath: "/grayarx-logo-full.png?v=14",
  accentFallback: "#C9A24A",
} as const;

export function formatZar(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(safe);
}

/** Mask to last 4 visible characters (IDs, bank refs, VIN, phones). */
export function maskLast4(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/\s+/g, "");
  if (cleaned.length < 5) return "••••";
  return "•".repeat(Math.max(0, cleaned.length - 4)) + cleaned.slice(-4);
}

/** Partially mask email for customer-facing PDFs. */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return email ?? null;
  const [local, domain] = email.split("@");
  if (!local) return `•••@${domain}`;
  const keep = local.slice(0, Math.min(2, local.length));
  return `${keep}•••@${domain}`;
}

export function invoicePopiaFooter(): string {
  return (
    "POPIA: Personal information on this document is limited to what is needed for billing. " +
    "Customer ID numbers, third-party bank refs, and vehicle VINs are masked to the last 4 digits. " +
    "GrayArx receiving bank details are shown in full so you can complete EFT payment. " +
    "Questions: privacy@grayarx.com"
  );
}

export type InvoiceLetterheadMode = "platform" | "dealership";

/**
 * Platform letterhead = GrayArx billing the dealership (subscription).
 * Dealership letterhead = dealer selling a vehicle (customer invoice), with GrayArx platform credit.
 */
export function resolveLetterheadMode(opts: {
  leadId: number;
  vehicleId: number;
}): InvoiceLetterheadMode {
  if (!opts.leadId || !opts.vehicleId) return "platform";
  return "dealership";
}
