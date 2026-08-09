import { useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, XCircle, MessageSquareWarning, Inbox, Send, Trash2 } from "lucide-react";
import {
  computeAffordabilityHint,
  affordabilityLabel,
  FI_DOCUMENT_CHECKLIST,
  FI_BANK_PORTAL_NOTE,
} from "@shared/preapprovalAffordability";

type Decision = "approved" | "declined" | "more_info";

function numOrNull(n: string | number | null | undefined): number | null {
  if (n == null || n === "") return null;
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? v : null;
}

function fmtZAR(n: string | number | null | undefined): string {
  if (n == null || n === "") return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return String(n);
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(v);
}

function statusBadge(status: string) {
  switch (status) {
    case "submitted":
    case "in_review":
    case "received":
      return <Badge variant="outline">Pending review</Badge>;
    case "approved":
      return <Badge className="bg-emerald-600/15 text-emerald-400 border border-emerald-600/30">Proceed to F&I</Badge>;
    case "declined":
      return <Badge className="bg-destructive/15 text-destructive border border-destructive/30">Declined</Badge>;
    case "more_info_needed":
      return <Badge className="bg-amber-600/15 text-amber-400 border border-amber-600/30">More info</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function affordabilityBadge(flag: ReturnType<typeof computeAffordabilityHint>["flag"]) {
  const label = affordabilityLabel(flag);
  if (flag === "ok") {
    return <Badge className="bg-emerald-600/15 text-emerald-300 border-emerald-600/30">{label}</Badge>;
  }
  if (flag === "tight") {
    return <Badge className="bg-amber-600/15 text-amber-300 border-amber-600/30">{label}</Badge>;
  }
  if (flag === "stretched") {
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30">{label}</Badge>;
  }
  return <Badge variant="outline">{label}</Badge>;
}

export default function AdminPreApprovals() {
  const list = trpc.adminPreApprovals.list.useQuery();
  const utils = trpc.useUtils();
  const [openId, setOpenId] = useState<number | null>(null);
  const [decision, setDecision] = useState<Decision>("approved");
  const [note, setNote] = useState("");

  // WhatsApp reply state
  const [waTarget, setWaTarget] = useState<{ phone: string; name: string } | null>(null);
  const [waText, setWaText] = useState("");

  const sendWA = trpc.whatsapp.sendMessage.useMutation({
    onSuccess: (r: any) => {
      if (r.success) {
        toast.success("WhatsApp message sent to applicant");
        setWaTarget(null);
        setWaText("");
      } else {
        toast.error(r.error ?? "Send failed");
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const removeRow = trpc.adminPreApprovals.delete.useMutation({
    onSuccess: () => {
      toast.success("Pre-approval removed");
      utils.adminPreApprovals.list.invalidate();
      setOpenId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const decide = trpc.adminPreApprovals.decide.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Decision recorded");
      utils.adminPreApprovals.list.invalidate();
      // After recording decision, prompt to send WhatsApp to applicant
      const row = (list.data ?? []).find((r: any) => r.id === variables.id) as any;
      if (row?.phone) {
        const msg =
          variables.decision === "approved"
            ? `Hi ${row.fullName}, we've reviewed your finance enquiry (ref: ${row.referenceNumber}) and would like to continue with our F&I team for the formal bank application. This is not a credit approval yet — the bank makes that decision. We'll contact you shortly about the document pack.`
            : variables.decision === "declined"
              ? `Hi ${row.fullName}, thank you for your application (ref: ${row.referenceNumber}). We are unable to proceed at this time. Please contact us if you'd like to discuss alternatives.`
              : `Hi ${row.fullName}, we've reviewed your application (ref: ${row.referenceNumber}) and need a bit more information. We'll be in touch shortly.`;
        setWaTarget({ phone: row.phone, name: row.fullName });
        setWaText(msg);
      }
      setOpenId(null);
      setNote("");
    },
    onError: (err) => toast.error(err.message),
  });

  const rows = list.data ?? [];

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r: any) =>
      r.status === "submitted" || r.status === "in_review" || r.status === "received",
    ).length;
    const approved = rows.filter((r: any) => r.status === "approved").length;
    const declined = rows.filter((r: any) => r.status === "declined").length;
    return { total, pending, approved, declined };
  }, [rows]);

  const active = openId != null ? rows.find((r: any) => r.id === openId) : null;
  const activeHint = active
    ? computeAffordabilityHint({
        netMonthlyIncome: numOrNull(active.netMonthlyIncome),
        totalMonthlyExpenses: numOrNull(active.totalMonthlyExpenses),
        existingDebtMonthly: numOrNull(active.existingDebtMonthly),
        grossMonthlyIncome: numOrNull(active.grossMonthlyIncome),
      })
    : null;

  return (
    <AdminShell
      title="Pre-Approvals"
      subtitle="Naledi captures finance applications from your public form. Every decision is made here, by a human."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total received</CardDescription>
            <CardTitle className="font-display text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting review</CardDescription>
            <CardTitle className="font-display text-3xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="font-display text-3xl text-emerald-400">
              {stats.approved}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Declined</CardDescription>
            <CardTitle className="font-display text-3xl text-destructive">
              {stats.declined}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Application queue</CardTitle>
          <CardDescription>
            Click a row to see the full application and record a decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-3">
                No pre-approval applications yet. Share your dealership's apply link
                (e.g. <span className="font-mono">/apply/&lt;your-shortcode&gt;</span>) on your website.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Vehicle price</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.referenceNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.email} · {r.phone}
                      </div>
                    </TableCell>
                    <TableCell>{fmtZAR(r.vehiclePrice)}</TableCell>
                    <TableCell>{fmtZAR(r.desiredDeposit)}</TableCell>
                    <TableCell>{r.desiredTermMonths ? `${r.desiredTermMonths} mo` : "—"}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setOpenId(r.id);
                            setDecision(r.humanDecision ?? "approved");
                            setNote(r.humanNote ?? "");
                          }}
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={removeRow.isPending}
                          onClick={() => {
                            if (!confirm(`Remove pre-approval ${r.referenceNumber}?`)) return;
                            removeRow.mutate({ id: r.id });
                          }}
                          aria-label={`Remove ${r.referenceNumber}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openId != null} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {active?.fullName} ·{" "}
              <span className="font-mono text-sm text-muted-foreground">
                {active?.referenceNumber}
              </span>
            </DialogTitle>
            <DialogDescription>
              Naledi captured this. Approve means “proceed to dealer F&I / bank portal” — never a
              credit decision. GrayArx never auto-approves.
            </DialogDescription>
          </DialogHeader>

          {active && (
            <div className="space-y-5">
              {activeHint && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Affordability hint (reviewer only)
                    </span>
                    {affordabilityBadge(activeHint.flag)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Monthly disposable</div>
                      <div>{fmtZAR(activeHint.monthlyDisposable)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Debt-to-income</div>
                      <div>
                        {activeHint.debtToIncomeRatio != null
                          ? `${Math.round(activeHint.debtToIncomeRatio * 100)}%`
                          : "—"}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Hint only — not a credit score. Do not tell the applicant they are “approved”.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  F&I document pack (dealer collects — not GrayArx)
                </p>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  {FI_DOCUMENT_CHECKLIST.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground pt-1">{FI_BANK_PORTAL_NOTE}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Email</div>
                  <div>{active.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Phone</div>
                  <div>{active.phone}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">ID (masked)</div>
                  <div className="font-mono">{active.idNumberMasked ?? "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Employment</div>
                  <div>{active.employmentStatus ?? "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Employer</div>
                  <div>{active.employer ?? "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Months in role</div>
                  <div>{active.monthsEmployed ?? "—"}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Gross income</div>
                  <div>{fmtZAR(active.grossMonthlyIncome)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Net income</div>
                  <div>{fmtZAR(active.netMonthlyIncome)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Expenses</div>
                  <div>{fmtZAR(active.totalMonthlyExpenses)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Existing debt</div>
                  <div>{fmtZAR(active.existingDebtMonthly)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Vehicle price</div>
                  <div>{fmtZAR(active.vehiclePrice)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Deposit · Term</div>
                  <div>
                    {fmtZAR(active.desiredDeposit)} · {active.desiredTermMonths ? `${active.desiredTermMonths} mo` : "—"}
                  </div>
                </div>
              </div>

              {active.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-muted-foreground text-xs">Notes from applicant</div>
                    <div className="text-sm whitespace-pre-wrap">{active.notes}</div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <Label className="mb-2 block">Decision</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={decision === "approved" ? "default" : "outline"}
                    className={decision === "approved" ? "bg-emerald-600 hover:bg-emerald-600/90" : ""}
                    onClick={() => setDecision("approved")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button
                    type="button"
                    variant={decision === "more_info" ? "default" : "outline"}
                    className={decision === "more_info" ? "bg-amber-500 hover:bg-amber-500/90 text-black" : ""}
                    onClick={() => setDecision("more_info")}
                  >
                    <MessageSquareWarning className="h-4 w-4 mr-2" /> More info
                  </Button>
                  <Button
                    type="button"
                    variant={decision === "declined" ? "destructive" : "outline"}
                    onClick={() => setDecision("declined")}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Decline
                  </Button>
                </div>
              </div>

              <div>
                <Label>Note to the applicant (private)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Internal context, follow-up actions…"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenId(null)}>
              Cancel
            </Button>
            <Button
              className="btn-gold"
              disabled={decide.isPending || openId == null}
              onClick={() =>
                openId != null &&
                decide.mutate({ id: openId, decision, note: note || undefined })
              }
            >
              {decide.isPending ? "Saving…" : "Record decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-decision WhatsApp reply dialog */}
      <Dialog open={!!waTarget} onOpenChange={(v) => { if (!v) { setWaTarget(null); setWaText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send WhatsApp to {waTarget?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Notify the applicant of your decision. Edit the message before sending.
            </p>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <p className="text-sm font-mono mt-0.5">{waTarget?.phone}</p>
            </div>
            <div>
              <Label htmlFor="wa-pre-approval">Message</Label>
              <Textarea
                id="wa-pre-approval"
                className="mt-1"
                rows={6}
                value={waText}
                onChange={(e) => setWaText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setWaTarget(null); setWaText(""); }}>
              Skip
            </Button>
            <Button
              className="btn-gold"
              disabled={!waText.trim() || sendWA.isPending}
              onClick={() =>
                waTarget &&
                sendWA.mutate({
                  phoneNumber: waTarget.phone,
                  message: waText.trim(),
                })
              }
            >
              {sendWA.isPending ? "Sending…" : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
