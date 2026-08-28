"use client";

import { useMemo, useState } from "react";
import {
  funnelPrinciples,
  getSmartReply,
  smartReplyExamples,
  type SmartReplyResult,
} from "@/lib/call-agent-playbook";
import type { CallIntel } from "@/lib/call-intel";
import { formatIntelNote } from "@/lib/call-intel";
import {
  CALL_STAGES,
  STAGE_LABELS,
  type CallStage,
} from "@/lib/call-stages";
import type { LeadContext } from "@/lib/sales-templates";

type SmartReplyPlaybookProps = {
  lead: LeadContext;
};

export function SmartReplyPlaybook({ lead }: SmartReplyPlaybookProps) {
  const firstExample = smartReplyExamples[0];
  const [stage, setStage] = useState<CallStage>(firstExample.stage);
  const [intel, setIntel] = useState<Partial<CallIntel>>({});
  const [message, setMessage] = useState<string>(firstExample.message);
  const [result, setResult] = useState<SmartReplyResult>(() =>
    getSmartReply(firstExample.message, lead, { stage: firstExample.stage }),
  );

  const accumulatedIntelNote = useMemo(
    () => formatIntelNote(intel),
    [intel],
  );

  function suggestReply(nextMessage: string, nextStageOverride?: CallStage) {
    const activeStage = nextStageOverride ?? stage;
    const next = getSmartReply(nextMessage, lead, { stage: activeStage, intel });
    setMessage(nextMessage);
    setResult(next);
    setStage(next.nextStage);
    setIntel(next.intel);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
          Stage-aware call funnel
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">Smart replies</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">
          Diagnose before prescribing — one question per turn, structured intel
          on every branch, pricing and tiers only when they ask.
        </p>

        <ol className="mt-4 flex flex-wrap gap-2">
          {CALL_STAGES.filter((s) => s !== "ended").map((s) => (
            <li
              key={s}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                stage === s
                  ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-500/40"
                  : s === result.nextStage
                    ? "bg-zinc-800 text-zinc-300"
                    : "bg-zinc-900 text-zinc-500"
              }`}
            >
              {STAGE_LABELS[s]}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <label htmlFor="call-stage" className="text-sm text-zinc-300">
            Simulate from stage
          </label>
          <select
            id="call-stage"
            value={stage}
            onChange={(event) =>
              setStage(event.target.value as CallStage)
            }
            className="mt-2 w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500 focus:ring-2"
          >
            {CALL_STAGES.filter((s) => s !== "ended").map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>

          <label
            htmlFor="dealership-message"
            className="mt-4 block text-sm text-zinc-300"
          >
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
            Scenario library
          </p>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {smartReplyExamples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => {
                  setStage(example.stage);
                  suggestReply(example.message, example.stage);
                }}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                {example.label}
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
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300">
              {result.intent}
            </span>
          </div>

          <blockquote className="mt-4 border-l-2 border-white/20 pl-4 text-base leading-7 text-white">
            &ldquo;{result.reply}&rdquo;
          </blockquote>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-black/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Next stage
              </p>
              <p className="mt-1 text-sm text-emerald-300">
                {STAGE_LABELS[result.nextStage]}
              </p>
            </div>
            <div className="rounded-md bg-black/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Action
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                {result.endCall ? "Say farewell, then end" : "Reply, then listen"}
              </p>
            </div>
          </div>

          {result.intelNote ? (
            <div className="mt-4 rounded-md bg-blue-950/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-400">
                This turn — log to CRM
              </p>
              <p className="mt-1 text-sm leading-6 text-blue-100/90">
                {result.intelNote}
              </p>
            </div>
          ) : null}

          {accumulatedIntelNote ? (
            <div className="mt-3 rounded-md bg-indigo-950/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-400">
                Call intel (accumulated)
              </p>
              <p className="mt-1 text-sm leading-6 text-indigo-100/90">
                {accumulatedIntelNote}
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-md bg-black/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Next action
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-300">
              {result.nextStep}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
        {funnelPrinciples.map(({ title, detail }) => (
          <div key={title} className="bg-zinc-950 p-4">
            <p className="text-sm font-medium text-zinc-200">{title}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
