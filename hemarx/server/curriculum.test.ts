import { describe, expect, it } from "vitest";
import { buildCurriculum, csvCell, inferStruggles, toCsv } from "./curriculum";
import { SAMPLE_ANSWERS } from "./profile";
import type { Struggle } from "./types";

describe("curriculum", () => {
  it("infers reach-the-owner from bounce language", () => {
    const tags = inferStruggles(
      [{ id: "x", question: "q", answer: "info@ bounces and the principal never sees mail" }],
      [],
    );
    expect(tags).toContain("reach_the_owner");
  });

  it("ranks founder-sales resources first for this learner", () => {
    const struggles: Struggle[] = ["first_customers", "founder_outbound", "reach_the_owner", "build_trap"];
    const rows = buildCurriculum(struggles, SAMPLE_ANSWERS);
    expect(rows.length).toBeGreaterThan(8);
    const names = rows.map((r) => r.resource.toLowerCase()).join(" ");
    expect(names).toContain("founding sales");
    expect(names).toContain("mom test");
    expect(names).not.toMatch(/atomic habits|rich dad|4-hour workweek/);
    expect(rows[0]?.why.toLowerCase()).toContain("apply this week");
  });

  it("writes a four-column csv", () => {
    const rows = buildCurriculum(["pricing"], SAMPLE_ANSWERS);
    const csv = toCsv(rows);
    expect(csv.startsWith("resource,format,link,why\n")).toBe(true);
    expect(csvCell('He said "no"')).toBe('"He said ""no"""');
    expect(rows.every((r) => r.link.startsWith("http"))).toBe(true);
  });
});
