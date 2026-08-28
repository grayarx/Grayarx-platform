"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ValueReport = {
  oneLiner: string;
  headlines: string[];
  dealerPitch: string[];
  monthly: {
    salesLost: number;
    gpLostZar: number;
    grayArxCostZar: number;
    netKeptZar: number;
    roiMultiple: number;
  };
  annual: { gpLostZar: number; netKeptZar: number };
  weekly: { totalLeadsAtRisk: number };
  inputs: {
    weeklyEnquiries: number;
    afterHoursShare: number;
    avgGrossProfitZar: number;
    weeklyMissedCalls: number;
    grayArxMonthlyZar: number;
  };
};

type PilotMoney = {
  estimatedGpFromViewingsZar: number;
  afterHoursRecovered: number;
  viewingsBooked: number;
  vsSubscription: string;
};

type Process = {
  id: string;
  name: string;
  moneyHook: string;
  dealerSteps: string[];
  underTheHood: string[];
  easyButton: string;
};

type Onboard = {
  percentComplete: number;
  readyForPilot: boolean;
  steps: Array<{ id: string; title: string; isDone: boolean; dealerDoes: string }>;
};

export default function DealerHomePage() {
  const [value, setValue] = useState<ValueReport | null>(null);
  const [pilotMoney, setPilotMoney] = useState<PilotMoney | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [onboard, setOnboard] = useState<Onboard | null>(null);
  const [weeklyEnquiries, setWeeklyEnquiries] = useState(40);
  const [avgGp, setAvgGp] = useState(18000);
  const [missedCalls, setMissedCalls] = useState(12);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [v, o] = await Promise.all([
      fetch("/api/value").then((r) => r.json()),
      fetch("/api/onboarding?dealershipId=demo-yard").then((r) => r.json()),
    ]);
    setValue(v.value);
    setPilotMoney(v.pilotMoney);
    setProcesses(v.processes);
    setOnboard(o);
    if (v.value?.inputs) {
      setWeeklyEnquiries(v.value.inputs.weeklyEnquiries);
      setAvgGp(v.value.inputs.avgGrossProfitZar);
      setMissedCalls(v.value.inputs.weeklyMissedCalls);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function recalc() {
    setBusy(true);
    try {
      const res = await fetch("/api/value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklyEnquiries,
          avgGrossProfitZar: avgGp,
          weeklyMissedCalls: missedCalls,
        }),
      });
      const json = await res.json();
      setValue(json.value);
      setPilotMoney(json.pilotMoney);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#08110e] text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          GrayArx
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Every night without GrayArx, you leave money on the table.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
          Easy for your team. Serious under the hood. Free pilot on your stock —
          Monday numbers decide.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/dealer/onboard"
            className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white"
          >
            Start 5-step setup
          </Link>
          <Link
            href="/admin/os"
            className="rounded-md border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300"
          >
            Open OS desk
          </Link>
          <Link
            href="/showroom/demo-yard"
            className="rounded-md border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300"
          >
            Buyer showroom
          </Link>
        </div>

        {value ? (
          <section className="mt-10 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-6">
            <p className="text-xs uppercase tracking-wide text-emerald-400">
              Cost of saying no
            </p>
            <p className="mt-3 text-xl font-medium leading-8 text-white sm:text-2xl">
              {value.oneLiner}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">GP at risk / month</p>
                <p className="mt-1 text-2xl text-white">
                  R{value.monthly.gpLostZar.toLocaleString("en-ZA")}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">GrayArx Professional</p>
                <p className="mt-1 text-2xl text-emerald-400">
                  R{value.monthly.grayArxCostZar.toLocaleString("en-ZA")}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">Net kept if recovered</p>
                <p className="mt-1 text-2xl text-white">
                  R{value.monthly.netKeptZar.toLocaleString("en-ZA")}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  ~{value.monthly.roiMultiple}× vs fee
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-zinc-500">
                Weekly online enquiries
                <input
                  type="number"
                  value={weeklyEnquiries}
                  onChange={(e) => setWeeklyEnquiries(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-zinc-500">
                Avg GP per car (R)
                <input
                  type="number"
                  value={avgGp}
                  onChange={(e) => setAvgGp(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-zinc-500">
                Missed calls / week
                <input
                  type="number"
                  value={missedCalls}
                  onChange={(e) => setMissedCalls(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void recalc()}
              className="mt-4 rounded-md border border-emerald-700 px-4 py-2 text-sm text-emerald-300 disabled:opacity-50"
            >
              Recalculate with my numbers
            </button>

            <ul className="mt-6 space-y-2 text-sm text-zinc-400">
              {value.headlines.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
            {pilotMoney ? (
              <p className="mt-4 text-sm text-emerald-300">
                Live pilot: {pilotMoney.viewingsBooked} viewings ·{" "}
                {pilotMoney.afterHoursRecovered} after-hours recovered ·{" "}
                {pilotMoney.vsSubscription}
              </p>
            ) : null}
          </section>
        ) : null}

        {onboard ? (
          <section className="mt-10 rounded-2xl border border-zinc-800 p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Setup progress
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {onboard.percentComplete}% ·{" "}
                  {onboard.readyForPilot
                    ? "Ready to prove value"
                    : "Finish naming + stock"}
                </p>
              </div>
              <Link
                href="/dealer/onboard"
                className="text-sm text-emerald-400 underline"
              >
                Continue setup
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {onboard.steps.map((s) => (
                <li
                  key={s.id}
                  className="flex gap-3 text-sm text-zinc-400"
                >
                  <span className={s.isDone ? "text-emerald-400" : "text-zinc-600"}>
                    {s.isDone ? "✓" : "○"}
                  </span>
                  <span>
                    <span className="text-zinc-200">{s.title}</span> — {s.dealerDoes}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">
            Easy for you. Complete underneath.
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Each desk: what your team does (simple) vs what GrayArx runs (full process).
          </p>
          <div className="mt-6 space-y-4">
            {processes.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"
              >
                <h3 className="font-medium text-white">{p.name}</h3>
                <p className="mt-1 text-sm text-amber-200/90">{p.moneyHook}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-500">
                      You do
                    </p>
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-zinc-400">
                      {p.dealerSteps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      GrayArx does
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-500">
                      {p.underTheHood.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {value ? (
          <section className="mt-10 rounded-2xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white">
              Why this is a no-brainer
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-400">
              {value.dealerPitch.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-zinc-500">
              Annual leakage at these inputs: ~R
              {value.annual.gpLostZar.toLocaleString("en-ZA")} · net kept with
              GrayArx ~R{value.annual.netKeptZar.toLocaleString("en-ZA")}.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
