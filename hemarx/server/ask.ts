import { INTERVIEW_PROMPTS, STRUGGLE_LABELS } from "./profile";
import { loadState, saveState } from "./store";
import type { AskOption, AskQuestion, AskSession, Struggle, StudioState } from "./types";

export function interviewComplete(interview: { answer: string }[]): boolean {
  return interview.length > 0 && interview.every((q) => q.answer.trim().split(/\s+/).filter(Boolean).length >= 8);
}

export function currentAsk(asks: AskSession[]): AskSession | null {
  return asks.find((session) => !session.completedAt && session.questions.some((q) => !isAnswered(q))) ?? null;
}

export function currentQuestion(session: AskSession | null): AskQuestion | null {
  if (!session) return null;
  return session.questions.find((q) => !isAnswered(q)) ?? null;
}

export function isAnswered(question: AskQuestion): boolean {
  if (question.kind === "text") return (question.answer ?? "").trim().length > 0;
  return (question.selected ?? []).length > 0;
}

export function askUser(input: {
  tool: AskSession["tool"];
  reason: string;
  questions: AskQuestion[];
}): AskSession {
  const state = loadState();
  const existing = currentAsk(state.asks.filter((s) => s.tool === input.tool));
  if (existing && input.tool === "curriculum") return existing;
  const session: AskSession = {
    id: `${input.tool}-${Date.now()}`,
    tool: input.tool,
    reason: input.reason,
    questions: input.questions.map((q) => ({ ...q })),
    createdAt: new Date().toISOString(),
  };
  state.asks = [session, ...state.asks.filter((s) => s.tool !== input.tool || s.completedAt)].slice(0, 40);
  saveState(state);
  return session;
}

export function ensureCurriculumAsk(): AskSession {
  const state = loadState();
  const open = currentAsk(state.asks.filter((s) => s.tool === "curriculum"));
  if (open) return open;
  if (interviewComplete(state.interview)) {
    const done = state.asks.find((s) => s.tool === "curriculum" && s.completedAt);
    if (done) return done;
  }
  return askUser({
    tool: "curriculum",
    reason: "The curriculum is blocked until you answer. Assumed answers are not allowed.",
    questions: curriculumQuestions(),
  });
}

export function curriculumQuestions(): AskQuestion[] {
  const struggleOptions: AskOption[] = Object.entries(STRUGGLE_LABELS).map(([id, label]) => ({
    id,
    label,
  }));
  return [
    {
      id: "struggles",
      prompt: "Which of these is actually true this month? Mark only what would change a close.",
      why: "The resource list is built from these chips. Popular topics stay off unless you mark them.",
      kind: "multi",
      options: struggleOptions,
      required: true,
    },
    ...INTERVIEW_PROMPTS.map((item) => ({
      id: item.id,
      prompt: item.question,
      why: "If this is vague, I will ask again. A Tuesday action beats a mood.",
      kind: "text" as const,
      required: true,
    })),
  ];
}

export function answerAsk(input: {
  sessionId: string;
  questionId: string;
  answer?: string;
  selected?: string[];
}): { session: AskSession; question: AskQuestion; followUp?: AskQuestion; complete: boolean } {
  const state = loadState();
  const session = state.asks.find((s) => s.id === input.sessionId);
  if (!session) throw new Error("No open question with that id.");
  const question = session.questions.find((q) => q.id === input.questionId);
  if (!question) throw new Error("That question is not in this ask.");

  if (question.kind === "text") {
    const text = (input.answer ?? "").trim();
    if (question.required && !text) {
      throw new Error("Write an answer. The studio will not guess.");
    }
    question.answer = text;
    const followUp =
      question.required && text.split(/\s+/).filter(Boolean).length < 8
        ? maybeFollowUp(question, text)
        : undefined;
    if (followUp && !session.questions.some((q) => q.id === followUp.id)) {
      const idx = session.questions.findIndex((q) => q.id === question.id);
      session.questions.splice(idx + 1, 0, followUp);
      applyAskToStudio(state, session);
      saveState(state);
      return { session, question, followUp, complete: false };
    }
  } else {
    const selected = input.selected ?? [];
    if (question.required && selected.length === 0) {
      throw new Error("Pick at least one.");
    }
    question.selected = selected;
    question.answer = selected.join(", ");
  }

  applyAskToStudio(state, session);
  const remaining = session.questions.filter((q) => !isAnswered(q));
  if (remaining.length === 0) {
    session.completedAt = new Date().toISOString();
  }
  saveState(state);
  return { session, question, complete: remaining.length === 0 };
}

function maybeFollowUp(question: AskQuestion, text: string): AskQuestion | undefined {
  if (question.id.startsWith("followup-")) return undefined;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 8) return undefined;
  return {
    id: `followup-${question.id}`,
    prompt: `That was too thin for “${question.prompt}”. Name a person, a number, or what Tuesday looks like if this is gone.`,
    why: "The Ask User tool does not guess. Weak answers do not unlock the curriculum.",
    kind: "text",
    required: true,
  };
}

function applyAskToStudio(state: StudioState, session: AskSession): void {
  if (session.tool !== "curriculum") return;
  const strugglesQ = session.questions.find((q) => q.id === "struggles");
  if (strugglesQ?.selected?.length) {
    state.struggles = strugglesQ.selected as Struggle[];
  }
  for (const item of INTERVIEW_PROMPTS) {
    const asked = session.questions.find((q) => q.id === item.id);
    const follow = session.questions.find((q) => q.id === `followup-${item.id}`);
    const answer = [asked?.answer, follow?.answer].filter(Boolean).join(" ").trim();
    const row = state.interview.find((q) => q.id === item.id);
    if (row && answer) row.answer = answer;
  }
}

export function pendingPayload(): {
  session: AskSession | null;
  question: AskQuestion | null;
  remaining: number;
  total: number;
} {
  const state = loadState();
  const session = currentAsk(state.asks);
  const question = currentQuestion(session);
  return {
    session,
    question,
    remaining: session ? session.questions.filter((q) => !isAnswered(q)).length : 0,
    total: session?.questions.length ?? 0,
  };
}
