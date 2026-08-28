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
