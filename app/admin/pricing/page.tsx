"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PriceRow = {
  name: string;
  category: string;
  plans: Array<{
    plan: string;
    price: string;
    confidence: string;
    source?: string;
  }>;
  notes?: string;
};

type Economics = {
  cogsLines: Array<{
    item: string;
    starter: number;
    professional: number;
    enterprise: number;
    notes: string;
  }>;
  packages: Array<{
    id: string;
    price: number;
    cogs: number;
    marginPercent: number;
    includedConversations: number;
    overage: number;
    profitNote: string;
  }>;
  rules: string[];
};

type OsPackage = {
  id: string;
  name: string;
  priceLabel: string;
  headline: string;
  vsMarket: string;
  target: string;
  includedWhatsAppConversations: number;
  overagePerConversationZar: number;
  estimatedCogsZar: number;
  grossMarginPercent: number;
  profitNote: string;
};

type Payload = {
  competitorPrices: PriceRow[];
  packages: OsPackage[];
  economics: Economics;
  pricingStrategy: {
    principle: string;
    whyNotCheaper: string;
    grayArx: Array<{ plan: string; price: string; why: string }>;
  };
};

function zar(n: number) {
  return `R${n.toLocaleString("en-ZA")}`;
}

export default function PricingMatrixPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/pricing")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Payload>;
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load pricing");
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f0e] text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
              Sell price + unit economics
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              GrayArx pricing that still makes profit
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {data?.pricingStrategy?.principle ??
                (error
                  ? `Could not load pricing (${error}).`
                  : "Loading packages…")}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/os"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              OS desk
            </Link>
            <Link
              href="/admin/competitors"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Battlecards
            </Link>
          </div>
        </header>

        <section className="mb-8 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
          <h2 className="text-sm font-semibold text-emerald-200">
            What we charge (pilot stays free)
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            {data?.pricingStrategy?.whyNotCheaper}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.packages ?? []).map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-emerald-900/50 bg-black/30 p-3"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-white">{p.name}</span>
                  <span className="text-emerald-400">{p.priceLabel}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">{p.headline}</p>
                <p className="mt-2 text-[11px] text-zinc-500">
                  {(p.includedWhatsAppConversations ?? 0).toLocaleString(
                    "en-ZA",
                  )}{" "}
                  WA included
                  {(p.overagePerConversationZar ?? 0) > 0
                    ? ` · overage R${p.overagePerConversationZar}/conv`
                    : " · hard cap"}
                </p>
                {p.id === "pilot" ? (
                  <p className="mt-2 text-[11px] text-amber-400/90">
                    We absorb pilot COGS — capped conversations only
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-emerald-500/90">
                    Est. COGS {zar(p.estimatedCogsZar)} · ~
                    {p.grossMarginPercent}% gross
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 overflow-x-auto rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">
              Our monthly COGS per yard (est.)
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              LLM + WhatsApp + Twilio + hosting + support + 15% contingency
            </p>
          </div>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Starter</th>
                <th className="px-4 py-3">Professional</th>
                <th className="px-4 py-3">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {(data?.economics?.cogsLines ?? []).map((line) => (
                <tr
                  key={line.item}
                  className="border-b border-zinc-900 text-zinc-300"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{line.item}</div>
                    <div className="text-[11px] text-zinc-500">{line.notes}</div>
                  </td>
                  <td className="px-4 py-3">{zar(line.starter)}</td>
                  <td className="px-4 py-3">{zar(line.professional)}</td>
                  <td className="px-4 py-3">{zar(line.enterprise)}</td>
                </tr>
              ))}
              <tr className="bg-emerald-950/20 text-emerald-200">
                <td className="px-4 py-3 font-semibold">Sell vs COGS</td>
                {(["starter", "professional", "enterprise"] as const).map(
                  (id) => {
                    const row = data?.economics?.packages.find(
                      (p) => p.id === id,
                    );
                    if (!row) return <td key={id} className="px-4 py-3" />;
                    return (
                      <td key={id} className="px-4 py-3 text-sm">
                        {zar(row.price)} − {zar(row.cogs)} ={" "}
                        <span className="font-semibold">
                          ~{row.marginPercent}%
                        </span>
                      </td>
                    );
                  },
                )}
              </tr>
            </tbody>
          </table>
          <ul className="space-y-1 px-4 py-3 text-xs text-zinc-500">
            {(data?.economics?.rules ?? []).map((rule) => (
              <li key={rule}>· {rule}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8 rounded-xl border border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-white">
            Positioning vs market
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.pricingStrategy?.grayArx ?? []).map((p) => (
              <div
                key={p.plan}
                className="rounded-lg border border-zinc-800 bg-black/20 p-3"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-white">{p.plan}</span>
                  <span className="text-emerald-400">{p.price}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">{p.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Competitor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {(data?.competitorPrices ?? []).flatMap((row) =>
                row.plans.map((plan, idx) => (
                  <tr
                    key={`${row.name}-${plan.plan}`}
                    className="border-b border-zinc-900 text-zinc-300"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {idx === 0 ? row.name : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {idx === 0 ? row.category : ""}
                    </td>
                    <td className="px-4 py-3">{plan.plan}</td>
                    <td className="px-4 py-3 text-zinc-100">{plan.price}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {plan.confidence}
                      {plan.source ? ` · ${plan.source}` : ""}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-6 space-y-3">
          {(data?.competitorPrices ?? [])
            .filter((r) => r.notes)
            .map((r) => (
              <p key={r.name} className="text-xs text-zinc-500">
                <span className="text-zinc-300">{r.name}:</span> {r.notes}
              </p>
            ))}
        </section>
      </main>
    </div>
  );
}
