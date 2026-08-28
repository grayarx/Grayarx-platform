/**
 * Optional OpenAI polish over a locked template.
 * Never invents stock/prices — only rewrites tone of the provided template.
 * On any failure / quota / missing key → return template unchanged.
 */

import {
  decideReplyMode,
  recordLlmPolish,
  recordTemplateReply,
} from "@/lib/billing/usage";

export type PolishResult = {
  reply: string;
  mode: "llm_polish" | "template";
  reason: string;
  polished: boolean;
};

export async function polishNalaReply(input: {
  dealershipId: string;
  templateReply: string;
  buyerMessage?: string;
}): Promise<PolishResult> {
  const decision = decideReplyMode(input.dealershipId);

  if (decision.mode === "template") {
    recordTemplateReply(input.dealershipId);
    return {
      reply: input.templateReply,
      mode: "template",
      reason: decision.reason,
      polished: false,
    };
  }

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    recordTemplateReply(input.dealershipId);
    return {
      reply: input.templateReply,
      mode: "template",
      reason: "OPENAI_API_KEY missing mid-flight — template kept.",
      polished: false,
    };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "You are Nala, a South African dealership WhatsApp assistant. Rewrite the TEMPLATE for natural WhatsApp tone. Keep every fact: prices, stock numbers, times, links, names. Do NOT invent vehicles, parts, or prices. Output only the rewritten message.",
          },
          {
            role: "user",
            content: [
              input.buyerMessage
                ? `Buyer said: ${input.buyerMessage}`
                : null,
              `TEMPLATE:\n${input.templateReply}`,
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
      }),
    });

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string; code?: string; type?: string };
    };

    if (!res.ok) {
      recordTemplateReply(input.dealershipId);
      const msg = json.error?.message ?? `HTTP ${res.status}`;
      const quota =
        /insufficient_quota|rate_limit|billing/i.test(msg) ||
        json.error?.code === "insufficient_quota";
      return {
        reply: input.templateReply,
        mode: "template",
        reason: quota
          ? `OpenAI quota/billing blocked polish — auto template fallback (${msg}).`
          : `OpenAI polish failed — template kept (${msg}).`,
        polished: false,
      };
    }

    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) {
      recordTemplateReply(input.dealershipId);
      return {
        reply: input.templateReply,
        mode: "template",
        reason: "Empty OpenAI response — template kept.",
        polished: false,
      };
    }

    recordLlmPolish(input.dealershipId);
    return {
      reply: content,
      mode: "llm_polish",
      reason: decision.reason,
      polished: true,
    };
  } catch (err) {
    recordTemplateReply(input.dealershipId);
    return {
      reply: input.templateReply,
      mode: "template",
      reason: `OpenAI network error — template kept (${err instanceof Error ? err.message : "error"}).`,
      polished: false,
    };
  }
}
