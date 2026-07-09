/**
 * Canonical list of the 11 South African official languages, used as the
 * single source of truth across every customer-facing agent (Mia, Nala,
 * Bongi, Naledi) and the public-facing forms.
 *
 * ISO 639-1 / 639-3 codes:
 *   en  English
 *   af  Afrikaans
 *   zu  isiZulu
 *   xh  isiXhosa
 *   st  Sesotho (Southern Sotho)
 *   nso Sepedi (Northern Sotho / Sesotho sa Leboa)
 *   tn  Setswana
 *   ts  Xitsonga
 *   ss  siSwati
 *   ve  Tshivenḓa
 *   nr  isiNdebele (Southern Ndebele)
 *
 * Plus `pt` (Portuguese) as a soft-supported bonus for the Mozambican /
 * Angolan diaspora — kept available but not surfaced as "official SA".
 */

export type LanguageCode =
  | "en"
  | "af"
  | "zu"
  | "xh"
  | "st"
  | "nso"
  | "tn"
  | "ts"
  | "ss"
  | "ve"
  | "nr"
  | "pt";

export interface LanguageMeta {
  code: LanguageCode;
  /** English name, used in admin UI. */
  englishName: string;
  /** Endonym — what the language calls itself. */
  endonym: string;
  /** Short culturally-correct greeting. */
  greeting: string;
  /** Short culturally-correct closing / thanks. */
  closing: string;
  /** Honorifics (sg/pl) the agent may use. */
  honorifics: string[];
  /** Style / register note for the LLM, in English. */
  styleNote: string;
  /** Whether this counts as an SA official language (drives onboarding selector). */
  saOfficial: boolean;
}

export const LANGUAGES: Record<LanguageCode, LanguageMeta> = {
  en: {
    code: "en",
    englishName: "English",
    endonym: "English",
    greeting: "Hi / Good day",
    closing: "Kind regards",
    honorifics: ["Mr.", "Mrs.", "Ms.", "Dr."],
    styleNote:
      "Use neutral South African English. Spell 'colour', 'kilometres', 'centre'. Avoid Americanisms ('y'all', 'gotten'). Be warm but professional.",
    saOfficial: true,
  },
  af: {
    code: "af",
    englishName: "Afrikaans",
    endonym: "Afrikaans",
    greeting: "Goeie dag / Hallo",
    closing: "Vriendelike groete",
    honorifics: ["Mnr.", "Mev.", "Mej.", "Dr."],
    styleNote:
      "Gebruik formele Afrikaans, nie Kombuis-Afrikaans nie. Spel 'lekker', 'kilometers'. Vermy Engelse woorde waar 'n natuurlike Afrikaanse weergawe bestaan.",
    saOfficial: true,
  },
  zu: {
    code: "zu",
    englishName: "isiZulu",
    endonym: "isiZulu",
    greeting: "Sawubona",
    closing: "Ngiyabonga",
    honorifics: ["Mnumzane", "Nkosikazi", "Nkosazana", "Baba", "Mama"],
    styleNote:
      "Use respectful isiZulu register. Address elders with 'Baba' / 'Mama' where appropriate. Never mix in English words for which a natural Zulu equivalent exists (e.g. 'imoto' not 'car').",
    saOfficial: true,
  },
  xh: {
    code: "xh",
    englishName: "isiXhosa",
    endonym: "isiXhosa",
    greeting: "Molo",
    closing: "Enkosi",
    honorifics: ["Mnumzana", "Nkosikazi", "Nkosazana", "Bhuti", "Sisi"],
    styleNote:
      "Use polite isiXhosa. Open with 'Molo' (singular) or 'Molweni' (plural). Use 'sisi' / 'bhuti' only when the customer's tone invites informal address.",
    saOfficial: true,
  },
  st: {
    code: "st",
    englishName: "Sesotho",
    endonym: "Sesotho",
    greeting: "Dumela",
    closing: "Ke a leboha",
    honorifics: ["Ntate", "Mme", "Abuti", "Ausi"],
    styleNote:
      "Use Sesotho (Southern Sotho — as spoken in Lesotho and the Free State). Address adults with 'Ntate' (sir) or 'Mme' (madam). Maintain warm, community-oriented register.",
    saOfficial: true,
  },
  nso: {
    code: "nso",
    englishName: "Sepedi (Northern Sotho)",
    endonym: "Sesotho sa Leboa",
    greeting: "Dumela",
    closing: "Ke a leboga",
    honorifics: ["Tate", "Mma", "Abuti", "Ausi"],
    styleNote:
      "Use Sesotho sa Leboa / Sepedi (as spoken in Limpopo). Note this is distinct from Sesotho (st). Address adults with 'Tate' (sir) or 'Mma' (madam). Warm, respectful, neighbourly register.",
    saOfficial: true,
  },
  tn: {
    code: "tn",
    englishName: "Setswana",
    endonym: "Setswana",
    greeting: "Dumela",
    closing: "Ke a leboga",
    honorifics: ["Rre", "Mme", "Abuti", "Ausi"],
    styleNote:
      "Use Setswana. Address adults with 'Rre' (sir) or 'Mme' (madam). Polite, neighbourly tone — never abrupt.",
    saOfficial: true,
  },
  ts: {
    code: "ts",
    englishName: "Xitsonga",
    endonym: "Xitsonga",
    greeting: "Avuxeni",
    closing: "Ndza khensa",
    honorifics: ["Tatana", "Mhani", "Buti", "Sesi"],
    styleNote:
      "Use Xitsonga (as spoken in Limpopo and northern Mpumalanga). Open with 'Avuxeni' and close with 'Ndza khensa'. Respectful register with 'Tatana' / 'Mhani' for elders.",
    saOfficial: true,
  },
  ss: {
    code: "ss",
    englishName: "siSwati",
    endonym: "siSwati",
    greeting: "Sawubona",
    closing: "Ngiyabonga",
    honorifics: ["Babe", "Make", "Bhuti", "Sisi"],
    styleNote:
      "Use siSwati (closely related to isiZulu but with distinct vocabulary — 'ngiyabonga' yes, but Swati grammar). Open with 'Sawubona' (sg) or 'Sanibonani' (pl). Respectful register.",
    saOfficial: true,
  },
  ve: {
    code: "ve",
    englishName: "Tshivenḓa",
    endonym: "Tshivenḓa",
    greeting: "Ndaa",
    closing: "Ndo livhuwa",
    honorifics: ["Vho", "Mufunzi"],
    styleNote:
      "Use Tshivenḓa with proper diacritics where possible (ḓ, ṱ, ṅ, ṋ). Open with 'Ndaa' and close with 'Ndo livhuwa'. Highly respectful register.",
    saOfficial: true,
  },
  nr: {
    code: "nr",
    englishName: "isiNdebele",
    endonym: "isiNdebele",
    greeting: "Lotjhani",
    closing: "Ngiyathokoza",
    honorifics: ["Babe", "Mama", "Bhuti", "Sisi"],
    styleNote:
      "Use Southern isiNdebele (Mpumalanga). Open with 'Lotjhani' and close with 'Ngiyathokoza'. Note this is distinct from Northern Ndebele (Zimbabwe). Respectful, warm register.",
    saOfficial: true,
  },
  pt: {
    code: "pt",
    englishName: "Portuguese",
    endonym: "Português",
    greeting: "Olá / Bom dia",
    closing: "Com os melhores cumprimentos",
    honorifics: ["Sr.", "Sra.", "Dr."],
    styleNote:
      "Use neutral business Portuguese. Aimed at the Mozambican and Angolan diaspora in SA. Polite, formal-ish register.",
    saOfficial: false,
  },
};

