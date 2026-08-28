import { describe, expect, it } from "vitest";
import { buildInvoiceDocumentView } from "../shared/invoiceDocument";
import { maskEmail, maskLast4, resolveLetterheadMode } from "../shared/invoiceBrand";
import {
  resolveGrayArxBankDetails,
  buildEftPaymentInstructions,
  formatEftPaymentText,
} from "../shared/bankDetails";

describe("invoice brand helpers", () => {
  it("masks sensitive values to last 4", () => {
    expect(maskLast4("1234567890123")).toBe("•••••••••0123");
    expect(maskEmail("john@example.com")).toBe("jo•••@example.com");
  });

  it("uses platform letterhead for subscription invoices", () => {
    expect(resolveLetterheadMode({ leadId: 0, vehicleId: 0 })).toBe("platform");
    expect(resolveLetterheadMode({ leadId: 9, vehicleId: 3 })).toBe("dealership");
  });

  it("resolves bank details from env-shaped input without hardcoding", () => {
    const bank = resolveGrayArxBankDetails({
      BANK_NAME: "FNB",
      BANK_ACCOUNT_NAME: "GrayArx (Pty) Ltd",
      BANK_ACCOUNT_NUMBER: "00000000000",
      BANK_BRANCH_CODE: "250655",
    });
    expect(bank.configured).toBe(true);
    expect(bank.accountNumber).toBe("00000000000");
    const eft = buildEftPaymentInstructions(bank, "GRAYARX-202607-TEST");
    expect(eft?.paymentReference).toBe("GRAYARX-202607-TEST");
    expect(formatEftPaymentText(eft!)).toContain("00000000000");
    expect(formatEftPaymentText(eft!)).toContain("250655");
  });

  it("builds a customer-ready dealership invoice document", () => {
    const doc = buildInvoiceDocumentView({
      invoice: {
        invoiceNumber: "INV-1-12345678",
        status: "draft",
        invoiceDate: "2026-07-14",
        dueDate: "2026-08-13",
        leadId: 42,
        vehicleId: 17,
        subtotal: 100000,
        vatAmount: 15000,
        totalAmount: 115000,
      },
      dealership: {
        name: "Jubilee Motors",
        contactEmail: "sales@jubilee.test",
        contactPhone: "+27821234567",
        region: "Gauteng",
        brandAccentColor: "#C9A24A",
        vatNumber: "4123456789",
        bankDetails: "FNB-1234567890",
      },
      lead: {
        contactName: "Thabo Nkosi",
        email: "thabo@example.com",
        phone: "0829998877",
      },
      vehicle: {
        year: 2022,
        make: "Toyota",
        model: "Hilux",
        vin: "AHTBB8CD501234567",
      },
      payments: [],
    });

    expect(doc.letterheadMode).toBe("dealership");
    expect(doc.from.name).toBe("Jubilee Motors");
    expect(doc.billTo.name).toBe("Thabo Nkosi");
    expect(doc.totalFormatted).toContain("115");
    expect(doc.lineItems[0].description).toContain("Toyota");
    expect(doc.lineItems[0].description).toContain("4567");
    expect(doc.popiaFooter).toContain("POPIA");
    expect(doc.eftPayment).toBeNull();
    expect(doc.dealershipBankNote).toContain("FNB");
    expect(doc.platformCredit).toBe("Document generated on the GrayArx platform");
    expect(JSON.stringify(doc)).not.toMatch(/thandi/i);
  });

  it("includes full platform EFT block on subscription invoices", () => {
    const bank = resolveGrayArxBankDetails({
      BANK_NAME: "FNB",
      BANK_ACCOUNT_NUMBER: "11112222333",
      BANK_BRANCH_CODE: "250655",
      BANK_ACCOUNT_NAME: "GrayArx (Pty) Ltd",
    });
    const doc = buildInvoiceDocumentView({
      invoice: {
        invoiceNumber: "GRAYARX-202607-ABC12",
        status: "sent",
        invoiceDate: "2026-07-14",
        dueDate: "2026-08-13",
        leadId: 0,
        vehicleId: 0,
        subtotal: 3999,
        vatAmount: 0,
        totalAmount: 3999,
      },
      dealership: {
        name: "Pilot Motors",
        contactEmail: "owner@pilot.test",
      },
      lead: null,
      vehicle: null,
      payments: [],
      platformBank: bank,
    });

    expect(doc.letterheadMode).toBe("platform");
    expect(doc.documentTitle).toBe("Invoice");
    expect(doc.from.taxLine).toContain("Ent.");
    expect(doc.from.taxLine).not.toContain("Income tax");
    expect(doc.vatFooterNote).toContain("not a VAT vendor");
    expect(doc.showVat).toBe(false);
    expect(doc.eftPayment?.accountNumber).toBe("11112222333");
    expect(doc.eftPayment?.paymentReference).toBe("GRAYARX-202607-ABC12");
    expect(doc.eftPayment?.bankName).toBe("FNB");
    expect(doc.lineItems[0].description).toContain("GrayArx Dealership OS");
    expect(JSON.stringify(doc)).not.toMatch(/thandi/i);
  });

  function platformInvoice(subtotal: number, lineDescription?: string) {
    return buildInvoiceDocumentView({
      invoice: {
        invoiceNumber: "GRAYARX-OS-TEST",
        status: "sent",
        invoiceDate: "2026-07-14",
        dueDate: "2026-08-13",
        leadId: 0,
        vehicleId: 0,
        subtotal,
        vatAmount: 0,
        totalAmount: subtotal,
      },
      dealership: { name: "Pilot Motors" },
      lead: null,
      vehicle: null,
      payments: [],
      lineDescription,
    });
  }

  it("never names Thandi on platform invoice JSON or letterhead fields", () => {
    const doc = platformInvoice(14990);
    expect(JSON.stringify(doc)).not.toMatch(/thandi/i);
    expect(doc.from.subtitle).toBeNull();
    expect(doc.preparedBy).toBe("GrayArx (Pty) Ltd");
    expect(doc.platformCredit).toBeNull();
    expect(doc.lineItems[0].description).toContain("Professional OS");
    expect(doc.lineItems[0].description).toContain("Pilot Motors");
  });

  it("maps OS plan line items from subtotal", () => {
    expect(platformInvoice(7990).lineItems[0].description).toContain("Starter OS");
    expect(platformInvoice(14990).lineItems[0].description).toContain("Professional OS");
    expect(platformInvoice(29990).lineItems[0].description).toContain("Enterprise OS");
  });

  it("uses an explicit Professional OS line description override", () => {
    const doc = platformInvoice(
      14990,
      "GrayArx Professional OS — monthly · Pilot Motors",
    );
    expect(doc.lineItems[0].description).toBe(
      "GrayArx Professional OS — monthly · Pilot Motors",
    );
  });
});
