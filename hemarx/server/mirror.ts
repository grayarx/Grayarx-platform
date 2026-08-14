import { completeJson } from "./llm";
import type { MirrorGrade, MirrorIssue } from "./types";

const HEDGE =
  /\b(kind of|sort of|maybe|probably|stuff|things|basically|overall|various|etc\.?|and so on|a lot of|something like)\b/gi;
const ABSOLUTE = /\b(always|never|everyone|nobody|guaranteed|proven to|the only)\b/gi;

export async function gradeMirror(material: string, explanation: string): Promise<MirrorGrade> {
  const local = gradeLocal(material, explanation);
  const llm = await completeJson({
    system:
      "You grade a learner's explanation against source material. Return JSON {score:0-100,letter,summary,issues:[{kind:'vague'|'wrong'|'unclear',excerpt,note,materialAnchor}],missing:string[],strongerVersion}. Do not invent facts that are not in the material. Be specific.",
    user: `MATERIAL:\n${material.slice(0, 8000)}\n\nEXPLANATION:\n${explanation.slice(0, 6000)}\n\nLocal draft to improve:\n${JSON.stringify(local)}`,
    maxTokens: 1800,
  });
  if (llm && typeof llm === "object") {
    const merged = { ...local, ...(llm as Partial<MirrorGrade>) };
    merged.issues = Array.isArray(merged.issues) ? merged.issues : local.issues;
    merged.missing = Array.isArray(merged.missing) ? merged.missing : local.missing;
    merged.score = clamp(Number(merged.score) || local.score);
    merged.letter = letterFor(merged.score);
    return merged;
  }
  return local;
}

export function gradeLocal(material: string, explanation: string): MirrorGrade {
  const issues: MirrorIssue[] = [];
  const materialSentences = splitSentences(material);
  const explainSentences = splitSentences(explanation);
  const materialTerms = keyTerms(material);
  const explainTerms = new Set(keyTerms(explanation));

  if (explanation.trim().length < 80) {
    issues.push({
      kind: "vague",
      excerpt: explanation.trim() || "(empty)",
      note: "Too short to show you understood the mechanism. Restate the cause, the action, and what you will do this week.",
    });
  }

  for (const sentence of explainSentences) {
    HEDGE.lastIndex = 0;
    if (HEDGE.test(sentence)) {
      issues.push({
        kind: "vague",
        excerpt: sentence,
        note: "Hedge language. Replace with a concrete actor, number, or next step.",
      });
    }
    ABSOLUTE.lastIndex = 0;
    if (ABSOLUTE.test(sentence) && !ABSOLUTE.test(material)) {
      issues.push({
        kind: "wrong",
        excerpt: sentence,
        note: "Absolute claim that the material does not make. Soften to what the source actually said.",
      });
    }
    if (sentence.split(/\s+/).length > 42) {
      issues.push({
        kind: "unclear",
        excerpt: sentence,
        note: "This sentence is doing too much. Split into claim + example.",
      });
    }
  }

  const missing = materialTerms.filter((term) => !explainTerms.has(term)).slice(0, 8);
  for (const term of missing.slice(0, 3)) {
    const anchor = materialSentences.find((s) => s.toLowerCase().includes(term)) ?? "";
    issues.push({
      kind: "vague",
      excerpt: `Missing idea: “${term}”`,
      note: "The material treats this as load-bearing. Put it in your own words or you do not have it.",
      materialAnchor: anchor.slice(0, 240),
    });
  }

  if (!/\b(I will|this week|tomorrow|next call|next email)\b/i.test(explanation)) {
    issues.push({
      kind: "unclear",
      excerpt: "No applied next step",
      note: "Understanding without a this-week action is shelf-help. Add one behaviour you will run.",
    });
  }

  const covered = materialTerms.filter((term) => explainTerms.has(term)).length;
  const coverage = materialTerms.length ? covered / materialTerms.length : 0.5;
  const penalty = issues.length * 5;
  const score = clamp(
    Math.round(72 + coverage * 28 - penalty + Math.min(8, explanation.length / 120)),
  );

  return {
    score,
    letter: letterFor(score),
    summary:
      issues.length === 0
        ? "Clear enough to use. The next test is whether you run the action, not whether you can explain it again."
        : `The explanation leaks in ${issues.filter((i) => i.kind === "vague").length} vague spots, ${issues.filter((i) => i.kind === "wrong").length} possible mismatches, and ${issues.filter((i) => i.kind === "unclear").length} unclear sentences.`,
    issues: dedupeIssues(issues).slice(0, 10),
    missing,
    strongerVersion: stronger(explanation, missing),
  };
}

function stronger(explanation: string, missing: string[]): string {
  const action = /\b(I will|this week)\b/i.test(explanation)
    ? ""
    : " This week I will apply it in one conversation, one email, or one number on the offer.";
  const gap = missing.length ? ` I am still missing: ${missing.slice(0, 4).join(", ")}.` : "";
  return `${explanation.trim().replace(/\s+/g, " ")}${gap}${action}`.slice(0, 1200);
}

function keyTerms(text: string): string[] {
  const stop = new Set(
    "the a an and or but if then than that this those these with from into onto over after before about above below under between against without within your their our its his her they them you for not are was were been being have has had will would can could should may might into onto just like also more most some any each few such only own same so than too very".split(
      " ",
    ),
  );
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []) {
    if (stop.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  const min = text.length < 1200 ? 1 : 2;
  return [...counts.entries()]
    .filter(([, n]) => n >= min)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([term]) => term)
    .slice(0, 16);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function letterFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function dedupeIssues(issues: MirrorIssue[]): MirrorIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.kind}:${issue.excerpt.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
