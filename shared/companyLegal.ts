/** Canonical GrayArx (Pty) Ltd details for legal documents and footers. */
export const GRAYARX_LEGAL = {
  legalName: "GrayArx (Pty) Ltd",
  /** CIPC company registration (May 2026). */
  enterpriseNumber: "2026/407647/07",
  /** SARS income tax reference — confirmed on IT77c notice of registration (May 2026). */
  incomeTaxReference: "9172596295",
  /** Not VAT-registered as at July 2026 — invoices exclude VAT. */
  vatRegistered: false,
  vatNumber: null as string | null,
  registeredAddress: {
    street: "Sjampanije Street",
    city: "Roodepoort",
    province: "Gauteng",
    postalCode: "1736",
    country: "South Africa",
  },
  informationOfficerEmail: "privacy@grayarx.com",
  legalEmail: "legal@grayarx.com",
  supportEmail: "hello@grayarx.com",
  phone: "+27 79 491 5187",
  website: "https://www.grayarx.com",
} as const;

export function grayArxRegisteredAddressSingleLine(): string {
  const a = GRAYARX_LEGAL.registeredAddress;
  return `${a.street}, ${a.city}, ${a.province} ${a.postalCode}, ${a.country}`;
}

/** Tax/VAT line for invoices and legal footers. */
export function grayArxTaxStatusLine(): string {
  const incomeTax = `Income tax ref: ${GRAYARX_LEGAL.incomeTaxReference}`;
  if (GRAYARX_LEGAL.vatRegistered && GRAYARX_LEGAL.vatNumber) {
    return `${incomeTax}. VAT no. ${GRAYARX_LEGAL.vatNumber}.`;
  }
  return `${incomeTax}. Not VAT-registered — prices exclude VAT.`;
}
