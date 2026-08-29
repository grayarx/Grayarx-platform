import { describe, it, expect } from "vitest";
import {
  buildDealerHelpReply,
  classifyDealerHelpIntent,
  isBugDescription,
} from "./dealerHelpAssistant";

describe("dealerHelpAssistant", () => {
  it("explains background agents without exposing founder tools or an agents page", () => {
    expect(classifyDealerHelpIntent("where are my agents")).toBe("help");
    const res = buildDealerHelpReply({ message: "where are my agents" });
    expect(res.mode).toBe("dealer");
    expect(res.reply).toMatch(/background/i);
    expect(res.reply).toMatch(/Leads/);
    expect(res.reply).not.toMatch(/Sipho ·/);
    expect(res.links.every((l) => l.href !== "/dealer/agents")).toBe(true);
  });

  it("blocks founder-only agent questions for dealers", () => {
    expect(classifyDealerHelpIntent("where is Sipho")).toBe("restricted");
    const res = buildDealerHelpReply({ message: "what is Kagiso doing" });
    expect(res.intent).toBe("restricted");
    expect(res.reply).toMatch(/platform ops|founder/i);
  });

  it("allows navigation help", () => {
    const res = buildDealerHelpReply({ message: "how do I import csv" });
    expect(res.intent).toBe("navigation");
    expect(res.links[0]?.href).toBe("/dealer/inventory/import");
  });

  it("answers product Q&A from the dealer playbook", () => {
    const res = buildDealerHelpReply({ message: "What does it cost?" });
    expect(res.intent).toBe("product_qa");
    expect(res.reply).toMatch(/Starter/);
    expect(res.reply).toMatch(/Professional/);
  });

  it("answers WhatsApp Business from the playbook", () => {
    const res = buildDealerHelpReply({
      message: "Do we need a WhatsApp Business number?",
    });
    expect(res.intent).toBe("product_qa");
    expect(res.reply).toMatch(/Cloud API/);
    expect(res.reply).not.toMatch(/Manus Forge/);
  });

  it("gives a real fix for 'dealer or admin access required' (not a nav link)", () => {
    const res = buildDealerHelpReply({
      message: "i cant upload csv it says dealer or admin access required",
    });
    expect(res.intent).toBe("troubleshooting");
    expect(res.reply).toMatch(/Set up my dealership/i);
    expect(res.reply).not.toMatch(/Bulk-import stock from a CSV file/);
  });

  it("troubleshoots imported cars that aren't showing", () => {
    const res = buildDealerHelpReply({ message: "I imported cars but they don't show" });
    expect(res.intent).toBe("troubleshooting");
    expect(res.reply).toMatch(/price above R1|same dealership/i);
    expect(res.links.some((l) => l.href === "/dealer/inventory")).toBe(true);
  });

  it("troubleshoots missing photos and R1 prices", () => {
    expect(classifyDealerHelpIntent("my photos are not loading")).toBe("troubleshooting");
    expect(classifyDealerHelpIntent("all my prices show R1")).toBe("troubleshooting");
  });

  it("does NOT hijack plain how-to questions", () => {
    // A how-to (no problem signal) must still be navigation, not troubleshooting.
    expect(classifyDealerHelpIntent("how do I import csv")).toBe("navigation");
    expect(classifyDealerHelpIntent("What does it cost?")).toBe("product_qa");
  });

  it("prompts for bug details on short report", () => {
    expect(classifyDealerHelpIntent("report a bug")).toBe("bug_report_prompt");
  });

  it("detects bug descriptions", () => {
    expect(
      isBugDescription("CSV import fails on row 12 with invalid price error"),
    ).toBe(true);
  });

  it("confirms bug tickets without exposing Kagiso as a dealer agent", () => {
    const res = buildDealerHelpReply({
      message: "ignored",
      ticket: { id: 42, title: "CSV import fails" },
    });
    expect(res.intent).toBe("bug_report");
    expect(res.reply).toContain("GrayArx support");
    expect(res.reply).not.toContain("Kagiso");
    expect(res.reply).toContain("#42");
  });
});
