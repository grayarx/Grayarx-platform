"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Vehicle = {
  id: string;
  stockNumber: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  colour: string;
  status: string;
};

type Lead = {
  id: string;
  source: string;
  buyerName: string;
  buyerPhone: string;
  message: string;
  status: string;
  nalaReply?: string;
  recoveredAfterHours: boolean;
  viewingAt?: string;
  vehicleId?: string;
};

type Roi = {
  headline: string;
  proofLines: string[];
  totals: Record<string, number>;
  conversionRate: number;
  afterHoursShare: number;
  bySource: Record<string, number>;
};

type Pilot = {
  dealershipName: string;
  status: string;
  endsAt: string;
  goals: string[];
  checklist: Array<{ id: string; label: string; done: boolean }>;
};

export default function ConversionOpsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stock, setStock] = useState<Vehicle[]>([]);
  const [roi, setRoi] = useState<Roi | null>(null);
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastReply, setLastReply] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState("Sipho Dlamini");
  const [buyerPhone, setBuyerPhone] = useState("+27 82 123 4567");
  const [message, setMessage] = useState(
    "Hi, is the Polo Vivo still available on AutoTrader?",
  );
  const [source, setSource] = useState("autotrader");

  const refresh = useCallback(async () => {
    const [leadsRes, stockRes, roiRes, pilotRes] = await Promise.all([
      fetch("/api/conversion/leads"),
      fetch("/api/conversion/stock"),
      fetch("/api/conversion/roi"),
      fetch("/api/conversion/pilot"),
    ]);
    const leadsJson = (await leadsRes.json()) as { leads: Lead[] };
    const stockJson = (await stockRes.json()) as { vehicles: Vehicle[] };
    const roiJson = (await roiRes.json()) as Roi;
    const pilotJson = (await pilotRes.json()) as { pilot: Pilot | null };
    setLeads(leadsJson.leads);
    setStock(stockJson.vehicles);
    setRoi(roiJson);
    setPilot(pilotJson.pilot);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function ingest() {
    setBusy(true);
    setError(null);
    setLastReply(null);
    try {
      const response = await fetch("/api/conversion/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName, buyerPhone, message, source }),
      });
      const data = (await response.json()) as {
        error?: string;
        nalaReply?: string;
        lead?: Lead;
      };
      if (!response.ok) {
        setError(data.error ?? "Failed to ingest lead");
        return;
      }
      setLastReply(data.nalaReply ?? null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function book(leadId: string) {
    setBusy(true);
    setError(null);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const response = await fetch("/api/conversion/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          viewingAt: tomorrow.toISOString(),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Booking failed");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function markSold(vehicleId: string) {
    setBusy(true);
    try {
      await fetch("/api/conversion/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_sold", vehicleId }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function startPilot() {
    setBusy(true);
    try {
      const response = await fetch("/api/conversion/pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          dealershipName: "Demo Yard",
        }),
      });
      const data = (await response.json()) as { pilot: Pilot };
      setPilot(data.pilot);
    } finally {
      setBusy(false);
    }
  }

  async function toggleChecklist(itemId: string, done: boolean) {
    const response = await fetch("/api/conversion/pilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checklist", itemId, done }),
    });
    const data = (await response.json()) as { pilot?: Pilot; error?: string };
    if (data.pilot) setPilot(data.pilot);
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
              Beat MotorX / DealershipIQ / Trinstel
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Conversion engine
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Marketplace lead → Nala answers from live stock → viewing booked →
              Monday ROI. Every action below is real and persisted — no fake
              buttons.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/os"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              OS
            </Link>
            <Link
              href="/admin/pricing"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Pricing
            </Link>
            <Link
              href="/admin/competitors"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Competitors
            </Link>
            <Link
              href="/admin/prospector"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Prospector
            </Link>
            <Link
              href="/"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Scripts
            </Link>
          </div>
        </header>

        {error ? (
          <p className="mb-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {roi ? (
          <section className="mb-6 rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-5">
            <h2 className="text-lg font-semibold text-emerald-200">
              Monday ROI report
            </h2>
            <p className="mt-2 text-base text-white">{roi.headline}</p>
            <ul className="mt-3 space-y-1 text-sm text-emerald-100/90">
              {roi.proofLines.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-emerald-300/70">
              Lead→viewing {roi.conversionRate}% · After-hours share{" "}
              {roi.afterHoursShare}%
            </p>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="font-semibold text-white">
              1 · Ingest lead (AutoTrader / Cars / missed call)
            </h2>
            <div className="mt-4 space-y-3">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm"
              >
                <option value="autotrader">AutoTrader</option>
                <option value="cars_co_za">Cars.co.za</option>
                <option value="website">Website</option>
                <option value="missed_call">Missed call</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm"
                placeholder="Buyer name"
              />
              <input
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm"
                placeholder="Phone"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void ingest()}
                className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
              >
                Run Nala reply (&lt;60s)
              </button>
            </div>
            {lastReply ? (
              <blockquote className="mt-4 border-l-2 border-emerald-500 pl-4 text-sm leading-6 text-emerald-100">
                {lastReply}
              </blockquote>
            ) : null}
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="font-semibold text-white">2 · Live stock</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Sold cars drop out of Nala answers immediately.
            </p>
            <ul className="mt-4 space-y-3">
              {stock.map((v) => (
                <li
                  key={v.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-zinc-100">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {v.stockNumber} · R{v.price.toLocaleString("en-ZA")} ·{" "}
                      {v.status}
                    </p>
                  </div>
                  {v.status === "available" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void markSold(v.id)}
                      className="shrink-0 text-xs text-amber-300 hover:underline"
                    >
                      Mark sold
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="font-semibold text-white">3 · Leads & bookings</h2>
          {leads.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              No leads yet — ingest one above.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {leads.map((lead) => (
                <li
                  key={lead.id}
                  className="rounded-lg border border-zinc-800 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {lead.buyerName} · {lead.source}
                      {lead.recoveredAfterHours ? " · after-hours" : ""}
                    </p>
                    <span className="text-xs uppercase tracking-wide text-emerald-400">
                      {lead.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{lead.message}</p>
                  {lead.nalaReply ? (
                    <p className="mt-2 text-sm text-zinc-300">{lead.nalaReply}</p>
                  ) : null}
                  {lead.status === "answered" && lead.vehicleId ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void book(lead.id)}
                      className="mt-3 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black"
                    >
                      Book viewing (tomorrow 10:00)
                    </button>
                  ) : null}
                  {lead.viewingAt ? (
                    <p className="mt-2 text-xs text-emerald-300">
                      Viewing: {new Date(lead.viewingAt).toLocaleString()}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="font-semibold text-white">4 · 14-day parallel pilot</h2>
          {!pilot ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void startPilot()}
              className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black"
            >
              Start free pilot
            </button>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-zinc-300">
                {pilot.dealershipName} · {pilot.status} · ends{" "}
                {new Date(pilot.endsAt).toLocaleDateString()}
              </p>
              <ul className="mt-3 space-y-2">
                {pilot.checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) =>
                        void toggleChecklist(item.id, e.target.checked)
                      }
                    />
                    <span
                      className={
                        item.done ? "text-zinc-500 line-through" : "text-zinc-200"
                      }
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
