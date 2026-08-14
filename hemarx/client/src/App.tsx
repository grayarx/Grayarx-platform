import { Link, Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { api, type Bootstrap } from "./api";
import Architect from "./pages/Architect";
import Ask from "./pages/Ask";
import Brief from "./pages/Brief";
import Curriculum from "./pages/Curriculum";
import Desk from "./pages/Desk";
import Mirror from "./pages/Mirror";

const LINKS = [
  ["/", "Desk"],
  ["/ask", "Ask"],
  ["/curriculum", "Curriculum"],
  ["/brief", "Brief"],
  ["/mirror", "Mirror"],
  ["/architect", "Architect"],
] as const;

export default function App() {
  const [location] = useLocation();
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    try {
      setData(await api.bootstrap());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="shell">
      <header className="top">
        <div>
          <p className="brand">
            Hemarx <span>Study</span>
          </p>
          <p className="tag">Just-in-time. Apply this week. Private.</p>
        </div>
        <nav>
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={location === href ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      {error && <p className="error">{error}</p>}
      {!data ? (
        <p className="muted">Opening the desk…</p>
      ) : (
        <Switch>
          <Route path="/">
            <Desk data={data} />
          </Route>
          <Route path="/ask">
            <Ask onSaved={reload} />
          </Route>
          <Route path="/interview">
            <Ask onSaved={reload} />
          </Route>
          <Route path="/curriculum">
            <Curriculum data={data} />
          </Route>
          <Route path="/brief">
            <Brief data={data} onUpdate={reload} />
          </Route>
          <Route path="/mirror">
            <Mirror />
          </Route>
          <Route path="/architect">
            <Architect />
          </Route>
        </Switch>
      )}
    </div>
  );
}
