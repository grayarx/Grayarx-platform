import { describe, expect, it } from "vitest";
import { answerAsk, askUser, currentQuestion, interviewComplete, isAnswered } from "./ask";
import { INTERVIEW_QUESTIONS } from "./profile";
import { loadState, saveState } from "./store";

describe("ask user tool", () => {
  it("blocks curriculum until answers exist", () => {
    expect(interviewComplete(INTERVIEW_QUESTIONS)).toBe(false);
    expect(interviewComplete([{ answer: "yes" }])).toBe(false);
    expect(
      interviewComplete([
        { answer: "Ten named principals get a four-sentence email and a same-day call." },
      ]),
    ).toBe(true);
  });

  it("asks, rejects a thin answer, then accepts a concrete one", () => {
    const state = loadState();
    state.asks = [];
    saveState(state);
    const session = askUser({
      tool: "custom",
      reason: "Need a Tuesday action",
      questions: [
        {
          id: "next",
          prompt: "What do you do Tuesday?",
          why: "No guessing.",
          kind: "text",
          required: true,
        },
      ],
    });
    expect(currentQuestion(session)?.id).toBe("next");
    const thin = answerAsk({ sessionId: session.id, questionId: "next", answer: "sell more" });
    expect(thin.complete).toBe(false);
    expect(thin.followUp?.id).toBe("followup-next");
    const filled = answerAsk({
      sessionId: session.id,
      questionId: thin.followUp!.id,
      answer: "Call ten named dealer principals before I open the codebase.",
    });
    expect(filled.complete).toBe(true);
    expect(isAnswered(filled.session.questions[0]!)).toBe(true);
  });

  it("records multi-select struggles", () => {
    const session = askUser({
      tool: "custom",
      reason: "chips",
      questions: [
        {
          id: "struggles",
          prompt: "Which?",
          why: "chips",
          kind: "multi",
          required: true,
          options: [
            { id: "build_trap", label: "Building instead of selling" },
            { id: "cash", label: "Cash" },
          ],
        },
      ],
    });
    const result = answerAsk({
      sessionId: session.id,
      questionId: "struggles",
      selected: ["build_trap"],
    });
    expect(result.complete).toBe(true);
    expect(result.question.selected).toEqual(["build_trap"]);
  });
});
