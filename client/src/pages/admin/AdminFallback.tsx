import { useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Mailbox, Clock, Phone, MessageSquare } from "lucide-react";

const CHANNEL_ICON: Record<string, typeof Mailbox> = {
  email: Mailbox,
  whatsapp: MessageSquare,
  call: Phone,
  web_chat: MessageSquare,
};

export default function AdminFallback() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adminFallback.list.useQuery();
  const { data: dealerships } = trpc.admin.listDealerships.useQuery();

  const resolve = trpc.adminFallback.resolve.useMutation({
    onSuccess: () => {
      utils.adminFallback.list.invalidate();
      toast.success("Marked resolved");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dealershipId: "",
    channel: "email" as "email" | "whatsapp" | "call" | "web_chat",
    customerName: "",
    customerContact: "",
    inboundMessage: "",
    language: "en",
    force: false,
  });

  const trigger = trpc.adminFallback.trigger.useMutation({
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Bongi drafted reply · ref ${res.reference}`);
        setOpen(false);
        setForm({
          dealershipId: "",
          channel: "email",
          customerName: "",
          customerContact: "",
          inboundMessage: "",
          language: "en",
          force: false,
        });
        utils.adminFallback.list.invalidate();
      } else {
        toast.error(res.reason);
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const all = data ?? [];
    const open = all.filter((m: any) => !m.resolvedAt).length;
    return { all: all.length, open, resolved: all.length - open };
  }, [data]);

  return (
    <AdminShell
      title="Fallback inbox · Bongi"
      subtitle="After-hours inbound messages where no human was available. Bongi drafts a professional reply with a reference number; you follow up the next business morning."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold">
              <Plus className="h-4 w-4 mr-2" />
              Trigger Bongi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manually trigger a fallback reply</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Dealership</Label>
                <Select
                  value={form.dealershipId}
                  onValueChange={(v) => setForm({ ...form, dealershipId: v })}
                >
                  <SelectTrigger>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Channel</Label>
                  <Select
                    value={form.channel}
                    onValueChange={(v) =>
                      setForm({ ...form, channel: v as typeof form.channel })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">email</SelectItem>
                      <SelectItem value="whatsapp">whatsapp</SelectItem>
                      <SelectItem value="call">call</SelectItem>
                      <SelectItem value="web_chat">web_chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Language</Label>
                  <Select
                    value={form.language}
                    onValueChange={(v) => setForm({ ...form, language: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="af">Afrikaans</SelectItem>
                      <SelectItem value="zu">isiZulu</SelectItem>
                      <SelectItem value="xh">isiXhosa</SelectItem>
                      <SelectItem value="st">Sesotho</SelectItem>
                      <SelectItem value="tn">Setswana</SelectItem>
                      <SelectItem value="ts">Xitsonga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Customer name</Label>
                  <Input
                    value={form.customerName}
                    onChange={(e) =>
                      setForm({ ...form, customerName: e.target.value })
                    }
                    placeholder="Sipho Dlamini"
                  />
                </div>
                <div>
                  <Label>Customer contact</Label>
                  <Input
                    value={form.customerContact}
                    onChange={(e) =>
                      setForm({ ...form, customerContact: e.target.value })
                    }
                    placeholder="+27 82 123 4567"
                  />
                </div>
              </div>
              <div>
                <Label>Inbound message</Label>
                <Textarea
                  value={form.inboundMessage}
                  onChange={(e) =>
                    setForm({ ...form, inboundMessage: e.target.value })
                  }
                  placeholder="What did the customer say?"
                  rows={4}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.force}
                  onChange={(e) => setForm({ ...form, force: e.target.checked })}
                />
                Force a reply even inside business hours (use sparingly)
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                className="btn-gold"
                disabled={!form.dealershipId || trigger.isPending}
                onClick={() =>
                  trigger.mutate({
                    dealershipId: Number(form.dealershipId),
                    channel: form.channel,
                    customerName: form.customerName || undefined,
                    customerContact: form.customerContact || undefined,
                    inboundMessage: form.inboundMessage || undefined,
                    language: form.language,
                    force: form.force,
                  })
                }
              >
                {trigger.isPending ? "Drafting…" : "Draft + send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="card-premium">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Total
            </div>
            <div className="font-display text-2xl font-bold mt-1">{counts.all}</div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Awaiting human follow-up
            </div>
            <div className="font-display text-2xl font-bold mt-1 text-amber-400">
              {counts.open}
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Resolved
            </div>
            <div className="font-display text-2xl font-bold mt-1 text-emerald-400">
              {counts.resolved}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-16 border border-dashed border-primary/15 rounded-2xl">
          <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No fallback messages right now.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Bongi only logs entries when an inbound is received outside business
            hours and no other agent picked it up.
          </p>
        </div>
      )}
      <div className="space-y-3">
        {data?.map((m: any) => {
          const ChannelIcon = CHANNEL_ICON[m.channel] ?? Mailbox;
          const resolved = !!m.resolvedAt;
          return (
            <Card key={m.id} className="card-premium">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ChannelIcon className="h-4 w-4 text-primary" />
                      <span className="font-semibold">
                        {m.customerName ?? "Anonymous customer"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        via {m.channel}
                      </span>
                      <Badge
                        className={
                          resolved
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }
                      >
                        {resolved ? "resolved" : "awaiting follow-up"}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">
                        {m.referenceNumber}
                      </Badge>
                    </div>
                    {m.inboundMessage && (
                      <p className="text-sm text-muted-foreground mt-2">
                        “{m.inboundMessage}”
                      </p>
                    )}
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                      <div className="text-[10px] uppercase tracking-wider text-primary mb-1">
                        Bongi replied
                      </div>
                      {m.outboundReply}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Received {new Date(m.createdAt).toLocaleString()}
                      {m.customerContact ? ` · ${m.customerContact}` : ""}
                    </p>
                  </div>
                  {!resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolve.mutate({ messageId: m.id })}
                      disabled={resolve.isPending}
                    >
                      Mark resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
