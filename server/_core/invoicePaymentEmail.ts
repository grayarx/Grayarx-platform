/**
 * Invoice email with EFT payment instructions (Resend / HTML).
 */
import {
  buildEftPaymentInstructions,
  formatEftPaymentText,
  renderEftPaymentInstructionsHtml,
  type GrayArxBankDetails,
} from "../../shared/bankDetails";
import { formatZar } from "../../shared/invoiceBrand";
import { grayArxEmailLayout } from "../../shared/emailBranding";

export function buildInvoicePaymentEmail(opts: {
  invoiceNumber: string;
  totalAmount: number | string;
  dueDate: string;
  dealershipName: string;
  platformBank: GrayArxBankDetails;
  printUrl?: string | null;
}): { subject: string; html: string; text: string } | null {
  const eft = buildEftPaymentInstructions(
    opts.platformBank,
    opts.invoiceNumber,
  );
  if (!eft) return null;

  const total = formatZar(opts.totalAmount);
  const subject = `GrayArx invoice ${opts.invoiceNumber} — ${total} due`;

  const printLink = opts.printUrl
    ? `<p style="margin:16px 0;font-size:14px;">
        <a href="${escapeAttr(opts.printUrl)}" style="color:#C9A24A;font-weight:600;">View / print invoice PDF</a>
      </p>`
    : "";

  const bodyHtml = `
  <p style="font-size:15px;line-height:1.55;margin:0 0 12px;">
    Hi ${escapeHtml(opts.dealershipName)},
  </p>
  <p style="font-size:15px;line-height:1.55;margin:0 0 12px;color:#374151;">
    Your GrayArx invoice <strong>${escapeHtml(opts.invoiceNumber)}</strong> is ready.
    Amount due: <strong>${escapeHtml(total)}</strong>
    ${opts.dueDate ? ` · Due ${escapeHtml(opts.dueDate)}` : ""}.
  </p>
  ${renderEftPaymentInstructionsHtml(eft)}
  ${printLink}
  <p style="font-size:13px;color:#5c5c5c;line-height:1.5;margin:16px 0 0;">
    After you pay, reply to this email or use the invoice number as your payment reference so we can mark it paid.
  </p>
`.trim();

  const html = grayArxEmailLayout(bodyHtml, "Invoice");
  const text = [
    `GrayArx invoice ${opts.invoiceNumber}`,
    `Amount due: ${total}`,
    opts.dueDate ? `Due: ${opts.dueDate}` : "",
    "",
    formatEftPaymentText(eft),
    opts.printUrl ? `\nView invoice: ${opts.printUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
