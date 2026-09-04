import { describe, expect, it } from "vitest";
import {
  buildNoVehicleWhatsAppReply,
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

  it("first WhatsApp hello answers from live stock, not a brochure stall", () => {
    const reply = buildNoVehicleWhatsAppReply(
      "hi",
      "en",
      "https://www.grayarx.com",
      [{ title: "2022 Hilux 2.8", price: 489_000 }],
      "Demo Motors",
    );
    expect(reply.toLowerCase()).toContain("live stock");
    expect(reply).toContain("Hilux");
    expect(reply).toContain("\n\n");
  });
});
