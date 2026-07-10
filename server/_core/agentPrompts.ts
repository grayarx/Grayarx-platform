/**
 * Multilingual tone & grammar guardrails for GrayArx agents.
 *
 * Each language gets:
 *   - A culturally-correct greeting/closing
 *   - Honorifics and politeness markers
 *   - Forbidden robotic phrases ("As an AI...", "I'm just a bot", etc.)
 *   - A short style note describing register
 *
 * We then bolt these onto every agent's system prompt and run a second
 * "quality self-check" pass where the LLM re-reads its draft against the
 * same rules before returning it.
 */

import { invokeLLM } from "./llm";
import { AGENTS, type AgentId } from "../../shared/agents";
import {
  LANGUAGES,
  type LanguageCode as SharedLanguageCode,
  type LanguageMeta,
} from "../../shared/languages";

/**
 * Re-export the shared canonical type so existing call sites keep working.
 * The single source of truth lives in `shared/languages.ts`.
 */
export type LanguageCode = SharedLanguageCode;

export type LanguageRules = {
  code: LanguageCode;
  name: string;
  greeting: string;
  closing: string;
  honorifics: string[];
  styleNote: string;
};

function toRules(meta: LanguageMeta): LanguageRules {
  return {
    code: meta.code,
    name: meta.code === "en" ? "South African English" : meta.englishName,
    greeting: meta.greeting,
    closing: meta.closing,
    honorifics: meta.honorifics,
    styleNote: meta.styleNote,
  };
}

/**
 * Tone & grammar rules for every supported language, derived from the
 * canonical `shared/languages.ts` table. Adding a new language only
 * requires adding it there.
 */
export const LANGUAGE_RULES: Record<LanguageCode, LanguageRules> = Object.
  fromEntries(
    (Object.keys(LANGUAGES) as LanguageCode[]).map((code) => [
      code,
      toRules(LANGUAGES[code]),
    ]),
  ) as Record<LanguageCode, LanguageRules>;

/** Phrases every agent must AVOID, regardless of language. */
export const FORBIDDEN_PHRASES = [
  "As an AI",
  "I am just a bot",
  "I'm just a bot",
  "I am an AI language model",
  "I cannot help with that",
  "Per our records",
  "Dear valued customer",
  "Thank you for reaching out",
];

