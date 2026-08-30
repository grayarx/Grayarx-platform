import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Loader2,
  Car as CarIcon,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Pencil,
  Wrench,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Bookings() {
  return (
    <DealerShell
      title="Bookings"
      subtitle="Test drives (Lerato) and the workshop diary for this yard — WhatsApp and the counter share one list."
    >
      <Tabs defaultValue="drives" className="gap-4">
        <TabsList>
          <TabsTrigger value="drives">Test drives</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
        </TabsList>
        <TabsContent value="drives">
          <TestDrivesTab />
        </TabsContent>
        <TabsContent value="workshop">
          <WorkshopTab />
        </TabsContent>
      </Tabs>
    </DealerShell>
  );
}

/**
 * Customer test-drive bookings handled by Lerato. Scoped to the user's
 * dealership server-side via `adminBookings.list`.
 */
type ReclassifyBooking = { id: number; referenceNumber: string; customerName: string };
type ActualType = "general_viewing" | "consultation" | "call" | "inquiry" | "other";

const ACTUAL_TYPE_OPTIONS: { value: ActualType; label: string }[] = [
  { value: "general_viewing", label: "General viewing" },
  { value: "consultation", label: "Consultation" },
  { value: "call", label: "Phone call / enquiry" },
  { value: "inquiry", label: "Online inquiry" },
  { value: "other", label: "Other" },
];

