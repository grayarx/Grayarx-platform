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

export type AskKind = "text" | "single" | "multi";
export type AskOption = { id: string; label: string; description?: string };
export type AskQuestion = {
  id: string;
  prompt: string;
  why: string;
  kind: AskKind;
  options?: AskOption[];
  required: boolean;
  answer?: string;
  selected?: string[];
};
export type AskSession = {
  id: string;
  tool: "curriculum" | "architect" | "brief" | "custom";
  reason: string;
  questions: AskQuestion[];
  createdAt: string;
  completedAt?: string;
};
export type AskPending = {
  session: AskSession | null;
  question: AskQuestion | null;
  remaining: number;
  total: number;
};

export type Bootstrap = {
  learner: { name: string; city: string; posture: string; rule: string };
  struggleLabels: Record<string, string>;
  interview: InterviewAnswer[];
  struggles: Struggle[];
  curriculum: CurriculumRow[];
  sources: Source[];
  latestBrief: DailyBrief | null;
  interviewComplete: boolean;
  pendingAsk: AskPending;
};

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const raw = await response.text();
  let data: { error?: string } = {};
  try {
    data = raw ? (JSON.parse(raw) as { error?: string }) : {};
  } catch {
    throw new Error(
      response.ok
        ? "The studio returned a page instead of data. Refresh."
        : raw.slice(0, 180) || response.statusText,
    );
  }
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
  startAsk: (tool: "curriculum" | "architect" = "curriculum") =>
    json<AskPending>("/api/ask/start", { method: "POST", body: JSON.stringify({ tool }) }),
  pendingAsk: () => json<AskPending>("/api/ask/pending"),
  answerAsk: (input: { sessionId: string; questionId: string; answer?: string; selected?: string[] }) =>
    json<{
      complete: boolean;
      pending: AskPending;
      interviewComplete: boolean;
      curriculum: CurriculumRow[];
    }>("/api/ask/answer", { method: "POST", body: JSON.stringify(input) }),
  brief: (force = false) => json<DailyBrief>("/api/brief", { method: "POST", body: JSON.stringify({ force }) }),
  mirror: (material: string, explanation: string) =>
    json<MirrorGrade>("/api/mirror", { method: "POST", body: JSON.stringify({ material, explanation }) }),
  architect: (person: string, choice?: string) =>
    json<{
      outline?: BookOutline;
      markdown?: string;
      needsAsk?: boolean;
      pending?: AskPending;
      session?: AskSession;
    }>("/api/architect", {
      method: "POST",
      body: JSON.stringify({ person, choice }),
    }),
};
