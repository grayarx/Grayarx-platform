import { describe, expect, it } from "vitest";
import { buildInvoiceDocumentView } from "../shared/invoiceDocument";
import { maskEmail, maskLast4, resolveLetterheadMode } from "../shared/invoiceBrand";

describe("invoice brand helpers", () => {
  it("masks sensitive values to last 4", () => {
    expect(maskLast4("1234567890123")).toBe("•••••••••0123");
    expect(maskEmail("john@example.com")).toBe("jo•••@example.com");
  });

  it("uses platform letterhead for subscription invoices", () => {
    expect(resolveLetterheadMode({ leadId: 0, vehicleId: 0 })).toBe("platform");
    expect(resolveLetterheadMode({ leadId: 9, vehicleId: 3 })).toBe("dealership");
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
  });
});
