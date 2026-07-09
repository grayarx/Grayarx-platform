/** Canonical GrayArx (Pty) Ltd details for legal documents and footers. */
export const GRAYARX_LEGAL = {
  legalName: "GrayArx (Pty) Ltd",
  enterpriseNumber: "2026/407647/07",
  taxReference: "9172598295",
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
