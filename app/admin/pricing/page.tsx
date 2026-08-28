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

type Payload = {
  competitorPrices: PriceRow[];
  packages: Array<{
    id: string;
    name: string;
    priceLabel: string;
    headline: string;
    vsMarket: string;
    target: string;
  }>;
  pricingStrategy: {
    principle: string;
    whyNotCheaper: string;
    grayArx: Array<{ plan: string; price: string; why: string }>;
  };
};

export default function PricingMatrixPage() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    void fetch("/api/os")
      .then((r) => r.json())
      .then((json: Payload) => setData(json));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f0e] text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
              Competitive pricing research
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Their prices vs GrayArx OS
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {data?.pricingStrategy.principle}
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
            GrayArx premium packages
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            {data?.pricingStrategy.whyNotCheaper}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.pricingStrategy.grayArx ?? []).map((p) => (
              <div
                key={p.plan}
                className="rounded-lg border border-emerald-900/50 bg-black/30 p-3"
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
