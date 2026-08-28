"use client";

import { useState } from "react";
import {
  getSmartReply,
  smartReplyExamples,
  type SmartReply,
} from "@/lib/call-agent-playbook";
import type { LeadContext } from "@/lib/sales-templates";

type SmartReplyPlaybookProps = {
  lead: LeadContext;
};

export function SmartReplyPlaybook({ lead }: SmartReplyPlaybookProps) {
  const [message, setMessage] = useState<string>(smartReplyExamples[0]);
  const [result, setResult] = useState<SmartReply>(() =>
    getSmartReply(smartReplyExamples[0], lead),
  );

  function suggestReply(nextMessage: string) {
    setMessage(nextMessage);
    setResult(getSmartReply(nextMessage, lead));
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
          Turn-by-turn call agent
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">Smart replies</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">
          Diagnose before prescribing — one question per turn, no feature lists.
          Log intel for GrayArx; close on a free pilot, not a brochure.
        </p>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <label htmlFor="dealership-message" className="text-sm text-zinc-300">
            What the dealership says
          </label>
          <textarea
            id="dealership-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500 focus:ring-2"
          />
          <button
            type="button"
            onClick={() => suggestReply(message)}
            className="mt-2 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Suggest reply
          </button>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Try a common reply
          </p>
          <div className="flex flex-wrap gap-2">
            {smartReplyExamples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => suggestReply(example)}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`rounded-lg border p-4 ${
            result.endCall
              ? "border-amber-900/70 bg-amber-950/20"
              : "border-emerald-900/70 bg-emerald-950/20"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              {result.situation}
            </p>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                result.endCall
                  ? "bg-amber-400/15 text-amber-300"
                  : "bg-emerald-400/15 text-emerald-300"
              }`}
            >
              {result.endCall
                ? "Say farewell, then end"
                : "Reply, then listen"}
            </span>
          </div>

          <blockquote className="mt-4 border-l-2 border-white/20 pl-4 text-base leading-7 text-white">
            “{result.reply}”
          </blockquote>

          {result.intelNote ? (
            <div className="mt-4 rounded-md bg-blue-950/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-400">
                Log to CRM
              </p>
              <p className="mt-1 text-sm leading-6 text-blue-100/90">
                {result.intelNote}
              </p>
            </div>
          ) : null}

          <div className="mt-5 rounded-md bg-black/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Next action
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-300">
              {result.nextStep}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-zinc-800 bg-zinc-800 sm:grid-cols-3">
        {[
          ["Diagnose first", "Ask about their process before mentioning GrayArx."],
          ["One question per turn", "Never dump features, tiers, or legal terms."],
          ["Log what you learn", "Tools, volume, and pain feed product and CRM."],
        ].map(([title, detail]) => (
          <div key={title} className="bg-zinc-950 p-4">
            <p className="text-sm font-medium text-zinc-200">{title}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
