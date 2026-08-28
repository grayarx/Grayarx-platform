import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, PhoneCall, Send, Loader2, Globe, Search } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ProspectorCallModal } from "@/components/prospector/ProspectorCallModal";
import type { Prospect } from "@nalaOs/prospector-types";

type RegionMeta = {
  id: string;
  name: string;
  currency: string;
  professional: string;
  count: number;
};

type CallModalState = {
  prospect: Prospect;
  twilioMessage: string;
  twilioConfigured: boolean;
  callPlaced: boolean;
  liveSessionId: string | null;
  callSid: string | null;
};

export default function IcpYardsPanel() {
  const sendEmail = trpc.pilotEmail.sendToDbProspect.useMutation();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [regions, setRegions] = useState<RegionMeta[]>([]);
  const [totalSeeded, setTotalSeeded] = useState(0);
  const [regionFilter, setRegionFilter] = useState("ZA");
  const [highOnly, setHighOnly] = useState(true);
  const [csvText, setCsvText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { phone: string; email: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [callModal, setCallModal] = useState<CallModalState | null>(null);
  const [researching, setResearching] = useState(false);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (regionFilter) q.set("region", regionFilter);
    if (highOnly) q.set("highAbility", "1");
    const res = await fetch(`/api/prospector/prospects?${q}`);
    const data = (await res.json()) as {
      prospects: Prospect[];
      regions: RegionMeta[];
      totalSeeded: number;
    };
    const rows = data.prospects ?? [];
    setProspects(rows);
    setRegions(data.regions ?? []);
    setTotalSeeded(data.totalSeeded ?? 0);
    setDrafts((prev) => {
      const next = { ...prev };
      for (const p of rows) {
        const existing = next[p.id];
        if (!existing) {
          next[p.id] = { phone: p.phone ?? "", email: p.email ?? "" };
          continue;
        }
        if (!existing.phone.trim() && p.phone) existing.phone = p.phone;
        if (!existing.email.trim() && p.email) existing.email = p.email;
      }
      return next;
    });
  }, [regionFilter, highOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  function draftFor(p: Prospect) {
    return drafts[p.id] ?? { phone: p.phone ?? "", email: p.email ?? "" };
  }

  async function saveContact(p: Prospect, patch?: { phone?: string; email?: string }) {
    const draft = { ...draftFor(p), ...patch };
    const res = await fetch("/api/prospector/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prospectId: p.id,
        phone: draft.phone,
        email: draft.email,
      }),
    });
    const data = (await res.json()) as { prospect?: Prospect; error?: string };
    if (!res.ok || !data.prospect) {
      toast.error(data.error ?? "Could not save contact");
      return null;
    }
    setProspects((rows) => rows.map((row) => (row.id === p.id ? data.prospect! : row)));
    setDrafts((d) => ({ ...d, [p.id]: { phone: data.prospect!.phone ?? "", email: data.prospect!.email ?? "" } }));
    return data.prospect;
  }

  async function handleSendEmail(p: Prospect) {
    const saved = await saveContact(p);
    const email = saved?.email?.trim();
    if (!email) {
      toast.error("No named firstname@dealer-domain yet — run Research contacts or paste one");
      return;
    }
    setBusyId(p.id);
    try {
      const result = await sendEmail.mutateAsync({
        email,
        dealershipName: p.name,
        contactName: p.contactName || "there",
        city: p.city,
        website: p.website,
        segment: "after_hours_leak",
      });
      if (result.success) {
        toast.success(`Pilot email sent to ${email}`);
      } else {
        toast.error(result.error ?? "Email blocked or failed");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleCall(p: Prospect) {
    const saved = await saveContact(p);
    const phone = saved?.phone?.trim();
    if (!phone) {
      toast.error("No switchboard yet — run Research contacts or paste a public number");
      return;
    }
    setBusyId(p.id);
    try {
      const res = await fetch("/api/prospector/queue-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: p.id, toPhone: phone }),
      });
      const data = (await res.json()) as {
        error?: string;
        placed?: boolean;
        twilioConfigured?: boolean;
        twilioMessage?: string;
        sessionId?: string;
        callSid?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Call failed");
        return;
      }
      if (data.placed) {
        toast.success(data.twilioMessage ?? `Dialling ${phone}`);
      } else {
        toast.message(data.twilioMessage ?? data.error ?? "Call queued — Twilio not live yet");
      }
      setCallModal({
        prospect: saved ?? p,
        twilioMessage: data.twilioMessage ?? "",
        twilioConfigured: Boolean(data.twilioConfigured),
        callPlaced: Boolean(data.placed),
        liveSessionId: data.sessionId ?? null,
        callSid: data.callSid ?? null,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function researchContacts() {
    setResearching(true);
    try {
      const res = await fetch("/api/prospector/research-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 6, deep: true }),
      });
      const data = (await res.json()) as { error?: string; message?: string; started?: boolean };
      if (!res.ok) {
        toast.error(data.error ?? "Research failed to start");
        return;
      }
      toast.success(data.message ?? "Researching ICP yards for named emails and switchboards");
      const t0 = Date.now();
      while (Date.now() - t0 < 120_000) {
        await new Promise((r) => setTimeout(r, 3000));
        const st = await fetch("/api/prospector/research-contacts");
        const meta = (await st.json()) as {
          running?: boolean;
          lastResult?: { emailsFound?: number; phonesFound?: number; researched?: number };
        };
        await load();
        if (!meta.running) {
          const found = meta.lastResult;
          toast.message(
            `Research pass finished — ${found?.emailsFound ?? 0} named email${(found?.emailsFound ?? 0) === 1 ? "" : "s"}, ${found?.phonesFound ?? 0} switchboard${(found?.phonesFound ?? 0) === 1 ? "" : "s"} on ${found?.researched ?? 0} yards.`,
          );
          return;
        }
      }
      await load();
    } finally {
      setResearching(false);
    }
  }

  async function importCsv() {
    const res = await fetch("/api/prospector/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText }),
    });
    const data = (await res.json()) as { imported?: number; skipped?: unknown[]; error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "CSV import failed");
      return;
    }
    setImportMsg(`Imported ${data.imported ?? 0} yards${data.skipped?.length ? ` · skipped ${data.skipped.length}` : ""}`);
    toast.success(`Imported ${data.imported ?? 0} ICP yards`);
    await load();
  }

  const regionPrice = regions.find((r) => r.id === regionFilter)?.professional;

  return (
    <section className="mb-10 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">ICP yards ({totalSeeded} seeded)</h2>
          <p className="text-sm text-muted-foreground">
            Sipho researches dealer sites for a named firstname@ and switchboard. Paste still
            overrides when the scrape only finds info@. High-ability first → Pilot → Monday proof →
            Professional
            {regionPrice ? ` (${regionPrice})` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            {["ZA", "AU", "GB", "AE", "US", "NZ"].map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <Button variant={highOnly ? "default" : "outline"} size="sm" onClick={() => setHighOnly((v) => !v)}>
            {highOnly ? "High ability" : "All ability"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void researchContacts()}
            disabled={researching}
          >
            {researching ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Research contacts
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/prospector/prospects?template=1">CSV template</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {prospects.slice(0, 24).map((p) => {
          const draft = draftFor(p);
          const busy = busyId === p.id;
          return (
            <Card key={p.id} className="card-premium">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{p.name}</h3>
                  <Badge variant="outline"> {p.score}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.location}</p>
                <p className="text-xs">{p.stockHint}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">{p.segment.replace(/_/g, " ")}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{p.abilityToPay}</Badge>
                </div>
                {p.website ? (
                  <a
                    href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.website}</span>
                  </a>
                ) : null}

                <div className="space-y-1.5 pt-1">
                  <div className="relative">
                    <Phone className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={draft.phone}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [p.id]: { ...draftFor(p), phone: e.target.value } }))
                      }
                      onBlur={() => void saveContact(p)}
                      placeholder="Switchboard (researched or paste)"
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={draft.email}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [p.id]: { ...draftFor(p), email: e.target.value } }))
                      }
                      onBlur={() => void saveContact(p)}
                      placeholder="firstname@dealer-domain"
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {draft.email.trim() ? (
                    <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" asChild>
                      <a href={`mailto:${draft.email.trim()}`}>
                        <Mail className="h-3 w-3 mr-1" />
                        mailto
                      </a>
                    </Button>
                  ) : null}
                  {draft.phone.trim() ? (
                    <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" asChild>
                      <a href={`tel:${draft.phone.trim()}`}>
                        <Phone className="h-3 w-3 mr-1" />
                        tel
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    className="h-7 text-[11px] px-2 btn-gold"
                    disabled={busy || sendEmail.isPending}
                    onClick={() => void handleSendEmail(p)}
                  >
                    {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                    Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] px-2"
                    disabled={busy}
                    onClick={() => void handleCall(p)}
                  >
                    {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <PhoneCall className="h-3 w-3 mr-1" />}
                    Call Themba
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {prospects.length > 24 && (
        <p className="text-xs text-muted-foreground">Showing 24 of {prospects.length} in this filter.</p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Import more yards (CSV)</p>
        <Textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="name,city,regionId,segment,abilityToPay,score,stockHint,phone,email,website,contactName,status"
          className="min-h-[90px] font-mono text-xs"
        />
        <Button size="sm" onClick={() => void importCsv()} disabled={!csvText.trim()}>
          Import CSV
        </Button>
        {importMsg && <p className="text-xs text-muted-foreground">{importMsg}</p>}
      </div>

      {callModal ? (
        <ProspectorCallModal
          prospect={callModal.prospect}
          twilioMessage={callModal.twilioMessage}
          twilioConfigured={callModal.twilioConfigured}
          callPlaced={callModal.callPlaced}
          liveSessionId={callModal.liveSessionId}
          callSid={callModal.callSid}
          onClose={() => setCallModal(null)}
          onSaveSession={async (prospectId, session) => {
            await fetch("/api/prospector/save-intel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prospectId, session }),
            });
          }}
        />
      ) : null}
    </section>
  );
}