/** All SA official language codes, in the constitutional order. */
export const SA_OFFICIAL_LANGUAGES: LanguageCode[] = [
  "en",
  "af",
  "nr",
  "xh",
  "zu",
  "nso",
  "st",
  "tn",
  "ss",
  "ve",
  "ts",
];

/** All language codes the platform understands (SA official + soft-supported bonuses). */
export const ALL_LANGUAGE_CODES: LanguageCode[] = [
  ...SA_OFFICIAL_LANGUAGES,
  "pt",
];

export function getLanguageMeta(code: LanguageCode): LanguageMeta {
  return LANGUAGES[code];
}

export function isLanguageCode(value: string): value is LanguageCode {
  return value in LANGUAGES;
}

/**
 * Detect the most likely language from a free-form text. Heuristic only —
 * looks for canonical greetings, closings and a few high-frequency words.
 * Returns "en" as a sensible default.
 *
 * Order of checks matters: more-specific first so we don't accidentally
 * tag siSwati text as isiZulu just because of "ngiyabonga".
 */
export function detectLanguage(text: string): LanguageCode {
  const t = text.toLowerCase().trim();
  if (!t) return "en";

  // Pure-text language fingerprints. Each entry: candidate code → unique words/phrases.
  // The most diagnostic / least-overlapping languages are checked FIRST.
  const fingerprints: Array<[LanguageCode, RegExp]> = [
    ["ve", /\b(ndaa|aa|ndo livhuwa|musadzi|munna|hu na)\b/],
    ["ts", /\b(avuxeni|ndza khensa|ndzi lava|tatana|mhani|swilo)\b/],
    ["nr", /\b(lotjhani|ngiyathokoza|nginithanda|umuntu|sikhuluma)\b/],
    ["ss", /\b(sanibonani|ngiyabonga|ngitsandza|umfana|labadzala)\b/],
    ["nso", /\b(sesotho sa leboa|ke kopa|ke leboga|thobela|botša|botisa|mmala|tate|mma|nako|leboga)\b/],
    ["tn", /\b(koloi e mo|mo kae|dumela|ke a leboga|rre|mme|nako e|nna ke|leboga)\b/],
    ["st", /\b(dumela|ke a leboha|ntate|mme|nako|hantle|leboha)\b/],
    ["xh", /\b(molo|molweni|enkosi|ndiyabonga|kunjani|kakuhle)\b/],
    ["zu", /\b(sawubona|ngiyabonga|kunjani|imoto|malini|yebo|ngicela|umbala)\b/],
    ["af", /\b(ek |julle|jou |watse|asseblief|dankie|goeie|hallo|baie|lekker|'n |dis |kar |kleur |nie |van die)\b/],
    // Portuguese diacritics break \b boundaries — use a non-ASCII-tolerant
    // pattern that matches at start, after whitespace, or after punctuation.
    ["pt", /(?:^|[\s,.;:!?])(olá|obrigado|obrigada|bom dia|boa tarde|quanto custa|carro|preço)(?=$|[\s,.;:!?])/i],
  ];

  for (const [code, re] of fingerprints) {
    if (re.test(t)) return code;
  }
  return "en";
}