function TestDrivesTab() {
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "requested"
    | "confirmed"
    | "rescheduled"
    | "completed"
    | "cancelled"
    | "no_show"
  >("all");
  const [reclassifyTarget, setReclassifyTarget] = useState<ReclassifyBooking | null>(null);
  const [reclassifyType, setReclassifyType] = useState<ActualType>("general_viewing");
  const [reclassifyNotes, setReclassifyNotes] = useState("");
  const [cancelBooking, setCancelBooking] = useState(true);

  const utils = trpc.useUtils();
  const { data, isLoading, isError, error, refetch } = trpc.adminBookings.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const decide = trpc.adminBookings.decide.useMutation({
    onSuccess: () => {
      utils.adminBookings.list.invalidate();
      toast.success("Booking updated");
    },
    onError: (e) => toast.error(e.message),
  });
  const reclassify = trpc.adminBookings.reclassify.useMutation({
    onSuccess: (res) => {
      utils.adminBookings.list.invalidate();
      toast.success(
        `Booking reclassified as "${ACTUAL_TYPE_OPTIONS.find((o) => o.value === res.actualType)?.label ?? res.actualType}"`,
      );
      setReclassifyTarget(null);
      setReclassifyNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const tdStatusClass = (s: string) => {
    const map: Record<string, string> = {
      requested: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      confirmed: "bg-primary/15 text-primary border-primary/30",
      rescheduled: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      completed: "bg-green-500/15 text-green-300 border-green-500/30",
      cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
      no_show: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    };
    return map[s] ?? "bg-muted text-muted-foreground border-border";
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="h-11 w-full md:w-56 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="rescheduled">Rescheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No-show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium rounded-2xl border border-primary/10 overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="border-primary/10 hover:bg-transparent">
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Suggested slot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Decide</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  <p className="mb-3 text-red-300">
                    {error?.message ?? "Could not load test-drive bookings."}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => refetch()}>
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && (!data || data.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  No test-drive bookings yet. Lerato will pencil in customer
                  requests here as they come in via the website or WhatsApp.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && data?.map((b: any) => (
              <TableRow key={b.id} className="border-primary/10">
                <TableCell>
                  <div className="font-mono text-xs">{b.referenceNumber}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {b.channel}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{b.customerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.customerContact}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {b.vehicleId ? `#${b.vehicleId}` : "—"}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {b.suggestedSlotStart
                      ? new Date(b.suggestedSlotStart).toLocaleString()
                      : "—"}
                  </div>
                  {b.confirmedSlotStart && (
                    <div className="text-[11px] text-primary mt-0.5">
                      Confirmed:{" "}
                      {new Date(b.confirmedSlotStart).toLocaleString()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`text-[10px] uppercase tracking-wider ${tdStatusClass(b.status)}`}
                  >
                    {b.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 flex-wrap">
                    {b.status === "requested" && (
                      <Button
                        size="sm"
                        className="btn-gold h-7 text-[11px] font-semibold"
                        onClick={() =>
                          decide.mutate({
                            id: b.id,
                            decision: "confirm",
                            confirmedSlotStart: b.suggestedSlotStart,
                            confirmedSlotEnd: b.suggestedSlotEnd,
                          })
                        }
                        disabled={decide.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                      </Button>
                    )}
                    {(b.status === "requested" || b.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() =>
                          decide.mutate({ id: b.id, decision: "reschedule" })
                        }
                        disabled={decide.isPending}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Reschedule
                      </Button>
                    )}
                    {b.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() =>
                          decide.mutate({ id: b.id, decision: "complete" })
                        }
                        disabled={decide.isPending}
                      >
                        Done
                      </Button>
                    )}
                    {b.status !== "cancelled" && b.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] text-red-300 border-red-500/30 hover:text-red-200"
                        onClick={() =>
                          decide.mutate({ id: b.id, decision: "cancel" })
                        }
                        disabled={decide.isPending}
                      >
                        <XCircle className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] text-amber-300 border-amber-500/30 hover:text-amber-200"
                      onClick={() => {
                        setReclassifyTarget({ id: b.id, referenceNumber: b.referenceNumber, customerName: b.customerName });
                        setReclassifyType("general_viewing");
                        setReclassifyNotes("");
                        setCancelBooking(true);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Reclassify
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!reclassifyTarget} onOpenChange={(open) => !open && setReclassifyTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Reclassify booking — {reclassifyTarget?.referenceNumber}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This booking for <strong className="text-foreground">{reclassifyTarget?.customerName}</strong> was
            logged as a test drive but may have been something else. Choose the actual type below.
          </p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Actual booking type</Label>
              <Select value={reclassifyType} onValueChange={(v) => setReclassifyType(v as ActualType)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTUAL_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any context about what actually happened…"
                value={reclassifyNotes}
                onChange={(e) => setReclassifyNotes(e.target.value)}
                rows={3}
                className="bg-background border-border resize-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cancelBooking}
                onChange={(e) => setCancelBooking(e.target.checked)}
                className="rounded"
              />
              <span className="text-muted-foreground">Cancel this test-drive slot (recommended)</span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReclassifyTarget(null)}>
              Discard
            </Button>
            <Button
              className="btn-gold font-semibold"
              disabled={reclassify.isPending}
              onClick={() => {
                if (!reclassifyTarget) return;
                reclassify.mutate({
                  id: reclassifyTarget.id,
                  actualType: reclassifyType,
                  notes: reclassifyNotes || undefined,
                  cancelBooking,
                });
              }}
            >
              {reclassify.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save reclassification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type WorkshopJob = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  vehicleDesc: string;
  serviceType: string;
  scheduledAt: string;
  status: string;
  source: string;
  notes?: string;
};

type JobPartLine = {
  id: string;
  serviceJobId: string;
  sku: string;
  name: string;
  qty: number;
  retailPrice: number;
};

type CalendarDay = { date: string; slots: WorkshopJob[] };

const SERVICE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "minor_service", label: "Minor service" },
  { value: "major_service", label: "Major service" },
  { value: "brakes", label: "Brakes" },
  { value: "diagnostics", label: "Diagnostics" },
  { value: "other", label: "Other / waiting on client" },
];

function formatJobType(type: string) {
  return SERVICE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function formatZar(n: number) {
  return `R${Number(n).toLocaleString("en-ZA")}`;
}

function WorkshopTab() {
  const [loading, setLoading] = useState(true);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [openJobs, setOpenJobs] = useState<WorkshopJob[]>([]);
  const [jobParts, setJobParts] = useState<JobPartLine[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openJob, setOpenJob] = useState<WorkshopJob | null>(null);
  const [form, setForm] = useState({
    buyerName: "",
    buyerPhone: "",
    vehicleDesc: "",
    serviceType: "other",
    notes: "",
  });

  const loadDiary = useCallback(async () => {
    const res = await fetch("/api/service/calendar", { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Could not load workshop diary");
    }
    setCalendar(Array.isArray(body.calendar) ? (body.calendar as CalendarDay[]) : []);
    setOpenJobs(Array.isArray(body.openJobs) ? (body.openJobs as WorkshopJob[]) : []);
    setJobParts(Array.isArray(body.jobParts) ? (body.jobParts as JobPartLine[]) : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadDiary()
      .catch((e: Error) => toast.error(e.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadDiary]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.buyerName.trim() || !form.vehicleDesc.trim()) {
      toast.error("Client name and vehicle are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/service/calendar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          buyerName: form.buyerName.trim(),
          buyerPhone: form.buyerPhone.trim() || undefined,
          vehicleDesc: form.vehicleDesc.trim(),
          serviceType: form.serviceType,
          notes: form.notes.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Could not create job");
      toast.success("Workshop job booked on this yard");
      setCreating(false);
      setForm({ buyerName: "", buyerPhone: "", vehicleDesc: "", serviceType: "other", notes: "" });
      await loadDiary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create job");
    } finally {
      setSaving(false);
    }
  };

  const partsFor = (jobId: string) => jobParts.filter((p) => p.serviceJobId === jobId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-xl">
          14-day diary for this yard. Nala “book a minor service” lands here too. Attach parts
          from the Parts counter after the client says yes.
        </p>
        <Button type="button" className="btn-gold" onClick={() => setCreating(true)}>
          <Wrench className="mr-2 h-4 w-4" />
          Create job
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading workshop diary…
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next 14 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {calendar.map((day) => (
                  <div
                    key={day.date}
                    className="rounded-lg border border-border px-3 py-2 min-h-[88px]"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString("en-ZA", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    {day.slots.length === 0 ? (
                      <p className="text-xs text-muted-foreground/70 mt-2">—</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {day.slots.map((slot) => (
                          <li key={slot.id}>
                            <button
                              type="button"
                              className="text-left text-sm text-foreground hover:text-primary w-full"
                              onClick={() => setOpenJob(slot)}
                            >
                              <span className="font-medium">{slot.vehicleDesc}</span>
                              <span className="block text-xs text-muted-foreground">
                                {slot.buyerName} · {formatJobType(slot.serviceType)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {openJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open workshop jobs. Create one at the counter or wait for Nala to book from WhatsApp.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5">Client</th>
                        <th className="px-3 py-2.5">Vehicle</th>
                        <th className="px-3 py-2.5">Job</th>
                        <th className="px-3 py-2.5">When</th>
                        <th className="px-3 py-2.5">Parts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {openJobs.map((job) => {
                        const lines = partsFor(job.id);
                        return (
                          <tr key={job.id} className="hover:bg-muted/20">
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                className="text-left font-medium text-foreground hover:text-primary"
                                onClick={() => setOpenJob(job)}
                              >
                                {job.buyerName}
                              </button>
                              <div className="text-[11px] text-muted-foreground uppercase">
                                {job.source}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">{job.vehicleDesc}</td>
                            <td className="px-3 py-2.5">{formatJobType(job.serviceType)}</td>
                            <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                              {new Date(job.scheduledAt).toLocaleString("en-ZA", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground">
                              {lines.length === 0
                                ? "None yet"
                                : lines.map((l) => `${l.qty}× ${l.sku}`).join(", ")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workshop job</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="job-client">Client name</Label>
              <Input
                id="job-client"
                value={form.buyerName}
                onChange={(e) => setForm((f) => ({ ...f, buyerName: e.target.value }))}
                placeholder="Thabo"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-phone">Phone (optional)</Label>
              <Input
                id="job-phone"
                value={form.buyerPhone}
                onChange={(e) => setForm((f) => ({ ...f, buyerPhone: e.target.value }))}
                placeholder="082…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-vehicle">Vehicle</Label>
              <Input
                id="job-vehicle"
                value={form.vehicleDesc}
                onChange={(e) => setForm((f) => ({ ...f, vehicleDesc: e.target.value }))}
                placeholder="Hilux in for cooling — waiting on client"
              />
            </div>
            <div className="space-y-1">
              <Label>Job type</Label>
              <Select
                value={form.serviceType}
                onValueChange={(v) => setForm((f) => ({ ...f, serviceType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-notes">Notes</Label>
              <Textarea
                id="job-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="h-20"
                placeholder="Waiting on client to approve the radiator"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-gold" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Book job
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openJob} onOpenChange={(open) => !open && setOpenJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openJob?.vehicleDesc}</DialogTitle>
          </DialogHeader>
          {openJob ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Client · </span>
                {openJob.buyerName}
                {openJob.buyerPhone && openJob.buyerPhone !== "counter"
                  ? ` · ${openJob.buyerPhone}`
                  : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Job · </span>
                {formatJobType(openJob.serviceType)} · {openJob.status} · {openJob.source}
              </p>
              <p className="text-xs font-mono text-muted-foreground">Ref {openJob.id}</p>
              {openJob.notes ? (
                <p className="text-muted-foreground">{openJob.notes}</p>
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Parts on this job
                </p>
                {partsFor(openJob.id).length === 0 ? (
                  <p className="text-muted-foreground">
                    None yet — book out from Parts and pick this job.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {partsFor(openJob.id).map((line) => (
                      <li key={line.id} className="flex justify-between gap-3">
                        <span>
                          {line.qty}× {line.name}{" "}
                          <span className="font-mono text-xs text-muted-foreground">{line.sku}</span>
                        </span>
                        <span className="tabular-nums">{formatZar(line.retailPrice)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenJob(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
