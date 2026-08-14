import { useState } from "react";
import { api, type Bootstrap, type InterviewAnswer, type Struggle } from "../api";

export default function Interview({ data, onSaved }: { data: Bootstrap; onSaved: () => void }) {
  const [interview, setInterview] = useState<InterviewAnswer[]>(data.interview);
  const [struggles, setStruggles] = useState<Struggle[]>(data.struggles);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = interview[step];

  function toggle(tag: Struggle) {
    setStruggles((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api.saveInterview(interview, struggles);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <p className="kicker">Interview {step + 1} / {interview.length}</p>
        <h1>Where would learning change the next two weeks?</h1>
        {current && (
          <>
            <h2>{current.question}</h2>
            <textarea
              rows={7}
              value={current.answer}
              onChange={(e) => {
                const next = interview.map((item) =>
                  item.id === current.id ? { ...item, answer: e.target.value } : item,
                );
                setInterview(next);
              }}
            />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
                Back
              </button>
              {step < interview.length - 1 ? (
                <button className="btn" onClick={() => setStep(step + 1)}>
                  Next
                </button>
              ) : (
                <button className="btn" disabled={busy} onClick={save}>
                  {busy ? "Building curriculum…" : "Build my curriculum"}
                </button>
              )}
            </div>
            {error && <p className="error">{error}</p>}
          </>
        )}
      </section>
      <aside className="card">
        <p className="kicker">Bottlenecks</p>
        <p>Mark only what is true this month. Popular topics stay off the list unless they earn a chip.</p>
        <div className="chips">
          {Object.entries(data.struggleLabels).map(([tag, label]) => (
            <button
              key={tag}
              className={struggles.includes(tag as Struggle) ? "chip on" : "chip"}
              onClick={() => toggle(tag as Struggle)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
