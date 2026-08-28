"use client";

import { useState } from "react";
import { LeadForm } from "@/components/LeadForm";
import { SmartReplyPlaybook } from "@/components/SmartReplyPlaybook";
import { TemplateCard } from "@/components/TemplateCard";
import {
  DEFAULT_LEAD,
  buildCallScript,
  buildWhatsAppFollowUp,
} from "@/lib/sales-templates";

export default function Home() {
  const [lead, setLead] = useState(DEFAULT_LEAD);

  const whatsAppFollowUp = buildWhatsAppFollowUp(lead);
  const callScript = buildCallScript(lead);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                GrayArx outreach
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Sales scripts
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Stage-aware discovery funnel — permission, diagnose, quantify, close
                on a free pilot. Structured intel on every turn feeds CRM and product.
                Pricing and tiers only when they ask.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/dealer"
                className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
              >
                Dealer home
              </a>
              <a
                href="/admin/conversion"
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
              >
                Conversion
              </a>
              <a
                href="/admin/prospector"
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Open prospector
              </a>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <LeadForm lead={lead} onChange={setLead} />

          <TemplateCard
            title="WhatsApp / Email follow-up"
            body={whatsAppFollowUp}
          />

          <TemplateCard title="Call script (spoken opener)" body={callScript} />

          <SmartReplyPlaybook lead={lead} />
        </div>
      </main>
    </div>
  );
}
