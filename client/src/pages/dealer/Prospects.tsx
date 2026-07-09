import { useState } from "react";
import { Loader2, Sparkles, Phone, Trash2, Globe, Mail, CalendarClock, Pause, Play } from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "scouted", label: "Scouted" },
  { value: "queued_for_call", label: "Queued for call" },
  { value: "called", label: "Called" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "rejected", label: "Rejected" },
] as const;

type ProspectStatus = (typeof STATUS_OPTIONS)[number]["value"];

function statusClass(s: string) {
  const map: Record<string, string> = {
    new: "bg-muted text-muted-foreground border-border",
    scouted: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    queued_for_call: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    called: "bg-primary/15 text-primary border-primary/30",
    contacted: "bg-primary/15 text-primary border-primary/30",
    converted: "bg-green-500/15 text-green-300 border-green-500/30",
    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return map[s] ?? "";
}

const SA_REGIONS = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

export default function Prospects() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.prospects.list.useQuery();

  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState("Gauteng");
  const [city, setCity] = useState("");
  const [targetVolume, setTargetVolume] = useState("");
  const [brandFocus, setBrandFocus] = useState("");
  const [count, setCount] = useState(5);

  const scout = trpc.prospects.scout.useMutation({
    onSuccess: (res) => {
      utils.prospects.list.invalidate();
      utils.dealer.stats.invalidate();
      setOpen(false);
      if (res.created > 0) {
        toast.success(`Prospector found ${res.created} new dealerships`);
      } else {
        toast.error("Prospector returned no results — try again");
      }
    },
    onError: () => toast.error("Prospector failed — please retry"),
  });

  const handoff = trpc.prospects.handoff.useMutation({
    onSuccess: () => {
      utils.prospects.list.invalidate();
      utils.dealer.stats.invalidate();
      toast.success("Handed off to Calling Agent");
    },
  });
  const updateStatus = trpc.prospects.updateStatus.useMutation({
    onSuccess: () => utils.prospects.list.invalidate(),
  });
  const remove = trpc.prospects.remove.useMutation({
    onSuccess: () => {
      utils.prospects.list.invalidate();
      utils.dealer.stats.invalidate();
      toast.success("Prospect removed");
    },
  });

  const schedules = trpc.prospects.listSchedules.useQuery();
  const nightly = schedules.data?.jobs.find((j) => j.name === "prospector-nightly");

  const enableNightly = trpc.prospects.enableNightlySchedule.useMutation({
    onSuccess: (res) => {
      schedules.refetch();
      if (res.success) toast.success("Nightly Prospector enabled — it'll run every day at 05:00 SAST.");
      else toast.error(`Could not enable schedule: ${res.error ?? "unknown error"}`);
    },
  });
  const toggleSchedule = trpc.prospects.setScheduleEnabled.useMutation({
    onSuccess: () => {
      schedules.refetch();
      toast.success("Schedule updated");
    },
  });
  const deleteSchedule = trpc.prospects.deleteSchedule.useMutation({
    onSuccess: () => {
      schedules.refetch();
      toast.success("Schedule removed");
    },
  });
  // TODO: Wire sendEmail mutation when tRPC types regenerate
  // const sendEmail = trpc.prospects.sendEmail.useMutation({...});

  return (
    <DealerShell
      title="Prospector AI"
      subtitle="Your autonomous business-development agent. It scouts South African dealerships matching your criteria, scores them, then hands the best ones to the Calling Agent."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {!nightly && (
            <Button
              variant="outline"
              onClick={() => enableNightly.mutate()}
              disabled={enableNightly.isPending}
            >
              <CalendarClock className="h-4 w-4 mr-2" />
              {enableNightly.isPending ? "Scheduling…" : "Enable nightly"}
            </Button>
          )}
          {nightly && (
            <div className="flex items-center gap-2 rounded-md border border-primary/20 px-3 py-2 text-xs bg-card/50">
              <CalendarClock className="h-4 w-4 text-primary" />
              <span>
                Nightly {nightly.isEnable ? <span className="text-green-400">active</span> : <span className="text-amber-400">paused</span>}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleSchedule.mutate({ taskUid: nightly.taskUid, enable: !nightly.isEnable })}
              >
                {nightly.isEnable ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteSchedule.mutate({ taskUid: nightly.taskUid })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold font-semibold">
              <Sparkles className="h-4 w-4 mr-2" /> Run Prospector
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Run a scouting session</DialogTitle>
              <DialogDescription>
                The agent uses AI to identify dealerships in your chosen area that fit your ideal customer profile.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2">
                <Label>Region *</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>City (optional)</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Sandton" className="mt-1" />
              </div>
              <div>
                <Label>Target monthly volume</Label>
                <Input value={targetVolume} onChange={(e) => setTargetVolume(e.target.value)} placeholder="e.g. 50-150" className="mt-1" />
              </div>
              <div>
                <Label>Brand focus</Label>
                <Input value={brandFocus} onChange={(e) => setBrandFocus(e.target.value)} placeholder="Premium / Used / EV" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>How many prospects?</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Math.min(10, Math.max(1, Number(e.target.value) || 5)))}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                className="btn-gold"
                onClick={() =>
                  scout.mutate({
                    region,
                    city: city || undefined,
                    targetVolume: targetVolume || undefined,
                    brandFocus: brandFocus || undefined,
                    count,
                  })
                }
                disabled={scout.isPending}
              >
                {scout.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Scouting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Run scout
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      }
    >
      {isLoading && (
        <div className="py-16 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      )}
      {!isLoading && (!data || data.length === 0) && (
        <div className="card-premium rounded-2xl border border-primary/10 p-16 text-center">
          <Sparkles className="h-10 w-10 mx-auto text-primary/50 mb-4" />
          <h3 className="font-display text-2xl font-semibold">No prospects yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Run the Prospector to have AI find qualified South African dealerships ready for your Calling Agent.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((p: any) => (
          <div key={p.id} className="card-premium rounded-2xl border border-primary/10 p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg font-semibold leading-tight truncate">
                  {p.dealershipName}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {[p.city, p.region].filter(Boolean).join(", ") || "South Africa"}
                </p>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary text-xs whitespace-nowrap">
                {p.score}/100
              </Badge>
            </div>

            {p.rationale && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{p.rationale}</p>
            )}

            <div className="mt-4 space-y-1.5 text-xs">
              {p.phone && (
                <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                  <Phone className="h-3 w-3" /> {p.phone}
                </a>
              )}
              {p.email && (
                <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary truncate">
                  <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{p.email}</span>
                </a>
              )}
              {p.website && (
                <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary truncate">
                  <Globe className="h-3 w-3 shrink-0" /> <span className="truncate">{p.website}</span>
                </a>
              )}
            </div>

            {p.brandsCarried && (
              <div className="flex flex-wrap gap-1 mt-3">
                {p.brandsCarried.split(",").slice(0, 4).map((b: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {b.trim()}
                  </Badge>
                ))}
              </div>
            )}

            <div className="border-t border-primary/10 mt-4 pt-4 flex items-center gap-2">
              <Select
                value={p.status}
                onValueChange={(s) => updateStatus.mutate({ id: p.id, status: s as ProspectStatus })}
              >
                <SelectTrigger className={`h-8 text-xs flex-1 border ${statusClass(p.status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                onClick={() => {
                  if (confirm(`Remove ${p.dealershipName}?`)) remove.mutate({ id: p.id });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2 mt-3">
              {p.status !== "queued_for_call" && p.status !== "called" && p.status !== "contacted" && p.status !== "converted" && (
                <Button
                  size="sm"
                  className="btn-gold font-semibold flex-1"
                  onClick={() => handoff.mutate({ id: p.id })}
                  disabled={handoff.isPending}
                >
                  <Phone className="h-3.5 w-3.5 mr-2" /> Hand off to Calling Agent
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info("Send email feature coming soon")}
                disabled={false}
              >
                <Mail className="h-3.5 w-3.5 mr-2" /> "Send Email"
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DealerShell>
  );
}
