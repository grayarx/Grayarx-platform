import { describe, expect, it } from "vitest";
import {
  extractIntlTelHrefs,
  extractSaPhonesFromHtml,
  mergeDiscoveredPhone,
  normalizeSaPhone,
  pickPreferredDealerPhone,
  pickPreferredSaPhone,
} from "../shared/prospectPhone";

describe("SA phone extraction from HTML", () => {
  it("extracts +27 and 0xx switchboard numbers from tel: and text", () => {
    const html = `
      <html><body>
        <a href="tel:+27118114008">Call us</a>
        <p>Also 011 615 0228 on the contact page.</p>
        <footer>Price R450 000 · stock 2018</footer>
      </body></html>
    `;
    const phones = extractSaPhonesFromHtml(html);
    const displays = phones.map((p) => p.display);
    expect(displays).toContain("011 811 4008");
    expect(displays).toContain("011 615 0228");
    expect(phones.some((p) => p.fromTelHref && p.display === "011 811 4008")).toBe(true);
    expect(phones.every((p) => !p.display.includes("450"))).toBe(true);
  });

  it("normalizes national and international forms to the same display", () => {
    expect(normalizeSaPhone("+27 11 811 4008")).toBe("011 811 4008");
    expect(normalizeSaPhone("0118114008")).toBe("011 811 4008");
    expect(normalizeSaPhone("082 053 2685")).toBe("082 053 2685");
    expect(normalizeSaPhone("+27820532685")).toBe("082 053 2685");
    expect(normalizeSaPhone("")).toBeNull();
    expect(normalizeSaPhone("123")).toBeNull();
  });

  it("prefers tel: landline on a contact page over footer mobiles", () => {
    const html = `
      <a href="tel:0112305220">Switchboard</a>
      <footer>WhatsApp 082 111 2222</footer>
    `;
    const picked = pickPreferredSaPhone(html, {
      pageUrl: "https://m5auto.co.za/contact",
    });
    expect(picked).toBe("011 230 5220");
  });

  it("does not overwrite a good existing phone with empty", () => {
    expect(mergeDiscoveredPhone("011 811 4008", null)).toBe("011 811 4008");
    expect(mergeDiscoveredPhone("011 811 4008", "")).toBe("011 811 4008");
    expect(mergeDiscoveredPhone(null, "011 615 0228")).toBe("011 615 0228");
    expect(mergeDiscoveredPhone("082 111 2222", "011 811 4008")).toBe("011 811 4008");
  });

  it("keeps explicit international tel: hrefs when the yard is not SA", () => {
    const html = `<a href="tel:+61393182744">Call Melbourne</a>`;
    expect(extractIntlTelHrefs(html)[0]).toMatch(/^\+613/);
    expect(pickPreferredDealerPhone(html)).toMatch(/^\+613/);
    expect(mergeDiscoveredPhone(null, "+61393182744")).toBe("+61393182744");
  });
});
