import { useState } from "react";
import type { AskQuestion, AskSession } from "../api";

export default function AskUserCard({
  session,
  question,
  remaining,
  total,
  busy,
  error,
  onAnswer,
}: {
  session: AskSession;
  question: AskQuestion;
  remaining: number;
  total: number;
  busy?: boolean;
  error?: string;
  onAnswer: (input: { answer?: string; selected?: string[] }) => void;
}) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>(question.selected ?? []);

  function toggle(id: string) {
    if (question.kind === "single") {
      setSelected([id]);
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function submit() {
    if (question.kind === "text") onAnswer({ answer: text });
    else onAnswer({ selected });
  }

  return (
    <section className="card">
      <p className="kicker">Ask User · {session.tool} · {total - remaining + 1} / {total}</p>
      <h1>{question.prompt}</h1>
      <p className="muted">{question.why}</p>
      <p className="muted">{session.reason}</p>
      {question.kind === "text" ? (
        <textarea
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your words. A person, a number, or a Tuesday action."
        />
      ) : (
        <div className="chips" style={{ marginTop: 12 }}>
          {(question.options ?? []).map((option) => (
            <button
              key={option.id}
              type="button"
              className={selected.includes(option.id) ? "chip on" : "chip"}
              onClick={() => toggle(option.id)}
            >
              <strong>{option.label}</strong>
              {option.description ? <div className="muted">{option.description}</div> : null}
            </button>
          ))}
        </div>
      )}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" disabled={busy} onClick={submit}>
          {busy ? "Saving…" : remaining <= 1 ? "Answer and continue" : "Answer"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
