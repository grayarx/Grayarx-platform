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
import { CheckCircle2, XCircle, MessageSquareWarning, Inbox } from "lucide-react";

type Decision = "approved" | "declined" | "more_info";

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
    case "received":
      return <Badge variant="outline">Received</Badge>;
    case "approved":
      return <Badge className="bg-emerald-600/15 text-emerald-400 border border-emerald-600/30">Approved</Badge>;
    case "declined":
      return <Badge className="bg-destructive/15 text-destructive border border-destructive/30">Declined</Badge>;
    case "more_info_needed":
      return <Badge className="bg-amber-600/15 text-amber-400 border border-amber-600/30">More info</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function AdminPreApprovals() {
  const list = trpc.adminPreApprovals.list.useQuery();
  const utils = trpc.useUtils();
  const [openId, setOpenId] = useState<number | null>(null);
  const [decision, setDecision] = useState<Decision>("approved");
  const [note, setNote] = useState("");

  const decide = trpc.adminPreApprovals.decide.useMutation({
    onSuccess: () => {
      toast.success("Decision recorded");
      utils.adminPreApprovals.list.invalidate();
      setOpenId(null);
      setNote("");
    },
    onError: (err) => toast.error(err.message),
  });

  const rows = list.data ?? [];

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r: any) => r.status === "received").length;
    const approved = rows.filter((r: any) => r.status === "approved").length;
    const declined = rows.filter((r: any) => r.status === "declined").length;
    return { total, pending, approved, declined };
  }, [rows]);

  const active = openId != null ? rows.find((r: any) => r.id === openId) : null;

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
              Naledi captured this. The decision below is yours — never automated.
            </DialogDescription>
          </DialogHeader>

          {active && (
            <div className="space-y-5">
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
    </AdminShell>
  );
}
