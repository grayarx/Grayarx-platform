export type Format = "book" | "podcast" | "creator" | "course" | "essay" | "newsletter";

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

export type InterviewAnswer = {
  id: string;
  question: string;
  answer: string;
};

export type Resource = {
  id: string;
  resource: string;
  format: Format;
  link: string;
  why: string;
  struggles: Struggle[];
  applyThisWeek: string;
  minutes: number;
};

export type CurriculumRow = {
  resource: string;
  format: Format;
  link: string;
  why: string;
};

export type SourceKind = "podcast" | "x" | "instagram" | "newsletter" | "news";

export type Source = {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  rss?: string;
  why: string;
  struggles: Struggle[];
};

export type BriefItem = {
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  kind: SourceKind;
  summary: string;
  whyNow: string;
  publishedAt?: string;
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

export type MirrorIssue = {
  kind: "vague" | "wrong" | "unclear";
  excerpt: string;
  note: string;
  materialAnchor?: string;
};

export type MirrorGrade = {
  score: number;
  letter: string;
  summary: string;
  issues: MirrorIssue[];
  missing: string[];
  strongerVersion: string;
};

export type BookQuote = {
  text: string;
  source: string;
  url?: string;
  verified: boolean;
};

export type BookSection = {
  title: string;
  coreFocus: string;
  openingStory: string;
  bigIdeas: string[];
  quotes: BookQuote[];
};

export type BookOutline = {
  person: string;
  generatedAt: string;
  wordCount: number;
  sources: { title: string; url: string }[];
  introduction: BookSection;
  chapters: BookSection[];
  caveats: string[];
};

export type AskKind = "text" | "single" | "multi";

export type AskOption = {
  id: string;
  label: string;
  description?: string;
};

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

export type StudioState = {
  interview: InterviewAnswer[];
  struggles: Struggle[];
  curriculum: CurriculumRow[];
  seenUrls: string[];
  briefs: DailyBrief[];
  lastBriefAt?: string;
  asks: AskSession[];
};
