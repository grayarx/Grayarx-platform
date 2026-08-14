import { fetchText } from "./scrape";

export type ResearchDoc = {
  title: string;
  url: string;
  text: string;
  kind: "wikipedia" | "wikiquote" | "official" | "interview";
};

export type ResearchBundle = {
  person: string;
  canonicalName: string;
  bio: string;
  docs: ResearchDoc[];
  quotes: { text: string; source: string; url: string }[];
};

const UA_HEADERS = {
  "user-agent": "HemarxArchitect/1.0 (private research; educational; no commercial scrape)",
  accept: "application/json,text/plain,text/html",
};

export async function researchPerson(person: string): Promise<ResearchBundle> {
  const wiki = await wikipedia(person);
  const quoteName = await wikiquoteTitle(wiki.canonicalName || person);
  const quotes = await wikiquote(quoteName);
  const official = wiki.website ? await officialSite(wiki.website, wiki.canonicalName) : null;
  const docs: ResearchDoc[] = [
    {
      title: wiki.canonicalName,
      url: wiki.url,
      text: wiki.extract,
      kind: "wikipedia",
    },
  ];
  if (quotes.pageText) {
    docs.push({
      title: `Wikiquote: ${wiki.canonicalName}`,
      url: quotes.url,
      text: quotes.pageText,
      kind: "wikiquote",
    });
  }
  if (official) docs.push(official);
  const extras = await extraEssays(person, wiki.canonicalName);
  docs.push(...extras);

  return {
    person,
    canonicalName: wiki.canonicalName,
    bio: docs.map((d) => d.text).join(" ").slice(0, 1800) || `${wiki.canonicalName} writes in public. The sourced pages below are the warrant for the outline.`,
    docs,
    quotes: quotes.items,
  };
}

type WikiSearch = {
  query?: { search?: Array<{ title: string; snippet?: string }> };
};

type WikiPage = {
  title?: string;
  extract?: string;
  fullurl?: string;
  extlinks?: Array<{ "*": string }>;
};

type WikiExtract = {
  query?: { pages?: Record<string, WikiPage> };
};

type WikiQuotePage = {
  title?: string;
  missing?: string;
  revisions?: Array<{ slots?: { main?: { "*": string } } }>;
};

type WikiQuoteQuery = {
  query?: { pages?: Record<string, WikiQuotePage> };
};

const KNOWN_SITES: Record<string, string> = {
  "paul graham": "https://www.paulgraham.com/articles.html",
  "patrick mckenzie": "https://www.kalzumeus.com/",
  "patio11": "https://www.kalzumeus.com/",
  "april dunford": "https://www.aprildunford.com/",
  "jason cohen": "https://longform.asmartbear.com/",
  "pete kazanjy": "https://www.foundingsales.com/",
  "peter kazanjy": "https://www.foundingsales.com/",
  "rob fitzpatrick": "https://www.momtestbook.com/",
  "melissa perri": "https://melissaperri.com/",
};

function scoreWikiHit(title: string, snippet: string, query: string): number {
  const blob = `${title} ${snippet}`.toLowerCase();
  const q = query.toLowerCase();
  let score = 0;
  if (title.toLowerCase().includes(q) || q.includes(title.toLowerCase().split(" (")[0])) score += 3;
  if (/\b(entrepreneur|programmer|software|blogger|writer|author|essayist|investor|salesperson|executive)\b/.test(blob)) score += 8;
  if (/\b(politician|footballer|soccer|actor|bishop|cricketer|rugby| rapper)\b/.test(blob) && !/\b(politician|football|actor)\b/.test(q)) score -= 12;
  if (/\b(patio11|kalzumeus|yc|y combinator|startup)\b/.test(blob)) score += 10;
  return score;
}

export type WikiCandidate = {
  title: string;
  snippet: string;
  score: number;
  url: string;
};

export function isAmbiguous(candidates: WikiCandidate[], person: string): boolean {
  if (KNOWN_SITES[person.toLowerCase()]) return false;
  if (/\(.+\)/.test(person)) return false;
  if (candidates.length < 2) return false;
  const disambiguated = candidates.filter((c) => /\(.+\)/.test(c.title));
  if (disambiguated.length >= 2) return true;
  const top = candidates[0]?.score ?? 0;
  const second = candidates[1]?.score ?? 0;
  if (top >= 8 && top - second >= 6) return false;
  return true;
}

export async function wikipediaCandidates(person: string): Promise<WikiCandidate[]> {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(person)}&utf8=1&format=json&srlimit=8`;
  const search = await json<WikiSearch>(searchUrl);
  const hits = search?.query?.search ?? [];
  return hits
    .map((hit) => ({
      title: hit.title,
      snippet: (hit.snippet ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      score: scoreWikiHit(hit.title, hit.snippet ?? "", person),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`,
    }))
    .sort((a, b) => b.score - a.score);
}

