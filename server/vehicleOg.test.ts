/**
 * Quick checks for vehicle OG helpers (no DB).
 */
import { describe, expect, it } from "vitest";
import {
  isSocialCrawler,
  parseShowroomVehicleId,
  requestPathname,
} from "../server/_core/vehicleOgHtml";
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
    expect(parseShowroomVehicleId("/")).toBeNull();
  });

  it("uses originalUrl under Express * mounts (req.path is /)", () => {
    expect(
      requestPathname({
        path: "/",
        url: "/",
        originalUrl: "/showroom/150001",
      }),
    ).toBe("/showroom/150001");
    expect(
      requestPathname({
        path: "/",
        originalUrl: "/showroom/150001?utm=1",
      }),
    ).toBe("/showroom/150001");
  });
});

describe("LLM model tiers", () => {
  it("defaults starter to gpt-4o-mini", () => {
    const prev = process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MODEL;
    expect(resolveOpenAIModelForDealership({ plan: "starter" })).toBe("gpt-4o-mini");
    if (prev !== undefined) process.env.OPENAI_MODEL = prev;
  });

  it("defaults Growth to gpt-4o-mini (not GPT-4o for all)", () => {
    const prev = process.env.OPENAI_MODEL_GROWTH;
    delete process.env.OPENAI_MODEL_GROWTH;
    expect(resolveOpenAIModelForDealership({ plan: "professional" })).toBe("gpt-4o-mini");
    if (prev !== undefined) process.env.OPENAI_MODEL_GROWTH = prev;
  });

  it("defaults Multi-site to gpt-4o", () => {
    const prev = process.env.OPENAI_MODEL_PREMIUM;
    delete process.env.OPENAI_MODEL_PREMIUM;
    expect(resolveOpenAIModelForDealership({ plan: "enterprise" })).toBe("gpt-4o");
    if (prev !== undefined) process.env.OPENAI_MODEL_PREMIUM = prev;
  });

  it("honours llmModel override", () => {
    expect(
      resolveOpenAIModelForDealership({ plan: "starter", llmModel: "gpt-4o" }),
    ).toBe("gpt-4o");
  });
});
