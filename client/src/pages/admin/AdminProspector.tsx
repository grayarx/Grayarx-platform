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

  const { data, isLoading } = trpc.prospects.list.useQuery();
  const { data: recentSends } = trpc.pilotEmail.recentSends.useQuery({ limit: 100 });
  const [poolRemaining, setPoolRemaining] = useState<number | null>(null);
  const [poolExhausted, setPoolExhausted] = useState(false);

  const emailedByAddress = new Map(
    (recentSends ?? []).map((s) => [s.email.trim().toLowerCase(), s] as const),
  );

  const scout = trpc.prospects.scout.useMutation({
    onSuccess: (result) => {
      utils.prospects.list.invalidate();
      if (result.created === 0 && "message" in result) {
        setPoolExhausted(true);
        setPoolRemaining(0);
        toast.warning(result.message as string);
      } else {
        setPoolExhausted(false);
        if ("poolRemaining" in result && typeof result.poolRemaining === "number") {
          setPoolRemaining(result.poolRemaining);
          toast.success(`${result.created} new prospect${result.created === 1 ? "" : "s"} added — ${result.poolRemaining} more in pool`);
        } else {
          toast.success(`${result.created} new prospect${result.created === 1 ? "" : "s"} added`);
        }
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
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
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function handleSendEmail(p: {
    id: number;
    email?: string | null;
    dealershipName: string;
    city?: string | null;
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
      subtitle="Dealerships our outreach team should target. AI-scored and refreshed daily. NOT visible to current dealerships."
      actions={
        <div className="flex items-center gap-2">
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
      {isLoading && <p className="text-muted-foreground">Loading prospects…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No prospects yet.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Click &ldquo;Generate prospects&rdquo; — Sipho only keeps dealerships with
            named/principal emails (info@ is blocked).
          </p>
        </div>
      )}
      {poolExhausted && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 mb-4">
          All dealerships in the local prospect pool have been added. Expand the pool or wait until next month.
        </div>
      )}
      {!poolExhausted && poolRemaining !== null && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground mb-4">
          <span className="font-medium text-foreground">{poolRemaining}</span> dealership{poolRemaining === 1 ? "" : "s"} remaining in the local prospect pool
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
