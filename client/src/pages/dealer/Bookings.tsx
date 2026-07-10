import { useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Car as CarIcon,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Pencil,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type BookingStatus = (typeof STATUS_OPTIONS)[number]["value"];

function statusClass(s: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    confirmed: "bg-primary/15 text-primary border-primary/30",
    completed: "bg-green-500/15 text-green-300 border-green-500/30",
    cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return map[s] ?? "";
}

export default function Bookings() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.dealer.listBookings.useQuery();
  const updateStatus = trpc.dealer.updateBookingStatus.useMutation({
    onSuccess: () => {
      utils.dealer.listBookings.invalidate();
      utils.dealer.stats.invalidate();
      toast.success("Booking updated");
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((b) => filter === "all" || b.status === filter)
      .filter((b) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          b.dealershipName.toLowerCase().includes(q) ||
          b.contactName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q)
        );
      });
  }, [data, filter, search]);

  return (
    <DealerShell
      title="Bookings"
      subtitle="Customer test-drive requests handled by Lerato, plus SaaS demo requests for the GrayArx platform itself."
    >
      <Tabs defaultValue="testdrives" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="testdrives" className="gap-2">
            <CarIcon className="h-4 w-4" /> Customer test drives
          </TabsTrigger>
          <TabsTrigger value="demos" className="gap-2">
            <CalendarIcon className="h-4 w-4" /> Platform demos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testdrives">
          <TestDrivesTab />
        </TabsContent>

        <TabsContent value="demos">
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dealership, contact, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-card border-border"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-11 w-full md:w-56 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium rounded-2xl border border-primary/10 overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-primary/10 hover:bg-transparent">
              <TableHead>Dealership</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Booked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No demo bookings yet.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((b) => (
              <TableRow key={b.id} className="border-primary/10">
                <TableCell>
                  <div className="font-medium">{b.dealershipName}</div>
                  {b.notes && (
                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                      {b.notes}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{b.contactName}</div>
                  <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-muted-foreground">
                    <a href={`mailto:${b.email}`} className="hover:text-primary flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {b.email}
                    </a>
                    <a href={`tel:${b.phone}`} className="hover:text-primary flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {b.phone}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{b.preferredDate}</div>
                      <div className="text-xs text-muted-foreground">{b.preferredTime}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={b.status}
                    onValueChange={(v) => updateStatus.mutate({ id: b.id, status: v as BookingStatus })}
                  >
                    <SelectTrigger className={`h-8 text-xs border ${statusClass(b.status)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {new Date(b.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
        </TabsContent>
      </Tabs>
    </DealerShell>
  );
}

/**
 * Customer test-drive bookings handled by Lerato. Distinct from the SaaS
 * "Platform demos" tab above (which is a dealer requesting a demo of the
 * GrayArx product). Test drives are scoped automatically to the user's
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

      {/* Reclassify modal */}
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
