import { describe, expect, it } from "vitest";
import { gradeLocal } from "./mirror";

const material = `
Demand-side sales starts from the struggling moment, not from your feature list.
Customers hire a product to make progress. Do nothing is the real competitor.
Have the willingness-to-pay talk early. Apply this week: ask what they would cut.
Deliverability fails when you mail info@ instead of a named principal.
`;

describe("mirror test", () => {
  it("flags vague hedges and missing load-bearing terms", () => {
    const grade = gradeLocal(material, "It is basically about stuff and things, probably sales.");
    expect(grade.score).toBeLessThan(80);
    expect(grade.issues.some((i) => i.kind === "vague")).toBe(true);
    expect(grade.missing.length).toBeGreaterThan(0);
  });

  it("rewards a concrete explanation with a this-week action", () => {
    const grade = gradeLocal(
      material,
      "Demand-side sales starts from the struggling moment, not a feature walkthrough. Do nothing is the real competitor. Willingness-to-pay must be asked early. Deliverability fails on info@ — I will mail ten named principals this week and call the same day.",
    );
    expect(grade.score).toBeGreaterThanOrEqual(70);
    expect(grade.letter).toMatch(/A|B|C/);
    expect(grade.issues.some((i) => i.excerpt.includes("No applied next step"))).toBe(false);
  });
});
