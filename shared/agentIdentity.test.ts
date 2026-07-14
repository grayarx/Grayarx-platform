import { describe, it, expect } from "vitest";
import {
  isWhatsAppOptOutMessage,
  isWhatsAppOptInMessage,
  resolveAgentDisplayName,
  slugifyPublicShortcode,
  withShortcodeSuffix,
} from "./agentIdentity";

describe("agentIdentity", () => {
  it("resolves display name with Nala default", () => {
    expect(resolveAgentDisplayName(null)).toBe("Nala");
    expect(resolveAgentDisplayName("  Thabo  ")).toBe("Thabo");
  });

  it("detects STOP / START keywords", () => {
    expect(isWhatsAppOptOutMessage("STOP")).toBe(true);
    expect(isWhatsAppOptOutMessage("unsubscribe")).toBe(true);
    expect(isWhatsAppOptOutMessage("stop please help")).toBe(false);
    expect(isWhatsAppOptInMessage("START")).toBe(true);
  });

  it("slugifies shortcodes within length bounds", () => {
    const slug = slugifyPublicShortcode("Karoo Motors Pretoria");
    expect(slug.length).toBeGreaterThanOrEqual(4);
    expect(slug.length).toBeLessThanOrEqual(8);
    expect(withShortcodeSuffix(slug).length).toBeLessThanOrEqual(12);
  });
});
