/**
 * Nala showroom LLM — grammar-polished replies in any SA language.
 * Uses vehicle facts block so prices/colours are never invented.
 */

import { invokeLLM } from "./llm";
import {
  buildWhatsAppSystemPrompt,
  scoreWhatsAppDraft,
  FORBIDDEN_PHRASES,
} from "./agentPrompts";
import type { LanguageCode } from "../../shared/languages";
import { LANGUAGES } from "../../shared/languages";
import {
  buildVehicleFactsBlock,
  type VehicleChatContext,
} from "../../shared/nalaShowroomChat";

export async function generateNalaGeneralWhatsAppReply(input: {
  language: LanguageCode;
  customerMessage: string;
  dealershipName: string;
  templateReply: string;
  inventoryHints?: Array<{ title: string; price?: number | string | null }>;
  dealershipId?: number;
  agentDisplayName?: string;
}): Promise<{ reply: string; score: number; issues: string[]; attempts: number }> {
  const langMeta = LANGUAGES[input.language];
  const agentName = (input.agentDisplayName?.trim() || "Nala");
  const stockLines = (input.inventoryHints ?? [])
    .slice(0, 5)
    .map((v) => {
      const price =
        v.price != null && Number(v.price) > 1
          ? ` — R${Math.round(Number(v.price)).toLocaleString("en-ZA")}`
          : "";
      return `• ${v.title}${price}`;
    })
    .join("\n");

  const extraContext = [
    `Dealership: ${input.dealershipName}`,
    stockLines ? `Available stock (use ONLY these — never invent):\n${stockLines}` : "",
    `Suggested factual reply to phrase naturally (keep any prices/links exact):\n${input.templateReply}`,
    "",
    `You are ${agentName}, the showroom assistant.`,
    "Reply in ONE warm message, max 90 words. Help the buyer browse, finance, trade-in, or book a test drive.",
    `CRITICAL: Write ONLY in ${langMeta.englishName} (${langMeta.endonym}). Perfect grammar.`,
    "WhatsApp layout: leave a blank line between greeting, answer, and any next-step ask.",
    `Never use: ${FORBIDDEN_PHRASES.slice(0, 4).join(", ")}.`,
    "Never say a human will call back tomorrow — you handle the conversation now, 24/7.",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = buildWhatsAppSystemPrompt(input.language, extraContext);
  const first = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.customerMessage },
    ],
    dealershipId: input.dealershipId,
  });
  const draft1 = first.choices?.[0]?.message?.content?.toString() ?? input.templateReply;
  const check1 = scoreWhatsAppDraft(draft1, input.language);
  if (check1.score >= 78) {
    return { reply: draft1, score: check1.score, issues: check1.issues, attempts: 1 };
  }

  const second = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.customerMessage },
      { role: "assistant", content: draft1 },
      {
        role: "user",
        content: `Rewrite in flawless ${langMeta.englishName}. Fix: ${check1.issues.join("; ")}. Keep all prices and links exact.`,
      },
    ],
    dealershipId: input.dealershipId,
  });
  const draft2 = second.choices?.[0]?.message?.content?.toString() ?? draft1;
  const check2 = scoreWhatsAppDraft(draft2, input.language);
  return {
    reply: draft2 || draft1 || input.templateReply,
    score: check2.score,
    issues: check2.issues,
    attempts: 2,
  };
}

export async function generateNalaShowroomReply(input: {
  language: LanguageCode;
  customerMessage: string;
  vehicle: VehicleChatContext;
  dealershipName: string;
  templateReply?: string;
  intent?: string;
  dealershipId?: number;
  agentDisplayName?: string;
}): Promise<{ reply: string; score: number; issues: string[]; attempts: number }> {
  const facts = buildVehicleFactsBlock(input.vehicle);
  const langMeta = LANGUAGES[input.language];
  const agentName = (input.agentDisplayName?.trim() || "Nala");

  const extraContext = [
    `Dealership: ${input.dealershipName}`,
    "STOCK FACTS (use ONLY these numbers — never invent):",
    facts,
    input.templateReply
      ? `Suggested factual reply to phrase naturally (keep all numbers/colours exact):\n${input.templateReply}`
      : "",
    input.intent ? `Detected intent: ${input.intent}` : "",
    "",
    `You are ${agentName}, the showroom assistant.`,
    "You are warm, conversational, and knowledgeable — like a trusted friend who knows cars inside out. Clients must feel they are chatting with a real person who genuinely wants to help them find the right car.",
    "Reply in ONE message, max 80 words, warm and natural.",
    "Answer the client's question FIRST, fully and clearly. Then — in the same reply — gently suggest a natural next step (test drive, finance, or viewing) woven into the text. Never list options as numbered items.",
    `CRITICAL: Write ONLY in ${langMeta.englishName} (${langMeta.endonym}). Perfect grammar and spelling.`,
    `Use greeting style: ${langMeta.greeting}. Respect: ${langMeta.styleNote}`,
    "WhatsApp layout: blank line between greeting, answer, and next step. Bold vehicle name/price with *single asterisks* (or ** — we convert).",
    `Never use: ${FORBIDDEN_PHRASES.slice(0, 4).join(", ")}.`,
    "Use **bold** for vehicle name and key figures only.",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = buildWhatsAppSystemPrompt(input.language, extraContext);

  const first = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.customerMessage },
    ],
    dealershipId: input.dealershipId,
  });
  const draft1 = first.choices?.[0]?.message?.content?.toString() ?? input.templateReply ?? "";
  const check1 = scoreWhatsAppDraft(draft1, input.language);
  if (check1.score >= 78) {
    return { reply: draft1, score: check1.score, issues: check1.issues, attempts: 1 };
  }

  const second = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.customerMessage },
      { role: "assistant", content: draft1 },
      {
        role: "user",
        content: `Rewrite in flawless ${langMeta.englishName}. Fix: ${check1.issues.join("; ")}. Keep all prices and facts exactly as given.`,
      },
    ],
    dealershipId: input.dealershipId,
  });
  const draft2 = second.choices?.[0]?.message?.content?.toString() ?? draft1;
  const check2 = scoreWhatsAppDraft(draft2, input.language);
  return {
    reply: draft2 || draft1 || input.templateReply || "",
    score: check2.score,
    issues: check2.issues,
    attempts: 2,
  };
}
