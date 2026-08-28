"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProspectCard } from "@/components/prospector/ProspectCard";
import { ProspectorCallModal } from "@/components/prospector/ProspectorCallModal";
import { MOCK_PROSPECTS } from "@/lib/prospector-data";
import type { CallSessionState, Prospect } from "@/lib/prospector-types";

export default function ProspectorAdminPage() {
  const [prospects, setProspects] = useState(MOCK_PROSPECTS);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [twilioMessage, setTwilioMessage] = useState("");
  const [twilioConfigured, setTwilioConfigured] = useState(false);
  const [queueLoading, setQueueLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prospector/queue-call")
      .then((response) => response.json())
      .then((data: { message?: string; configured?: boolean }) => {
        setTwilioMessage(
          data.message ??
            "Twilio credentials missing — calls queue but do not dial.",
        );
        setTwilioConfigured(Boolean(data.configured));
      })
      .catch(() => {
        setTwilioMessage(
          "Twilio credentials missing (need TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN/API_KEY + TWILIO_FROM_NUMBER/PHONE_NUMBER) — call queued but not placed.",
        );
      });
  }, []);

  const handleHandOff = useCallback(async (prospect: Prospect) => {
    setQueueLoading(prospect.id);
    try {
      const response = await fetch("/api/prospector/queue-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
      });
      const data = (await response.json()) as {
        twilioMessage?: string;
        twilioConfigured?: boolean;
      };

      if (data.twilioMessage) setTwilioMessage(data.twilioMessage);
      if (typeof data.twilioConfigured === "boolean") {
        setTwilioConfigured(data.twilioConfigured);
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
              Hand off to Themba — discovery funnel, live smart replies, and
              structured intel on every turn. No feature dumps; pricing only when
              they ask.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
          >
            Script lab
          </Link>
        </header>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
          {twilioMessage}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {prospects.map((prospect) => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
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
          onClose={() => setActiveProspect(null)}
          onSaveSession={(prospectId, session) => {
            void handleSaveSession(prospectId, session);
          }}
        />
      ) : null}
    </div>
  );
}
