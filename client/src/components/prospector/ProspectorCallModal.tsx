"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyBlock } from "@/components/prospector/CopyBlock";
import { fetchCallAgentReply } from "@nalaOs/call-agent-api";
import { formatIntelNote } from "@nalaOs/call-intel";
import { STAGE_LABELS, defaultStage, type CallStage } from "@nalaOs/call-stages";
import { prospectToLead } from "@nalaOs/prospect-to-lead";
import type { CallSessionState, Prospect } from "@nalaOs/prospector-types";
import {
  buildCallScript,
  buildWhatsAppFollowUp,
} from "@nalaOs/sales-templates";

type ProspectorCallModalProps = {
  prospect: Prospect;
  twilioMessage: string;
  twilioConfigured: boolean;
  callPlaced?: boolean;
  liveSessionId?: string | null;
  callSid?: string | null;
  onClose: () => void;
  onSaveSession: (prospectId: string, session: CallSessionState) => void;
};

type LiveSessionPayload = {
  status: string;
  stage: CallStage;
  intel: CallSessionState["intel"];
  transcript: CallSessionState["transcript"];
};

export function ProspectorCallModal({
  prospect,
  twilioMessage,
  twilioConfigured,
  callPlaced = false,
  liveSessionId = null,
  callSid = null,
  onClose,
  onSaveSession,
}: ProspectorCallModalProps) {
  const lead = useMemo(() => prospectToLead(prospect), [prospect]);
  const whatsAppFollowUp = useMemo(() => buildWhatsAppFollowUp(lead), [lead]);
  const callOpener = useMemo(() => buildCallScript(lead), [lead]);

  const [stage, setStage] = useState<CallStage>(
    prospect.callStage ?? defaultStage(),
  );
  const [intel, setIntel] = useState(prospect.callIntel ?? {});
  const [dealershipMessage, setDealershipMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<
    Awaited<ReturnType<typeof fetchCallAgentReply>> | null
  >(null);
  const [transcript, setTranscript] = useState<
    CallSessionState["transcript"]
  >(() => [
    {
      role: "agent",
      text: callOpener.split("\n\n[STOP")[0]?.trim() ?? callOpener,
    },
  ]);

  const accumulatedIntel = useMemo(() => formatIntelNote(intel), [intel]);

  useEffect(() => {
    if (!liveSessionId) return;

    let cancelled = false;

    async function pollLiveSession() {
      try {
        const response = await fetch(
          `/api/prospector/call-session?sessionId=${liveSessionId}`,
        );
        if (!response.ok || cancelled) return;

        const data = (await response.json()) as LiveSessionPayload;
        if (cancelled) return;

        setStage(data.stage);
        setIntel(data.intel);
        if (data.transcript.length > 0) {
          setTranscript(data.transcript);
        }

        onSaveSession(prospect.id, {
          stage: data.stage,
          intel: data.intel,
          transcript: data.transcript,
        });
      } catch {
        /* ignore polling errors */
      }
    }

    void pollLiveSession();
    const interval = window.setInterval(pollLiveSession, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [liveSessionId, onSaveSession, prospect.id]);

  async function submitDealershipTurn() {
    const message = dealershipMessage.trim();
    if (!message) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCallAgentReply({
        message,
        lead,
        context: { stage, intel },
      });

      const nextTranscript: CallSessionState["transcript"] = [
        ...transcript,
        { role: "dealership", text: message },
        {
          role: "agent",
          text: result.response,
          intent: result.intent,
        },
      ];

      setTranscript(nextTranscript);
      setStage(result.nextStage);
      setIntel(result.intel);
      setLastReply(result);
      setDealershipMessage("");

      onSaveSession(prospect.id, {
        stage: result.nextStage,
        intel: result.intel,
        transcript: nextTranscript,
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unexpected error.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prospector-call-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
                {prospect.name}
              </p>
              <h2
                id="prospector-call-title"
                className="mt-1 text-lg font-semibold text-white"
              >
                {callPlaced
                  ? "Themba is on the line — live Twilio call in progress."
                  : "Practice mode — read the opener, type what they say, learn the funnel."}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {prospect.location}
                {prospect.phone ? ` · ${prospect.phone}` : ""}
              </p>
              {callSid ? (
                <p className="mt-1 font-mono text-[11px] text-zinc-600">
                  Call SID: {callSid}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900"
            >
              Close
            </button>
          </div>

          <p
            className={`mt-3 rounded-md px-3 py-2 text-xs leading-5 ${
              twilioConfigured
                ? "bg-emerald-950/40 text-emerald-200"
                : "bg-amber-950/40 text-amber-200"
            }`}
          >
            {twilioMessage}
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <CopyBlock label="WhatsApp / email follow-up" body={whatsAppFollowUp} />
          <CopyBlock label="Call opener (turn 1 only)" body={callOpener} />

          <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
                Live call funnel
              </p>
              <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                {STAGE_LABELS[stage]}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {liveSessionId
                ? "Live transcript from Twilio — updates every few seconds while Themba runs the playbook on the call."
                : "Manual mode: type what the dealership says if you are on the phone yourself."}
            </p>

            <div className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-black/30 p-3">
              {transcript.map((turn, index) => (
                <div
                  key={`${turn.role}-${index}`}
                  className={`text-sm leading-6 ${
                    turn.role === "agent" ? "text-emerald-100" : "text-zinc-200"
                  }`}
                >
                  <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {turn.role === "agent" ? "Themba" : "Dealership"}
                    {turn.intent ? ` · ${turn.intent}` : ""}
                  </span>
                  {turn.text}
                </div>
              ))}
            </div>

            <label className="mt-4 block text-sm text-zinc-300">
              Manual turn (if not on live Twilio call)
            </label>
            <textarea
              value={dealershipMessage}
              onChange={(event) => setDealershipMessage(event.target.value)}
              rows={2}
              disabled={Boolean(liveSessionId)}
              placeholder={
                liveSessionId
                  ? "Live call active — transcript syncs automatically."
                  : "e.g. It usually waits until the next morning."
              }
              className="mt-2 w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500 focus:ring-2"
            />
            <button
              type="button"
              disabled={loading || !dealershipMessage.trim() || Boolean(liveSessionId)}
              onClick={submitDealershipTurn}
              className="mt-2 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking…" : "Next agent turn"}
            </button>

            {error ? (
              <p className="mt-2 text-sm text-red-300">{error}</p>
            ) : null}

            {lastReply ? (
              <div className="mt-4 space-y-3 rounded-lg border border-zinc-800 bg-black/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Agent says next
                </p>
                <p className="text-sm leading-7 text-white">
                  &ldquo;{lastReply.response}&rdquo;
                </p>
                <p className="text-xs leading-5 text-zinc-500">
                  {lastReply.nextStep}
                </p>
                {lastReply.intelNote ? (
                  <p className="text-xs leading-5 text-blue-300">
                    Log: {lastReply.intelNote}
                  </p>
                ) : null}
              </div>
            ) : null}

            {accumulatedIntel ? (
              <p className="mt-3 text-xs leading-5 text-indigo-300">
                Call intel: {accumulatedIntel}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
