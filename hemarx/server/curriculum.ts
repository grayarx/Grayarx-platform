import { LEARNER } from "./profile";
import { RESOURCES } from "./resources";
import type { CurriculumRow, InterviewAnswer, Resource, Struggle } from "./types";

const KEYWORD_STRUGGLES: Array<{ re: RegExp; tag: Struggle }> = [
  { re: /\b(bounce|info@|mailbox|deliverability|spf|dkim|principal|owner)\b/i, tag: "reach_the_owner" },
  { re: /\b(outbound|cold email|call|prospect|appointment)\b/i, tag: "founder_outbound" },
  { re: /\b(pilot|first customer|paying|close|yes)\b/i, tag: "first_customers" },
  { re: /\b(build|agent|feature|codebase|pipeline)\b/i, tag: "build_trap" },
  { re: /\b(price|pricing|offer|invoice|willingness)\b/i, tag: "pricing" },
  { re: /\b(cash|runway|payfast|eft|vat|tax)\b/i, tag: "cash" },
  { re: /\b(pitch|feature walkthrough|struggling|jobs? to be done|demand)\b/i, tag: "demand_side_sales" },
  { re: /\b(calendar|hours|time|maker|morning)\b/i, tag: "time_split" },
  { re: /\b(south africa|sast|dealer|used-car|nca|owner-operator)\b/i, tag: "sa_b2b" },
  { re: /\b(ai|llm|agent roster|whatsapp)\b/i, tag: "ship_ai" },
];

export function inferStruggles(interview: InterviewAnswer[], selected: Struggle[]): Struggle[] {
  const tags = new Set<Struggle>(selected);
  const blob = interview.map((a) => `${a.question} ${a.answer}`).join("\n");
  for (const { re, tag } of KEYWORD_STRUGGLES) {
    if (re.test(blob)) tags.add(tag);
  }
  if (tags.size === 0) {
    return ["first_customers", "founder_outbound", "build_trap"];
  }
  return [...tags];
}

export function scoreResource(resource: Resource, struggles: Struggle[]): number {
  let score = 0;
  for (const tag of resource.struggles) {
    if (struggles.includes(tag)) score += 3;
  }
  if (resource.minutes <= 40) score += 1;
  if (resource.format === "essay" || resource.format === "podcast") score += 1;
  return score;
}

export function buildCurriculum(struggles: Struggle[], interview: InterviewAnswer[]): CurriculumRow[] {
  const ranked = [...RESOURCES]
    .map((resource) => ({ resource, score: scoreResource(resource, struggles) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.resource.minutes - b.resource.minutes);

  const nextAction = interview.find((a) => a.id === "next_action")?.answer ?? "";
  const fourteen = interview.find((a) => a.id === "fourteen_days")?.answer ?? "";

  return ranked.map(({ resource }) => ({
    resource: resource.resource,
    format: resource.format,
    link: resource.link,
    why: stitchWhy(resource, nextAction, fourteen),
  }));
}

function stitchWhy(resource: Resource, nextAction: string, fourteen: string): string {
  const bits = [resource.why];
  if (nextAction) {
    bits.push(`Your stated next action: ${trim(nextAction, 180)} This resource is on the list only if it makes that action sharper this week.`);
  }
  if (fourteen && resource.struggles.includes("first_customers")) {
    bits.push(`14-day win you named: ${trim(fourteen, 140)}`);
  }
  bits.push(`Apply this week: ${resource.applyThisWeek}`);
  bits.push(`Written for ${LEARNER.name}'s rule: ${LEARNER.rule}`);
  return bits.join(" ");
}

function trim(text: string, n: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= n ? clean : `${clean.slice(0, n - 1)}…`;
}

export function toCsv(rows: CurriculumRow[]): string {
  const header = ["resource", "format", "link", "why"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((key) => csvCell(row[key as keyof CurriculumRow])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