/** Build the system prompt for a given agent + language. */
export function buildSystemPrompt(
  agentId: AgentId,
  lang: LanguageCode,
  extraContext = "",
): string {
  const persona = AGENTS[agentId];
  const rules = LANGUAGE_RULES[lang];
  return [
    `You are ${persona.displayName}, the ${persona.role} at GrayArx — the AI operating system for South African car dealerships.`,
    `Your sign-off is: "${persona.signature}" (use it once, at the end).`,
    `Your reply MUST be written in ${rules.name}.`,
    `Open with: "${rules.greeting}" (vary slightly if it flows better; do not skip it).`,
    `Close with: "${rules.closing}" before your signature.`,
    `Honorifics available: ${rules.honorifics.join(", ")}.`,
    `Tone & style: ${rules.styleNote}`,
    "",
    "Hard rules:",
    `- Never use any of these phrases: ${FORBIDDEN_PHRASES.map((p) => `"${p}"`).join(", ")}.`,
    "- Never claim to be a human; if asked directly say you are an AI concierge.",
    "- Never invent vehicle availability, prices, finance terms, or appointment times you weren't given.",
    "- Keep replies under 140 words unless explicitly asked for more detail.",
    "- Always respect POPIA: never repeat back ID numbers, banking details, or addresses.",
    "- If the customer's message is hostile or abusive, respond once with calm professionalism and offer to escalate to a human team member.",
    extraContext ? `\nAdditional context:\n${extraContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * WhatsApp tone variant — same persona + language rules, but messages must
 * feel like a voice note: short, lowercase-friendly, no formal sign-off.
 */
export function buildWhatsAppSystemPrompt(
  lang: LanguageCode,
  extraContext = "",
): string {
  const persona = AGENTS.whatsapp;
  const rules = LANGUAGE_RULES[lang];
  return [
    `You are ${persona.displayName}, the ${persona.role} at GrayArx.`,
    `You are warm, patient, and knowledgeable — like a trusted friend who happens to know cars really well. Clients must feel they are talking to a real person who genuinely cares about finding them the right car.`,
    `This is a WhatsApp reply, NOT an email. It must feel like a quick, friendly voice note in writing.`,
    `Reply in ${rules.name}.`,
    `You may open warmly (e.g. "${rules.greeting}") but you do NOT need a formal closing.`,
    `Tone & style: ${rules.styleNote}`,
    "",
    "Hard rules for WhatsApp:",
    "- Maximum 60 words. Aim for 25–40.",
    "- Short sentences. Line breaks are fine. No long paragraphs.",
    "- At most ONE emoji, and only if it naturally fits.",
    "- No formal email sign-off block. End with just your first name.",
    `- Never use any of these phrases: ${FORBIDDEN_PHRASES.map((p) => `"${p}"`).join(", ")}.`,
    "- Never claim to be a human; you are an AI concierge for the dealership.",
    "- NEVER present numbered emoji menus (1️⃣, 2️⃣, 3️⃣). Weave any next-step suggestions naturally into your reply — e.g. 'I can arrange a test drive — just say the word.'",
    "- Answer the client's question FIRST, then gently suggest a natural next step in the same breath.",
    "- Start the very first message in a thread with a short AI disclosure on its own line (e.g. \"⚡ AI assistant\"), then the body. This is non-negotiable.",
    "- Never invent stock, prices, finance terms or appointments.",
    "- Respect POPIA: do not echo back ID numbers, banking details or full addresses.",
    extraContext ? `\nContext from the dealership:\n${extraContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Score a WhatsApp draft against tone constraints. Stricter length cap than email.
 */
export function scoreWhatsAppDraft(
  text: string,
  lang: LanguageCode,
): { score: number; issues: string[] } {
  const issues: string[] = [];
  const rules = LANGUAGE_RULES[lang];
  const lower = text.toLowerCase();

  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      issues.push(`Contains forbidden phrase: "${phrase}"`);
    }
  }

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 60) issues.push(`Too long for WhatsApp (${wordCount} words, max 60)`);
  if (wordCount < 4) issues.push(`Too short (${wordCount} words, min 4)`);

  // Count emoji (rough): any non-ASCII character in symbol planes
  // Plain unicode-range count (no /u flag — keeps TS happy on older lib targets)
  let emojiCount = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x1f300 && cp <= 0x1faff) || (cp >= 0x2600 && cp <= 0x27bf)) {
      emojiCount++;
    }
  }
  const emojiMatches = new Array(emojiCount);
  if (emojiMatches.length > 1) {
    issues.push(`Too many emoji (${emojiMatches.length}, max 1)`);
  }

  // Formal sign-off block patterns that don't belong on WhatsApp
  if (/kind regards|vriendelike groete|yours sincerely|ngiyabonga kakhulu/i.test(text)) {
    issues.push("Contains a formal email-style closing block");
  }

  if (lang !== "en") {
    const greetingHit = text.toLowerCase().includes(rules.greeting.split(" ")[0].toLowerCase());
    if (!greetingHit && wordCount > 15) {
      issues.push(`No ${rules.name} greeting detected — possible English fallback`);
    }
  }

  if (/\bbot\b/i.test(text) || /artificial intelligence/i.test(text)) {
    issues.push("Self-references as bot/AI in an awkward way");
  }

  const score = Math.max(0, 100 - issues.length * 18);
  return { score, issues };
}

/**
 * Generate a WhatsApp reply with the same self-check loop as the email path.
 */
export async function generateWhatsAppReply(input: {
  language: LanguageCode;
  customerMessage: string;
  context?: string;
}): Promise<{ reply: string; score: number; issues: string[]; attempts: number }> {
  const systemPrompt = buildWhatsAppSystemPrompt(input.language, input.context);

  const first = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.customerMessage },
    ],
  });
  const draft1 = first.choices?.[0]?.message?.content?.toString() ?? "";
  const check1 = scoreWhatsAppDraft(draft1, input.language);
  if (check1.score >= 82) {
    return { reply: draft1, score: check1.score, issues: check1.issues, attempts: 1 };
  }

  const second = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.customerMessage },
      { role: "assistant", content: draft1 },
      {
        role: "user",
        content: `Your draft has these problems: ${check1.issues.join("; ")}. Rewrite it as a short WhatsApp reply, fixing every problem.`,
      },
    ],
  });
  const draft2 = second.choices?.[0]?.message?.content?.toString() ?? draft1;
  const check2 = scoreWhatsAppDraft(draft2, input.language);
  return { reply: draft2, score: check2.score, issues: check2.issues, attempts: 2 };
}

