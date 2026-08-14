/**
 * Typo normalization + grammar polish for Nala showroom replies — all 12 languages.
 */

import type { LanguageCode } from "./languages";
import { ALL_LANGUAGE_CODES } from "./languages";
import { PROMPT_FOLLOW_UP, replyNeedsNameCapture, nalaText } from "./nalaTranslations";

type Vars = Record<string, string | number | undefined>;

function fillTemplate(template: string, vars: Vars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v != null ? String(v) : "";
  });
}

/** Fill a native template and run grammar polish — use for all outbound Nala copy. */
export function polishedNalaText(
  lang: LanguageCode,
  strings: Record<LanguageCode, string>,
  vars: Vars = {},
): string {
  const template = strings[lang] ?? strings.en;
  return polishNalaReply(fillTemplate(template, vars), lang);
}

/** Common buyer typos before intent classification (all languages). */
export function normalizeBuyerMessage(text: string): string {
  let out = text.trim();
  const rules: Array<[RegExp, string]> = [
    // Afrikaans
    [/\bkleer\b/gi, "kleur"],
    [/\bkleere\b/gi, "kleur"],
    [/\bkler\b/gi, "kleur"],
    [/\bwatse\b/gi, "wat"],
    [/\bwt\s+kleur/gi, "wat kleur"],
    // English
    [/\bhow much is\b/gi, "how much"],
    [/\bcolur\b/gi, "colour"],
    [/\bcolor\b/gi, "colour"],
    // isiZulu / isiXhosa / siSwati
    [/\bumbala\b/gi, "umbala"],
    [/\bmmala\b/gi, "mmala"],
    // Portuguese
    [/\bpreco\b/gi, "preço"],
    [/\bcor\b/gi, "cor"],
    // Setswana / Sesotho / Sepedi
    [/\bmmala\b/gi, "mmala"],
    [/\bkoloi\b/gi, "koloi"],
    // Xitsonga
    [/\bmuvala\b/gi, "muvala"],
    [/\bmovha\b/gi, "movha"],
    // Tshivenḓa
    [/\bmmala\b/gi, "mmala"],
  ];
  for (const [re, rep] of rules) {
    out = out.replace(re, rep);
  }
  return out.trim();
}

/** English phrases that should never appear in non-English bot replies (LLM leakage). */
const ENGLISH_LEAKAGE: RegExp[] = [
  /\bor pick an option below\b/i,
  /\banything else about this car\b/i,
  /\bwhat's your name\b/i,
  /\bwhat is your name\b/i,
  /\bi don't have the exact colour\b/i,
  /\blets anders\b/i,
  /\bworking on it\b/i,
  /\bsomething went wrong\b/i,
  /\btry again or pick\b/i,
  /\bbooka test drive\b/i,
  /\bwant to book a test drive\b/i,
];

/**
 * Universal fixes applied to every language.
 * IMPORTANT: never collapse newlines — WhatsApp needs blank lines between sections.
 */
const UNIVERSAL_FIXES: Array<[RegExp, string]> = [
  // Horizontal whitespace only (spaces/tabs) — preserve intentional \n\n
  [/[^\S\n]{2,}/g, " "],
  [/[^\S\n]+\n/g, "\n"],
  [/\n[^\S\n]+/g, "\n"],
  // Cap runaway blank lines (Meta-friendly: one empty line max)
  [/\n{3,}/g, "\n\n"],
  // Strip spaces/tabs after ** — never eat newlines (closing **\n\n must survive)
  [/\*\*[^\S\n]+/g, "**"],
  // Strip spaces/tabs before a closing ** (not an opening ** on the next line)
  [/[^\S\n]+\*\*(?![a-zA-Z0-9\u00C0-\u024F_*])/g, "**"],
];

