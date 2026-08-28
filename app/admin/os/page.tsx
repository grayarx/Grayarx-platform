"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Module = {
  id: string;
  name: string;
  job: string;
  status: string;
  beats: string[];
};

type Package = {
  id: string;
  name: string;
  priceLabel: string;
  target: string;
  headline: string;
  vsMarket: string;
  includes: string[];
};

type OsState = {
  modules: Module[];
  packages: Package[];
  parts: Array<{ id: string; sku: string; name: string; price: number; qty: number }>;
  partsEnquiries: Array<{ id: string; buyerName: string; status: string; nalaReply: string }>;
  serviceBookings: Array<{ id: string; buyerName: string; serviceType: string; scheduledAt: string }>;
  tradeIns: Array<{ id: string; buyerName: string; make: string; model: string; status: string }>;
  pricingStrategy: {
    principle: string;
    whyNotCheaper: string;
    grayArx: Array<{ plan: string; price: string; why: string }>;
  };
};

export default function OsCommandCenterPage() {
  const [data, setData] = useState<OsState | null>(null);
  const [buyerName, setBuyerName] = useState("Thandi Nkosi");
  const [buyerPhone, setBuyerPhone] = useState("+27 82 555 0199");
  const [message, setMessage] = useState("Do you have brake pads for a Hilux?");
  const [holdPart, setHoldPart] = useState(true);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/os");
    const json = (await res.json()) as OsState;
    setData(json);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName, buyerPhone, message, holdPart }),
      });
      const json = (await res.json()) as {
        result?: { intent: string; reply: string };
        error?: string;
      };
      if (!res.ok || !json.result) {
        setError(json.error ?? "Failed");
        return;
      }
      setLastIntent(json.result.intent);
      setLastReply(json.result.reply);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const presets = [
    { label: "Parts", text: "Do you have brake pads for a Hilux?" },
    { label: "Service", text: "Book a minor service for my Polo next week" },
    { label: "Trade-in", text: "Trade-in my 2019 Polo with 78000 km, good condition" },
    { label: "Sales", text: "Is the Hilux still available on AutoTrader?" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f0e] text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
              GrayArx Dealership OS
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              One OS. Sales, parts, service, trade-in.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {data?.pricingStrategy.principle ??
                "AI-native operating system for the yard — not a bolt-on chatbot."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/pricing"
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white"
            >
              Pricing matrix
            </Link>
            <Link
              href="/admin/competitors"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Battlecards
            </Link>
            <Link
              href="/admin/conversion"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Sales engine
            </Link>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.modules ?? [])
            .filter((m) =>
              ["sales_conversion", "parts", "service", "trade_in"].includes(m.id),
            )
            .map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white">{m.name}</h2>
                  <span className="text-[10px] uppercase tracking-wide text-emerald-400">
                    {m.status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{m.job}</p>
              </div>
            ))}
        </section>

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <h2 className="text-sm font-semibold text-white">Nala OS router</h2>
          <p className="mt-1 text-xs text-zinc-500">
            One message → sales, parts, service, or trade-in. Presets:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setMessage(p.text)}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              placeholder="Buyer name"
            />
            <input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              placeholder="Phone"
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
          <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={holdPart}
              onChange={(e) => setHoldPart(e.target.checked)}
            />
            Hold matched part on counter (parts intent)
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void send()}
            className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Routing…" : "Run through OS"}
          </button>
          {error ? <p className="mt-2 text-sm text-amber-400">{error}</p> : null}
          {lastReply ? (
            <div className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3">
              <p className="text-xs uppercase tracking-wide text-emerald-400">
                Intent: {lastIntent}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-100">
                {lastReply}
              </p>
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-white">Parts counter</h2>
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              {(data?.parts ?? []).map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>
                    {p.name}{" "}
                    <span className="text-zinc-600">({p.sku})</span>
                  </span>
                  <span className="text-zinc-200">
                    R{p.price} · qty {p.qty}
                  </span>
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-xs font-semibold uppercase text-zinc-500">
              Recent quotes
            </h3>
            <ul className="mt-2 space-y-2 text-xs text-zinc-400">
              {(data?.partsEnquiries ?? []).slice(0, 5).map((e) => (
                <li key={e.id}>
                  {e.buyerName} — {e.status}
                </li>
              ))}
              {(data?.partsEnquiries ?? []).length === 0 ? (
                <li>No parts enquiries yet.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-white">Service diary</h2>
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              {(data?.serviceBookings ?? []).slice(0, 8).map((b) => (
                <li key={b.id}>
                  {b.buyerName} · {b.serviceType.replaceAll("_", " ")} ·{" "}
                  {new Date(b.scheduledAt).toLocaleString("en-ZA", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </li>
              ))}
              {(data?.serviceBookings ?? []).length === 0 ? (
                <li>No service bookings yet.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-white">Trade-in queue</h2>
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              {(data?.tradeIns ?? []).slice(0, 8).map((t) => (
                <li key={t.id}>
                  {t.buyerName} · {t.make} {t.model} · {t.status}
                </li>
              ))}
              {(data?.tradeIns ?? []).length === 0 ? (
                <li>No trade-ins yet.</li>
              ) : null}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-white">
            OS packages (premium)
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {data?.pricingStrategy.whyNotCheaper}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.packages ?? []).map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-white">{p.name}</span>
                  <span className="text-sm text-emerald-400">{p.priceLabel}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">{p.headline}</p>
                <p className="mt-2 text-[11px] text-zinc-600">{p.vsMarket}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-white">Full module map</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Module</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Job</th>
                  <th className="py-2">Beats</th>
                </tr>
              </thead>
              <tbody>
                {(data?.modules ?? []).map((m) => (
                  <tr key={m.id} className="border-t border-zinc-900 text-zinc-300">
                    <td className="py-2 pr-3 font-medium text-white">{m.name}</td>
                    <td className="py-2 pr-3 text-emerald-400">{m.status}</td>
                    <td className="py-2 pr-3 text-xs">{m.job}</td>
                    <td className="py-2 text-xs text-zinc-500">
                      {m.beats.join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
