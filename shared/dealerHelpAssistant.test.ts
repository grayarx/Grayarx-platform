import { describe, it, expect } from "vitest";
import {
  buildDealerHelpReply,
  classifyDealerHelpIntent,
  isBugDescription,
} from "./dealerHelpAssistant";

describe("dealerHelpAssistant", () => {
  it("blocks agent roster questions for dealers", () => {
    expect(classifyDealerHelpIntent("where are my agents")).toBe("restricted");
    const res = buildDealerHelpReply({ message: "where are my agents" });
    expect(res.mode).toBe("dealer");
    expect(res.intent).toBe("restricted");
    expect(res.reply).toContain("owner");
  });

  it("allows navigation help", () => {
    const res = buildDealerHelpReply({ message: "how do I import csv" });
    expect(res.intent).toBe("navigation");
    expect(res.links[0]?.href).toBe("/dealer/inventory/import");
  });

  it("prompts for bug details on short report", () => {
    expect(classifyDealerHelpIntent("report a bug")).toBe("bug_report_prompt");
  });

  it("detects bug descriptions", () => {
    expect(
      isBugDescription("CSV import fails on row 12 with invalid price error"),
    ).toBe(true);
  });
});
