/**
 * GrayArx platform EFT / bank-transfer details for invoices and emails.
 * Account numbers come from env at runtime — never hardcode real numbers here.
 */

export type GrayArxBankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  /** True when BANK_ACCOUNT_NUMBER is set (required for EFT instructions). */
  configured: boolean;
};

export type EftPaymentInstructions = GrayArxBankDetails & {
  paymentReference: string;
  methodLabel: string;
};

/** Defaults for SA FNB business (universal branch). Founder must confirm branch code. */
export const BANK_DEFAULTS = {
  bankName: "FNB",
  accountName: "GrayArx (Pty) Ltd",
  /** Common FNB universal branch code — confirm with FNB / founder before go-live. */
  branchCode: "250655",
} as const;

export function resolveGrayArxBankDetails(env: {
  BANK_NAME?: string | null;
  BANK_ACCOUNT_NUMBER?: string | null;
  BANK_BRANCH_CODE?: string | null;
  BANK_ACCOUNT_NAME?: string | null;
}): GrayArxBankDetails {
  const accountNumber = String(env.BANK_ACCOUNT_NUMBER ?? "").trim();
  return {
    bankName: String(env.BANK_NAME ?? "").trim() || BANK_DEFAULTS.bankName,
    accountName:
      String(env.BANK_ACCOUNT_NAME ?? "").trim() || BANK_DEFAULTS.accountName,
    accountNumber,
    branchCode:
      String(env.BANK_BRANCH_CODE ?? "").trim() || BANK_DEFAULTS.branchCode,
    configured: accountNumber.length > 0,
  };
}

export function buildEftPaymentInstructions(
  bank: GrayArxBankDetails,
  paymentReference: string,
): EftPaymentInstructions | null {
  if (!bank.configured) return null;
  return {
    ...bank,
    paymentReference: paymentReference.trim() || "INVOICE",
    methodLabel: "EFT / bank transfer",
  };
}

/** Plain-text block for emails and FAQ answers. */
export function formatEftPaymentText(eft: EftPaymentInstructions): string {
  return [
    "Pay by EFT / bank transfer:",
    `Bank: ${eft.bankName}`,
    `Account name: ${eft.accountName}`,
    `Account number: ${eft.accountNumber}`,
    `Branch code: ${eft.branchCode}`,
    `Reference: ${eft.paymentReference}`,
    "(Please use the invoice number as your payment reference.)",
  ].join("\n");
}

/** HTML block for invoice emails (table-safe, inline styles). */
export function renderEftPaymentInstructionsHtml(
  eft: EftPaymentInstructions,
  opts?: { accent?: string },
): string {
  const accent = opts?.accent ?? "#C9A24A";
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:4px 12px 4px 0;color:#5c5c5c;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td>
      <td style="padding:4px 0;color:#1a1a1a;font-size:13px;font-weight:600;">${escapeHtml(value)}</td>
    </tr>`;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;border:1px solid #e8e0d0;border-radius:4px;background:#faf8f4;">
  <tr>
    <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:10px;">
        Payment instructions · EFT
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        ${row("Bank", eft.bankName)}
        ${row("Account name", eft.accountName)}
        ${row("Account number", eft.accountNumber)}
        ${row("Branch code", eft.branchCode)}
        ${row("Reference", eft.paymentReference)}
      </table>
      <p style="margin:12px 0 0;font-size:12px;color:#5c5c5c;line-height:1.45;">
        Please use the invoice number as your payment reference so we can allocate your payment.
      </p>
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
