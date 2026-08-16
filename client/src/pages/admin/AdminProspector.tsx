import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Globe, Sparkles, Loader2, Send, PhoneCall, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SEGMENT_LABELS: Record<string, string> = {
  no_website_social_only: "No website — social only",
  basic_website_no_showroom: "Basic website — no showroom",
  after_hours_leak: "After-hours lead leak",
  whatsapp_manual: "WhatsApp — manual replies",
};

type HandoffPack = {
  dealershipName: string;
  called: boolean;
  queued: boolean;
  reason?: string;
  followUpText: string;
  callScript: string;
};

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label}`);
  }
}

export default function AdminProspector() {
  const utils = trpc.useUtils();
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [handoffId, setHandoffId] = useState<number | null>(null);
  const [handoffPack, setHandoffPack] = useState<HandoffPack | null>(null);
  const [segments, setSegments] = useState<Record<number, string>>({});

  const { data: scoutJob } = trpc.prospects.scoutJobStatus.useQuery(undefined, {
    refetchInterval: (q) => (q.state.data?.running ? 3000 : 15_000),
  });
  const { data, isLoading } = trpc.prospects.list.useQuery(undefined, {
    refetchInterval: scoutJob?.running ? 4000 : false,
  });
  const { data: recentSends } = trpc.pilotEmail.recentSends.useQuery({ limit: 100 });
  const [poolRemaining, setPoolRemaining] = useState<number | null>(null);
  const [poolExhausted, setPoolExhausted] = useState(false);

  const activeQueue =
    typeof scoutJob?.researchRemaining === "number"
      ? scoutJob.researchRemaining
      : poolRemaining;
  const coolingDown =
    typeof scoutJob?.coolingDown === "number" ? scoutJob.coolingDown : 0;

  const emailedByAddress = new Map(
    (recentSends ?? []).map((s) => [s.email.trim().toLowerCase(), s] as const),
  );

  const scout = trpc.prospects.scout.useMutation({
    onSuccess: (result) => {
      utils.prospects.list.invalidate();
      utils.prospects.scoutJobStatus.invalidate();
      if ("researchRemaining" in result && typeof result.researchRemaining === "number") {
        setPoolRemaining(result.researchRemaining);
      }
      setPoolExhausted(false);
      if ("started" in result && result.started) {
        toast.success(
          "message" in result && result.message
            ? String(result.message)
            : "Sipho is researching dealer websites — refresh shortly",
        );
        return;
      }
      if (result.created === 0 && "message" in result) {
        toast.message(result.message as string);
      } else {
        const remaining =
          "researchRemaining" in result && typeof result.researchRemaining === "number"
            ? result.researchRemaining
            : null;
        toast.success(
          `${result.created} principal contact${result.created === 1 ? "" : "s"} found${
            remaining !== null ? ` — ${remaining} still to research` : ""
          }`,
        );
      }
    },
    onError: (e: { message: string }) => {
      const msg = e.message || "";
      if (/Unexpected token|<!DOCTYPE|is not valid JSON/i.test(msg)) {
        toast.error(
          "Server timed out mid-research. Try Generate again — Sipho now runs in the background so this should not happen.",
        );
        return;
      }
      toast.error(msg);
    },
  });
  const sendEmail = trpc.pilotEmail.sendToDbProspect.useMutation({
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const handoff = trpc.prospects.handoff.useMutation({
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const removeProspect = trpc.prospects.remove.useMutation({
    onSuccess: () => {
      utils.prospects.list.invalidate();
      toast.success("Prospect removed");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const purgeAll = trpc.prospects.purgeAll.useMutation({
    onSuccess: (result) => {
      utils.prospects.list.invalidate();
      toast.success(
        `Cleared ${result.deletedProspects} prospect${result.deletedProspects === 1 ? "" : "s"}. Scout will only add named/principal emails.`,
      );
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const addPrincipal = trpc.prospects.addPrincipal.useMutation({
    onSuccess: (result) => {
      utils.prospects.list.invalidate();
      utils.prospects.scoutJobStatus.invalidate();
      toast.success(result.created ? "Principal prospect added" : "Principal email updated");
      setPasteOpen(false);
      setPasteForm({
        dealershipName: "",
        email: "",
        website: "",
        contactName: "",
        phone: "",
        city: "",
      });
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteForm, setPasteForm] = useState({
    dealershipName: "",
    email: "",
    website: "",
    contactName: "",
    phone: "",
    city: "",
  });

  async function handleSendEmail(p: {
    id: number;
    email?: string | null;
    dealershipName: string;
    city?: string | null;
    website?: string | null;
    brandsCarried?: string | null;
    estimatedMonthlyVolume?: number | null;
  }) {
    const email = p.email?.trim();
    if (!email) {
      toast.error("No email address for this prospect");
      return;
    }
    setSendingId(p.id);
    try {
      const result = await sendEmail.mutateAsync({
        email,
        dealershipName: p.dealershipName,
        contactName: "there",
        city: p.city ?? undefined,
        website: p.website ?? undefined,
        brands: p.brandsCarried ?? undefined,
        estimatedVolume: p.estimatedMonthlyVolume ?? undefined,
        segment: (segments[p.id] ?? "basic_website_no_showroom") as
          | "no_website_social_only"
          | "basic_website_no_showroom"
          | "after_hours_leak"
          | "whatsapp_manual",
      });
      if (result.success) {
        toast.success(`Pilot email sent to ${email}${result.messageId ? ` (${result.messageId})` : ""}`);
        void utils.pilotEmail.recentSends.invalidate();
      } else {
        toast.error(`Failed to send: ${result.error ?? "unknown error"}`);
      }
    } finally {
      setSendingId(null);
    }
  }

  async function handleHandoff(p: { id: number; dealershipName: string }) {
    setHandoffId(p.id);
    try {
      const result = await handoff.mutateAsync({ id: p.id });
      if (!result.success) {
        toast.error("error" in result ? String(result.error) : "Handoff failed");
        return;
      }
      void utils.prospects.list.invalidate();
      setHandoffPack({
        dealershipName: p.dealershipName,
        called: Boolean(result.called),
        queued: Boolean(result.queued),
        reason: "reason" in result ? result.reason : undefined,
        followUpText: result.followUpText ?? "",
        callScript: result.callScript ?? "",
      });
      if (result.called) {
        toast.success(`Themba dialled ${p.dealershipName}`);
      } else {
        toast.message(`Queued for Themba — copy the follow-up below`);
      }
    } finally {
      setHandoffId(null);
    }
  }

  return (
    <AdminShell
      title="Prospector"
      subtitle="Sipho digs named principals (not info@). Paste a verified firstname@dealer when you find one — highest yield. NOT visible to dealerships."
      actions={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={() => setPasteOpen(true)}>
            Paste principal
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (
                !window.confirm(
                  "Remove ALL prospects? Sipho will only re-add dealerships with named/principal emails (not info@).",
                )
              ) {
                return;
              }
              purgeAll.mutate();
            }}
            disabled={purgeAll.isPending || !(data && data.length > 0)}
          >
            {purgeAll.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear all
          </Button>
          <Button
            className="btn-gold"
            onClick={() => scout.mutate({ region: "Gauteng", count: 5 })}
            disabled={scout.isPending}
          >
            {scout.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate prospects
          </Button>
        </div>
      }
    >
      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0a0a0c] border-primary/25 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">Paste principal contact</DialogTitle>
            <DialogDescription>
              Add a named inbox on the dealer domain (e.g. thabo@yard.co.za). Rejects info@ /
              sales@. Instant card — no scrape wait.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Dealership name *"
              value={pasteForm.dealershipName}
              onChange={(e) => setPasteForm((f) => ({ ...f, dealershipName: e.target.value }))}
              className="bg-black/40 border-white/15"
            />
            <Input
              placeholder="Website URL * (https://…)"
              value={pasteForm.website}
              onChange={(e) => setPasteForm((f) => ({ ...f, website: e.target.value }))}
              className="bg-black/40 border-white/15"
            />
            <Input
              placeholder="Principal email * (firstname@dealer-domain)"
              value={pasteForm.email}
              onChange={(e) => setPasteForm((f) => ({ ...f, email: e.target.value }))}
              className="bg-black/40 border-white/15"
            />
            <Input
              placeholder="Contact name (optional)"
              value={pasteForm.contactName}
              onChange={(e) => setPasteForm((f) => ({ ...f, contactName: e.target.value }))}
              className="bg-black/40 border-white/15"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Phone"
                value={pasteForm.phone}
                onChange={(e) => setPasteForm((f) => ({ ...f, phone: e.target.value }))}
                className="bg-black/40 border-white/15"
              />
              <Input
                placeholder="City"
                value={pasteForm.city}
                onChange={(e) => setPasteForm((f) => ({ ...f, city: e.target.value }))}
                className="bg-black/40 border-white/15"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasteOpen(false)} className="border-white/20">
              Cancel
            </Button>
            <Button
              className="btn-gold"
              disabled={
                addPrincipal.isPending ||
                !pasteForm.dealershipName.trim() ||
                !pasteForm.email.trim() ||
                !pasteForm.website.trim()
              }
              onClick={() =>
                addPrincipal.mutate({
                  dealershipName: pasteForm.dealershipName.trim(),
                  email: pasteForm.email.trim(),
                  website: pasteForm.website.trim(),
                  contactName: pasteForm.contactName.trim() || undefined,
                  phone: pasteForm.phone.trim() || undefined,
                  city: pasteForm.city.trim() || undefined,
                  region: "Gauteng",
                })
              }
            >
              {addPrincipal.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save principal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading && <p className="text-muted-foreground">Loading prospects…</p>}
      {!isLoading && (!data || data.length === 0) && !scoutJob?.running && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No prospects yet.</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
            Sipho researches continuously (~every 10 min): imports known named
            emails, then digs the next dealers. New cards appear when he finds a
            real firstname@dealer-domain inbox.
            <span className="block mt-1">
              Generate is optional — a short burst if you want more checked now.
            </span>
          </p>
        </div>
      )}
      {scoutJob?.running && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>
            Sipho is researching dealer websites for principal emails…
            {typeof scoutJob.researchRemaining === "number"
              ? ` ${scoutJob.researchRemaining} left in queue.`
              : ""}
          </span>
        </div>
      )}
      {!scoutJob?.running && scoutJob?.lastResult && (
        <div
          className={`rounded-lg border px-4 py-2 text-xs mb-4 ${
            scoutJob.lastResult.created > 0
              ? "border-emerald-500/25 bg-emerald-500/5 text-muted-foreground"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}
        >
          Last research: checked{" "}
          <span className="text-foreground font-medium">
            {scoutJob.lastResult.researched ?? "—"}
          </span>{" "}
          site{(scoutJob.lastResult.researched ?? 0) === 1 ? "" : "s"}, found{" "}
          <span className="text-foreground font-medium">
            {scoutJob.lastResult.created}
          </span>{" "}
          principal contact{scoutJob.lastResult.created === 1 ? "" : "s"}
          {scoutJob.lastResult.names?.length
            ? ` (${scoutJob.lastResult.names.slice(0, 3).join(", ")}${scoutJob.lastResult.names.length > 3 ? "…" : ""})`
            : ""}
          {scoutJob.lastResult.created === 0 ? (
            <span className="block mt-1 opacity-90">
              Not broken — those sites mostly only list info@. Tried dealers cool down
              for a few hours so the active queue moves; deeper directory/press crawl
              runs on the next enrich pass. Click Generate again to check more.
            </span>
          ) : null}
        </div>
      )}
      {poolExhausted && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 mb-4">
          Active research queue empty for now (or all remaining dealers are cooling down).
          Sipho retries after cooldown; scheduled enrich still digs deeper.
        </div>
      )}
      {!poolExhausted && activeQueue !== null && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground mb-4">
          <span className="font-medium text-foreground">{activeQueue}</span> dealership
          {activeQueue === 1 ? "" : "s"} left in the active research queue
          {coolingDown > 0
            ? ` (${coolingDown} cooling down after a recent empty check)`
            : ""}{" "}
          — named emails only, no filler like jane.doe
        </div>
      )}
      {(recentSends?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm mb-4">
          <p className="font-medium text-foreground mb-1">
            {recentSends!.length} pilot email{recentSends!.length === 1 ? "" : "s"} logged
          </p>
          <p className="text-xs text-muted-foreground">
            &ldquo;Sent&rdquo; means Resend accepted the message (has a message id). Opens/bounces are in the{" "}
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Resend dashboard
            </a>
            , not here.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((p) => {
          const email = p.email?.trim().toLowerCase() ?? "";
          const prior = email ? emailedByAddress.get(email) : undefined;
          const status = String(p.status ?? "");
          return (
            <Card key={p.id} className="card-premium">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold leading-tight truncate">
                    {p.dealershipName}
                  </h3>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      Score {p.score ?? "—"}
                    </Badge>
                    {status ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {status.replace(/_/g, " ")}
                      </Badge>
                    ) : null}
                    {prior ? (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
                        Emailed {new Date(prior.sentAt).toLocaleDateString()}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {p.region && <div>{p.region}</div>}
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:underline truncate"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{p.website}</span>
                    </a>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> {p.email}
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> {p.phone}
                    </div>
                  )}
                </div>
                {p.brandsCarried && (
                  <div className="flex flex-wrap gap-1">
                    {p.brandsCarried.split(",").slice(0, 4).map((b: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {b.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                {p.estimatedMonthlyVolume && (
                  <p className="text-xs text-muted-foreground">
                    ~{p.estimatedMonthlyVolume} vehicles/month
                  </p>
                )}
                <div className="pt-2 border-t border-primary/10 space-y-2">
                  {p.email && (
                    <>
                      <Select
                        value={segments[p.id] ?? "basic_website_no_showroom"}
                        onValueChange={(v) => setSegments((prev) => ({ ...prev, [p.id]: v }))}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SEGMENT_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs btn-gold"
                        disabled={sendingId === p.id}
                        onClick={() => handleSendEmail(p)}
                      >
                        {sendingId === p.id ? (
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3 mr-1.5" />
                        )}
                        {prior ? "Resend pilot email" : "Send pilot email"}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs"
                    disabled={handoffId === p.id || handoff.isPending}
                    onClick={() => handleHandoff(p)}
                  >
                    {handoffId === p.id ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <PhoneCall className="h-3 w-3 mr-1.5" />
                    )}
                    Hand off to Themba
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-7 text-xs text-destructive hover:text-destructive"
                    disabled={removingId === p.id || removeProspect.isPending}
                    onClick={() => {
                      if (!confirm(`Remove ${p.dealershipName} from Prospector?`)) return;
                      setRemovingId(p.id);
                      removeProspect.mutate(
                        { id: p.id },
                        { onSettled: () => setRemovingId(null) },
                      );
                    }}
                  >
                    {removingId === p.id ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1.5" />
                    )}
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={handoffPack != null} onOpenChange={(v) => !v && setHandoffPack(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Themba handoff · {handoffPack?.dealershipName}</DialogTitle>
            <DialogDescription>
              {handoffPack?.called
                ? "Outbound call started. Keep the WhatsApp follow-up ready."
                : "Call queued (Twilio not dialling yet). Copy the playbook texts below."}
              {handoffPack?.reason ? ` ${handoffPack.reason}` : ""}
            </DialogDescription>
          </DialogHeader>
          {handoffPack && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    WhatsApp / email follow-up
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => copyText("Follow-up", handoffPack.followUpText)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <Textarea readOnly value={handoffPack.followUpText} className="min-h-[120px] text-sm" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Call script (spoken opener)
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => copyText("Call script", handoffPack.callScript)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <Textarea readOnly value={handoffPack.callScript} className="min-h-[100px] text-sm" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHandoffPack(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
