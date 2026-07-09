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

  it("strips markdown for WhatsApp", () => {
    expect(stripMarkdownForWhatsApp("The **2022 Polo** is **R250 000**")).toBe(
      "The 2022 Polo is R250 000",
    );
  });
});
