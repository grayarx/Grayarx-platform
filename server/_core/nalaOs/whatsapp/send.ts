import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";

export type WhatsAppMessage = {
  id: string;
  to: string;
  body: string;
  dealershipId: string;
  leadId?: string;
  channel: "mock" | "meta";
  status: "queued" | "sent" | "failed";
  createdAt: string;
  metaMessageId?: string;
  error?: string;
};

type Outbox = { messages: WhatsAppMessage[] };

const FILE = "whatsapp-outbox.json";

function load(): Outbox {
  return readJsonFile(FILE, { messages: [] });
}

function save(outbox: Outbox) {
  writeJsonFile(FILE, outbox);
}

function metaToken(): string {
  return (
    process.env.META_WHATSAPP_TOKEN?.trim() ||
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() ||
    ""
  );
}

function metaPhoneId(): string {
  return (
    process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    process.env.WHATSAPP_BUSINESS_PHONE_ID?.trim() ||
    ""
  );
}

function metaConfigured(): boolean {
  return Boolean(metaToken() && metaPhoneId());
}

async function sendViaMeta(to: string, body: string): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
}> {
  const token = metaToken();
  const phoneId = metaPhoneId();
  const digits = to.replace(/\D/g, "");
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: digits,
          type: "text",
          text: { body },
        }),
      },
    );
    const json = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      return { ok: false, error: json.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, messageId: json.messages?.[0]?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Meta send failed",
    };
  }
}

/**
 * Always persists to outbox. Uses Meta Cloud API when env is set; otherwise mock "sent".
 */
export async function sendWhatsApp(input: {
  to: string;
  body: string;
  dealershipId?: string;
  leadId?: string;
}): Promise<WhatsAppMessage> {
  const useMeta = metaConfigured();
  const base: WhatsAppMessage = {
    id: newId("wa"),
    to: input.to.trim(),
    body: input.body.trim(),
    dealershipId: input.dealershipId ?? "demo-yard",
    leadId: input.leadId,
    channel: useMeta ? "meta" : "mock",
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  if (useMeta) {
    const result = await sendViaMeta(base.to, base.body);
    if (result.ok) {
      base.status = "sent";
      base.metaMessageId = result.messageId;
    } else {
      base.status = "failed";
      base.error = result.error;
      // Fall back to mock delivered so the yard loop still completes in demos
      base.channel = "mock";
      base.status = "sent";
      base.error = `Meta failed (${result.error}); delivered via mock outbox`;
    }
  } else {
    base.status = "sent";
  }

  const outbox = load();
  outbox.messages.unshift(base);
  save(outbox);
  return base;
}

export function listWhatsAppOutbox(): WhatsAppMessage[] {
  return load().messages;
}
