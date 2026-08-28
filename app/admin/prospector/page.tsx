"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProspectCard } from "@/components/prospector/ProspectCard";
import { ProspectorCallModal } from "@/components/prospector/ProspectorCallModal";
import { MOCK_PROSPECTS } from "@/lib/prospector-data";
import { prospectToLead } from "@/lib/prospect-to-lead";
import type { CallSessionState, Prospect } from "@/lib/prospector-types";

export default function ProspectorAdminPage() {
  const [prospects, setProspects] = useState(MOCK_PROSPECTS);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [twilioMessage, setTwilioMessage] = useState("");
  const [twilioConfigured, setTwilioConfigured] = useState(false);
  const [queueLoading, setQueueLoading] = useState<string | null>(null);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callPlaced, setCallPlaced] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prospector/queue-call")
      .then((response) => response.json())
      .then(
        (data: {
          message?: string;
          configured?: boolean;
          webhookBaseUrlResolved?: string | null;
        }) => {
          const webhookNote = data.webhookBaseUrlResolved
            ? ` Webhook: ${data.webhookBaseUrlResolved}`
            : "";
          setTwilioMessage(
            (data.message ??
              "Twilio not configured — see docs/TWILIO_CALLING_TODAY.md.") +
              webhookNote,
          );
          setTwilioConfigured(Boolean(data.configured));
        },
      )
      .catch(() => {
        setTwilioMessage(
          "Twilio not configured — set credentials and TWILIO_WEBHOOK_BASE_URL. See docs/TWILIO_CALLING_TODAY.md.",
        );
      });
  }, []);

  const handlePhoneChange = useCallback((prospectId: string, phone: string) => {
    setProspects((current) =>
      current.map((item) =>
        item.id === prospectId ? { ...item, phone } : item,
      ),
    );
  }, []);

  const handleHandOff = useCallback(async (prospect: Prospect) => {
    setQueueLoading(prospect.id);
    setQueueError(null);
    setLiveSessionId(null);
    setCallSid(null);
    setCallPlaced(false);

    try {
      const lead = prospectToLead(prospect);
      const response = await fetch("/api/prospector/queue-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          toPhone: prospect.phone,
          lead,
        }),
      });
      const data = (await response.json()) as {
        twilioMessage?: string;
        twilioConfigured?: boolean;
        placed?: boolean;
        sessionId?: string;
        callSid?: string;
        error?: string;
      };

      if (data.twilioMessage) setTwilioMessage(data.twilioMessage);
      if (typeof data.twilioConfigured === "boolean") {
        setTwilioConfigured(data.twilioConfigured);
      }
      if (data.error) setQueueError(data.error);

      if (data.placed && data.sessionId) {
        setLiveSessionId(data.sessionId);
        setCallSid(data.callSid ?? null);
        setCallPlaced(true);
      }

      setProspects((current) =>
        current.map((item) =>
          item.id === prospect.id
            ? { ...item, status: "queued_for_call" as const }
            : item,
        ),
      );
      setActiveProspect({ ...prospect, status: "queued_for_call" });
    } finally {
      setQueueLoading(null);
    }
  }, []);

  const handleSaveSession = useCallback(
    async (prospectId: string, session: CallSessionState) => {
      setProspects((current) =>
        current.map((item) =>
          item.id === prospectId
            ? {
                ...item,
                callIntel: session.intel,
                callStage: session.stage,
                status:
                  session.intel.outcome === "demo_booked"
                    ? "demo_booked"
                    : session.intel.outcome === "do_not_contact"
                      ? "do_not_contact"
                      : session.intel.outcome === "not_interested"
                        ? "not_interested"
                        : item.status === "queued_for_call"
                          ? "called"
                          : item.status,
              }
            : item,
        ),
      );

      await fetch("/api/prospector/save-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, session }),
      });
    },
    [],
  );

  const handleRemove = useCallback((prospect: Prospect) => {
    setProspects((current) => current.filter((item) => item.id !== prospect.id));
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              GrayArx admin
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Prospector
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              <strong className="text-zinc-200">Today:</strong> click{" "}
              <strong className="text-emerald-300">Practice funnel</strong> — learn
              the call opener and smart replies while you dial from your own phone.
              After Gray Ox is approved and we add the +27 number,{" "}
              <strong className="text-zinc-200">Hand off to Themba</strong> will
              auto-dial.
            </p>
          </div>
          <Link
            href="/admin/setup"
            className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            Twilio setup
          </Link>
          <Link
            href="/"
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
          >
            Script lab
          </Link>
        </header>

        <div className="mb-6 space-y-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100/90">
          <p>
            <strong>Twilio:</strong>{" "}
            {twilioConfigured
              ? "Ready to dial."
              : "Connected — waiting for Gray Ox bundle + SA phone number."}{" "}
            {twilioMessage}
          </p>
          {queueError ? <p className="text-red-300">{queueError}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {prospects.map((prospect) => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              loading={queueLoading === prospect.id}
              canDial={twilioConfigured}
              onPhoneChange={handlePhoneChange}
              onPractice={(selected) => {
                setCallPlaced(false);
                setLiveSessionId(null);
                setCallSid(null);
                setActiveProspect(selected);
              }}
              onHandOff={(selected) => {
                if (queueLoading !== selected.id) {
                  void handleHandOff(selected);
                }
              }}
              onResendEmail={() => {
                /* Grayarx-Final: trigger Resend pilot email */
              }}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </main>

      {activeProspect ? (
        <ProspectorCallModal
          prospect={activeProspect}
          twilioMessage={twilioMessage}
          twilioConfigured={twilioConfigured}
          callPlaced={callPlaced}
          liveSessionId={liveSessionId}
          callSid={callSid}
          onClose={() => {
            setActiveProspect(null);
            setLiveSessionId(null);
            setCallSid(null);
            setCallPlaced(false);
          }}
          onSaveSession={(prospectId, session) => {
            void handleSaveSession(prospectId, session);
          }}
        />
      ) : null}
    </div>
  );
}
