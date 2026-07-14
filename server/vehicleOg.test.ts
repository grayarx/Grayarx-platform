/**
 * Quick checks for vehicle OG helpers (no DB).
 */
import { describe, expect, it } from "vitest";
import { isSocialCrawler, parseShowroomVehicleId } from "../server/_core/vehicleOgHtml";
import { resolveOpenAIModelForDealership } from "../shared/llmModelTiers";

describe("vehicle OG helpers", () => {
  it("detects WhatsApp / Facebook crawlers", () => {
    expect(isSocialCrawler("facebookexternalhit/1.1")).toBe(true);
    expect(isSocialCrawler("WhatsApp/2.0")).toBe(true);
    expect(isSocialCrawler("Twitterbot/1.0")).toBe(true);
    expect(isSocialCrawler("Mozilla/5.0 Chrome")).toBe(false);
  });

  it("parses /showroom/:id", () => {
    expect(parseShowroomVehicleId("/showroom/42")).toBe(42);
    expect(parseShowroomVehicleId("/showroom/42/")).toBe(42);
    expect(parseShowroomVehicleId("/showroom/42?x=1")).toBe(42);
    expect(parseShowroomVehicleId("/showroom")).toBeNull();
    expect(parseShowroomVehicleId("/dealer/1")).toBeNull();
  });
});

describe("LLM model tiers", () => {
  it("defaults starter to gpt-4o-mini", () => {
    const prev = process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MODEL;
    expect(resolveOpenAIModelForDealership({ plan: "starter" })).toBe("gpt-4o-mini");
    if (prev !== undefined) process.env.OPENAI_MODEL = prev;
  });

  it("honours llmModel override", () => {
    expect(
      resolveOpenAIModelForDealership({ plan: "starter", llmModel: "gpt-4o" }),
    ).toBe("gpt-4o");
  });
});
