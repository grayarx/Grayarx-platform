"use client";

import { useState } from "react";

type CopyBlockProps = {
  label: string;
  body: string;
};

export function CopyBlock({ label, body }: CopyBlockProps) {
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
    <div className="rounded-lg border border-zinc-800 bg-black/40">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap px-3 py-3 text-sm leading-7 text-zinc-100">
        {body}
      </p>
    </div>
  );
}
