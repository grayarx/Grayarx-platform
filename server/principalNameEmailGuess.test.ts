import { describe, expect, it } from "vitest";
import {
  extractPrincipalNamesFromText,
  guessEmailsForPerson,
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
});
