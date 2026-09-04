import { useState } from "react";
import { api, type MirrorGrade } from "../api";

export default function Mirror() {
  const [material, setMaterial] = useState("");
  const [explanation, setExplanation] = useState("");
  const [grade, setGrade] = useState<MirrorGrade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      setGrade(await api.mirror(material, explanation));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <p className="kicker">Mirror test</p>
        <h1>Grade the explanation against the material</h1>
        <div className="split">
          <label>
            Material
            <textarea rows={12} value={material} onChange={(e) => setMaterial(e.target.value)} />
          </label>
          <label>
            Your explanation
            <textarea rows={12} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </label>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" disabled={busy} onClick={run}>
            {busy ? "Grading…" : "Grade me"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>
      <aside className="card">
        {grade ? (
          <>
            <p className="score">
              {grade.letter} <span style={{ fontSize: 22 }}>{grade.score}</span>
            </p>
            <p>{grade.summary}</p>
            {grade.issues.map((issue) => (
              <div className="issue" key={issue.excerpt}>
                <span className={`badge ${issue.kind}`}>{issue.kind}</span>
                <p>{issue.excerpt}</p>
                <p className="muted">{issue.note}</p>
                {issue.materialAnchor && <p className="quote">{issue.materialAnchor}</p>}
              </div>
            ))}
            <h3>Stronger version</h3>
            <p>{grade.strongerVersion}</p>
          </>
        ) : (
          <p className="muted">Vague, wrong, or unclear — named, with the line from the source.</p>
        )}
      </aside>
    </div>
  );
}
