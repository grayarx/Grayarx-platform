"use client";

import type { LeadContext } from "@/lib/sales-templates";

type LeadFormProps = {
  lead: LeadContext;
  onChange: (lead: LeadContext) => void;
};

const fields: Array<{
  key: keyof LeadContext;
  label: string;
  multiline?: boolean;
}> = [
  { key: "dealershipName", label: "Dealership" },
  { key: "location", label: "Location" },
  { key: "agentName", label: "Agent name" },
  { key: "phoneNumber", label: "Callback number" },
  { key: "researchNote", label: "WhatsApp hook (curiosity, not product)", multiline: true },
  { key: "callReason", label: "Discovery opener (one line, spoken)", multiline: true },
];

export function LeadForm({ lead, onChange }: LeadFormProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
        Lead details
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="grid gap-1.5 text-sm">
            <span className="text-zinc-400">{field.label}</span>
            {field.multiline ? (
              <textarea
                value={lead[field.key]}
                onChange={(event) =>
                  onChange({ ...lead, [field.key]: event.target.value })
                }
                rows={3}
                className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
              />
            ) : (
              <input
                value={lead[field.key]}
                onChange={(event) =>
                  onChange({ ...lead, [field.key]: event.target.value })
                }
                className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
              />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}
