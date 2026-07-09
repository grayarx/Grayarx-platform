import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};

const ACTION_LABELS: Record<string, string> = {
  send_email: "Send email",
  send_whatsapp: "Send WhatsApp",
  make_call: "Make call",
  send_invoice: "Send invoice",
  send_reminder: "Send reminder",
  create_booking: "Create booking",
  update_lead: "Update lead",
  high_value_invoice: "High-value invoice",
  other: "Other action",
};

export default function AdminApprovals() {
  const utils = trpc.useUtils();
  const { data: queue, isLoading } = trpc.adminApprovals.list.useQuery();
  const [busyId, setBusyId] = useState<number | null>(null);

  const decide = trpc.adminApprovals.decide.useMutation({
    onSuccess: () => {
      utils.adminApprovals.list.invalidate();
      utils.admin.overview.invalidate();
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setBusyId(null),
  });

  return (
    <AdminShell
      title="Approval queue"
      subtitle="Every agent action waiting on a human decision. Approve to execute, reject to discard. Stale items expire after 24 hours."
    >
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && (!queue || queue.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nothing pending. Agents are caught up.</p>
        </div>
      )}
      <div className="space-y-3">
        {queue?.map((item: any) => (
          <Card key={item.id} className="card-premium">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">
                      {ACTION_LABELS[item.actionType] ?? item.actionType}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Agent {item.agentId}
                    </Badge>
                    <Badge className={`text-xs ${RISK_COLORS[item.riskLevel] ?? ""}`}>
                      {item.riskLevel} risk
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{item.summary}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Dealership {item.dealershipId} · Queued{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="btn-gold"
                    disabled={busyId === item.id}
                    onClick={() => {
                      setBusyId(item.id);
                      decide.mutate({ approvalId: item.id, decision: "approved" });
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => {
                      setBusyId(item.id);
                      decide.mutate({ approvalId: item.id, decision: "rejected" });
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
