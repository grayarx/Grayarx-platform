import { Fragment, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Mail,
  Phone,
  KanbanSquare,
  Table2,
  Clock,
  CheckCheck,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function stepLabel(step: string) {
  if (step === "day_1") return "Day 1";
  if (step === "day_3") return "Day 3";
  if (step === "day_7") return "Day 7";
  return step;
}

export default function Leads() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LeadStatus | "followups">("all");
  const [expandedDraft, setExpandedDraft] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.dealer.listLeads.useQuery();
  const { data: followups } = trpc.dealer.listLeadFollowups.useQuery();

  const updateStatus = trpc.dealer.updateLeadStatus.useMutation({
    onMutate: async ({ id, status }) => {
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
      utils.dealer.listLeadFollowups.invalidate();
      utils.dealer.stats.invalidate();
      toast.success("Lead status updated");
    },
  });

  const markFollowedUp = trpc.dealer.markLeadFollowedUp.useMutation({
    onSuccess: () => {
      utils.dealer.listLeads.invalidate();
      utils.dealer.listLeadFollowups.invalidate();
      utils.dealer.stats.invalidate();
      toast.success("Marked followed up — reminders cancelled");
    },
    onError: (e) => toast.error(e.message),
  });

  const now = Date.now();
  const followupByLead = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        step: string;
        dueAt: Date | string;
        status: string;
        draftPreview: string | null;
        overdue: boolean;
      }
    >();
    for (const f of followups ?? []) {
      const due = new Date(f.dueAt).getTime();
      const overdue = f.status === "pending" && due <= now;
      const existing = map.get(f.leadId);
      // Prefer earliest pending / overdue, else first drafted
      if (!existing) {
        map.set(f.leadId, {
          id: f.id,
          step: f.step,
          dueAt: f.dueAt,
          status: f.status,
          draftPreview: f.draftPreview,
          overdue,
        });
        continue;
      }
      if (overdue && !existing.overdue) {
        map.set(f.leadId, {
          id: f.id,
          step: f.step,
          dueAt: f.dueAt,
          status: f.status,
          draftPreview: f.draftPreview,
          overdue,
        });
      }
    }
    return map;
  }, [followups, now]);

  const overdueCount = useMemo(
    () => [...followupByLead.values()].filter((f) => f.overdue).length,
    [followupByLead],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((l) => {
        if (filter === "followups") return followupByLead.has(l.id);
        if (filter === "all") return true;
        return l.status === filter;
      })
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
  }, [data, filter, search, followupByLead]);

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
      {overdueCount > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {overdueCount} follow-up{overdueCount === 1 ? "" : "s"} due
          </p>
          <p className="mt-1 text-xs text-amber-100/80">
            Mia drafted Day 1 / 3 / 7 reminders. Review drafts, then mark followed up when you contact the buyer.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 h-7 border-amber-500/40 text-amber-100 hover:bg-amber-500/20"
            onClick={() => setFilter("followups")}
          >
            Show follow-ups
          </Button>
        </div>
      ) : null}

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
            <SelectItem value="followups">
              Follow-ups{overdueCount > 0 ? ` (${overdueCount} due)` : ""}
            </SelectItem>
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
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead>Dealership</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Volume</TableHead>
                  <TableHead className="hidden lg:table-cell">Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Received</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No leads yet. They'll appear here the moment a dealership signs up.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((lead) => {
                  const fu = followupByLead.get(lead.id);
                  return (
                    <Fragment key={lead.id}>
                      <TableRow className="border-primary/10">
                        <TableCell>
                          <div className="font-medium">{lead.dealershipName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{lead.contactName}</div>
                          <div className="text-xs text-muted-foreground flex flex-col gap-0.5 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {lead.email}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {lead.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {lead.monthlyVehicles != null ? lead.monthlyVehicles : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {fu ? (
                            <div className="space-y-1">
                              <Badge
                                className={
                                  fu.overdue
                                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                    : "bg-primary/15 text-primary border-primary/30"
                                }
                              >
                                {fu.overdue ? "Overdue" : "Scheduled"} · {stepLabel(fu.step)}
                              </Badge>
                              {fu.draftPreview ? (
                                <button
                                  type="button"
                                  className="block text-[11px] text-primary underline underline-offset-2"
                                  onClick={() =>
                                    setExpandedDraft((id) => (id === lead.id ? null : lead.id))
                                  }
                                >
                                  {expandedDraft === lead.id ? "Hide draft" : "View Mia draft"}
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={lead.status}
                            onValueChange={(s) =>
                              updateStatus.mutate({
                                id: lead.id,
                                status: s as LeadStatus,
                              })
                            }
                          >
                            <SelectTrigger
                              className={`h-8 w-[130px] text-xs border ${statusBadge(lead.status)}`}
                            >
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
                          {lead.createdAt
                            ? new Date(lead.createdAt).toLocaleDateString("en-ZA")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {fu ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              disabled={markFollowedUp.isPending}
                              onClick={() => markFollowedUp.mutate({ id: lead.id })}
                            >
                              <CheckCheck className="h-3.5 w-3.5 mr-1" />
                              Followed up
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                      {expandedDraft === lead.id && fu?.draftPreview ? (
                        <TableRow className="border-primary/10 bg-card/40">
                          <TableCell colSpan={7} className="text-sm text-muted-foreground whitespace-pre-wrap">
                            <span className="text-xs uppercase tracking-wider text-primary block mb-2">
                              Mia draft · {stepLabel(fu.step)}
                            </span>
                            {fu.draftPreview}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {(Object.keys(grouped) as LeadStatus[]).map((status) => (
              <div
                key={status}
                className="rounded-2xl border border-primary/10 bg-card/30 p-3 min-h-[200px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = Number(e.dataTransfer.getData("text/plain"));
                  if (Number.isFinite(id)) {
                    updateStatus.mutate({ id, status });
                  }
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold capitalize">{status}</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {grouped[status].length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {grouped[status].map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(lead.id))}
                      className="rounded-xl border border-primary/15 bg-background/70 p-3 cursor-grab active:cursor-grabbing"
                    >
                      <p className="font-medium text-sm truncate">{lead.contactName}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.dealershipName}</p>
                      {followupByLead.get(lead.id)?.overdue ? (
                        <Badge className="mt-2 bg-rose-500/15 text-rose-300 border-rose-500/30 text-[10px]">
                          Follow-up overdue
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DealerShell>
  );
}
