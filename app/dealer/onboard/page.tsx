"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Guide = {
  state: { currentStep: string; dealershipName: string };
  steps: Array<{
    id: string;
    title: string;
    dealerDoes: string;
    grayArxDoes: string;
    doneWhen: string;
    isDone: boolean;
  }>;
  percentComplete: number;
  readyForPilot: boolean;
};

const STOCK_DEMO = `stockNumber,make,model,year,price,mileage,colour,status
GA-2001,Volkswagen,Polo Vivo,2021,219900,55000,White,available
GA-2002,Toyota,Corolla,2020,259900,72000,Silver,available`;

const PARTS_DEMO = `sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier
CAB-POLO,1K0819644,Cabin filter Polo,Volkswagen Polo,Volkswagen,Polo,2018,2024,85,169,12,Local`;

export default function DealerOnboardPage() {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [name, setName] = useState("Sandton Motors");
  const [partsOn, setPartsOn] = useState(true);
  const [serviceOn, setServiceOn] = useState(true);
  const [stockCsv, setStockCsv] = useState(STOCK_DEMO);
  const [partsCsv, setPartsCsv] = useState(PARTS_DEMO);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/onboarding?dealershipId=demo-yard");
    const json = (await res.json()) as Guide;
    setGuide(json);
    setName(json.state.dealershipName || "Sandton Motors");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function push(msg: string) {
    setLog((l) => [msg, ...l].slice(0, 8));
  }

  async function completeYard() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealershipId: "demo-yard",
          step: "yard",
          name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setGuide(json);
      push(`Yard named: ${name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function completeModules() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealershipId: "demo-yard",
          step: "modules",
          modules: {
            sales: true,
            parts: partsOn,
            service: serviceOn,
            tradeIn: true,
            finance: true,
            missedCall: true,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setGuide(json);
      push(
        `Modules: parts ${partsOn ? "ON" : "OFF"}, service ${serviceOn ? "ON" : "OFF"}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function importStock() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stock/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_csv",
          dealershipId: "demo-yard",
          csv: stockCsv,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Stock import failed");
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealershipId: "demo-yard", step: "stock" }),
      });
      push(
        `Stock imported: +${json.imported} / updated ${json.updated} (skipped ${json.skipped.length})`,
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function importParts() {
    setBusy(true);
    setError(null);
    try {
      if (!partsOn) {
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealershipId: "demo-yard", step: "parts" }),
        });
        push("Parts skipped (module off)");
        await refresh();
        return;
      }
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_csv",
          dealershipId: "demo-yard",
          csv: partsCsv,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Parts import failed");
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealershipId: "demo-yard", step: "parts" }),
      });
      push(
        `Parts imported: +${json.imported} / updated ${json.updated}`,
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function testChannels() {
    setBusy(true);
    setError(null);
    try {
      const poll = await fetch("/api/marketplace/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "poll", limit: 1 }),
      }).then((r) => r.json());
      await fetch("/api/crm/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          provider: "motorx",
          url: "mock://motorx/leads",
          dealershipId: "demo-yard",
        }),
      });
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealershipId: "demo-yard", step: "channels" }),
      });
      push(`Channel test: ingested ${poll.ingested ?? 1} lead + CRM registered`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function finishProof() {
    setBusy(true);
    try {
      await fetch("/api/reports/monday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "gm@yard.test",
          dealershipName: name,
        }),
      });
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealershipId: "demo-yard", step: "proof" }),
      });
      push("Monday ROI email generated — setup complete");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const step = guide?.state.currentStep;

  return (
    <div className="min-h-screen bg-[#08110e] text-zinc-100">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/dealer" className="text-sm text-emerald-400">
          ← Dealer home
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          5-step setup — easy outside, complete inside
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {guide
            ? `${guide.percentComplete}% complete`
            : "Loading…"}
        </p>

        {error ? <p className="mt-4 text-sm text-amber-400">{error}</p> : null}

        <ol className="mt-8 space-y-3">
          {(guide?.steps ?? []).map((s) => (
            <li
              key={s.id}
              className={`rounded-xl border p-4 ${
                step === s.id
                  ? "border-emerald-700 bg-emerald-950/30"
                  : "border-zinc-800"
              }`}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium text-white">
                  {s.isDone ? "✓ " : ""}
                  {s.title}
                </span>
                <span className="text-xs text-zinc-500">{s.doneWhen}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{s.dealerDoes}</p>
              <p className="mt-1 text-xs text-zinc-600">{s.grayArxDoes}</p>
            </li>
          ))}
        </ol>

        <section className="mt-8 rounded-xl border border-zinc-800 p-5">
          {step === "yard" || !step ? (
            <>
              <h2 className="text-sm font-semibold text-white">1. Yard name</h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-3 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void completeYard()}
                className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
              >
                Save & continue
              </button>
            </>
          ) : null}

          {step === "modules" ? (
            <>
              <h2 className="text-sm font-semibold text-white">2. Desks</h2>
              <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={partsOn}
                  onChange={(e) => setPartsOn(e.target.checked)}
                />
                Parts counter (off if you don’t sell parts)
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={serviceOn}
                  onChange={(e) => setServiceOn(e.target.checked)}
                />
                Service bookings
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => void completeModules()}
                className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
              >
                Save desks
              </button>
            </>
          ) : null}

          {step === "stock" ? (
            <>
              <h2 className="text-sm font-semibold text-white">3. Load cars</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Paste CSV from your system — or use the demo rows.
              </p>
              <textarea
                value={stockCsv}
                onChange={(e) => setStockCsv(e.target.value)}
                rows={6}
                className="mt-3 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void importStock()}
                className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
              >
                Import stock
              </button>
            </>
          ) : null}

          {step === "parts" ? (
            <>
              <h2 className="text-sm font-semibold text-white">
                4. Parts prices (your numbers)
              </h2>
              {!partsOn ? (
                <p className="mt-2 text-sm text-zinc-400">
                  Parts is off — skip this step.
                </p>
              ) : (
                <textarea
                  value={partsCsv}
                  onChange={(e) => setPartsCsv(e.target.value)}
                  rows={5}
                  className="mt-3 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs"
                />
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void importParts()}
                className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
              >
                {partsOn ? "Import parts" : "Skip parts"}
              </button>
            </>
          ) : null}

          {step === "channels" ? (
            <>
              <h2 className="text-sm font-semibold text-white">
                5a. Test a real lead pipe
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                One click: pull a demo AutoTrader lead, Nala WhatsApps, CRM logs it.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void testChannels()}
                className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
              >
                Poll demo lead + register CRM
              </button>
            </>
          ) : null}

          {step === "proof" ? (
            <>
              <h2 className="text-sm font-semibold text-white">
                5b. Monday proof
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Generate the ROI email, then open Dealer home for the money calculator.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void finishProof()}
                className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
              >
                Send Monday ROI & finish
              </button>
              <Link
                href="/dealer"
                className="ml-3 text-sm text-emerald-400 underline"
              >
                See money-left-on-table
              </Link>
            </>
          ) : null}
        </section>

        <ul className="mt-6 space-y-1 text-xs text-zinc-600">
          {log.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </main>
    </div>
  );
}
