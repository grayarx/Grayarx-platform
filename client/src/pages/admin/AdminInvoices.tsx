/**
 * Founder/admin view of Thandi's invoice ledger across any dealership.
 *
 * Pick a dealership, see her invoices, draft a new one, record payments.
 * POPIA: full customer/bank details live in the database; this page renders
 * only what's safe for a founder operator (already masked at the data layer
 * for any customer-facing PDF).
 */
import { useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Receipt, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
};

function formatRand(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function AdminInvoices() {
  const utils = trpc.useUtils();
  const { data: dealerships } = trpc.admin.listDealerships.useQuery();
  const [dealershipId, setDealershipId] = useState<number | null>(null);

  // Pick the first dealership as the default once it loads.
  const effectiveDealershipId = useMemo(() => {
    if (dealershipId) return dealershipId;
    return dealerships?.[0]?.id ?? null;
  }, [dealershipId, dealerships]);

  const invoicesQuery = trpc.thandi.listInvoices.useQuery(
    { dealershipId: effectiveDealershipId ?? 0, limit: 100 },
    { enabled: effectiveDealershipId !== null },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    leadId: "",
    vehicleId: "",
    subtotal: "",
    paymentTermsDays: "30",
  });

  const generateInvoice = trpc.thandi.generateInvoice.useMutation({
    onSuccess: (res) => {
      toast.success(`Invoice ${res.invoiceNumber} drafted`);
      setCreateOpen(false);
      setForm({ leadId: "", vehicleId: "", subtotal: "", paymentTermsDays: "30" });
      utils.thandi.listInvoices.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const updateStatus = trpc.thandi.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.thandi.listInvoices.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const totalOutstanding = useMemo(() => {
    if (!invoicesQuery.data) return 0;
    return invoicesQuery.data
      .filter((inv: any) => inv.status !== "paid")
      .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount ?? 0), 0);
  }, [invoicesQuery.data]);

  const totalPaid = useMemo(() => {
    if (!invoicesQuery.data) return 0;
    return invoicesQuery.data
      .filter((inv: any) => inv.status === "paid")
      .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount ?? 0), 0);
  }, [invoicesQuery.data]);

  return (
    <AdminShell
      title="Invoices · Thandi"
      subtitle="Thandi drafts and reconciles invoices across every dealership. POPIA-aware: customer-facing PDFs mask ID and bank-account numbers to last 4 digits."
      actions={
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              className="btn-gold"
              disabled={!effectiveDealershipId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Draft invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Draft a new invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="leadId">Lead ID</Label>
                  <Input
                    id="leadId"
                    type="number"
                    value={form.leadId}
                    onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                    placeholder="e.g. 42"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleId">Vehicle ID</Label>
                  <Input
                    id="vehicleId"
                    type="number"
                    value={form.vehicleId}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                    placeholder="e.g. 17"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="subtotal">Subtotal (R, excl VAT)</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    value={form.subtotal}
                    onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                    placeholder="259999.00"
                  />
                </div>
                <div>
                  <Label htmlFor="terms">Payment terms (days)</Label>
                  <Input
                    id="terms"
                    type="number"
                    value={form.paymentTermsDays}
                    onChange={(e) =>
                      setForm({ ...form, paymentTermsDays: e.target.value })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                VAT (15%) and total will be calculated automatically. The invoice
                starts in <code>draft</code> status — Thandi will hold it for
                review before sending.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="btn-gold"
                disabled={
                  !effectiveDealershipId ||
                  !form.leadId ||
                  !form.vehicleId ||
                  !form.subtotal ||
                  generateInvoice.isPending
                }
                onClick={() => {
                  if (!effectiveDealershipId) return;
                  generateInvoice.mutate({
                    dealershipId: effectiveDealershipId,
                    leadId: Number(form.leadId),
                    vehicleId: Number(form.vehicleId),
                    subtotal: Number(form.subtotal),
                    paymentTermsDays: Number(form.paymentTermsDays) || 30,
                  });
                }}
              >
                {generateInvoice.isPending ? "Drafting…" : "Draft invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <Label className="text-sm">Dealership</Label>
        <Select
          value={effectiveDealershipId?.toString() ?? ""}
          onValueChange={(v) => setDealershipId(Number(v))}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Pick a dealership" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KpiCard
          label="Invoices"
          value={(invoicesQuery.data ?? []).length}
          icon={FileText}
        />
        <KpiCard
          label="Outstanding"
          value={formatRand(totalOutstanding)}
          icon={AlertCircle}
          tone="warn"
        />
        <KpiCard
          label="Paid (this dealership)"
          value={formatRand(totalPaid)}
          icon={Receipt}
          tone="ok"
        />
      </div>

      {!effectiveDealershipId && (
        <div className="text-center py-12 text-muted-foreground">
          No dealership selected yet.
        </div>
      )}

      {effectiveDealershipId && (
        <Card className="card-premium">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Loading invoices…
                    </TableCell>
                  </TableRow>
                )}
                {!invoicesQuery.isLoading &&
                  (!invoicesQuery.data || invoicesQuery.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        No invoices yet for this dealership. Draft the first one.
                      </TableCell>
                    </TableRow>
                  )}
                {(invoicesQuery.data ?? []).map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground">#{inv.leadId}</TableCell>
                    <TableCell className="text-muted-foreground">#{inv.vehicleId}</TableCell>
                    <TableCell>{formatRand(Number(inv.subtotal))}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRand(Number(inv.vatAmount))}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatRand(Number(inv.totalAmount))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(inv.dueDate).toLocaleDateString("en-ZA")}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={inv.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({
                            invoiceId: inv.id,
                            status: v as any,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <Badge className={STATUS_TONE[inv.status] ?? ""}>
                            {inv.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">draft</SelectItem>
                          <SelectItem value="sent">sent</SelectItem>
                          <SelectItem value="paid">paid</SelectItem>
                          <SelectItem value="overdue">overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof Receipt;
  tone?: "ok" | "warn";
}) {
  return (
    <Card className="card-premium">
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="font-display text-2xl font-bold mt-1">{value}</div>
        </div>
        <Icon
          className={
            tone === "warn"
              ? "h-5 w-5 text-amber-400"
              : tone === "ok"
                ? "h-5 w-5 text-emerald-400"
                : "h-5 w-5 text-primary"
          }
        />
      </CardContent>
    </Card>
  );
}
