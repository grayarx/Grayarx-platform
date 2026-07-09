import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Brain,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

type Severity = "critical" | "high" | "medium" | "low";
type Status = "open" | "pending_approval" | "applied" | "dismissed";

const SEVERITY_CLASS: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-300 border-red-500/40",
  high: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  medium: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  low: "bg-muted text-muted-foreground border-border",
};

const SEVERITY_ICON: Record<Severity, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: Sparkles,
  low: Sparkles,
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.85 ? "bg-green-400" : value >= 0.65 ? "bg-amber-400" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{pct}% confidence</span>
    </div>
  );
}

function EvidencePanel({ raw }: { raw: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  if (!raw) return null;
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  return (
    <div className="rounded-md border border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5" />
          Why Kagiso thinks this
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2">
          <table className="w-full text-xs">
            <tbody>
              {Object.entries(parsed).map(([k, v]) => (
                <tr key={k} className="border-b border-border/40 last:border-0">
                  <td className="py-1 pr-2 font-mono text-muted-foreground">{k}</td>
                  <td className="py-1 font-mono text-foreground">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ImprovementsPage() {
  const [tab, setTab] = useState<Status>("pending_approval");
  const [proposal, setProposal] = useState<{
    actionId: number;
    actionTitle: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    patch: Record<string, unknown>;
    changedKeys: string[];
  } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const utils = trpc.useUtils();
  const { data: actions, isLoading } = trpc.improvement.list.useQuery({
    status: tab,
    limit: 100,
  });

  const runAudit = trpc.improvement.runAudit.useMutation({
    onSuccess: (res) => {
      toast.success(
        `Kagiso queued ${res.created.length} new action${res.created.length === 1 ? "" : "s"} for your review.`,
      );
      utils.improvement.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const utilsClient = trpc.useUtils();

  const confirmApply = trpc.improvement.confirmApply.useMutation({
    onSuccess: () => {
      toast.success("Approved and applied.");
      setProposal(null);
      setAcknowledged(false);
      utils.improvement.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const dismiss = trpc.improvement.dismiss.useMutation({
    onSuccess: () => {
      toast.success("Dismissed.");
      utils.improvement.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  async function openProposal(id: number, title: string) {
    try {
      const data = await utilsClient.improvement.proposeApply.fetch({ id });
      setProposal({
        actionId: id,
        actionTitle: title,
        before: data.before as Record<string, unknown>,
        after: data.after as Record<string, unknown>,
        patch: data.patch as Record<string, unknown>,
        changedKeys: data.changedKeys,
      });
      setAcknowledged(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not prepare proposal.";
      toast.error(msg);
    }
  }

  return (
    <DealerShell
      title="Improvements"
      subtitle="Kagiso audits your business and PROPOSES changes. Nothing is applied until you read the diff and approve."
      actions={
        <Button
          onClick={() => runAudit.mutate()}
          disabled={runAudit.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {runAudit.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Auditing…
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Run audit now
            </>
          )}
        </Button>
      }
    >
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="rounded-full bg-primary/20 p-2 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Ask-first AI</p>
            <p>
              Kagiso is an AI agent. Every finding shows you{" "}
              <span className="text-foreground">how confident it is</span> and the{" "}
              <span className="text-foreground">raw KPI numbers</span> behind it. When you click
              Apply, you see the exact before / after of every setting Kagiso wants to change, and
              nothing happens until you tick the approval box.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending_approval">Pending</TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : (actions ?? []).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                {tab === "pending_approval" ? (
                  <>
                    <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <p className="font-medium text-foreground">No actions waiting for review.</p>
                    <p className="text-sm">
                      Click <span className="text-foreground">Run audit now</span> to let Kagiso
                      scan the business and queue actions for your approval.
                    </p>
                  </>
                ) : (
                  <p>No {tab.replace("_", " ")} actions yet.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(actions ?? []).map((a) => {
                const Icon = SEVERITY_ICON[a.severity as Severity];
                const confidence = a.confidence ? Number(a.confidence) : null;
                return (
                  <Card key={a.id} className="border-border">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md border border-border bg-muted/40 p-2 text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-foreground">{a.title}</CardTitle>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={SEVERITY_CLASS[a.severity as Severity]}
                            >
                              {a.severity}
                            </Badge>
                            <Badge variant="outline" className="border-border text-muted-foreground">
                              {a.category.replace(/_/g, " ")}
                            </Badge>
                            {a.autoApplicable === 1 && (
                              <Badge
                                variant="outline"
                                className="border-primary/40 bg-primary/15 text-primary"
                              >
                                <Zap className="mr-1 h-3 w-3" />
                                Kagiso can do this
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="border-primary/40 bg-primary/10 text-primary"
                            >
                              <Brain className="mr-1 h-3 w-3" />
                              AI Agent
                            </Badge>
                          </div>
                          {confidence !== null && (
                            <div className="mt-2">
                              <ConfidenceBar value={confidence} />
                            </div>
                          )}
                        </div>
                      </div>

                      {tab === "pending_approval" && (
                        <div className="flex shrink-0 gap-2">
                          {a.autoApplicable === 1 && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openProposal(a.id, a.title)}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Review &amp; Apply
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismiss.mutate({ id: a.id })}
                            disabled={dismiss.isPending}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Finding
                        </p>
                        <p className="text-foreground/90">{a.finding}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Suggested fix
                        </p>
                        <p className="text-foreground/90">{a.suggestedFix}</p>
                      </div>
                      {a.impactEstimate && (
                        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2 text-foreground/80">
                          <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                          <span>{a.impactEstimate}</span>
                        </div>
                      )}
                      <EvidencePanel raw={a.evidence ?? null} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={proposal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setProposal(null);
            setAcknowledged(false);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Kagiso wants to apply: {proposal?.actionTitle}
            </DialogTitle>
            <DialogDescription>
              Here is the exact change to your settings. Nothing happens until you tick the
              acknowledgement box and click Approve.
            </DialogDescription>
          </DialogHeader>
          {proposal && proposal.changedKeys.length === 0 ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">
              This action has no automated lever \u2014 it's a recommendation for you to act on
              manually. Dismiss it after you've handled it.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-border">
                <div className="border-b border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Settings diff
                </div>
                <div className="divide-y divide-border">
                  {(proposal?.changedKeys ?? []).map((k) => (
                    <div key={k} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 text-xs">
                      <div>
                        <div className="font-mono text-muted-foreground">{k}</div>
                        <div className="font-mono text-foreground">
                          {String(proposal?.before[k] ?? "\u2014")}
                        </div>
                      </div>
                      <div className="text-primary">→</div>
                      <div>
                        <div className="font-mono text-muted-foreground opacity-0">{k}</div>
                        <div className="font-mono text-primary">
                          {String(proposal?.after[k] ?? "\u2014")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
                <Checkbox
                  checked={acknowledged}
                  onCheckedChange={(c) => setAcknowledged(c === true)}
                />
                <span className="text-foreground/90">
                  I have read the change above and I approve Kagiso applying it to my dealership.
                </span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProposal(null);
                setAcknowledged(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!acknowledged || confirmApply.isPending || !proposal || proposal.changedKeys.length === 0}
              onClick={() => {
                if (!proposal) return;
                confirmApply.mutate({ id: proposal.actionId, acknowledged: true });
              }}
            >
              {confirmApply.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve &amp; apply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DealerShell>
  );
}
