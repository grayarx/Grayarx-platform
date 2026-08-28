"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Summary = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  pricing: { public: string; confidence: string; notes?: string };
  sameAsGrayArx: string;
  oneLiner: string;
};

type Card = {
  competitor: {
    id: string;
    name: string;
    categoryLabel: string;
    website?: string;
    sells: string[];
    pricing: { public: string; confidence: string; notes?: string };
    strengths: string[];
    gaps: string[];
    coexistence: string;
    oneLiner: string;
    talkTrack: string;
    sayNever: string;
    categories: Array<{
      category: string;
      they: string;
      we: string;
      beat: string;
    }>;
    productLessons: string[];
  };
  spokenReply: string;
  nextStep: string;
  beatBullets: string[];
  pricingContrast: string;
};

type Meta = {
  packages: Array<{
    id: string;
    name: string;
    price: string;
    target: string;
    includes: string[];
  }>;
  priceBands: Array<{ band: string; range: string; examples: string }>;
  beatRoadmap: Array<{ phase: string; items: string[] }>;
};

export default function CompetitorsPage() {
  const [list, setList] = useState<Summary[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [selectedId, setSelectedId] = useState("motorx");
  const [card, setCard] = useState<Card | null>(null);
  const [query, setQuery] = useState("We're already using MotorX");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const loadList = useCallback(async () => {
    const res = await fetch("/api/competitors");
    const data = (await res.json()) as Meta & { competitors: Summary[] };
    setList(data.competitors);
    setMeta({
      packages: data.packages,
      priceBands: data.priceBands,
      beatRoadmap: data.beatRoadmap,
    });
  }, []);

  const loadCard = useCallback(async (id: string) => {
    setError(null);
    const res = await fetch(`/api/competitors?id=${encodeURIComponent(id)}`);
    const data = (await res.json()) as { card?: Card; error?: string };
    if (!res.ok || !data.card) {
      setError(data.error ?? "Failed to load battlecard");
      return;
    }
    setCard(data.card);
    setSelectedId(id);
  }, []);

  useEffect(() => {
    void loadList().then(() => loadCard("motorx"));
  }, [loadList, loadCard]);

  const filtered = useMemo(() => {
    if (filter === "all") return list;
    return list.filter((c) => c.category === filter);
  }, [list, filter]);

  const categories = useMemo(() => {
    const set = new Set(list.map((c) => c.category));
    return ["all", ...[...set].sort()];
  }, [list]);

  async function lookupQuery() {
    setError(null);
    const res = await fetch(
      `/api/competitors?q=${encodeURIComponent(query)}`,
    );
    const data = (await res.json()) as { card?: Card; error?: string };
    if (!res.ok || !data.card) {
      setError(data.error ?? "No match");
      return;
    }
    setCard(data.card);
    setSelectedId(data.card.competitor.id);
  }

  return (
    <div className="min-h-screen bg-[#0c1110] text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
              Sales desk · competitive intel
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Why GrayArx — not just another MotorX
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              What each competitor sells, what they charge (public or estimated),
              and the exact talk track when a dealer names them. Never trash —
              sell the conversion layer beside their stack.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/conversion"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Conversion
            </Link>
            <Link
              href="/admin/prospector"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Prospector
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Dealer said…
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              placeholder="We're already on MotorX / DealershipIQ / Visio…"
            />
            <button
              type="button"
              onClick={() => void lookupQuery()}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Pull battlecard
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-amber-400">{error}</p>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-zinc-800 p-2">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void loadCard(c.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      selectedId === c.id
                        ? "bg-emerald-950 text-emerald-200"
                        : "text-zinc-300 hover:bg-zinc-900"
                    }`}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {c.categoryLabel}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-6">
            {card ? (
              <>
                <section className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-5">
                  <p className="text-xs uppercase tracking-wide text-emerald-400">
                    Say this
                  </p>
                  <p className="mt-2 text-base leading-7 text-zinc-100">
                    {card.spokenReply}
                  </p>
                  <p className="mt-3 text-sm text-zinc-400">{card.competitor.oneLiner}</p>
                  {card.competitor.sayNever ? (
                    <p className="mt-3 text-sm text-rose-300">
                      Never say: “{card.competitor.sayNever}”
                    </p>
                  ) : null}
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 p-4">
                    <h2 className="text-sm font-semibold text-white">
                      What they sell
                    </h2>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                      {card.competitor.sells.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-zinc-800 p-4">
                    <h2 className="text-sm font-semibold text-white">Pricing</h2>
                    <p className="mt-3 text-sm text-zinc-200">
                      {card.competitor.pricing.public}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Confidence: {card.competitor.pricing.confidence}
                      {card.competitor.pricing.notes
                        ? ` · ${card.competitor.pricing.notes}`
                        : ""}
                    </p>
                    <p className="mt-3 text-sm text-emerald-300">
                      {card.pricingContrast}
                    </p>
                  </div>
                </section>

                {card.competitor.categories.length > 0 ? (
                  <section className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                        <tr>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">They</th>
                          <th className="px-4 py-3">GrayArx</th>
                          <th className="px-4 py-3">How we beat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {card.competitor.categories.map((row) => (
                          <tr
                            key={row.category}
                            className="border-b border-zinc-900 text-zinc-300"
                          >
                            <td className="px-4 py-3 font-medium text-white">
                              {row.category}
                            </td>
                            <td className="px-4 py-3">{row.they}</td>
                            <td className="px-4 py-3">{row.we}</td>
                            <td className="px-4 py-3 text-emerald-300">
                              {row.beat}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                ) : null}

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 p-4">
                    <h2 className="text-sm font-semibold text-white">
                      Their strengths
                    </h2>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                      {card.competitor.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-zinc-800 p-4">
                    <h2 className="text-sm font-semibold text-white">
                      Gaps we exploit
                    </h2>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                      {card.competitor.gaps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </section>

                {card.competitor.productLessons.length > 0 ? (
                  <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
                    <h2 className="text-sm font-semibold text-amber-200">
                      Build this to stay ahead
                    </h2>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100/80">
                      {card.competitor.productLessons.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-zinc-500">Loading battlecard…</p>
            )}

            {meta ? (
              <>
                <section className="rounded-xl border border-zinc-800 p-4">
                  <h2 className="text-sm font-semibold text-white">
                    GrayArx packages (price to beat)
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {meta.packages.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium text-white">{p.name}</span>
                          <span className="text-sm text-emerald-400">{p.price}</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{p.target}</p>
                        <ul className="mt-2 list-disc pl-4 text-xs text-zinc-400">
                          {p.includes.map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-800 p-4">
                  <h2 className="text-sm font-semibold text-white">
                    Market price bands
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                    {meta.priceBands.map((b) => (
                      <li key={b.band}>
                        <span className="text-zinc-200">{b.band}</span> — {b.range}{" "}
                        <span className="text-zinc-600">({b.examples})</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-xl border border-zinc-800 p-4">
                  <h2 className="text-sm font-semibold text-white">
                    Roadmap to win every category
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {meta.beatRoadmap.map((phase) => (
                      <div key={phase.phase}>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                          {phase.phase}
                        </h3>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-400">
                          {phase.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
