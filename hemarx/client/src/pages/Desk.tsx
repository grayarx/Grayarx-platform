import { Link } from "wouter";
import type { Bootstrap } from "../api";

export default function Desk({ data }: { data: Bootstrap }) {
  const next = data.curriculum[0];
  const brief = data.latestBrief;
  const waiting = Boolean(data.pendingAsk?.question) || !data.interviewComplete;
  return (
    <div className="grid">
      <section className="card">
        <p className="kicker">This week</p>
        {waiting ? (
          <>
            <h1>The studio is waiting on you.</h1>
            <p>
              Ask User is the interview. I will not invent a curriculum from assumed answers. One question at a time, until there is a Tuesday action.
            </p>
            <p className="muted">{data.learner.rule}</p>
            <Link href="/ask" className="btn">
              Answer the next question
            </Link>
          </>
        ) : (
          <>
            <h1>The desk is for the problem that is costing you a close.</h1>
            <p>{data.learner.posture}</p>
            <p className="muted">{data.learner.rule}</p>
            {next && (
              <>
                <h2>Start here</h2>
                <p>
                  <a href={next.link} target="_blank" rel="noreferrer">
                    {next.resource}
                  </a>
                </p>
                <p>{next.why}</p>
              </>
            )}
            <div className="row">
              <Link href="/ask" className="btn">
                Re-ask
              </Link>
              <Link href="/curriculum" className="btn secondary">
                Open the spreadsheet
              </Link>
            </div>
          </>
        )}
      </section>
      <aside className="card">
        <p className="kicker">Coffee</p>
        <h2>{brief ? brief.headline : waiting ? "Brief waits on the interview" : "No brief yet this morning"}</h2>
        <p className="muted">
          {brief
            ? `${brief.items.length} items · ~${brief.readMinutes} min`
            : "Pull the sources that match what you are actually learning."}
        </p>
        <Link href="/brief" className="btn">
          {brief ? "Read the brief" : "Build this morning’s brief"}
        </Link>
      </aside>
    </div>
  );
}
