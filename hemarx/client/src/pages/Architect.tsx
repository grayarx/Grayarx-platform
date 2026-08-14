import { useState } from "react";
import { api, type BookOutline } from "../api";

export default function Architect() {
  const [person, setPerson] = useState("Paul Graham");
  const [outline, setOutline] = useState<BookOutline | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const result = await api.architect(person);
      setOutline(result.outline);
      setMarkdown(result.markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${person.replace(/\s+/g, "-").toLowerCase()}-book-outline.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <section className="card">
        <p className="kicker">Book architect</p>
        <h1>Build a book from a public body of work</h1>
        <p className="muted">
          Wikipedia, Wikiquote, and official pages only. No invented quotes. Thin quote pools are labelled, not padded with fiction.
        </p>
        <div className="row">
            <input type="text" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Paul Graham" />
          <button className="btn" disabled={busy} onClick={run}>
            {busy ? "Researching…" : "Research and outline"}
          </button>
          {markdown && (
            <button className="btn secondary" onClick={download}>
              Download markdown
            </button>
          )}
        </div>
        {error && <p className="error">{error}</p>}
      </section>
      {outline && (
        <section className="card" style={{ marginTop: 18 }}>
          <p className="kicker">
            {outline.person} · {outline.wordCount} words · {outline.chapters.length} chapters
          </p>
          <SectionBlock label="Introduction" section={outline.introduction} />
          {outline.chapters.map((chapter, i) => (
            <SectionBlock key={chapter.title} label={`Chapter ${i + 1}`} section={chapter} />
          ))}
          <h3>Sources</h3>
          <ul className="list">
            {outline.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
          <h3>Caveats</h3>
          <ul className="list">
            {outline.caveats.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SectionBlock({
  label,
  section,
}: {
  label: string;
  section: { title: string; coreFocus: string; openingStory: string; bigIdeas: string[]; quotes: { text: string; source: string; verified: boolean }[] };
}) {
  return (
    <article style={{ padding: "18px 0", borderBottom: "1px solid var(--rule)" }}>
      <h2>
        {label}: {section.title}
      </h2>
      <p>
        <strong>Core focus.</strong> {section.coreFocus}
      </p>
      <p>
        <strong>Opening story.</strong> {section.openingStory}
      </p>
      <h3>5 Big Ideas</h3>
      <ol>
        {section.bigIdeas.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ol>
      <h3>5 Quotes / Aphorisms</h3>
      {section.quotes.map((quote) => (
        <p className="quote" key={quote.text}>
          “{quote.text}” — {quote.source} {quote.verified ? "(verified)" : "(not verbatim)"}
        </p>
      ))}
    </article>
  );
}
