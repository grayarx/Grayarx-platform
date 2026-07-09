import { useMemo, useState } from "react";
import { Loader2, Search, Mail, Phone, KanbanSquare, Table2 } from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
] as const;

type LeadStatus = (typeof STATUS_OPTIONS)[number]["value"];

function statusBadge(s: string) {
  const map: Record<string, string> = {
    new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    contacted: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    qualified: "bg-primary/15 text-primary border-primary/30",
    converted: "bg-green-500/15 text-green-300 border-green-500/30",
    lost: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return map[s] ?? "bg-muted text-foreground";
}

export default function Leads() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.dealer.listLeads.useQuery();
  const updateStatus = trpc.dealer.updateLeadStatus.useMutation({
    onMutate: async ({ id, status }) => {
      // Optimistic update so the kanban card re-renders into its new column
      // immediately on drop (instant feedback, rollback on error).
      await utils.dealer.listLeads.cancel();
      const previous = utils.dealer.listLeads.getData();
      if (previous) {
        utils.dealer.listLeads.setData(
          undefined,
          previous.map((l) =>
            l.id === id ? { ...l, status: status as LeadStatus } : l,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) utils.dealer.listLeads.setData(undefined, ctx.previous);
      toast.error("Couldn't update lead — reverted.");
    },
    onSuccess: () => {
      utils.dealer.listLeads.invalidate();
      utils.dealer.stats.invalidate();
      toast.success("Lead status updated");
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((l) => filter === "all" || l.status === filter)
      .filter((l) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          l.dealershipName.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q)
        );
      });
  }, [data, filter, search]);

  const grouped = useMemo(() => {
    const buckets: Record<LeadStatus, typeof filtered> = {
      new: [],
      contacted: [],
      qualified: [],
      converted: [],
      lost: [],
    };
    for (const l of filtered) {
      const s = (l.status as LeadStatus) ?? "new";
      if (buckets[s]) buckets[s].push(l);
    }
    return buckets;
  }, [filtered]);

  return (
    <DealerShell
      title="Leads"
      subtitle="Every lead captured by your AI agents and website forms — switch to Kanban to drag-and-drop between stages."
    >
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dealership, contact, email, phone..."
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

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="table" className="gap-2">
            <Table2 className="h-4 w-4" /> Table
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <KanbanSquare className="h-4 w-4" /> Kanban
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="card-premium rounded-2xl border border-primary/10 overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead>Dealership</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Volume</TableHead>
                  <TableHead className="hidden lg:table-cell">Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Received</TableHead>
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
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No leads yet. They'll appear here the moment a dealership signs up.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((lead) => (
                  <TableRow key={lead.id} className="border-primary/10">
                    <TableCell>
                      <div className="font-medium">{lead.dealershipName}</div>
                      {lead.notes && (
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {lead.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{lead.contactName}</div>
                      <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-muted-foreground">
                        <a href={`mailto:${lead.email}`} className="hover:text-primary flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </a>
                        <a href={`tel:${lead.phone}`} className="hover:text-primary flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {lead.monthlyVehicles ? `${lead.monthlyVehicles}/mo` : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="text-xs uppercase">
                        {lead.language ?? "en"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({ id: lead.id, status: v as LeadStatus })
                        }
                      >
                        <SelectTrigger className={`h-8 text-xs border ${statusBadge(lead.status)}`}>
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
                      {new Date(lead.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {STATUS_OPTIONS.map((stage) => (
                <KanbanColumn
                  key={stage.value}
                  stage={stage.value}
                  label={stage.label}
                  leads={grouped[stage.value] ?? []}
                  onDropLead={(leadId) =>
                    updateStatus.mutate({ id: leadId, status: stage.value })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DealerShell>
  );
}

interface KanbanColumnProps {
  stage: LeadStatus;
  label: string;
  leads: Array<{
    id: number;
    dealershipName: string;
    contactName: string;
    email: string;
    phone: string;
    status: string;
    language?: string | null;
    monthlyVehicles?: number | null;
    createdAt: Date | string;
  }>;
  onDropLead: (leadId: number) => void;
}

function KanbanColumn({ stage, label, leads, onDropLead }: KanbanColumnProps) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const raw = e.dataTransfer.getData("text/lead-id");
        const id = Number.parseInt(raw, 10);
        if (Number.isFinite(id)) onDropLead(id);
      }}
      className={`rounded-2xl border p-3 min-h-[400px] transition-colors ${
        over
          ? "border-primary bg-primary/5"
          : "border-primary/10 bg-card/40"
      }`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusBadge(stage)}`}>
          {label}
        </div>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {leads.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8 italic">
            Drop leads here
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/lead-id", String(lead.id));
                e.dataTransfer.effectAllowed = "move";
              }}
              className="rounded-lg border border-primary/10 bg-background/60 p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
            >
              <div className="font-medium text-sm">{lead.dealershipName}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {lead.contactName}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px] uppercase">
                  {lead.language ?? "en"}
                </Badge>
                {lead.monthlyVehicles ? (
                  <span>{lead.monthlyVehicles}/mo</span>
                ) : null}
                <span className="ml-auto">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
