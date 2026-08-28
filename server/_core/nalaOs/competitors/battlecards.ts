import {
  COMPETITORS,
  type Competitor,
  type CompetitorId,
} from "@nalaOs/competitors/catalog";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9.+]+/g, " ").trim();
}

/** All names + aliases for regex / matching */
export function competitorMatchTerms(): string[] {
  const terms = new Set<string>();
  for (const c of COMPETITORS) {
    terms.add(c.name);
    for (const a of c.aliases) terms.add(a);
  }
  return [...terms].sort((a, b) => b.length - a.length);
}

/**
 * Detect a competitor mention in free text (dealer objection, call transcript).
 */
export function findCompetitor(message: string): Competitor | undefined {
  const hay = normalize(message);
  if (!hay) return undefined;

  for (const c of COMPETITORS) {
    const needles = [c.name, ...c.aliases].map(normalize);
    for (const needle of needles) {
      if (!needle) continue;
      if (hay.includes(needle)) return c;
    }
  }
  return undefined;
}

export function getCompetitor(id: CompetitorId): Competitor | undefined {
  return COMPETITORS.find((c) => c.id === id);
}

export function listCompetitors(): Competitor[] {
  return COMPETITORS;
}

export type BattlecardView = {
  competitor: Competitor;
  /** Spoken reply for Themba / sales */
  spokenReply: string;
  /** What the human sales lead should do next */
  nextStep: string;
  /** Bullet "we use X that's better" lines for the founder */
  beatBullets: string[];
  /** Suggested price contrast */
  pricingContrast: string;
};

export function buildBattlecard(competitor: Competitor): BattlecardView {
  const beatBullets =
    competitor.categories.length > 0
      ? competitor.categories.map(
          (row) =>
            `${row.category}: they ${row.they.toLowerCase()} — we ${row.we.toLowerCase()} (${row.beat})`,
        )
      : competitor.gaps.map((g) => `Gap we exploit: ${g}`);

  const pricingContrast = `They: ${competitor.pricing.public}. We: free 14-day pilot, then Starter OS R7,990 / Professional OS R14,990 / Enterprise from R29,990 — AI dealership OS (sales + parts + service), not a cheap chatbot.`;

  return {
    competitor,
    spokenReply: competitor.talkTrack,
    nextStep: `Log competitor=${competitor.name}. ${competitor.coexistence} Never say: "${competitor.sayNever || "trash them"}". Soft-close free parallel pilot.`,
    beatBullets,
    pricingContrast,
  };
}

export function battlecardFromMessage(message: string): BattlecardView | undefined {
  const competitor = findCompetitor(message);
  if (!competitor) return undefined;
  return buildBattlecard(competitor);
}

/** Regex source for playbook intent matching (longest names first) */
export function competitorIntentPattern(): RegExp {
  const escaped = competitorMatchTerms()
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return new RegExp(`\\b(?:${escaped})\\b`, "i");
}
