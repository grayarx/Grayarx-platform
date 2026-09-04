import { describe, expect, it } from "vitest";
import {
  buildPrincipalNameSearchQueries,
  buildPublishedEmailSearchQueries,
  buildSaDirectoryUrls,
  extractBraveSearchBundle,
  extractEmailsFromText,
  extractPrincipalNamesFromText,
  extractSearchResultUrls,
  guessEmailsForPerson,
  looksLikeSearchBotChallenge,
  pickBestPublishedEmail,
  smtpVerificationEnabled,
} from "./_core/principalNameEmailGuess";

describe("principal name → email guess", () => {
  it("extracts Dealer Principal names from page text", () => {
    const text =
      "Meet our team. Thabo Molefe, Dealer Principal has 20 years experience. Also Jane Smith - Sales Manager.";
    const people = extractPrincipalNamesFromText(text);
    expect(people.some((p) => /Thabo Molefe/i.test(p.fullName))).toBe(true);
    expect(people.find((p) => /Thabo/i.test(p.fullName))?.role).toMatch(/Principal/i);
  });

  it("guesses firstname@ and first.last@ on dealer domain only", () => {
    const guesses = guessEmailsForPerson(
      {
        fullName: "Thabo Molefe",
        firstName: "Thabo",
        lastName: "Molefe",
        role: "Dealer Principal",
        source: "website",
      },
      "https://www.voncalauto.co.za",
    );
    expect(guesses).toContain("thabo@voncalauto.co.za");
    expect(guesses).toContain("thabo.molefe@voncalauto.co.za");
    expect(guesses.every((e) => e.endsWith("@voncalauto.co.za"))).toBe(true);
  });

  it("extracts emails from search snippets", () => {
    const text =
      "Contact Thabo at thabo.molefe@voncalauto.co.za or info@voncalauto.co.za for stock.";
    const emails = extractEmailsFromText(text);
    expect(emails).toContain("thabo.molefe@voncalauto.co.za");
    expect(emails).toContain("info@voncalauto.co.za");
  });

  it("picks published named email matching discovered person (not info@)", () => {
    const people = [
      {
        fullName: "Thabo Molefe",
        firstName: "Thabo",
        lastName: "Molefe",
        role: "Dealer Principal",
        source: "website" as const,
      },
    ];
    const picked = pickBestPublishedEmail(
      ["info@voncalauto.co.za", "thabo@voncalauto.co.za", "sales@voncalauto.co.za"],
      people,
      "https://www.voncalauto.co.za",
    );
    expect(picked?.email).toBe("thabo@voncalauto.co.za");
    expect(picked?.person.fullName).toMatch(/Thabo/i);
  });

  it("rejects filler and off-domain published emails", () => {
    const picked = pickBestPublishedEmail(
      ["jane.doe@voncalauto.co.za", "webadmin@vmgsoftware.co.za", "thabo@other.co.za"],
      [
        {
          fullName: "Thabo Molefe",
          firstName: "Thabo",
          lastName: "Molefe",
          role: "Dealer Principal",
          source: "website",
        },
      ],
      "https://www.voncalauto.co.za",
    );
    expect(picked).toBeNull();
  });

  it("builds multi-source name queries (not LinkedIn-only)", () => {
    const qs = buildPrincipalNameSearchQueries("Voncal Auto", "Pretoria");
    expect(qs.some((q) => q.includes("site:linkedin.com"))).toBe(true);
    expect(qs.some((q) => q.includes("site:facebook.com"))).toBe(true);
    expect(qs.some((q) => q.includes("site:brabys.com"))).toBe(true);
    expect(qs.some((q) => q.includes("site:cylex.co.za"))).toBe(true);
    expect(qs.some((q) => /appointed|promoted/.test(q))).toBe(true);
    expect(qs.length).toBeGreaterThanOrEqual(8);
  });

  it("uses Australian directories when the market is AU", () => {
    const qs = buildPrincipalNameSearchQueries("M&G Motors", "Melbourne", "AU");
    expect(qs.some((q) => q.includes("yellowpages.com.au"))).toBe(true);
    expect(qs.some((q) => q.includes("Australia"))).toBe(true);
    expect(qs.every((q) => !q.includes("brabys.com"))).toBe(true);
  });

  it("builds direct SA directory URLs without a search engine", () => {
    const urls = buildSaDirectoryUrls("Voncal Auto", "Pretoria");
    expect(urls.some((u) => u.includes("brabys.com"))).toBe(true);
    expect(urls.some((u) => u.includes("cylex.co.za"))).toBe(true);
    expect(urls.some((u) => u.includes("yellosa.co.za"))).toBe(true);
    expect(urls.every((u) => /^https:\/\//.test(u))).toBe(true);
  });

  it("builds published-email queries across directories and social", () => {
    const qs = buildPublishedEmailSearchQueries({
      host: "voncalauto.co.za",
      dealershipName: "Voncal Auto",
      people: [
        {
          fullName: "Thabo Molefe",
          firstName: "Thabo",
          lastName: "Molefe",
          role: "Dealer Principal",
          source: "website",
        },
      ],
    });
    expect(qs.some((q) => q.includes("@voncalauto.co.za"))).toBe(true);
    expect(qs.some((q) => q.includes("site:hotfrog.co.za"))).toBe(true);
    expect(qs.some((q) => q.includes("Thabo Molefe"))).toBe(true);
  });

  it("extracts result URLs from DuckDuckGo-style HTML", () => {
    const html = `
      <a href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fbrabys.com%2Fvoncal">x</a>
      <a href="https://example.com/about">y</a>
      <a href="https://duckduckgo.com/foo">skip</a>
    `;
    const urls = extractSearchResultUrls(html);
    expect(urls).toContain("https://brabys.com/voncal");
    expect(urls).toContain("https://example.com/about");
    expect(urls.every((u) => !u.includes("duckduckgo.com"))).toBe(true);
  });

  it("detects DuckDuckGo bot-challenge / empty HTML", () => {
    expect(looksLikeSearchBotChallenge("")).toBe(true);
    expect(looksLikeSearchBotChallenge("<html>Unfortunately, bots use DuckDuckGo too</html>")).toBe(
      true,
    );
    expect(
      looksLikeSearchBotChallenge(
        `<html><a href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fbrabys.com%2Fx">Voncal Auto Dealer Principal</a></html>`,
      ),
    ).toBe(false);
  });

  it("extracts Brave Search JSON results", () => {
    const { urls, text } = extractBraveSearchBundle({
      web: {
        results: [
          {
            title: "Thabo Molefe — Dealer Principal",
            url: "https://voncalauto.co.za/about",
            description: "Email thabo@voncalauto.co.za",
          },
        ],
      },
    });
    expect(urls).toContain("https://voncalauto.co.za/about");
    expect(text).toMatch(/thabo@voncalauto\.co\.za/i);
  });

  it("skips SMTP verification on Railway", () => {
    const prev = process.env.RAILWAY_ENVIRONMENT;
    process.env.RAILWAY_ENVIRONMENT = "production";
    expect(smtpVerificationEnabled()).toBe(false);
    if (prev === undefined) delete process.env.RAILWAY_ENVIRONMENT;
    else process.env.RAILWAY_ENVIRONMENT = prev;
  });
});
