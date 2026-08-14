import type { Bootstrap } from "../api";

export default function Curriculum({ data }: { data: Bootstrap }) {
  if (!data.interviewComplete) {
    return (
      <section className="card">
        <p className="kicker">Spreadsheet</p>
        <h1>Blocked until you answer.</h1>
        <p>Ask User has to finish first. No assumed curriculum.</p>
        <a className="btn" href="/ask">
          Open Ask User
        </a>
      </section>
    );
  }
  return (
    <section className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="kicker">Spreadsheet</p>
          <h1>Just-in-time resources</h1>
          <p className="muted">Not bestsellers. Matches the interview. Apply this week or drop it.</p>
        </div>
        <a className="btn" href="/api/curriculum.csv">
          Download CSV
        </a>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Format</th>
              <th>Link</th>
              <th>Why this, for you</th>
            </tr>
          </thead>
          <tbody>
            {data.curriculum.map((row) => (
              <tr key={row.link + row.resource}>
                <td>{row.resource}</td>
                <td>{row.format}</td>
                <td>
                  <a href={row.link} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </td>
                <td>{row.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
