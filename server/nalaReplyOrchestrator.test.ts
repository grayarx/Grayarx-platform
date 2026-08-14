import { describe, expect, it } from "vitest";
import {
  parseVehicleTitleFromMessage,
  stripMarkdownForWhatsApp,
} from "../server/_core/nalaReplyOrchestrator";

describe("nalaReplyOrchestrator", () => {
  it("parses vehicle title from wa.me prefill", () => {
    expect(
      parseVehicleTitleFromMessage("Hi, I'm interested in the 2022 Toyota Corolla XS"),
    ).toBe("2022 Toyota Corolla XS");
  });

  it("converts markdown bold to WhatsApp bold and keeps spacing", () => {
    expect(stripMarkdownForWhatsApp("The **2022 Polo** is **R250 000**")).toBe(
      "The *2022 Polo* is *R250 000*",
    );
    const spaced = stripMarkdownForWhatsApp("Hi\n\n**Polo**\n\nAsk me");
    expect(spaced).toBe("Hi\n\n*Polo*\n\nAsk me");
  });
});
