import { useState } from "react";
import { api, type Bootstrap, type DailyBrief } from "../api";

export default function Brief({ data, onUpdate }: { data: Bootstrap; onUpdate: () => void }) {
  const [brief, setBrief] = useState<DailyBrief | null>(data.latestBrief);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pull(force = false) {
    setBusy(true);
    setError("");
    try {
      const next = await api.brief(force);
      setBrief(next);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <p className="kicker">Ten minutes</p>
        <h1>{brief?.headline ?? "Morning brief"}</h1>
        <p className="muted">
          Only what maps to the curriculum. No repeats. No clickbait. X and Instagram are listed as follows; the scrape uses public feeds.
        </p>
        <div className="row">
          <button className="btn" disabled={busy} onClick={() => pull(false)}>
            {busy ? "Pulling…" : "Pull this morning"}
          </button>
          <button className="btn secondary" disabled={busy} onClick={() => pull(true)}>
            Rebuild
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        {brief?.items.map((item) => (
          <article className="brief-item" key={item.url}>
            <p className="meta">
              {item.sourceName} · {item.kind}
            </p>
            <h3>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            </h3>
            <p>{item.summary}</p>
            <p className="muted">{item.whyNow}</p>
          </article>
        ))}
        {brief && brief.items.length === 0 && (
          <p>Feeds were quiet or off-topic. Protect the calling block anyway.</p>
        )}
      </section>
      <aside className="card">
        <p className="kicker">Sources</p>
        <h2>What gets pulled</h2>
        <ul className="list">
          {data.sources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
              </a>{" "}
              <span className="muted">({source.kind}{source.rss ? "" : ", follow only"})</span>
              <div className="muted">{source.why}</div>
            </li>
          ))}
        </ul>
        {brief && brief.skipped.length > 0 && (
          <>
            <h3>Cut this morning</h3>
            <ul className="list muted">
              {brief.skipped.slice(0, 12).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
