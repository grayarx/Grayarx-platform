import { describe, expect, it } from "vitest";
import {
  extractEmailsFromText,
  extractPrincipalNamesFromText,
  guessEmailsForPerson,
  pickBestPublishedEmail,
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
});
