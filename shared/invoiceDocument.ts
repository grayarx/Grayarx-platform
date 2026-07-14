/**
 * Printable invoice document model — shared between API payload and UI.
 */
import {
  formatZar,
  invoicePopiaFooter,
  maskEmail,
  maskLast4,
  resolveLetterheadMode,
  type InvoiceLetterheadMode,
  INVOICE_BRAND,
} from "./invoiceBrand";
import {
  GRAYARX_LEGAL,
  grayArxRegisteredAddressSingleLine,
  grayArxTaxStatusLine,
} from "./companyLegal";

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
};

export type InvoiceDocumentView = {
  letterheadMode: InvoiceLetterheadMode;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  currency: "ZAR";
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  subtotalFormatted: string;
  vatFormatted: string;
  totalFormatted: string;
  showVat: boolean;
  accentColor: string;
  logoUrl: string | null;
  from: {
    name: string;
    subtitle: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    taxLine: string | null;
  };
  billTo: {
    name: string;
    email: string | null;
    phone: string | null;
    detail: string | null;
  };
  lineItems: InvoiceLineItem[];
  payments: Array<{
    amountFormatted: string;
    paymentDate: string;
    method: string;
    reference: string | null;
  }>;
  bankDetailsMasked: string | null;
  preparedBy: string;
  popiaFooter: string;
  platformCredit: string | null;
  grayArxLegalName: string;
  grayArxWebsite: string;
};

function asDateLabel(value: unknown): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function buildInvoiceDocumentView(input: {
  invoice: {
    invoiceNumber: string;
    status: string;
    invoiceDate: unknown;
    dueDate: unknown;
    leadId: number;
    vehicleId: number;
    subtotal: number | string;
    vatAmount: number | string;
    totalAmount: number | string;
  };
  dealership: {
    name: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    region?: string | null;
    brandLogoUrl?: string | null;
    brandAccentColor?: string | null;
    vatNumber?: string | null;
    bankDetails?: string | null;
  } | null;
  lead: {
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  vehicle: {
    title?: string | null;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    vin?: string | null;
    price?: number | string | null;
  } | null;
  payments?: Array<{
    amount: number | string;
    paymentDate: unknown;
    paymentMethod: string;
    reference?: string | null;
  }>;
}): InvoiceDocumentView {
  const letterheadMode = resolveLetterheadMode({
    leadId: Number(input.invoice.leadId) || 0,
    vehicleId: Number(input.invoice.vehicleId) || 0,
  });

  const subtotal = Number(input.invoice.subtotal) || 0;
  const vatAmount = Number(input.invoice.vatAmount) || 0;
  const totalAmount = Number(input.invoice.totalAmount) || 0;
  const accent =
    input.dealership?.brandAccentColor &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(input.dealership.brandAccentColor)
      ? input.dealership.brandAccentColor
      : INVOICE_BRAND.gold;

  const vehicleLabel = input.vehicle
    ? [
        input.vehicle.year,
        input.vehicle.make,
        input.vehicle.model,
      ]
        .filter(Boolean)
        .join(" ") ||
      input.vehicle.title ||
      "Vehicle"
    : null;

  const lineItems: InvoiceLineItem[] =
    letterheadMode === "platform"
      ? [
          {
            description: `GrayArx subscription — ${input.dealership?.name ?? "Dealership"}`,
            quantity: 1,
            unitAmount: subtotal,
            amount: subtotal,
          },
        ]
      : [
          {
            description: [
              vehicleLabel ?? "Vehicle sale",
              input.vehicle?.vin ? `VIN ${maskLast4(input.vehicle.vin)}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
            quantity: 1,
            unitAmount: subtotal,
            amount: subtotal,
          },
        ];

  const from =
    letterheadMode === "platform"
      ? {
          name: GRAYARX_LEGAL.legalName,
          subtitle: "Prepared by Thandi · GrayArx Accountant",
          email: GRAYARX_LEGAL.supportEmail,
          phone: GRAYARX_LEGAL.phone,
          address: grayArxRegisteredAddressSingleLine(),
          taxLine: grayArxTaxStatusLine(),
        }
      : {
          name: input.dealership?.name ?? "Dealership",
          subtitle: "Tax invoice / quotation · prepared with Thandi (GrayArx)",
          email: input.dealership?.contactEmail ?? null,
          phone: input.dealership?.contactPhone
            ? maskLast4(input.dealership.contactPhone)
            : null,
          address: input.dealership?.region
            ? `${input.dealership.region}, South Africa`
            : null,
          taxLine: input.dealership?.vatNumber
            ? `VAT no. ${input.dealership.vatNumber}`
            : "VAT details on request",
        };

  const billTo =
    letterheadMode === "platform"
      ? {
          name: input.dealership?.name ?? "Dealership",
          email: input.dealership?.contactEmail ?? null,
          phone: input.dealership?.contactPhone
            ? maskLast4(input.dealership.contactPhone)
            : null,
          detail: input.dealership?.region
            ? `${input.dealership.region}, South Africa`
            : null,
        }
      : {
          name: input.lead?.contactName ?? "Customer",
          email: maskEmail(input.lead?.email ?? null),
          phone: maskLast4(input.lead?.phone ?? null),
          detail: vehicleLabel ? `Re: ${vehicleLabel}` : null,
        };

  return {
    letterheadMode,
    invoiceNumber: input.invoice.invoiceNumber,
    status: input.invoice.status,
    invoiceDate: asDateLabel(input.invoice.invoiceDate),
    dueDate: asDateLabel(input.invoice.dueDate),
    currency: "ZAR",
    subtotal,
    vatAmount,
    totalAmount,
    subtotalFormatted: formatZar(subtotal),
    vatFormatted: formatZar(vatAmount),
    totalFormatted: formatZar(totalAmount),
    showVat: vatAmount > 0,
    accentColor: accent,
    logoUrl:
      letterheadMode === "dealership" && input.dealership?.brandLogoUrl
        ? input.dealership.brandLogoUrl
        : INVOICE_BRAND.logoIconPath,
    from,
    billTo,
    lineItems,
    payments: (input.payments ?? []).map((p) => ({
      amountFormatted: formatZar(p.amount),
      paymentDate: asDateLabel(p.paymentDate),
      method: p.paymentMethod.replace(/_/g, " "),
      reference: p.reference ? maskLast4(p.reference) : null,
    })),
    bankDetailsMasked: input.dealership?.bankDetails
      ? maskLast4(input.dealership.bankDetails)
      : null,
    preparedBy: "Thandi · GrayArx Accountant Agent",
    popiaFooter: invoicePopiaFooter(),
    platformCredit:
      letterheadMode === "dealership"
        ? "Document generated on the GrayArx platform"
        : null,
    grayArxLegalName: GRAYARX_LEGAL.legalName,
    grayArxWebsite: GRAYARX_LEGAL.website,
  };
}
