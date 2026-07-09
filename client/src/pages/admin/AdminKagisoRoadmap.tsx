import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import {
  Sparkles,
  Coins,
  TrendingUp,
  Play,
  X,
  Bot,
  ListChecks,
  Cpu,
  Hand,
  Info,
  GitPullRequest,
  Check,
  Wand2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  low: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  info: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const SECTION_LABELS: Record<string, string> = {
  data_health: "Data health",
  agent_activity: "Agent activity",
  inventory: "Inventory",
  lead_pipeline: "Lead pipeline",
  pre_approvals: "Pre-approvals",
  fallback: "Fallback",
  brand_kit: "Brand kit",
  language_coverage: "Language coverage",
  ui_health: "UI health",
  commercial: "Commercial",
};

export default function AdminKagisoRoadmap() {
  const utils = trpc.useUtils();
  const { data: roadmap, isLoading } = trpc.adminKagiso.listRoadmap.useQuery();
  const { data: preview } = trpc.adminKagiso.auditCostPreview.useQuery(
    undefined,
    { refetchOnWindowFocus: false },
  );
  const { data: autoStatus } = trpc.adminKagiso.autonomousStatus.useQuery(
    undefined,
    { refetchInterval: 5 * 60 * 1000 },
  );

  const fullAudit = trpc.adminKagiso.runFullAudit.useMutation({
    onSuccess: (r: any) => {
      toast.success(
        `Audit complete · ${r.inserted} new findings · ${r.skipped} already on the board`,
      );
      utils.adminKagiso.listRoadmap.invalidate();
      utils.adminKagiso.auditCostPreview.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const decide = trpc.adminKagiso.decideRoadmap.useMutation({
    onSuccess: () => utils.adminKagiso.listRoadmap.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const [busyId, setBusyId] = useState<number | null>(null);

  // ---- v29: Proposed patches (Kagiso self-improvement loop) ----
  const { data: proposedPatches } =
    trpc.adminKagiso.listProposedPatches.useQuery({ status: "proposed" });
  const { data: allPatches } = trpc.adminKagiso.listProposedPatches.useQuery({
    limit: 50,
  });
  const [patchBusyId, setPatchBusyId] = useState<number | null>(null);
  const applyPatch = trpc.adminKagiso.applyPatch.useMutation({
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(`Patch applied (${r.bytesWritten} bytes)`);
      } else {
        toast.error(`Apply failed: ${r.error}`);
      }
      utils.adminKagiso.listProposedPatches.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const rejectPatch = trpc.adminKagiso.rejectPatch.useMutation({
    onSuccess: () => {
      toast.success("Patch rejected");
      utils.adminKagiso.listProposedPatches.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Kagiso → propose new agent
  const { data: dealerships } = trpc.admin.listDealerships.useQuery();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [proposeForm, setProposeForm] = useState({
    dealershipId: "",
    painPoints: "",
    recentActivity: "",
  });
  const [lastProposal, setLastProposal] = useState<
    | {
        name: string;
        role: string;
        description: string;
        impactEstimate: string;
        sampleOutput: string;
        confidence: number;
      }
    | null
  >(null);
  const propose = trpc.adminKagiso.proposeAgent.useMutation({
    onSuccess: (res) => {
      setLastProposal(res.proposal);
      utils.adminKagiso.listRoadmap.invalidate();
      toast.success(`Kagiso proposed ${res.proposal.name}`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const sorted = [...(roadmap ?? [])].sort(
    (a: any, b: any) =>
      (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
  );

  const pending = sorted.filter(
    (r: any) => r.status === "pending" || r.status === "proposed",
  );
  const totalPendingCredits = pending.reduce(
    (sum: number, r: any) => sum + (r.creditCostEstimate ?? r.creditCost ?? 0),
    0,
  );
  const totalPendingROI = pending.reduce(
    (sum: number, r: any) => sum + (r.roiEstimateZar ?? r.estimatedRoiZar ?? 0),
    0,
  );

  return (
    <AdminShell
      title="Kagiso upgrade roadmap"
      subtitle="Kagiso walks ten platform sections methodically and writes findings here. Each finding has a self-estimated credit cost, an ROI estimate, and an autonomous-vs-human flag. The numbers below are Kagiso's own estimates, not your real billing rate."
      actions={
        <div className="flex gap-2">
          <Dialog open={proposeOpen} onOpenChange={setProposeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bot className="h-4 w-4 mr-2" /> Propose new agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ask Kagiso to propose a new agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Dealership context (optional)</Label>
                  <Select
                    value={proposeForm.dealershipId}
                    onValueChange={(v) =>
                      setProposeForm({ ...proposeForm, dealershipId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Platform-wide (no specific dealership)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(dealerships ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pain points (comma-separated)</Label>
                  <Textarea
                    rows={2}
                    value={proposeForm.painPoints}
                    onChange={(e) =>
                      setProposeForm({ ...proposeForm, painPoints: e.target.value })
                    }
                    placeholder="too many manual approvals, slow vehicle valuation, no aftercare follow-up"
                  />
                </div>
                <div>
                  <Label>Recent activity summary (optional)</Label>
                  <Textarea
                    rows={3}
                    value={proposeForm.recentActivity}
                    onChange={(e) =>
                      setProposeForm({
                        ...proposeForm,
                        recentActivity: e.target.value,
                      })
                    }
                    placeholder="What's been happening over the last week?"
                  />
                </div>
                {lastProposal && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                    <div className="font-semibold text-primary mb-1">
                      Latest proposal · {lastProposal.name} — {lastProposal.role}
                    </div>
                    <div className="text-muted-foreground mb-2">
                      {lastProposal.description}
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Impact:</strong> {lastProposal.impactEstimate}
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Confidence:</strong>{" "}
                      {(lastProposal.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProposeOpen(false)}>
                  Close
                </Button>
                <Button
                  className="btn-gold"
                  disabled={propose.isPending}
                  onClick={() =>
                    propose.mutate({
                      dealershipId: proposeForm.dealershipId
                        ? Number(proposeForm.dealershipId)
                        : undefined,
                      painPoints: proposeForm.painPoints
                        ? proposeForm.painPoints
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : undefined,
                      recentActivity: proposeForm.recentActivity || undefined,
                    })
                  }
                >
                  {propose.isPending ? "Asking Kagiso…" : "Generate proposal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            className="btn-gold"
            onClick={() => fullAudit.mutate()}
            disabled={fullAudit.isPending}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {fullAudit.isPending ? "Auditing…" : "Run methodical audit"}
          </Button>
        </div>
      }
    >
      {/* Autonomous-mode status banner */}
      {autoStatus && (
        <div
          className={`mb-4 rounded-lg border p-3 text-sm flex items-center justify-between gap-3 ${
            autoStatus.isAutonomousActive
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
              : "bg-yellow-500/5 border-yellow-500/20 text-yellow-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <div>
              <span className="font-semibold">Kagiso autonomous mode · </span>
              {autoStatus.lastAuditRanAt ? (
                <>
                  last audit ran {Math.round((Date.now() - autoStatus.lastAuditRanAt.getTime()) / (1000 * 60 * 60))}h ago — next auto-run at{" "}
                  {autoStatus.nextAuditDueAt?.toLocaleTimeString()}
                </>
              ) : (
                <>no audit has run yet — it will fire automatically on the next inbound request</>
              )}
            </div>
          </div>
          <span className="text-xs opacity-70">{autoStatus.pendingFindingsCount} pending findings</span>
        </div>
      )}

      {/* Autonomous-cost rollup card — appears even before first run */}
      {preview && (
        <Card className="card-premium border-primary/30 mb-6">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    Autonomous run estimate (Kagiso's own numbers)
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    estimate · not billed
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  If Kagiso were to do every agent-autonomous finding from
                  today's audit by himself, his self-estimated credit budget is:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Audit run
                    </div>
                    <div className="font-display text-2xl font-bold">
                      {preview.cost.auditRun}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Autonomous fixes
                    </div>
                    <div className="font-display text-2xl font-bold text-primary">
                      {preview.cost.autonomousFindings.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total autonomous
                    </div>
                    <div className="font-display text-2xl font-bold text-emerald-500">
                      {preview.cost.total.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Hand className="h-3 w-3" /> Human-only items
                    </div>
                    <div className="font-display text-2xl font-bold">
                      {preview.cost.humanFindings.toLocaleString()}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
                  These are Kagiso's self-estimated credit units, not your
                  GrayArx billing rate. For real platform credit pricing, contact{" "}
                  <a
                    href="https://help.grayarx.com"
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    help.grayarx.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" /> Pending findings
            </div>
            <div className="font-display text-3xl font-bold mt-1">
              {pending.length}
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Coins className="h-3.5 w-3.5" /> Total cost (credits)
            </div>
            <div className="font-display text-3xl font-bold mt-1">
              {totalPendingCredits.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> Estimated ROI (R/year)
            </div>
            <div className="font-display text-3xl font-bold mt-1">
              R {totalPendingROI.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Cpu className="h-3.5 w-3.5" /> Autonomous-eligible
            </div>
            <div className="font-display text-3xl font-bold mt-1">
              {pending.filter((r: any) => r.agentAutonomous).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading roadmap…</p>}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            Kagiso hasn't written any findings yet.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Click <strong>Run methodical audit</strong> to walk all ten sections.
          </p>
        </div>
      )}

      {/* v29 — Kagiso self-improvement loop: Proposed Patches */}
      <Card className="card-premium mb-8 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Kagiso self-improvement loop
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                For a tightly allow-listed set of safe findings (stale
                marketing copy, SEO meta, safe constants), Kagiso drafts a
                single-file find/replace patch and parks it here for you to
                one-click apply. Nothing is ever auto-applied. The applier
                is sandboxed to `client/src/pages/`, `client/src/components/`,
                and a few shared constants — it cannot touch auth, payments,
                schema, or any server core.
              </p>
            </div>
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {(proposedPatches ?? []).length} awaiting review
            </Badge>
          </div>

          {(!proposedPatches || proposedPatches.length === 0) && (
            <div className="text-sm text-muted-foreground border border-dashed border-primary/20 rounded-md p-6 text-center">
              No patches proposed right now. Kagiso only drafts patches for
              findings whose hash matches a hard-coded recipe — next
              autonomous run will fill this if any safe-category finding is
              detected.
            </div>
          )}

          <div className="space-y-3">
            {(proposedPatches ?? []).map((patch: any) => (
              <Card key={patch.id} className="border-primary/15">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <GitPullRequest className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-medium truncate">{patch.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {patch.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono">
                          {patch.filePath}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {patch.rationale}
                      </p>
                      <pre className="mt-3 text-[11px] font-mono bg-muted/40 border border-border rounded p-3 overflow-x-auto whitespace-pre">
{patch.diffPreview}
                      </pre>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="btn-gold"
                        disabled={patchBusyId === patch.id}
                        onClick={() => {
                          setPatchBusyId(patch.id);
                          applyPatch.mutate(
                            { id: patch.id },
                            { onSettled: () => setPatchBusyId(null) },
                          );
                        }}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={patchBusyId === patch.id}
                        onClick={() => {
                          setPatchBusyId(patch.id);
                          rejectPatch.mutate(
                            { id: patch.id },
                            { onSettled: () => setPatchBusyId(null) },
                          );
                        }}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {allPatches && allPatches.some((p: any) => p.status !== "proposed") && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Show patch history ({
                  allPatches.filter((p: any) => p.status !== "proposed").length
                } past)
              </summary>
              <div className="mt-2 space-y-1 text-xs">
                {allPatches
                  .filter((p: any) => p.status !== "proposed")
                  .map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded bg-muted/30"
                    >
                      <span className="truncate">
                        <span className="font-mono text-[10px] text-muted-foreground mr-2">
                          {p.filePath}
                        </span>
                        {p.title}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {p.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sorted.map((item: any) => {
          const credit =
            item.creditCostEstimate ?? item.creditCost ?? 0;
          const roi = item.roiEstimateZar ?? item.estimatedRoiZar ?? 0;
          const isAutonomous = !!item.agentAutonomous;
          const isHumanRequired = !!item.humanRequired;
          return (
            <Card key={item.id} className="card-premium">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge
                        className={`text-xs ${PRIORITY_COLORS[item.priority] ?? ""}`}
                      >
                        {item.priority}
                      </Badge>
                      {item.severity && (
                        <Badge
                          className={`text-xs ${SEVERITY_COLORS[item.severity] ?? ""}`}
                        >
                          {item.severity}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      {item.auditSection && (
                        <Badge variant="outline" className="text-xs">
                          {SECTION_LABELS[item.auditSection] ?? item.auditSection}
                        </Badge>
                      )}
                      {isAutonomous && !isHumanRequired && (
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/30">
                          <Cpu className="h-3 w-3 mr-1" /> agent-autonomous
                        </Badge>
                      )}
                      {isHumanRequired && (
                        <Badge className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                          <Hand className="h-3 w-3 mr-1" /> needs human
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {item.description}
                    </p>
                    {item.rationale && (
                      <p className="text-xs text-muted-foreground/80 mt-2 italic">
                        Kagiso's reasoning: {item.rationale}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
                      <span className="flex items-center gap-1 text-primary">
                        <Coins className="h-3 w-3" /> {credit} credits
                      </span>
                      <span className="flex items-center gap-1 text-emerald-500">
                        <TrendingUp className="h-3 w-3" /> ~R{" "}
                        {roi.toLocaleString()} / yr
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {(item.status === "pending" ||
                      item.status === "proposed") && (
                      <>
                        <Button
                          size="sm"
                          className="btn-gold"
                          disabled={busyId === item.id}
                          onClick={() => {
                            setBusyId(item.id);
                            decide.mutate(
                              { itemId: item.id, decision: "approved" },
                              { onSettled: () => setBusyId(null) },
                            );
                          }}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === item.id}
                          onClick={() => {
                            setBusyId(item.id);
                            decide.mutate(
                              { itemId: item.id, decision: "dismissed" },
                              { onSettled: () => setBusyId(null) },
                            );
                          }}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                        </Button>
                      </>
                    )}
                    {item.status !== "pending" &&
                      item.status !== "proposed" && (
                        <Badge variant="outline">{item.status}</Badge>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
