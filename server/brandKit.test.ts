/**
 * Brand kit — pure helper tests. No DB / no LLM.
 */
import { describe, it, expect } from "vitest";
import {
  resolveBrandKit,
  sanitizeHexColor,
  maskAccountNumber,
  maskIdNumber,
  maskPhone,
  renderEmailSignature,
} from "./_core/brandKit";

describe("brand kit helpers", () => {
  it("returns GrayArx defaults when fields are missing", () => {
    const kit = resolveBrandKit({ name: "Karoo Motors" });
    expect(kit.dealershipName).toBe("Karoo Motors");
    expect(kit.logoUrl).toBeNull();
    expect(kit.accentColor).toBe("#C9A24A");
    expect(kit.signature).toContain("GrayArx");
    expect(kit.vatNumber).toBeNull();
    expect(kit.bankDetails).toBeNull();
  });

  it("uses provided brand fields when present", () => {
    const kit = resolveBrandKit({
      name: "Highveld Motors",
      brandLogoUrl: "https://cdn.example.com/logo.png",
      brandAccentColor: "#0a84ff",
      brandSignature: "Highveld Motors · Family-owned since 1972",
      vatNumber: "4250123456",
      bankDetails: "FNB · 62012345678",
    });
    expect(kit.logoUrl).toBe("https://cdn.example.com/logo.png");
    expect(kit.accentColor).toBe("#0a84ff");
    expect(kit.signature).toContain("Highveld");
  });

  it("sanitises hex colours and rejects invalid values", () => {
    expect(sanitizeHexColor("#ABC")).toBe("#abc");
    expect(sanitizeHexColor("ABCDEF")).toBe("#abcdef");
    expect(sanitizeHexColor("not-a-colour")).toBeNull();
    expect(sanitizeHexColor("")).toBeNull();
    expect(sanitizeHexColor(null)).toBeNull();
  });

  it("falls back to default accent when supplied colour is invalid", () => {
    const kit = resolveBrandKit({
      name: "Test",
      brandAccentColor: "not-a-colour",
    });
    expect(kit.accentColor).toBe("#C9A24A");
  });

  it("masks account / ID / phone numbers safely", () => {
    expect(maskAccountNumber("62012345678")).toBe("**** **** 5678");
    expect(maskIdNumber("9001015009087")).toBe("*********9087");
    expect(maskPhone("+27821234567")).toBe("+27 *** *** 4567");
    expect(maskAccountNumber("123")).toBe("123"); // too short to mask
  });

  it("renders an email signature that escapes HTML in dealership names", () => {
    const kit = resolveBrandKit({ name: "<script>alert(1)</script>" });
    const html = renderEmailSignature(kit, "Mia");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Mia");
  });
});