async function wikipedia(person: string): Promise<{
  canonicalName: string;
  extract: string;
  url: string;
  website?: string;
}> {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(person)}&utf8=1&format=json&srlimit=8`;
  const search = await json<WikiSearch>(searchUrl);
  const hits = search?.query?.search ?? [];
  const ranked = [...hits].sort(
    (a, b) => scoreWikiHit(b.title, b.snippet ?? "", person) - scoreWikiHit(a.title, a.snippet ?? "", person),
  );
  const known = KNOWN_SITES[person.toLowerCase()];
  const best = ranked[0];
  const bestScore = best ? scoreWikiHit(best.title, best.snippet ?? "", person) : -99;
  if (known && bestScore < 4) {
    return {
      canonicalName: person,
      extract: "",
      url: known,
      website: known,
    };
  }
  const title = best?.title || person;
  const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info|extlinks&exintro=0&explaintext=1&inprop=url&ellimit=20&redirects=1&titles=${encodeURIComponent(title)}&format=json`;
  const data = await json<WikiExtract>(extractUrl);
  const page = Object.values(data?.query?.pages ?? {})[0] ?? {};
  const links = (page.extlinks ?? []).map((l) => l["*"]).filter(Boolean);
  const knownSite = KNOWN_SITES[person.toLowerCase()] || KNOWN_SITES[title.toLowerCase()];
  const website =
    knownSite ||
    known ||
    links.find((l) => /\/\/(www\.)?(?!wikipedia|wikimedia|archive)/i.test(l) && !l.includes("twitter.com") && !l.includes("facebook.com"));
  return {
    canonicalName: page.title || title,
    extract: (page.extract || "").slice(0, 12000),
    url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    website,
  };
}

async function wikiquoteTitle(name: string): Promise<string> {
  const url = `https://en.wikiquote.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&utf8=1&format=json&srlimit=5`;
  const data = await json<WikiSearch>(url);
  const hits = data?.query?.search ?? [];
  if (!hits.length) return name;
  const ranked = [...hits].sort(
    (a, b) => scoreWikiHit(b.title, b.snippet ?? "", name) - scoreWikiHit(a.title, a.snippet ?? "", name),
  );
  const best = ranked[0];
  if (!best || scoreWikiHit(best.title, best.snippet ?? "", name) < 0) return name;
  return best.title;
}

async function wikiquote(name: string): Promise<{
  url: string;
  pageText: string;
  items: { text: string; source: string; url: string }[];
}> {
  const url = `https://en.wikiquote.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&titles=${encodeURIComponent(name)}`;
  const data = await json<WikiQuoteQuery>(url);
  const page = Object.values(data?.query?.pages ?? {})[0];
  const pageUrl = `https://en.wikiquote.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`;
  if (!page || page.missing !== undefined) {
    return { url: pageUrl, pageText: "", items: [] };
  }
  const wikitext = page.revisions?.[0]?.slots?.main?.["*"] ?? "";
  const items = parseWikiquote(wikitext, pageUrl).slice(0, 80);
  return { url: pageUrl, pageText: stripWiki(wikitext).slice(0, 12000), items };
}

export function parseWikiquote(wikitext: string, pageUrl: string): { text: string; source: string; url: string }[] {
  const items: { text: string; source: string; url: string }[] = [];
  const lines = wikitext.split("\n");
  let source = "Wikiquote";
  for (const line of lines) {
    const heading = /^==+\s*(.+?)\s*==+/.exec(line);
    if (heading) {
      source = stripWiki(heading[1]);
      continue;
    }
    const quoted = /^\*\s+(?!\*)(.+?)\s*$/.exec(line);
    if (!quoted) continue;
    let text = stripWiki(quoted[1]).replace(/^"|"$/g, "").trim();
    if (text.length < 24 || text.length > 280) continue;
    if (/^https?:/i.test(text) || /^\[?https?:/i.test(text)) continue;
    if (/^\w+:/.test(text) && !text.includes(" ")) continue;
    if (/^(external links|category:|defaultsort)/i.test(text)) continue;
    items.push({ text, source: source || "Wikiquote", url: pageUrl });
  }
  return dedupeQuotes(items);
}

export function stripWiki(value: string): string {
  return value
    .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/'''|''/g, "")
    .replace(/<ref[\s\S]*?<\/ref>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function officialSite(url: string, name: string): Promise<ResearchDoc | null> {
  const html = await fetchText(url, 7000);
  if (!html) return null;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
  if (text.length < 200) return null;
  return { title: `${name} — official site`, url, text, kind: "official" };
}

async function json<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers: UA_HEADERS });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function dedupeQuotes(items: { text: string; source: string; url: string }[]): { text: string; source: string; url: string }[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function extraEssays(query: string, canonical: string): Promise<ResearchDoc[]> {
  const key = `${query} ${canonical}`.toLowerCase();
  const urls: { title: string; url: string }[] = [];
  if (key.includes("paul graham")) {
    urls.push(
      { title: "Do Things That Don't Scale", url: "https://paulgraham.com/ds.html" },
      { title: "Maker's Schedule, Manager's Schedule", url: "https://paulgraham.com/makersschedule.html" },
      { title: "How to Get Startup Ideas", url: "https://paulgraham.com/startupideas.html" },
    );
  }
  if (key.includes("patrick mckenzie") || key.includes("patio11")) {
    urls.push(
      { title: "About patio11", url: "https://www.kalzumeus.com/about/" },
      { title: "Kalzumeus start here", url: "https://www.kalzumeus.com/start-here-if-youre-new/" },
      { title: "Bits about Money", url: "https://www.bitsaboutmoney.com/" },
    );
  }
  const docs: ResearchDoc[] = [];
  for (const item of urls) {
    const doc = await officialSite(item.url, item.title);
    if (doc) docs.push(doc);
  }
  return docs;
}

export function extractAphorisms(text: string, source: string, url: string): { text: string; source: string; url: string }[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 220);
  const scored = sentences
    .filter((s) => !/wikipedia|retrieved|isbn|references/i.test(s))
    .filter((s) => /\b(I |you |we |don't |never |always |the |people )\b/i.test(s));
  return scored.slice(0, 30).map((text) => ({ text, source, url }));
}
