import { completeText } from "./llm";
import { LEARNER } from "./profile";
import { extractAphorisms, researchPerson, type ResearchBundle } from "./research";
import type { BookOutline, BookQuote, BookSection } from "./types";

const CHAPTER_TITLES = [
  "The Break",
  "The Diagnosis",
  "What They Refuse",
  "The First Principle",
  "Language They Trust",
  "The Work Itself",
  "The Buyer",
  "Money and Value",
  "Time and Attention",
  "Scale Without Theatre",
  "The Practice",
  "Monday",
];

export async function buildBook(person: string): Promise<BookOutline> {
  const research = await researchPerson(person);
  const quotes = collectQuotes(research);
  const ideas = collectIdeas(research);
  const llm = await tryLlmOutline(research, quotes);
  if (llm) return llm;
  return localOutline(research, quotes, ideas);
}

function collectQuotes(research: ResearchBundle): BookQuote[] {
  const fromWiki = research.quotes.map((q) => ({
    text: q.text,
    source: q.source,
    url: q.url,
    verified: true,
  }));
  const extracted: BookQuote[] = [];
  for (const doc of research.docs) {
    if (doc.kind === "wikipedia") continue;
    for (const item of extractAphorisms(doc.text, doc.title, doc.url)) {
      extracted.push({ text: item.text, source: item.source, url: item.url, verified: doc.kind !== "wikipedia" });
    }
  }
  const all = [...fromWiki, ...extracted];
  const seen = new Set<string>();
  return all.filter((q) => {
    const key = q.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return q.text.length >= 24;
  });
}

function collectIdeas(research: ResearchBundle): string[] {
  const text = research.docs.map((d) => d.text).join("\n");
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 50 && s.length < 240)
    .filter((s) => !/references|isbn|retrieved on|external links/i.test(s));
  const unique: string[] = [];
  for (const sentence of sentences) {
    if (unique.some((u) => u.slice(0, 40) === sentence.slice(0, 40))) continue;
    unique.push(sentence);
    if (unique.length >= 80) break;
  }
  return unique;
}

async function tryLlmOutline(research: ResearchBundle, quotes: BookQuote[]): Promise<BookOutline | null> {
  const sourceBlock = research.docs
    .map((d) => `# ${d.title}\n${d.url}\n${d.text.slice(0, 3500)}`)
    .join("\n\n");
  const quoteBlock = quotes
    .slice(0, 40)
    .map((q) => `- "${q.text}" (${q.source} ${q.url ?? ""})`)
    .join("\n");
  const raw = await completeText({
    maxTokens: 4000,
    system: `You are a ghostwriter outlining a nonfiction book strictly from supplied public sources. Do not invent quotes. Do not invent biographical scenes that are not in the sources. If a story is not in the sources, say the public record shows X instead of fabricating a client story. Voice: insightful, concise, emotionally resonant, faithful to the person's tone. No generic self-help filler. No first-person as yourself. Output Markdown in this exact structure.

Introduction: <title>
Core focus: ...
Opening story: ...
5 Big Ideas:
1. ...
5 Quotes/Aphorisms:
1. "..." — source

Then Chapter 1 through Chapter 12 with the same fields. At least 2000 words. Each chapter builds on the last.`,
    user: `Person: ${research.canonicalName}\nLearner context (do not mention other products): ${LEARNER.posture}\n\nSOURCES:\n${sourceBlock}\n\nVERIFIED QUOTES:\n${quoteBlock || "(none from Wikiquote — only paraphrase sourced ideas, never fake quotes)"}`,
  });
  if (!raw) return null;
  const parsed = parseGeneratedMarkdown(raw, research, quotes);
  if (parsed.chapters.length < 12) return null;
  return parsed;
}

export function localOutline(
  research: ResearchBundle,
  quotes: BookQuote[],
  ideas: string[],
): BookOutline {
  const name = research.canonicalName;
  const bio = research.bio || `${name} is a public practitioner whose work is documented in the sources listed.`;
  const q = (i: number): BookQuote =>
    quotes[i % Math.max(quotes.length, 1)] ?? {
      text: `${name}'s public work keeps returning to the same pressure: say the true thing, then do the next concrete act.`,
      source: "Hemarx note — not a verbatim quote; quote pool was thin",
      verified: false,
    };

  const intro: BookSection = {
    title: `${name}: The Work, Not the Myth`,
    coreFocus: `The public record of ${name} is useful only where it changes what you do this week. Origin here is not celebrity. It is the moment their work stopped being commentary and became a method.`,
    openingStory: bio.split("\n").slice(0, 3).join(" ").slice(0, 700) || `${name}'s documented path is the opening: what they actually did, not what a summary slide says they believe.`,
    bigIdeas: padIdeas(ideas.slice(0, 5), name, [
      `${name}'s work is a refusal of theatre.`,
      "The useful unit is a practice you can run on Monday.",
      "Language is a tool, not a brand.",
      "If it cannot be sourced, it does not go in the book.",
      "The reader is here to apply, not to admire.",
    ]),
    quotes: quoteSet(quotes, 0),
  };

  const chapters: BookSection[] = CHAPTER_TITLES.map((title, index) => {
    const ideaSlice = ideas.slice(index * 5, index * 5 + 5);
    const focus = chapterFocus(title, name, research);
    return {
      title: `Chapter ${index + 1}: ${title}`,
      coreFocus: focus,
      openingStory: (ideaSlice[0] || bio).slice(0, 500),
      bigIdeas: padIdeas(ideaSlice, name, fallbackIdeas(title, name)),
      quotes: quoteSet(quotes, (index + 1) * 5),
    };
  });

  const outline: BookOutline = {
    person: name,
    generatedAt: new Date().toISOString(),
    wordCount: 0,
    sources: research.docs.map((d) => ({ title: d.title, url: d.url })),
    introduction: intro,
    chapters,
    caveats: buildCaveats(quotes, research),
  };
  outline.wordCount = countWords(outline);
  expandToWordCount(outline, research, q);
  outline.wordCount = countWords(outline);
  return outline;
}

