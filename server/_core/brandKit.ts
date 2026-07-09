/**
 * Per-dealership brand kit — central source of truth for the visual
 * identity that every agent reuses (email signature, invoice header,
 * WhatsApp footer, fallback reply footer).
 *
 * The dealership row holds optional brand fields. When any field is
 * missing we fall back to GrayArx's default look (gold/black) so the
 * dealer can ship before they've uploaded their logo.
 */

export interface BrandKit {
  dealershipName: string;
  logoUrl: string | null;
  accentColor: string;
  signature: string;
  vatNumber: string | null;
  bankDetails: string | null;
}

const GRAYARX_DEFAULT_ACCENT = "#C9A24A";
const GRAYARX_DEFAULT_SIGNATURE =
  "Powered by GrayArx · The Dealership AI Operating System";

/**
 * Build a usable brand kit from a (possibly partial) dealership record.
 * Always returns a fully-populated kit so downstream agents don't need
 * to handle nulls.
 */
export function resolveBrandKit(dealership: {
  name?: string | null;
  brandLogoUrl?: string | null;
  brandAccentColor?: string | null;
  brandSignature?: string | null;
  vatNumber?: string | null;
  bankDetails?: string | null;
}): BrandKit {
  const accent =
    sanitizeHexColor(dealership.brandAccentColor) ?? GRAYARX_DEFAULT_ACCENT;
  return {
    dealershipName: dealership.name?.trim() || "Your dealership",
    logoUrl: dealership.brandLogoUrl?.trim() || null,
    accentColor: accent,
    signature: dealership.brandSignature?.trim() || GRAYARX_DEFAULT_SIGNATURE,
    vatNumber: dealership.vatNumber?.trim() || null,
    bankDetails: dealership.bankDetails?.trim() || null,
  };
}

/**
 * Hex colour validator. Accepts `#RGB`, `#RRGGBB`, with or without leading
 * `#`. Anything else is dropped, so a fat-fingered admin entry never blows
 * up an outbound email.
 */
export function sanitizeHexColor(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  return null;
}

/**
 * POPIA-safe masking helpers. Used in customer-facing invoice/statement
 * PDFs so the dealer can configure full bank details once but never leak
 * them to a customer.
 */
export function maskAccountNumber(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return value;
  return `**** **** ${digits.slice(-4)}`;
}

export function maskIdNumber(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return value;
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function maskPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return value;
  return `+${digits.slice(0, 2)} *** *** ${digits.slice(-4)}`;
}

/**
 * Render an HTML email signature block from a brand kit. Used by every
 * outbound email agent (Mia, Lerato, Thandi).
 */
export function renderEmailSignature(brand: BrandKit, agentDisplayName: string): string {
  const accent = brand.accentColor;
  const logo = brand.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.dealershipName)}" height="36" style="height:36px;display:block;border-radius:4px;" />`
    : "";
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:2px solid ${accent};padding-top:12px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#0f172a;">
  <tr>
    <td>${logo}</td>
    <td style="padding-left:12px;">
      <div style="font-weight:600;color:${accent};">${escapeHtml(agentDisplayName)} \u00b7 ${escapeHtml(brand.dealershipName)}</div>
      <div style="color:#64748b;margin-top:2px;">${escapeHtml(brand.signature)}</div>
    </td>
  </tr>
</table>`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
