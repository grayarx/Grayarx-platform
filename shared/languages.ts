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
      "Use neutral South African English. Spell 'colour', 'kilometres', 'centre'. Avoid Americanisms ('y'all', 'gotten'). Be warm but professional. Perfect grammar; short sentences; blank line between greeting and answer on WhatsApp.",
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
      "Skryf vloeiende, korrekte Afrikaans (nie Kombuis-Afrikaans). Gebruik 'toetsrit', 'finansiering', 'inruil' eerder as Engelse leenwoorde waar moontlik. Korrekte spelling en leestekens. Op WhatsApp: kort sinne met 'n oop reël tussen groet en antwoord.",
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
      "Bhala isiZulu esihloniphekile, nesiphelele ngokwegrama (ukuvumelana kwezibizo/izenzo). Sebenzisa 'imoto', 'ukushayela', 'imali' — ungaxubi isiNgisi uma kunokufanele. Biza abadala 'Baba'/'Mama'. WhatsApp: imisho emifushane, umugqa ovulekile phakathi kokubingelela nempendulo.",
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
      "Bhala isiXhosa esihloniphekileyo nesigramatical correct. Qala ngo'Molo' (sg) okanye 'Molweni' (pl). Musa ukuxuba isiNgesi xa kukho igama lesiXhosa. WhatsApp: izivakalisi ezimfutshane, umgca ovulekileyo phakathi kombuliso nempendulo.",
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
      "Sebelisa Sesotho sa Borwa (Free State / Lesotho) — e fapane le Sepedi (nso). Bua le batho baholo ka 'Ntate'/'Mme'. Grammar e nepahetseng; qoba Senyesemane se sa hlokahaleng. WhatsApp: dipolelo tse khutšoane, mola o bulehileng pakeng tsa tumediso le karabo.",
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
      "Šomiša Sesotho sa Leboa / Sepedi (Limpopo) — e fapana le Sesotho (st). Oleditse 'Tate'/'Mma'. Grammar ye nepagilego; o se ke wa tsenya Seisemane ka go se hlokege. WhatsApp: mafoko a makopana, mothalo o bulegilego magareng ga tumedišo le karabo.",
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
      "Dirisa Setswana se se nepagetseng. Bitsa bagolo 'Rre'/'Mme'. Se tsenye Sekgoa fa go na le lefoko la Setswana. WhatsApp: dipolelo tse khutshwane, mola o bulegileng magareng ga tumediso le karabo.",
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
      "Tirhisa Xitsonga xa ntiyiso (Limpopo / Mpumalanga). Sungula hi 'Avuxeni', heta hi 'Ndza khensa'. Grammar leyi lulameke; unga hlanganisi Xinghezi loko ku ri na rito ra Xitsonga. WhatsApp: swivulwa swo koma, ntila lowu pfulekeke exikarhi ka xiloso ni nhlamulo.",
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
      "Sebentisa siSwati lesiphelele (hlukile ku-isiZulu). Vula nge-'Sawubona'/'Sanibonani'. Ungafaki siNgisi uma likhona ligama lesiSwati. WhatsApp: imisho lemfushane, umugca lovulekile emkhatsini wekubingelela nemphendvulo.",
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
      "Ṅwalani Tshivenḓa tsho tea, na diacritics (ḓ, ṱ, ṅ, ṋ) hune zwi tea. Vhulahani nga 'Ndaa', fhedzani nga 'Ndo livhuwa'. Ni songo ḓadzha English calques (e.g. 'booka test drive') — shumisani Tshivenḓa tsha nṱha. WhatsApp: miṱero miṱuku, mutala wo vuleaho vhukati ha u losha na phindulo.",
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
      "Sebenzisa isiNdebele saseMpumalanga (Southern), hhayi Northern Ndebele. Vula ngo-'Lotjhani'. Igrama ephelele; ungaxubi isiNgisi uma kukhona igama lesiNdebele. WhatsApp: imisho emifishane, umugqa ovulekile phakathi kokubingelela nempendulo.",
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
      "Use português de negócios claro (diáspora moçambicana/angolana na SA). Gramática correta; evite calques do inglês. No WhatsApp: frases curtas e uma linha em branco entre saudação e resposta.",
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
 * Shared LLM instruction block — fluent grammar + WhatsApp readability
 * for every supported language.
 */
export function whatsappLanguageProficiencyBlock(code: LanguageCode): string {
  const m = LANGUAGES[code];
  return [
    `Language proficiency: write the ENTIRE message in flawless ${m.englishName} (${m.endonym}).`,
    "Use correct grammar, natural word order, and culturally appropriate honorifics.",
    "Do not mix English filler when a natural phrase exists (except vehicle make/model, prices, stock numbers, and URLs).",
    "Keep numbers, prices, and links exactly as given.",
    "WhatsApp layout: short lines; leave a blank line between greeting, main answer, and any next-step question.",
  ].join(" ");
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
    // Afrikaans: multi-word phrases first (no \b needed — surrounding text provides boundaries),
    // then single distinctive words wrapped in \b.
    ["af", /(?:ek soek|ek wil|ek het|ek is|wat kos|het julle|is daar|kan julle|hoe laat|baie dankie|goeie more|goeie dag|\bek\b|\bjulle\b|\bjou\b|\bwatse\b|\basseblief\b|\bdankie\b|\bgoeie\b|\bhallo\b|\bhaai\b|\bbaie\b|\blekker\b|\bhoeveel\b|\btoetsrit\b|\bfinansier\b|\bbakkies?\b|\bmôre\b|\bbeskikbaar\b|\binruil\b|\bsoek\b|\bnie\b|\bdaar\b|\bmotor\b|\bmotors\b)/],
    // Portuguese diacritics break \b boundaries — use a non-ASCII-tolerant
    // pattern that matches at start, after whitespace, or after punctuation.
    ["pt", /(?:^|[\s,.;:!?])(olá|obrigado|obrigada|bom dia|boa tarde|quanto custa|carro|preço)(?=$|[\s,.;:!?])/i],
  ];

  for (const [code, re] of fingerprints) {
    if (re.test(t)) return code;
  }
  return "en";
}