function chapterFocus(title: string, name: string, research: ResearchBundle): string {
  const map: Record<string, string> = {
    "The Break": `The public turning point in ${name}'s work — the moment the old way of operating stopped being honest.`,
    "The Diagnosis": `What ${name} says is actually broken — not the fashionable problem, the one they keep naming.`,
    "What They Refuse": `The practices ${name} will not bless: theatre, fake certainty, borrowed playbooks.`,
    "The First Principle": `The load-bearing idea everything else hangs on in ${name}'s public teaching.`,
    "Language They Trust": `The words ${name} repeats until they become a method.`,
    "The Work Itself": `What the work looks like on a Tuesday, according to their own descriptions.`,
    "The Buyer": `Who they are speaking to, and what that person is trying to make progress on.`,
    "Money and Value": `How ${name} treats price, value, and the refusal to apologise for either.`,
    "Time and Attention": `Where they put hours. What they starve.`,
    "Scale Without Theatre": `Growth without becoming the thing they criticised.`,
    "The Practice": `The drills. The checklists. The unromantic repetition.`,
    Monday: `What a reader is to do in the next working day if they took ${name} seriously.`,
  };
  return map[title] ?? `${name}: ${title}. ${research.bio.slice(0, 180)}`;
}

function fallbackIdeas(title: string, name: string): string[] {
  return [
    `${name} treats “${title.toLowerCase()}” as a behaviour, not a mood.`,
    "If you cannot point to a source, you do not have their idea. You have yours.",
    "Application beats recitation.",
    "Cut the part that makes you look clever.",
    "Leave with one action that would make them nod, not clap.",
  ];
}

function padIdeas(ideas: string[], name: string, fallback: string[]): string[] {
  const out = [...ideas];
  for (const item of fallback) {
    if (out.length >= 5) break;
    out.push(item.includes(name) ? item : `${name}: ${item}`);
  }
  while (out.length < 5) out.push(`${name}'s public work keeps insisting on a next concrete act.`);
  return out.slice(0, 5);
}

function quoteSet(quotes: BookQuote[], start: number): BookQuote[] {
  if (quotes.length === 0) {
    return Array.from({ length: 5 }, () => ({
      text: "No verified verbatim quote was available for this section. The ideas above are paraphrases of sourced public material, not invented speech.",
      source: "Quote pool empty",
      verified: false,
    }));
  }
  const out: BookQuote[] = [];
  for (let i = 0; i < 5; i++) {
    out.push(quotes[(start + i) % quotes.length]!);
  }
  return out;
}

function buildCaveats(quotes: BookQuote[], research: ResearchBundle): string[] {
  const caveats = [
    "Quotes marked unverified are paraphrases or pool notes, not invented speech presented as theirs.",
    "Biography appears only where it teaches. No extra life story.",
  ];
  if (quotes.filter((q) => q.verified).length < 15) {
    caveats.push(
      `Verified verbatim quotes were thin for ${research.canonicalName}. Chapters reuse the sourced pool rather than fabricate lines.`,
    );
  }
  if (!research.docs.some((d) => d.kind === "wikiquote" && d.text)) {
    caveats.push("No Wikiquote page was found. Prefer their official writing over third-party recap.");
  }
  return caveats;
}

