"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OsState = {
  modules: Array<{ id: string; name: string; job: string; status: string }>;
  packages: Array<{ id: string; name: string; priceLabel: string; headline: string }>;
  parts: Array<{ id: string; sku: string; name: string; price: number; qty: number }>;
  partsEnquiries: Array<{ id: string; buyerName: string; status: string }>;
  serviceBookings: Array<{ id: string; buyerName: string; serviceType: string; scheduledAt: string }>;
  tradeIns: Array<{ id: string; buyerName: string; make: string; model: string; status: string }>;
  finance: Array<{ id: string; buyerName: string; status: string; partnerUrl: string }>;
  branches: Array<{ id: string; name: string; city: string }>;
  whatsappOutbox: Array<{ id: string; to: string; body: string; status: string; channel: string }>;
  emailOutbox: Array<{ id: string; to: string; subject: string; status: string }>;
  crmDeliveries: Array<{ id: string; provider: string; event: string; status: string }>;
  pricingStrategy: { principle: string; whyNotCheaper: string };
  roi: { headline: string; proofLines: string[] };
};

export default function OsCommandCenterPage() {
  const [data, setData] = useState<OsState | null>(null);
  const [buyerName, setBuyerName] = useState("Thandi Nkosi");
  const [buyerPhone, setBuyerPhone] = useState("+27 82 555 0199");
  const [message, setMessage] = useState("Do you have brake pads for a Hilux?");
  const [holdPart, setHoldPart] = useState(true);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/os");
    setData((await res.json()) as OsState);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function pushLog(line: string) {
    setLog((prev) => [line, ...prev].slice(0, 12));
  }

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
        result?: {
          intent: string;
          reply: string;
          delivery?: { whatsapp: { id: string; status: string }; crm: unknown[] };
        };
        error?: string;
      };
      if (!res.ok || !json.result) {
        setError(json.error ?? "Failed");
        return;
      }
      setLastIntent(json.result.intent);
      setLastReply(json.result.reply);
      setLastMeta(
        json.result.delivery
          ? `WhatsApp ${json.result.delivery.whatsapp.status} · CRM events ${json.result.delivery.crm.length}`
          : null,
      );
      pushLog(`OS ${json.result.intent}: WhatsApp delivered`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function pollMarketplace() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "poll", limit: 3 }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        ingested?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Poll failed");
        return;
      }
      pushLog(`Marketplace poll: ingested ${json.ingested} leads + WhatsApp`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function missedCall() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/recovery/missed-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerName: "Lebo Mokoena",
          callerPhone: "+27 82 777 6611",
          vehicleHint: "Polo Vivo",
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        nalaReply?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Recovery failed");
        return;
      }
      setLastIntent("missed_call");
      setLastReply(json.nalaReply ?? null);
      pushLog("Missed call recovered → WhatsApp sent");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function mondayEmail() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/monday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "gm@sandtonmotors.test",
          dealershipName: "Sandton Motors",
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        email?: { subject: string };
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Email failed");
        return;
      }
      pushLog(`Monday email: ${json.email?.subject}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const presets = [
    { label: "Parts", text: "Do you have brake pads for a Hilux?" },
    { label: "Service", text: "Book a minor service for my Polo next week" },
    { label: "Trade-in", text: "Trade-in my 2019 Polo with 78000 km, good condition" },
    { label: "Finance", text: "Can I finance the Hilux on monthly instalment?" },
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
              Working OS — every path delivers
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {data?.pricingStrategy.principle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/showroom/demo-yard" className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white">
              Showroom (parts on)
            </Link>
            <Link href="/showroom/yard-pta" className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
              PTA (parts off)
            </Link>
            <Link href="/admin/pricing" className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
              Pricing
            </Link>
            <Link href="/admin/conversion" className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
              Sales
            </Link>
          </div>
        </header>

        <section className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void pollMarketplace()}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Poll AutoTrader/Cars leads
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void missedCall()}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Simulate missed call
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void mondayEmail()}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Send Monday ROI email
          </button>
        </section>

        {error ? <p className="mb-4 text-sm text-amber-400">{error}</p> : null}

        {data?.roi ? (
          <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
            <h2 className="text-sm font-semibold text-white">Monday proof</h2>
            <p className="mt-2 text-sm text-emerald-300">{data.roi.headline}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-400">
              {data.roi.proofLines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <h2 className="text-sm font-semibold text-white">Nala OS router</h2>
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
            />
            <input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
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
            Hold matched part on counter
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void send()}
            className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Working…" : "Run through OS (WhatsApp + CRM)"}
          </button>
          {lastReply ? (
            <div className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3">
              <p className="text-xs uppercase tracking-wide text-emerald-400">
                Intent: {lastIntent}
                {lastMeta ? ` · ${lastMeta}` : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-100">
                {lastReply}
              </p>
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-white">WhatsApp outbox</h2>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs text-zinc-400">
              {(data?.whatsappOutbox ?? []).map((m) => (
                <li key={m.id} className="border-b border-zinc-900 pb-2">
                  <span className="text-emerald-400">{m.status}</span> → {m.to}{" "}
                  <span className="text-zinc-600">({m.channel})</span>
                  <p className="mt-1 line-clamp-2 text-zinc-300">{m.body}</p>
                </li>
              ))}
              {(data?.whatsappOutbox ?? []).length === 0 ? (
                <li>Empty — run a message or poll marketplace.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-white">CRM deliveries</h2>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs text-zinc-400">
              {(data?.crmDeliveries ?? []).map((d) => (
                <li key={d.id}>
                  <span className="text-zinc-200">{d.provider}</span> · {d.event} ·{" "}
                  {d.status}
                </li>
              ))}
              {(data?.crmDeliveries ?? []).length === 0 ? (
                <li>Empty — OS actions push MotorX mock webhooks.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-white">Parts · Service · Trade-in · Finance</h2>
            <div className="mt-3 grid gap-3 text-xs text-zinc-400 sm:grid-cols-2">
              <div>
                <p className="font-medium text-zinc-200">Parts stock</p>
                <ul className="mt-1 space-y-1">
                  {(data?.parts ?? []).map((p) => (
                    <li key={p.id}>
                      {p.name} — R{p.price} · qty {p.qty}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-zinc-200">Service</p>
                <ul className="mt-1 space-y-1">
                  {(data?.serviceBookings ?? []).slice(0, 5).map((b) => (
                    <li key={b.id}>
                      {b.buyerName} · {b.serviceType.replaceAll("_", " ")}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-medium text-zinc-200">Trade-ins</p>
                <ul className="mt-1 space-y-1">
                  {(data?.tradeIns ?? []).slice(0, 4).map((t) => (
                    <li key={t.id}>
                      {t.make} {t.model} · {t.status}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-medium text-zinc-200">Finance</p>
                <ul className="mt-1 space-y-1">
                  {(data?.finance ?? []).slice(0, 4).map((f) => (
                    <li key={f.id}>
                      {f.buyerName} · {f.status}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-white">Branches</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {(data?.branches ?? []).map((b) => (
                <li key={b.id}>
                  {b.name} — {b.city}{" "}
                  <span className="text-xs text-zinc-600">({b.id})</span>
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-xs font-semibold uppercase text-zinc-500">
              Activity log
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-zinc-500">
              {log.map((l) => (
                <li key={l}>{l}</li>
              ))}
              {log.length === 0 ? <li>Actions appear here.</li> : null}
            </ul>
            <h3 className="mt-4 text-xs font-semibold uppercase text-zinc-500">
              Email outbox
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-zinc-400">
              {(data?.emailOutbox ?? []).map((e) => (
                <li key={e.id}>
                  {e.status}: {e.subject} → {e.to}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-white">Module status</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.modules ?? []).map((m) => (
              <div key={m.id} className="rounded-lg border border-zinc-900 p-3 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-white">{m.name}</span>
                  <span className="text-emerald-400">{m.status}</span>
                </div>
                <p className="mt-1 text-zinc-500">{m.job}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
