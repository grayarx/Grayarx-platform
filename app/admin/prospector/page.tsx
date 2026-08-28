"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProspectCard } from "@/components/prospector/ProspectCard";
import { ProspectorCallModal } from "@/components/prospector/ProspectorCallModal";
import type { CallSessionState, Prospect } from "@/lib/prospector-types";
import { prospectToLead } from "@/lib/prospect-to-lead";

type RegionMeta = {
  id: string;
  name: string;
  currency: string;
  professional: string;
  count: number;
};

export default function ProspectorAdminPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [regions, setRegions] = useState<RegionMeta[]>([]);
  const [regionFilter, setRegionFilter] = useState<string>("ZA");
  const [highOnly, setHighOnly] = useState(true);
  const [csvText, setCsvText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [twilioMessage, setTwilioMessage] = useState("");
  const [twilioConfigured, setTwilioConfigured] = useState(false);
  const [queueLoading, setQueueLoading] = useState<string | null>(null);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callPlaced, setCallPlaced] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  const loadProspects = useCallback(async () => {
    const q = new URLSearchParams();
    if (regionFilter) q.set("region", regionFilter);
    if (highOnly) q.set("highAbility", "1");
    const res = await fetch(`/api/prospector/prospects?${q}`);
    const data = (await res.json()) as {
      prospects: Prospect[];
      regions: RegionMeta[];
    };
    setProspects(data.prospects);
    setRegions(data.regions);
  }, [regionFilter, highOnly]);

  useEffect(() => {
    void loadProspects();
  }, [loadProspects]);

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
          "Twilio not configured — set credentials and TWILIO_WEBHOOK_BASE_URL.",
        );
      });
  }, []);

  const regionPrice = useMemo(
    () => regions.find((r) => r.id === regionFilter)?.professional,
    [regions, regionFilter],
  );

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

  async function handleImport() {
    setImportMsg(null);
    const res = await fetch("/api/prospector/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      imported?: number;
      skipped?: unknown[];
      prospects?: Prospect[];
      error?: string;
    };
    if (data.error) {
      setImportMsg(data.error);
      return;
    }
    if (data.prospects?.length) {
      setProspects((cur) => [...data.prospects!, ...cur]);
    }
    setImportMsg(
      `Imported ${data.imported ?? 0} · skipped ${data.skipped?.length ?? 0}`,
    );
    setCsvText("");
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              GrayArx / Greyhawks admin
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Prospector — ICP yards that can pay
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {prospects.length} showing · filter by region · paste real phones
              from AutoTrader/Carsales before dialling.{" "}
              {regionPrice ? (
                <span className="text-emerald-300">
                  Local Professional: {regionPrice}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/pricing"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Pricing
            </Link>
            <Link
              href="/admin/setup"
              className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black"
            >
              Twilio setup
            </Link>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-xs text-zinc-500">
            Region
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="ml-2 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} · {r.name} ({r.count})
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={highOnly}
              onChange={(e) => setHighOnly(e.target.checked)}
            />
            High / enterprise ability to pay only
          </label>
          <a
            href="/api/prospector/prospects?template=1"
            className="text-xs text-emerald-400 underline"
          >
            Download CSV template
          </a>
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-xs font-medium text-zinc-300">
            Import more dealerships (CSV)
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV with name,city,regionId,segment,abilityToPay,score,..."
            rows={3}
            className="mt-2 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-200"
          />
          <button
            type="button"
            onClick={() => void handleImport()}
            className="mt-2 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-black"
          >
            Import into list
          </button>
          {importMsg ? (
            <p className="mt-2 text-xs text-emerald-400">{importMsg}</p>
          ) : null}
        </div>

        <div className="mb-6 space-y-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100/90">
          <p>
            <strong>Twilio:</strong>{" "}
            {twilioConfigured
              ? "Ready to dial."
              : "Connected — waiting for Gray Ox bundle + SA phone number."}{" "}
            {twilioMessage}
          </p>
          <p className="text-xs text-emerald-100/70">
            Merge into Grayarx-Final to reuse OpenAI / Meta / Resend — see{" "}
            <code className="text-emerald-200">docs/MERGE_INTO_GRAYARX_FINAL.md</code>
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
                /* Final: trigger Resend pilot email */
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
