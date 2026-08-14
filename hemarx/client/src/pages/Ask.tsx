import { useEffect, useState } from "react";
import { Link } from "wouter";
import AskUserCard from "../AskUserCard";
import { api, type AskPending } from "../api";

export default function Ask({ onSaved }: { onSaved: () => void }) {
  const [pending, setPending] = useState<AskPending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function load() {
    const started = await api.startAsk("curriculum");
    setPending(started);
    setDone(!started.question);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  async function answer(input: { answer?: string; selected?: string[] }) {
    if (!pending?.session || !pending.question) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.answerAsk({
        sessionId: pending.session.id,
        questionId: pending.question.id,
        ...input,
      });
      setPending(result.pending);
      if (result.complete || !result.pending.question) {
        setDone(true);
        onSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (done && !pending?.question) {
    return (
      <section className="card">
        <p className="kicker">Ask User</p>
        <h1>The studio has what it needs.</h1>
        <p>Curriculum is built from your answers, not from guesses.</p>
        <Link href="/curriculum" className="btn">
          Open the spreadsheet
        </Link>
      </section>
    );
  }

  if (!pending?.session || !pending.question) {
    return <p className="muted">Loading the next question…</p>;
  }

  return (
    <AskUserCard
      key={pending.question.id}
      session={pending.session}
      question={pending.question}
      remaining={pending.remaining}
      total={pending.total}
      busy={busy}
      error={error}
      onAnswer={answer}
    />
  );
}
