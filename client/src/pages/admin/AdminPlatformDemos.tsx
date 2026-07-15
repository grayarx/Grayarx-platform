import { useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Mail,
  Phone,
  Calendar as CalendarIcon,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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

/**
 * Founder-only: SaaS platform demo requests (not dealership test drives).
 * Kept out of /dealer/bookings so dealers never see GrayArx sales pipeline.
 */
export default function AdminPlatformDemos() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.dealer.listBookings.useQuery();
  const updateStatus = trpc.dealer.updateBookingStatus.useMutation({
    onSuccess: () => {
      utils.dealer.listBookings.invalidate();
      toast.success("Demo booking updated");
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
    <AdminShell
      title="Platform demos"
      subtitle="GrayArx SaaS demo requests from the marketing site — founder/admin only. Dealership test drives live under each dealer's Bookings."
    >
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
                  No platform demo bookings yet.
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
                    onValueChange={(v) =>
                      updateStatus.mutate({ id: b.id, status: v as BookingStatus })
                    }
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
    </AdminShell>
  );
}
