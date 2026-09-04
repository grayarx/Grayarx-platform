import { describe, expect, it } from "vitest";
import {
  decodeCloudflareEmail,
  extractContactishUrls,
  extractEmailsFromHtml,
  extractJsonLdPeople,
  extractObfuscatedEmails,
} from "./_core/prospectEmailExtract";

function encodeCfEmail(email: string, key = 0x0a): string {
  let hex = key.toString(16).padStart(2, "0");
  for (const ch of email) {
    hex += (ch.charCodeAt(0) ^ key).toString(16).padStart(2, "0");
  }
  return hex;
}

describe("prospect email HTML extract", () => {
  it("decodes Cloudflare data-cfemail", () => {
    const encoded = encodeCfEmail("darius@jubileemotors.co.za");
    expect(decodeCloudflareEmail(encoded)).toBe("darius@jubileemotors.co.za");
    const html = `<span class="__cf_email__" data-cfemail="${encoded}">[email protected]</span>`;
    expect(extractEmailsFromHtml(html)).toContain("darius@jubileemotors.co.za");
  });

  it("reads name [at] domain [dot] co.za", () => {
    const text = "Email Thabo on thabo [at] voncalauto [dot] co [dot] za for stock.";
    expect(extractObfuscatedEmails(text)).toContain("thabo@voncalauto.co.za");
    expect(extractEmailsFromHtml(`<p>${text}</p>`)).toContain("thabo@voncalauto.co.za");
  });

  it("reads JSON-LD Person email + name", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Thabo Molefe",
      jobTitle: "Dealer Principal",
      email: "mailto:thabo@voncalauto.co.za",
    })}</script>`;
    const people = extractJsonLdPeople(html);
    expect(people.some((p) => /Thabo Molefe/i.test(p.fullName))).toBe(true);
    expect(extractEmailsFromHtml(html)).toContain("thabo@voncalauto.co.za");
  });

  it("follows same-host contact/about/team hrefs", () => {
    const html = `
      <a href="/our-people.html">Meet the team</a>
      <a href="https://other.co.za/contact">skip</a>
      <a href="/stock">Inventory</a>
    `;
    const urls = extractContactishUrls(html, "https://voncalauto.co.za");
    expect(urls.some((u) => /our-people/i.test(u))).toBe(true);
    expect(urls.some((u) => /other\.co\.za/i.test(u))).toBe(false);
  });

  it("decodes HTML entity @", () => {
    const html = `<p>darius&#64;jubileemotors.co.za</p>`;
    expect(extractEmailsFromHtml(html)).toContain("darius@jubileemotors.co.za");
  });
});
