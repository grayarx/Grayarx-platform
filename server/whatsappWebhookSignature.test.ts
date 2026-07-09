import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { validateWhatsAppWebhookSignature } from "./_core/whatsappService";

describe("validateWhatsAppWebhookSignature", () => {
  const secret = "test_app_secret";
  const payload = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

  function sign(body: string, appSecret: string): string {
    const hex = createHmac("sha256", appSecret).update(body).digest("hex");
    return `sha256=${hex}`;
  }

  it("accepts Meta-style sha256= signatures", () => {
    const signature = sign(payload, secret);
    expect(validateWhatsAppWebhookSignature(signature, payload, secret)).toBe(true);
  });

  it("rejects tampered payloads", () => {
    const signature = sign(payload, secret);
    expect(validateWhatsAppWebhookSignature(signature, payload + "x", secret)).toBe(false);
  });

  it("rejects wrong secrets", () => {
    const signature = sign(payload, secret);
    expect(validateWhatsAppWebhookSignature(signature, payload, "other_secret")).toBe(false);
  });

  it("rejects empty signature", () => {
    expect(validateWhatsAppWebhookSignature("", payload, secret)).toBe(false);
  });
});
