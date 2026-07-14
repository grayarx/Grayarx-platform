export type ServiceHealth = {
  ok: boolean;
  detail: string;
};

export type PlatformHealth = {
  openai: ServiceHealth;
  resend: ServiceHealth;
  whatsapp: ServiceHealth;
  webhooks: ServiceHealth;
  generatedAt: number;
};

async function checkOpenAI(): Promise<ServiceHealth> {
  // OpenAI-only for chat — no Manus Forge LLM fallback. Templates if this fails.
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  if (!apiKey) {
    return { ok: false, detail: "OPENAI_API_KEY not set — Nala uses templates only (no Forge LLM)" };
  }
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      return { ok: true, detail: "API key valid" };
    }
    const body = await res.text();
    if (body.includes("insufficient_quota")) {
      return { ok: false, detail: "Billing/quota exhausted — top up at platform.openai.com" };
    }
    return { ok: false, detail: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "OpenAI check failed",
    };
  }
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const phoneId = Boolean(
    process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
  const token = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
  const verify = Boolean(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);

  return {
    openai: await checkOpenAI(),
    resend: {
      ok: Boolean(process.env.RESEND_API_KEY),
      detail: process.env.RESEND_API_KEY ? "RESEND_API_KEY configured" : "Missing — pilot emails disabled",
    },
    whatsapp: {
      ok: phoneId && token,
      detail:
        phoneId && token
          ? "Phone + token configured — Nala can auto-reply"
          : "Missing phone_number_id or access token",
    },
    webhooks: {
      ok: verify && Boolean(process.env.WHATSAPP_APP_SECRET),
      detail: verify ? "Verify token set" : "WHATSAPP_WEBHOOK_VERIFY_TOKEN missing",
    },
    generatedAt: Date.now(),
  };
}
