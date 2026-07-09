/**
 * Lightweight i18n for GrayArx. Stored in localStorage, no external deps.
 * Covers the 7 official SA languages we support at MVP.
 */

import { createContext, useContext } from "react";

export type LanguageCode = "en" | "af" | "zu" | "xh" | "st" | "tn" | "ve";

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "af", label: "Afrikaans", native: "Afrikaans" },
  { code: "zu", label: "isiZulu", native: "isiZulu" },
  { code: "xh", label: "isiXhosa", native: "isiXhosa" },
  { code: "st", label: "Sesotho", native: "Sesotho" },
  { code: "tn", label: "Setswana", native: "Setswana" },
  { code: "ve", label: "Tshivenda", native: "Tshivenḓa" },
];

type Dictionary = Record<string, string>;

const en: Dictionary = {
  "nav.home": "Home",
  "nav.showroom": "Showroom",
  "nav.pricing": "Pricing",
  "nav.dashboard": "Dashboard",
  "cta.startTrial": "Start Free Trial",
  "cta.bookDemo": "Book Demo",
  "hero.badge": "Built for South African Dealerships",
  "hero.title.a": "Your",
  "hero.title.b": "24/7 AI Sales Team",
  "hero.title.c": "That Never Sleeps",
  "hero.tagline": "The Dealership AI Operating System.",
  "trust.noCard": "No credit card required",
  "trust.popia": "POPIA compliant",
  "trust.sla": "99.5% uptime SLA",
};

const af: Dictionary = {
  "nav.home": "Tuis",
  "nav.showroom": "Vertoonlokaal",
  "nav.pricing": "Pryse",
  "nav.dashboard": "Paneelbord",
  "cta.startTrial": "Begin gratis proeftydperk",
  "cta.bookDemo": "Bespreek demo",
  "hero.badge": "Gebou vir Suid-Afrikaanse handelaars",
  "hero.title.a": "Jou",
  "hero.title.b": "24/7 KI-verkoopspan",
  "hero.title.c": "Wat Nooit Slaap Nie",
  "hero.tagline": "Die handelaar se KI-bedryfstelsel.",
  "trust.noCard": "Geen kredietkaart benodig",
  "trust.popia": "POPIA-voldoende",
  "trust.sla": "99,5% beskikbaarheid",
};

const zu: Dictionary = {
  "nav.home": "Ikhaya",
  "nav.showroom": "Igumbi lokubukisa",
  "nav.pricing": "Amanani",
  "nav.dashboard": "Ibhodi",
  "cta.startTrial": "Qala isizini samahhala",
  "cta.bookDemo": "Bhukha idemo",
  "hero.badge": "Yakhelwe abathengisi baseNingizimu Afrika",
  "hero.title.a": "Ithimba lakho",
  "hero.title.b": "le-AI lokuthengisa 24/7",
  "hero.title.c": "Elingalali",
  "hero.tagline": "Isistimu yokusebenza ye-AI yabathengisi.",
  "trust.noCard": "Akudingeki ikhadi lesikweletu",
  "trust.popia": "Ihambelana ne-POPIA",
  "trust.sla": "99.5% ukutholakala",
};

const xh: Dictionary = {
  "nav.home": "Ekhaya",
  "nav.showroom": "Indlu yokubonisa",
  "nav.pricing": "Amaxabiso",
  "nav.dashboard": "Ibhodi",
  "cta.startTrial": "Qala iziko lasimahla",
  "cta.bookDemo": "Bhukisha idemo",
  "hero.badge": "Yenzelwe abathengisi baseMzantsi Afrika",
  "hero.title.a": "Iqela lakho",
  "hero.title.b": "le-AI lokuthengisa ngo-24/7",
  "hero.title.c": "Elingalaliyo",
  "hero.tagline": "Inkqubo yokusebenza ye-AI yabathengisi.",
  "trust.noCard": "Akufuneki khadi letyala",
  "trust.popia": "Ihambelana ne-POPIA",
  "trust.sla": "99.5% ixesha lokufumaneka",
};

const st: Dictionary = {
  "nav.home": "Lehae",
  "nav.showroom": "Kamore ya pontsho",
  "nav.pricing": "Litheko",
  "nav.dashboard": "Boto ea taolo",
  "cta.startTrial": "Qala teko ea mahala",
  "cta.bookDemo": "Bukha pontsho",
  "hero.badge": "E etselitsoe barekisi ba Afrika Boroa",
  "hero.title.a": "Sehlopha sa hau",
  "hero.title.b": "sa AI sa thekiso 24/7",
  "hero.title.c": "Se sa Robaleng",
  "hero.tagline": "Tsamaiso ea AI ea barekisi.",
  "trust.noCard": "Ha ho hlokahale karete ea mokitlane",
  "trust.popia": "E lumellanang le POPIA",
  "trust.sla": "99.5% nako ea ho fumaneha",
};

const tn: Dictionary = {
  "nav.home": "Legae",
  "nav.showroom": "Phaposi ya pontsho",
  "nav.pricing": "Ditlhwatlhwa",
  "nav.dashboard": "Boto ya taolo",
  "cta.startTrial": "Simolola teko ya mahala",
  "cta.bookDemo": "Bukisa pontsho",
  "hero.badge": "E dirilwe barekisi ba Aforika Borwa",
  "hero.title.a": "Setlhopha sa gago",
  "hero.title.b": "sa AI sa thekiso 24/7",
  "hero.title.c": "Se Se Sa Robaleng",
  "hero.tagline": "Tsamaiso ya AI ya barekisi.",
  "trust.noCard": "Ga go tlhokege karata ya sekoloto",
  "trust.popia": "E dumalanang le POPIA",
  "trust.sla": "99.5% nako ya go bonwa",
};

const ve: Dictionary = {
  "nav.home": "Hayani",
  "nav.showroom": "Kamara ya u sumbedza",
  "nav.pricing": "Mitengo",
  "nav.dashboard": "Bodho ya vhulanguli",
  "cta.startTrial": "Thoma muling'wisi wa mahala",
  "cta.bookDemo": "Bukha tsumbo",
  "hero.badge": "Yo itelwa vharengisi vha Afrika Tshipembe",
  "hero.title.a": "Tshigwada tshanu",
  "hero.title.b": "tsha AI tsha u rengisa 24/7",
  "hero.title.c": "Tshi sa edeli",
  "hero.tagline": "Sisiteme ya AI ya vharengisi.",
  "trust.noCard": "A hu ṱoḓei khadi ḽa zwikolodo",
  "trust.popia": "I tendelana na POPIA",
  "trust.sla": "99.5% tshifhinga tsha u wanala",
};

const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, af, zu, xh, st, tn, ve };

export interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (k) => en[k] ?? k,
});

export const useI18n = () => useContext(I18nContext);

export const translate = (lang: LanguageCode, key: string) =>
  DICTIONARIES[lang]?.[key] ?? en[key] ?? key;
