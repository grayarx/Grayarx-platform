/**
 * Founder/admin invoice ledger across any dealership.
 *
 * Pick a dealership, create invoices, record payments.
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InvoicePreviewDialog } from "@/components/invoices/InvoicePreviewDialog";
import { Plus, Receipt, FileText, AlertCircle, Printer, Eye } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { OS_INVOICE_PLANS, osInvoicePlanById } from "@shared/osPlans";

type InvoiceKind = "subscription" | "other";

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

  const emptyForm = {
    invoiceType: "subscription" as InvoiceKind,
    planId: "professional",
    leadId: "",
    vehicleId: "",
    subtotal: "14990",
    paymentTermsDays: "30",
  };
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Form -> preview (no DB write yet) -> confirm creates it for real.
  const [draftPreviewOpen, setDraftPreviewOpen] = useState(false);

  const namedPlanSelected =
    form.invoiceType === "subscription" && form.planId !== "custom";

  const buildDraftPayload = () => ({
    dealershipId: effectiveDealershipId ?? 0,
    leadId:
      form.invoiceType === "other" && form.leadId ? Number(form.leadId) : undefined,
    vehicleId:
      form.invoiceType === "other" && form.vehicleId
        ? Number(form.vehicleId)
        : undefined,
    subtotal: Number(form.subtotal),
    paymentTermsDays: Number(form.paymentTermsDays) || 30,
    ...(namedPlanSelected ? { planId: form.planId } : {}),
  });

  const previewInvoice = trpc.thandi.previewInvoice.useMutation({
    onSuccess: () => {
      setCreateOpen(false);
      setDraftPreviewOpen(true);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const generateInvoice = trpc.thandi.generateInvoice.useMutation({
    onSuccess: (res) => {
      toast.success(`Invoice ${res.invoiceNumber} created`);
      setDraftPreviewOpen(false);
      setForm(emptyForm);
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

  const { data: stripeAvailable } = trpc.billing.stripeAvailable.useQuery();
  const { data: platformBank } = trpc.billing.platformBankDetails.useQuery();
  const stripeCheckout = trpc.billing.createStripeCheckout.useMutation({
    onSuccess: (res) => {
      if (res.url) {
        window.location.href = res.url;
      } else {
        toast.error("No Checkout URL returned");
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  // Gate the "Email EFT" send action behind a preview of the exact invoice
  // the dealership will see, so nothing goes out unreviewed.
  const [sendPreview, setSendPreview] = useState<{ invoiceId: number } | null>(
    null,
  );
  const sendPreviewQuery = trpc.thandi.getInvoice.useQuery(
    { invoiceId: sendPreview?.invoiceId ?? 0 },
    { enabled: !!sendPreview },
  );

  const emailInvoice = trpc.billing.emailInvoicePaymentInstructions.useMutation({
    onSuccess: (res) => {
      toast.success(`EFT invoice emailed to ${res.to}`);
      setSendPreview(null);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const generateSubInvoice = trpc.billing.generateInvoice.useMutation({
    onSuccess: (res) => {
      toast.success(`Subscription invoice ${res.invoiceNumber} created`);
      utils.thandi.listInvoices.invalidate();
      utils.billing.listInvoices.invalidate();
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
      title="Invoices"
      subtitle="Create and reconcile invoices. Download / Print opens a new tab. Subscription invoices include FNB EFT details."
      actions={
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              className="btn-gold"
              disabled={!effectiveDealershipId}
            >
              <Plus className="h-4 w-4 mr-2" />
              New invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Invoice type</Label>
                <RadioGroup
                  value={form.invoiceType}
                  onValueChange={(v) => {
                    const invoiceType = v as InvoiceKind;
                    if (invoiceType === "subscription") {
                      const plan = osInvoicePlanById("professional");
                      setForm({
                        ...form,
                        invoiceType,
                        planId: "professional",
                        subtotal: String(plan?.priceMonthlyZar ?? 14990),
                      });
                      return;
                    }
                    setForm({ ...form, invoiceType, planId: "custom" });
                  }}
                  className="gap-2"
                >
                  <label
                    htmlFor="type-subscription"
                    className="flex cursor-pointer items-start gap-2 rounded-md border border-input p-3 text-sm hover:bg-accent/40"
                  >
                    <RadioGroupItem value="subscription" id="type-subscription" className="mt-0.5" />
                    <span>
                      <span className="font-medium">Subscription (monthly platform fee)</span>
                      <span className="block text-xs text-muted-foreground">
                        The common case — GrayArx bills the dealership for platform access.
                        No lead/vehicle needed.
                      </span>
                    </span>
                  </label>
                  <label
                    htmlFor="type-other"
                    className="flex cursor-pointer items-start gap-2 rounded-md border border-input p-3 text-sm hover:bg-accent/40"
                  >
                    <RadioGroupItem value="other" id="type-other" className="mt-0.5" />
                    <span>
                      <span className="font-medium">Other / linked to a lead-vehicle</span>
                      <span className="block text-xs text-muted-foreground">
                        Rare — a specific referral or commission invoice tied to one deal.
                      </span>
                    </span>
                  </label>
                </RadioGroup>
              </div>

              {form.invoiceType === "other" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="leadId">Lead ID (optional)</Label>
                    <Input
                      id="leadId"
                      type="number"
                      value={form.leadId}
                      onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                      placeholder="e.g. 42"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleId">Vehicle ID (optional)</Label>
                    <Input
                      id="vehicleId"
                      type="number"
                      value={form.vehicleId}
                      onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                      placeholder="e.g. 17"
                    />
                  </div>
                </div>
              )}

              {form.invoiceType === "subscription" && (
                <div>
                  <Label htmlFor="planId" className="mb-2 block">
                    Plan
                  </Label>
                  <Select
                    value={form.planId}
                    onValueChange={(v) => {
                      if (v === "custom") {
                        setForm({ ...form, planId: "custom" });
                        return;
                      }
                      const plan = osInvoicePlanById(v);
                      setForm({
                        ...form,
                        planId: v,
                        subtotal: plan ? String(plan.priceMonthlyZar) : form.subtotal,
                      });
                    }}
                  >
                    <SelectTrigger id="planId">
                      <SelectValue placeholder="Pick a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {OS_INVOICE_PLANS.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} — R{plan.priceMonthlyZar.toLocaleString("en-US")}/mo
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {namedPlanSelected ? (
                  <div>
                    <Label>Subtotal (R, excl VAT)</Label>
                    <p className="mt-2 text-sm font-medium">
                      {formatRand(Number(form.subtotal))}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        / month
                      </span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="subtotal">Subtotal (R, excl VAT)</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      step="0.01"
                      value={form.subtotal}
                      onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                      placeholder="14990"
                    />
                  </div>
                )}
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
                Not VAT-registered — invoice total equals subtotal. VAT will be added only
                after GrayArx registers for VAT. Lead/Vehicle IDs are only references for a
                specific deal — they are not how GrayArx gets paid. You'll see a preview of
                the actual invoice before it's created.
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
                  !form.subtotal ||
                  Number(form.subtotal) <= 0 ||
                  previewInvoice.isPending
                }
                onClick={() => {
                  if (!effectiveDealershipId) return;
                  previewInvoice.mutate(buildDraftPayload());
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewInvoice.isPending ? "Building preview…" : "Preview invoice"}
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
        {effectiveDealershipId && (
          <Button
            variant="outline"
            size="sm"
            disabled={generateSubInvoice.isPending}
            onClick={() =>
              generateSubInvoice.mutate({ dealershipId: effectiveDealershipId })
            }
          >
            {generateSubInvoice.isPending ? "Creating…" : "Post-pilot sub invoice (ZAR)"}
          </Button>
        )}
        {stripeAvailable?.available ? (
          <span className="text-xs text-emerald-500">Stripe Checkout enabled</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Bank/EFT only (set STRIPE_SECRET_KEY for card Checkout)
          </span>
        )}
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

      {platformBank && (
        <Card className="card-premium mb-6 border-primary/20">
          <CardContent className="p-4 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
              Platform EFT (subscription invoices)
            </div>
            {platformBank.configured ? (
              <div className="grid gap-1 sm:grid-cols-2 text-muted-foreground">
                <div>
                  Bank: <span className="text-foreground font-medium">{platformBank.bankName}</span>
                </div>
                <div>
                  Account name:{" "}
                  <span className="text-foreground font-medium">{platformBank.accountName}</span>
                </div>
                <div>
                  Account:{" "}
                  <span className="text-foreground font-mono font-medium">
                    {platformBank.accountNumber}
                  </span>
                </div>
                <div>
                  Branch:{" "}
                  <span className="text-foreground font-mono font-medium">
                    {platformBank.branchCode}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-amber-600 dark:text-amber-400">
                Not configured — set <code className="text-xs">BANK_ACCOUNT_NUMBER</code> (and
                BANK_NAME / BRANCH / ACCOUNT_NAME) on Railway so PDF + email show pay-to details.
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
                  <TableHead className="text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Loading invoices…
                    </TableCell>
                  </TableRow>
                )}
                {!invoicesQuery.isLoading &&
                  (!invoicesQuery.data || invoicesQuery.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                        No invoices yet for this dealership. Create the first one.
                      </TableCell>
                    </TableRow>
                  )}
                {(invoicesQuery.data ?? []).map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {Number(inv.leadId) > 0 ? `#${inv.leadId}` : "— (subscription)"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {Number(inv.vehicleId) > 0 ? `#${inv.vehicleId}` : "—"}
                    </TableCell>
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
                      <div className="flex flex-col gap-1">
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
                        {inv.status !== "paid" && (
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] px-2"
                              onClick={() =>
                                updateStatus.mutate({
                                  invoiceId: inv.id,
                                  status: "paid",
                                })
                              }
                            >
                              Mark paid (EFT)
                            </Button>
                            {stripeAvailable?.available && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] px-2"
                                disabled={stripeCheckout.isPending}
                                onClick={() =>
                                  stripeCheckout.mutate({ invoiceId: inv.id })
                                }
                              >
                                Stripe pay
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8"
                        >
                          <Link href={`/admin/invoices/${inv.id}/print`}>
                            <Printer className="h-3.5 w-3.5 mr-1.5" />
                            Download / Print
                          </Link>
                        </Button>
                        {(!inv.leadId || Number(inv.leadId) === 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px]"
                            disabled={
                              emailInvoice.isPending || !platformBank?.configured
                            }
                            onClick={() => setSendPreview({ invoiceId: inv.id })}
                          >
                            Email EFT
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <InvoicePreviewDialog
        open={draftPreviewOpen}
        onOpenChange={(open) => {
          setDraftPreviewOpen(open);
          if (!open) setCreateOpen(true);
        }}
        title="Preview — nothing created yet"
        loading={previewInvoice.isPending}
        doc={previewInvoice.data?.document}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDraftPreviewOpen(false);
                setCreateOpen(true);
              }}
            >
              Back to edit
            </Button>
            <Button
              className="btn-gold"
              disabled={!effectiveDealershipId || generateInvoice.isPending}
              onClick={() => {
                if (!effectiveDealershipId) return;
                generateInvoice.mutate(buildDraftPayload());
              }}
            >
              {generateInvoice.isPending ? "Creating…" : "Confirm & create"}
            </Button>
          </>
        }
      />

      <InvoicePreviewDialog
        open={!!sendPreview}
        onOpenChange={(open) => !open && setSendPreview(null)}
        title={`Review before sending${
          sendPreviewQuery.data?.invoice?.invoiceNumber
            ? ` — ${sendPreviewQuery.data.invoice.invoiceNumber}`
            : ""
        }`}
        loading={sendPreviewQuery.isLoading}
        doc={sendPreviewQuery.data?.document}
        footer={
          <>
            <Button variant="outline" onClick={() => setSendPreview(null)}>
              Cancel
            </Button>
            <Button
              className="btn-gold"
              disabled={emailInvoice.isPending}
              onClick={() => {
                if (!sendPreview) return;
                emailInvoice.mutate({ invoiceId: sendPreview.invoiceId });
              }}
            >
              {emailInvoice.isPending ? "Sending…" : "Confirm & email EFT invoice"}
            </Button>
          </>
        }
      />
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
