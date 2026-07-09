import { describe, it, expect, vi, beforeEach } from "vitest";

describe("platformHealth", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    delete process.env.WHATSAPP_APP_SECRET;
  });

  it("reports missing keys when env is empty", async () => {
    const { getPlatformHealth } = await import("./_core/platformHealth");
    const h = await getPlatformHealth();
    expect(h.openai.ok).toBe(false);
    expect(h.resend.ok).toBe(false);
    expect(h.whatsapp.ok).toBe(false);
  });

  it("reports configured services from env", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.WHATSAPP_ACCESS_TOKEN = "tok";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "1245737138612982";
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify";
    process.env.WHATSAPP_APP_SECRET = "secret";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => "" }),
    );
    process.env.OPENAI_API_KEY = "sk-test";

    const { getPlatformHealth } = await import("./_core/platformHealth");
    const h = await getPlatformHealth();
    expect(h.resend.ok).toBe(true);
    expect(h.whatsapp.ok).toBe(true);
    expect(h.webhooks.ok).toBe(true);
    expect(h.openai.ok).toBe(true);
  });
});