/**
 * Prepend a short, language-aware AI disclosure to a WhatsApp draft.
 * Always added by the server before persisting/sending, so even if the
 * LLM forgets the rule, the dealer's customer still sees an honest AI tag.
 */
export function addWhatsAppAIDisclosure(
  draft: string,
  lang: LanguageCode,
): string {
  const tag: Record<LanguageCode, string> = {
    en: "⚡ AI assistant · Nala (GrayArx)",
    af: "⚡ KI-assistent · Nala (GrayArx)",
    zu: "⚡ Umsizi we-AI · Nala (GrayArx)",
    xh: "⚡ Umncedi we-AI · Nala (GrayArx)",
    st: "⚡ Mothusi wa AI · Nala (GrayArx)",
    nso: "⚡ Mothuši wa AI · Nala (GrayArx)",
    tn: "⚡ Mothusi wa AI · Nala (GrayArx)",
    ts: "⚡ Mupfuni wa AI · Nala (GrayArx)",
    ss: "⚡ Umsiti we-AI · Nala (GrayArx)",
    ve: "⚡ Muthusi wa AI · Nala (GrayArx)",
    nr: "⚡ Umsizi we-AI · Nala (GrayArx)",
    pt: "⚡ Assistente de IA · Nala (GrayArx)",
  };
  const prefix = tag[lang] ?? tag.en;
  // Don't double-prefix if the LLM already added one.
  if (/AI (assistant|concierge|agent)/i.test(draft.slice(0, 80))) return draft;
  return `${prefix}\n\n${draft.trim()}`;
}

/**
 * Heuristic quality scoring of an agent's draft against the guardrails.
 * Returns a numeric score (0–100) and a list of issues found.
 * Pure function — no LLM call — so it's cheap and deterministic.
 */
export function scoreDraft(
  text: string,
  lang: LanguageCode,
): { score: number; issues: string[] } {
  const issues: string[] = [];
  const rules = LANGUAGE_RULES[lang];
  const lower = text.toLowerCase();

  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      issues.push(`Contains forbidden phrase: "${phrase}"`);
    }
  }

  // Length sanity
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 200) issues.push(`Too long (${wordCount} words, max 200)`);
  if (wordCount < 8) issues.push(`Too short (${wordCount} words, min 8)`);

  // Language fallback check — if a non-English language was requested,
  // the reply MUST contain the greeting OR closing as a basic sanity check.
  if (lang !== "en") {
    const greetingHit = text.toLowerCase().includes(rules.greeting.split(" ")[0].toLowerCase());
    const closingHit = text.toLowerCase().includes(rules.closing.split(" ")[0].toLowerCase());
    if (!greetingHit && !closingHit) {
      issues.push(
        `No ${rules.name} greeting or closing detected — possible English fallback`,
      );
    }
  }

  // Self-reference robot patterns
  if (/\bbot\b/i.test(text) || /artificial intelligence/i.test(text)) {
    issues.push("Self-references as bot/AI in an awkward way");
  }

  const score = Math.max(0, 100 - issues.length * 18);
  return { score, issues };
}

/**
 * Run the LLM with the agent's persona + language rules, then if the draft
 * fails the heuristic check, ask the model to rewrite it once. This is the
 * "self-check pass" — it costs at most 2 LLM calls.
 */
export async function generateAgentReply(input: {
  agentId: AgentId;
  language: LanguageCode;
  customerMessage: string;
  context?: string;
}): Promise<{ reply: string; score: number; issues: string[]; attempts: number }> {
  const systemPrompt = buildSystemPrompt(input.agentId, input.language, input.context);

  const first = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.customerMessage },
    ],
  });
  const draft1 = first.choices?.[0]?.message?.content?.toString() ?? "";

  const check1 = scoreDraft(draft1, input.language);
  if (check1.score >= 82) {
    return { reply: draft1, score: check1.score, issues: check1.issues, attempts: 1 };
  }

  // Self-correction pass
  const second = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.customerMessage },
      { role: "assistant", content: draft1 },
      {
        role: "user",
        content: `Your draft has these problems: ${check1.issues.join("; ")}. Rewrite the reply, fixing every problem. Keep the same intent but obey every rule strictly.`,
      },
    ],
  });
  const draft2 = second.choices?.[0]?.message?.content?.toString() ?? draft1;
  const check2 = scoreDraft(draft2, input.language);

  return { reply: draft2, score: check2.score, issues: check2.issues, attempts: 2 };
}