/** Per-language grammar / spelling corrections on outbound replies. */
const LANG_FIXES: Partial<Record<LanguageCode, Array<[RegExp, string]>>> = {
  af: [
    [/\blets anders\b/gi, "Iets anders"],
    [/\b, or kies\b/gi, ", of kies"],
    [/\bor kies 'n opsie\b/gi, "of kies 'n opsie"],
    [/\b'n Konsultant\b/g, "'n konsultant"],
  ],
  en: [[/\blets anders\b/gi, "Anything else"]],
  zu: [
    [/\bUzo\*\*/g, "Uzothola i-**"],
    [/\bthe \*\*/gi, "**"],
    [/\btest drive\b/gi, "ukushayela"],
  ],
  xh: [
    [/\bthe \*\*/gi, "**"],
    [/\btest drive\b/gi, "ukushayela"],
  ],
  st: [
    [/\bHo na le se seng\?\s*khetha/gi, "Ho na le se seng? Khetha"],
    [/\b, or pick\b/gi, ", khetha"],
    [/\bGearbox:\b/gi, "Sebopeho sa gear:"],
  ],
  nso: [
    [/\bGo na le se sengwe\?\s*kgetha/gi, "Go na le se sengwe? Kgetha"],
    [/\b, or pick\b/gi, ", kgetha"],
    [/\bGearbox:\b/gi, "Sebopešo sa gear:"],
  ],
  tn: [
    [/\bGo na le se sengwe\?\s*kgetha/gi, "Go na le se sengwe? Kgetha"],
    [/\b, or pick\b/gi, ", kgetha"],
    [/\bGearbox:\b/gi, "Mokgwa wa gear:"],
  ],
  ts: [
    [/\bXiphiqo xin'wana\b/gi, "Xin'wana xin'we hi movha lowu"],
    [/\b, or pick\b/gi, ", kumbe hlawula"],
    [/\bGearbox:\b/gi, "Gear ya ku cinca:"],
  ],
  ss: [
    [/\b, or pick\b/gi, ", noma ukhethe"],
    [/\bGearbox:\b/gi, "I-gearbox:"],
    [/\btest drive\b/gi, "kushayela"],
  ],
  ve: [
    [/\bZwi ita zwine\?\s*$/gi, "Dzina lavho ndi ani?"],
    [/\b, or pick\b/gi, ", nangani"],
    [/\bZwiṅwe\?\s*nangani/gi, "Zwiṅwe zwi re hone? Nangani"],
    [/\bbooka test drive\b/gi, "bulokha u linga u shumisa"],
    [/\bGearbox:\b/gi, "Gearbox ya u shandukisa:"],
  ],
  nr: [
    [/\b, or pick\b/gi, ", noma ukhethe"],
    [/\btest drive\b/gi, "ukushayela"],
  ],
  pt: [
    [/\bexcellent\b/gi, "excelente"],
    [/\bgood\b/gi, "bom"],
    [/\bfair\b/gi, "razoável"],
    [/\bpoor\b/gi, "mau"],
    [/\b, or pick\b/gi, ", ou escolha"],
  ],
};

function stripEnglishLeakage(text: string, lang: LanguageCode): string {
  if (lang === "en") return text;
  let out = text;
  for (const re of ENGLISH_LEAKAGE) {
    if (re.test(out)) {
      const follow = nalaText(lang, PROMPT_FOLLOW_UP);
      out = out.replace(re, follow.includes(",") ? follow.split(",").slice(1).join(",").trim() : follow);
    }
  }
  return out;
}

function fixTruncatedAfrikaans(text: string): string {
  if (/^[a-z]{2,8}\s+anders\b/i.test(text) && !/^iets anders/i.test(text)) {
    return text.replace(/^[a-z]+\s+anders/i, "Iets anders");
  }
  return text;
}

function capitalizeSentences(text: string): string {
  return text.replace(/(^|[.!?]\s+)([a-zà-ÿ])/g, (_, p, c) => `${p}${c.toUpperCase()}`);
}

export function polishNalaReply(text: string, lang: LanguageCode): string {
  let out = text.trim();
  if (!out) return out;

  for (const [re, rep] of UNIVERSAL_FIXES) {
    out = out.replace(re, rep);
  }

  const langFixes = LANG_FIXES[lang] ?? [];
  for (const [re, rep] of langFixes) {
    out = out.replace(re, rep);
  }

  out = fixTruncatedAfrikaans(out);
  out = stripEnglishLeakage(out, lang);
  out = capitalizeSentences(out);

  return out.trim();
}

/**
 * Keep WhatsApp readable: collapse runaway blank lines, ensure space before
 * separators / bullet lists / score blocks. Never remove intentional \n\n.
 */
export function ensureWhatsAppSpacing(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([^\n])\n(─{3,})/g, "$1\n\n$2")
    .replace(/(─{3,}[^\n]*)\n([^\n])/g, "$1\n\n$2")
    .replace(/([^\n])\n(📊)/g, "$1\n\n$2")
    .replace(/([^\n])\n(• )/g, "$1\n\n$2")
    .trim();
}

/** One clean bot bubble — optional follow-up appended when appropriate. */
export function composeShowroomBotReply(
  mainReply: string,
  lang: LanguageCode,
  options: { appendFollowUp?: boolean } = {},
): string {
  let text = polishNalaReply(mainReply, lang);
  const lower = text.toLowerCase();

  if (options.appendFollowUp && !replyNeedsNameCapture(text)) {
    const follow = polishNalaReply(PROMPT_FOLLOW_UP[lang] ?? PROMPT_FOLLOW_UP.en, lang);
    const followHint = follow.slice(0, 14).toLowerCase();
    const alreadyHasFollow =
      lower.includes(followHint) ||
      lower.includes("opsie hieronder") ||
      lower.includes("inketho engezansi") ||
      lower.includes("ukhetho ngezansi") ||
      lower.includes("opção abaixo") ||
      lower.includes("ka tlase") ||
      lower.includes("ka fase") ||
      lower.includes("fa tlase") ||
      lower.includes("laha hansi") ||
      lower.includes("nga fhasi");
    if (!alreadyHasFollow) {
      text = `${text}\n\n${follow}`;
    }
  }

  return text;
}

/** UI labels kept in English across all showroom templates. */
function stripAllowedLoanwords(text: string): string {
  return text
    .replace(/\*\*Test drive\*\*/gi, "")
    .replace(/\*\*Pre-approval\*\*/gi, "")
    .replace(/\*\*Trade-in value\*\*/gi, "")
    .replace(/\*\*skip\*\*/gi, "")
    .replace(/\*\*(excellent|good|fair|poor)\*\*/gi, "")
    .replace(/\bPOA\b/g, "")
    .replace(/\bGearbox\b/gi, "")
    .replace(/\bAI\b/g, "")
    .replace(/\bNala\b/g, "")
    .replace(/\bTumi\b/g, "");
}

/** Quality gate for native templates — used in tests and dev audits. */
export function scoreNalaTemplate(text: string, lang: LanguageCode): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const trimmed = text.trim();
  const forLeakCheck = stripAllowedLoanwords(trimmed);

  if (trimmed.length < 4) issues.push("too short");
  if (/ {2,}/.test(trimmed)) issues.push("double spaces");
  if (/\?\s*[a-zà-ÿ]/.test(trimmed)) issues.push("missing capital after question mark");

  if (lang !== "en") {
    for (const re of ENGLISH_LEAKAGE) {
      if (re.test(forLeakCheck)) issues.push(`english leakage: ${re.source}`);
    }
    if (/\bZwi ita zwine\b/i.test(trimmed) && !/Dzina lavho/i.test(trimmed)) {
      issues.push("incorrect Tshivenḓa name phrase");
    }
  }

  if (lang === "zu" && /Uzo\*\*/.test(trimmed)) issues.push("broken Zulu location template");

  return { ok: issues.length === 0, issues };
}

export type LangStrings = Record<LanguageCode, string>;

/** Validate every key in a LangStrings map has all languages and passes quality gates. */
export function validateLangStrings(label: string, strings: LangStrings): string[] {
  const failures: string[] = [];
  for (const lang of ALL_LANGUAGE_CODES) {
    const value = strings[lang];
    if (!value?.trim()) {
      failures.push(`${label}[${lang}]: missing or empty`);
      continue;
    }
    const { ok, issues } = scoreNalaTemplate(value, lang);
    if (!ok) {
      failures.push(`${label}[${lang}]: ${issues.join(", ")}`);
    }
  }
  return failures;
}
