import { describe, it, expect } from "vitest";
import {
  buildThembaSalesSayScript,
  buildThembaSalesFollowUpText,
  buildSalesTwiml,
} from "./salesCallScript";

describe("Themba sales call scripts", () => {
  const prospect = {
    dealershipName: "Karoo Motors",
    city: "Beaufort West",
    region: "Western Cape",
    rationale: "Strong WhatsApp traffic and no after-hours cover",
    score: 82,
  };

  it("builds a spoken opener with playbook elevator + demo CTA", () => {
    const script = buildThembaSalesSayScript(prospect);
    expect(script).toMatch(/Themba/i);
    expect(script).toMatch(/Karoo Motors/);
    expect(script).toMatch(/not to your customers/);
    expect(script).toMatch(/demo/i);
    expect(script).toMatch(/079|zero seven nine/i);
  });

  it("builds WhatsApp follow-up text for queue fallback", () => {
    const text = buildThembaSalesFollowUpText(prospect);
    expect(text).toMatch(/Karoo Motors|YES/);
    expect(text).toMatch(/079 491 5187/);
    expect(text.length).toBeLessThan(600);
  });

  it("wraps script in Gather-capable TwiML", () => {
    const twiml = buildSalesTwiml(prospect);
    expect(twiml).toContain("<Response>");
    expect(twiml).toContain("<Say");
    expect(twiml).toContain("<Gather");
    expect(twiml).toContain("Karoo Motors");
  });
});
