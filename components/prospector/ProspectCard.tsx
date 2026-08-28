"use client";

import type { Prospect } from "@/lib/prospector-types";

const STATUS_LABELS: Record<Prospect["status"], string> = {
  scouted: "Scouted",
  emailed: "Emailed",
  queued_for_call: "Queued for call",
  called: "Called",
  demo_booked: "Demo booked",
  not_interested: "Not interested",
  do_not_contact: "Do not contact",
};

type ProspectCardProps = {
  prospect: Prospect;
  onHandOff: (prospect: Prospect) => void;
  onResendEmail?: (prospect: Prospect) => void;
  onRemove?: (prospect: Prospect) => void;
};

export function ProspectCard({
  prospect,
  onHandOff,
  onResendEmail,
  onRemove,
}: ProspectCardProps) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{prospect.name}</h3>
          <p className="mt-0.5 text-sm text-zinc-500">{prospect.location}</p>
        </div>
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          Score {prospect.score}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-zinc-300">
          {STATUS_LABELS[prospect.status]}
        </span>
        {prospect.emailedAt ? (
          <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-zinc-500">
            Emailed {new Date(prospect.emailedAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-400">{prospect.researchNote}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onHandOff(prospect)}
          className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
        >
          Hand off to Themba
        </button>
        {prospect.status === "emailed" && onResendEmail ? (
          <button
            type="button"
            onClick={() => onResendEmail(prospect)}
            className="rounded-md border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900"
          >
            Resend pilot email
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(prospect)}
            className="rounded-md border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-red-900/50 hover:text-red-300"
          >
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}
