import { LEARNER } from "./profile";
import { fetchText, parseRss, type RssItem } from "./scrape";
import { CLICKBAIT, RELEVANCE, SOURCES } from "./sources";
import { loadState, saveBrief } from "./store";
import type { BriefItem, DailyBrief, Source, Struggle } from "./types";

const NOISE =
  /\b(opinion:|sponsored|win a |giveaway|horoscope|celebrity|lifestyle|recipe|world cup squad)\b/i;

export async function buildDailyBrief(force = false): Promise<DailyBrief> {
  const state = loadState();
  const today = new Date().toISOString().slice(0, 10);
  if (!force) {
    const existing = state.briefs.find((b) => b.date === today);
    if (existing) return existing;
  }

  const struggles = state.struggles;
  const seen = new Set(state.seenUrls);
  const skipped: string[] = [];
  const consulted: string[] = [];
  const collected: BriefItem[] = [];

  await Promise.all(
    SOURCES.map(async (source) => {
      consulted.push(source.name);
      if (!source.rss) {
        skipped.push(`${source.name} (${source.kind}): no public RSS — listed as a follow, not scraped.`);
        return;
      }
      const xml = await fetchText(source.rss);
      if (!xml) {
        skipped.push(`${source.name}: feed unreachable this morning.`);
        return;
      }
      const items = parseRss(xml);
      for (const item of items) {
        const verdict = keepItem(item, source, struggles, seen);
        if (verdict === true) {
          collected.push(toBriefItem(item, source, struggles));
          seen.add(normalizeUrl(item.url));
        } else if (verdict) {
          skipped.push(verdict);
        }
      }
    }),
  );

  const ranked = collected
    .sort((a, b) => relevanceScore(b, struggles) - relevanceScore(a, struggles))
    .slice(0, 8);

  const brief: DailyBrief = {
    date: today,
    generatedAt: new Date().toISOString(),
    readMinutes: Math.max(6, Math.min(10, 4 + ranked.length)),
    headline: ranked[0]
      ? `Coffee brief — ${ranked.length} items that touch this week's work`
      : "Coffee brief — sources were quiet or off-topic; protect the calling block anyway",
    items: ranked,
    skipped: unique(skipped).slice(0, 24),
    sourcesConsulted: unique(consulted),
  };

  saveBrief(brief);
  return brief;
}

export function keepItem(
  item: RssItem,
  source: Source,
  struggles: Struggle[],
  seen: Set<string>,
): true | string | false {
  const url = normalizeUrl(item.url);
  const text = `${item.title} ${item.summary}`;
  if (seen.has(url)) return `Repeat dropped: ${item.title}`;
  if (CLICKBAIT.test(text)) return `Clickbait dropped: ${item.title}`;
  if (NOISE.test(text)) return false;
  if (!sourceRelevant(source, struggles)) return false;
  if (!itemRelevant(text, source, struggles)) return false;
  return true;
}

function sourceRelevant(source: Source, struggles: Struggle[]): boolean {
  return source.struggles.some((tag) => struggles.includes(tag));
}

function itemRelevant(text: string, source: Source, struggles: Struggle[]): boolean {
  const tags = source.struggles.filter((tag) => struggles.includes(tag));
  if (source.kind === "news" || source.kind === "newsletter") {
    return tags.some((tag) => RELEVANCE[tag]?.test(text)) || /\b(dealership|used[- ]car|sme|outbound|pricing|payments?|south africa)\b/i.test(text);
  }
  if (source.kind === "podcast") {
    return tags.some((tag) => RELEVANCE[tag]?.test(text)) || /\b(sales|outbound|pricing|customers?|pitch)\b/i.test(text);
  }
  return tags.some((tag) => RELEVANCE[tag]?.test(text));
}

function toBriefItem(item: RssItem, source: Source, struggles: Struggle[]): BriefItem {
  return {
    title: item.title,
    url: item.url,
    sourceId: source.id,
    sourceName: source.name,
    kind: source.kind,
    summary: item.summary || "No summary in feed — open only if the title maps to this week's conversations.",
    whyNow: whyNow(item, source, struggles),
    publishedAt: item.publishedAt,
  };
}

function whyNow(item: RssItem, source: Source, struggles: Struggle[]): string {
  const hit = source.struggles.find((tag) => struggles.includes(tag));
  if (hit === "sa_b2b") {
    return `Use as sentence-one context with a principal. ${LEARNER.city} owners live in this week's numbers, not in your roadmap.`;
  }
  if (hit === "founder_outbound" || hit === "reach_the_owner") {
    return "Steal one line, send the ten emails, call the same day. Do not add a new sequence tool.";
  }
  if (hit === "pricing") {
    return "If this changes the number on the one-page offer, change it before noon. Otherwise skip.";
  }
  if (hit === "build_trap") {
    return "Read only if it shortens what you will build. Then go back to conversations.";
  }
  return `On the list because it maps to ${hit ?? source.name}. Apply or discard — do not archive.`;
}

function relevanceScore(item: BriefItem, struggles: Struggle[]): number {
  const text = `${item.title} ${item.summary}`;
  let score = 0;
  for (const tag of struggles) {
    if (RELEVANCE[tag]?.test(text)) score += 2;
  }
  if (item.kind === "news") score += 1;
  return score;
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.replace(/^www\./, "");
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