function countWords(outline: BookOutline): number {
  const sections = [outline.introduction, ...outline.chapters];
  const text = sections
    .map(
      (s) =>
        `${s.title} ${s.coreFocus} ${s.openingStory} ${s.bigIdeas.join(" ")} ${s.quotes.map((q) => q.text).join(" ")}`,
    )
    .join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

function expandToWordCount(outline: BookOutline, research: ResearchBundle, q: (i: number) => BookQuote): void {
  const extra = [research.bio, ...research.docs.map((d) => d.text)].join(" ").replace(/\s+/g, " ");
  let i = 0;
  while (countWords(outline) < 2050 && i < 12) {
    const chapter = outline.chapters[i]!;
    const slice = extra.slice(i * 280, i * 280 + 900) || extra.slice(0, 900);
    chapter.openingStory = `${chapter.openingStory} ${slice}`.slice(0, 1800);
    chapter.coreFocus = `${chapter.coreFocus} The sourced record — not a motivational gloss — is the only warrant for this chapter. ${q(i).text}`;
    i += 1;
  }
}

export function parseGeneratedMarkdown(
  markdown: string,
  research: ResearchBundle,
  quotes: BookQuote[],
): BookOutline {
  const chunks = markdown.split(/\n(?=Introduction:|Chapter\s+\d+)/i);
  const sections: BookSection[] = chunks.map((chunk) => parseSection(chunk, quotes)).filter((s) => s.title);
  const introduction = sections[0] ?? localOutline(research, quotes, []).introduction;
  const chapters = sections.slice(1, 13);
  while (chapters.length < 12) {
    const filler = localOutline(research, quotes, []).chapters[chapters.length]!;
    chapters.push(filler);
  }
  const outline: BookOutline = {
    person: research.canonicalName,
    generatedAt: new Date().toISOString(),
    wordCount: 0,
    sources: research.docs.map((d) => ({ title: d.title, url: d.url })),
    introduction,
    chapters: chapters.slice(0, 12),
    caveats: buildCaveats(quotes, research),
  };
  outline.wordCount = countWords(outline);
  if (outline.wordCount < 2000) expandToWordCount(outline, research, (i) => quotes[i % Math.max(quotes.length, 1)] ?? { text: research.bio.slice(0, 180), source: "Wikipedia", verified: false });
  outline.wordCount = countWords(outline);
  return outline;
}

function parseSection(chunk: string, quotes: BookQuote[]): BookSection {
  const title = (/^(?:Introduction|Chapter\s+\d+):\s*(.+)$/im.exec(chunk)?.[1] ?? "").trim();
  const coreFocus = (/Core focus:\s*([\s\S]*?)(?:\nOpening story:)/i.exec(chunk)?.[1] ?? "").trim();
  const openingStory = (/Opening story:\s*([\s\S]*?)(?:\n5 Big Ideas:)/i.exec(chunk)?.[1] ?? "").trim();
  const ideasBlock = (/5 Big Ideas:\s*([\s\S]*?)(?:\n5 Quotes)/i.exec(chunk)?.[1] ?? "").trim();
  const quotesBlock = (/5 Quotes[^\n]*:\s*([\s\S]*)$/i.exec(chunk)?.[1] ?? "").trim();
  const bigIdeas = numbered(ideasBlock);
  const parsedQuotes = numbered(quotesBlock).map((text, i) => {
    const cleaned = text.replace(/^["“]|["”]$/g, "");
    const known = quotes.find((q) => cleaned.includes(q.text.slice(0, 40)));
    return (
      known ?? {
        text: cleaned,
        source: "Generated from supplied sources — verify before treating as verbatim",
        verified: Boolean(known),
      }
    );
  });
  while (parsedQuotes.length < 5) parsedQuotes.push(quotes[parsedQuotes.length] ?? { text: cleanedFallback(quotes, parsedQuotes.length), source: "Sourced pool", verified: Boolean(quotes[parsedQuotes.length]) });
  return {
    title,
    coreFocus,
    openingStory,
    bigIdeas: padList(bigIdeas, 5, "The public work insists on a next act."),
    quotes: parsedQuotes.slice(0, 5),
  };
}

function numbered(block: string): string[] {
  return block
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+\.|-)\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function padList(items: string[], n: number, fill: string): string[] {
  const out = [...items];
  while (out.length < n) out.push(fill);
  return out.slice(0, n);
}

function cleanedFallback(quotes: BookQuote[], i: number): string {
  return quotes[i % Math.max(quotes.length, 1)]?.text ?? "No verbatim line in the pool for this slot.";
}

export function outlineToMarkdown(outline: BookOutline): string {
  const parts: string[] = [
    `# ${outline.person}`,
    `Word count: ${outline.wordCount}`,
    "",
    renderSection("Introduction", outline.introduction),
    ...outline.chapters.map((c, i) => renderSection(`Chapter ${i + 1}`, c)),
    "## Sources",
    ...outline.sources.map((s) => `- ${s.title}: ${s.url}`),
    "",
    "## Caveats",
    ...outline.caveats.map((c) => `- ${c}`),
  ];
  return parts.join("\n");
}

function renderSection(label: string, section: BookSection): string {
  return [
    `## ${label}: ${section.title}`,
    `Core focus: ${section.coreFocus}`,
    `Opening story: ${section.openingStory}`,
    "5 Big Ideas:",
    ...section.bigIdeas.map((idea, i) => `${i + 1}. ${idea}`),
    "5 Quotes/Aphorisms:",
    ...section.quotes.map((q, i) => `${i + 1}. "${q.text}" — ${q.source}${q.verified ? " (verified)" : " (not verbatim)"}`),
    "",
  ].join("\n");
}
