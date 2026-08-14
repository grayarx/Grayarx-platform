export type Struggle =
  | "first_customers"
  | "founder_outbound"
  | "reach_the_owner"
  | "build_trap"
  | "pricing"
  | "cash"
  | "demand_side_sales"
  | "time_split"
  | "ship_ai"
  | "sa_b2b";

export type InterviewAnswer = { id: string; question: string; answer: string };
export type CurriculumRow = { resource: string; format: string; link: string; why: string };
export type Source = {
  id: string;
  name: string;
  kind: string;
  url: string;
  rss?: string;
  why: string;
};
export type BriefItem = {
  title: string;
  url: string;
  sourceName: string;
  kind: string;
  summary: string;
  whyNow: string;
};
export type DailyBrief = {
  date: string;
  generatedAt: string;
  readMinutes: number;
  headline: string;
  items: BriefItem[];
  skipped: string[];
  sourcesConsulted: string[];
};
export type MirrorGrade = {
  score: number;
  letter: string;
  summary: string;
  issues: { kind: "vague" | "wrong" | "unclear"; excerpt: string; note: string; materialAnchor?: string }[];
  missing: string[];
  strongerVersion: string;
};
export type BookOutline = {
  person: string;
  wordCount: number;
  sources: { title: string; url: string }[];
  caveats: string[];
  introduction: BookSection;
  chapters: BookSection[];
};
export type BookSection = {
  title: string;
  coreFocus: string;
  openingStory: string;
  bigIdeas: string[];
  quotes: { text: string; source: string; verified: boolean }[];
};

export type Bootstrap = {
  learner: { name: string; city: string; posture: string; rule: string };
  struggleLabels: Record<string, string>;
  interview: InterviewAnswer[];
  struggles: Struggle[];
  curriculum: CurriculumRow[];
  sources: Source[];
  latestBrief: DailyBrief | null;
};

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || response.statusText);
  return data as T;
}

export const api = {
  bootstrap: () => json<Bootstrap>("/api/bootstrap"),
  saveInterview: (interview: InterviewAnswer[], struggles: Struggle[]) =>
    json<{ interview: InterviewAnswer[]; struggles: Struggle[]; curriculum: CurriculumRow[] }>("/api/interview", {
      method: "POST",
      body: JSON.stringify({ interview, struggles }),
    }),
  brief: (force = false) => json<DailyBrief>("/api/brief", { method: "POST", body: JSON.stringify({ force }) }),
  mirror: (material: string, explanation: string) =>
    json<MirrorGrade>("/api/mirror", { method: "POST", body: JSON.stringify({ material, explanation }) }),
  architect: (person: string) =>
    json<{ outline: BookOutline; markdown: string }>("/api/architect", {
      method: "POST",
      body: JSON.stringify({ person }),
    }),
};
