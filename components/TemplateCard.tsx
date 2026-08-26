"use client";

import { useState } from "react";

type TemplateCardProps = {
  title: string;
  body: string;
};

export function TemplateCard({ title, body }: TemplateCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {title}
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="px-4 py-4 text-sm leading-7 text-zinc-100 whitespace-pre-wrap">
        {body}
      </p>
    </section>
  );
}
