import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Scale, Inbox, Trash2, UserCheck } from "lucide-react";
import { GRAYARX_LEGAL } from "@shared/companyLegal";

const MAILBOX_ICONS = {
  privacy: Shield,
  legal: Scale,
  hello: Mail,
  other: Inbox,
} as const;

export default function AdminCompliance() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.complianceMailbox.list.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const markRead = trpc.complianceMailbox.markRead.useMutation({
    onSuccess: () => utils.complianceMailbox.list.invalidate(),
  });
  const deleteRecord = trpc.complianceMailbox.delete.useMutation({
    onSuccess: () => utils.complianceMailbox.list.invalidate(),
  });
  const markFollowUp = trpc.complianceMailbox.markFollowUp.useMutation({
    onSuccess: () => utils.complianceMailbox.list.invalidate(),
  });

  const unread = data?.filter((i) => i.status === "new").length ?? 0;

  return (
    <AdminShell
      title="Compliance inbox"
      subtitle="Privacy, legal, and support messages — web forms and Resend inbound (privacy@ / legal@)."
      actions={
        unread > 0 ? (
          <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">
            {unread} unread
          </Badge>
        ) : undefined
      }
    >
      <Card className="card-premium mb-6 border-primary/15">
        <CardContent className="p-5 text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Founder alerts</strong> go to{" "}
            {process.env.NODE_ENV === "development" ? "FOUNDER_ALERT_EMAIL / grayarx@gmail.com" : "your Gmail"} via
            Resend whenever a message arrives.
          </p>
          <p>
            To receive real emails sent to{" "}
            <strong className="text-primary">{GRAYARX_LEGAL.informationOfficerEmail}</strong> and{" "}
            <strong className="text-primary">{GRAYARX_LEGAL.legalEmail}</strong>, enable{" "}
            <strong>Resend Inbound</strong> on grayarx.com and point the webhook to{" "}
            <code className="text-xs bg-black/40 px-1 rounded">/api/webhooks/resend-inbound</code>.
            See <code className="text-xs">docs/COMPLIANCE_MAILBOX_SETUP.md</code>.
          </p>
        </CardContent>
      </Card>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="space-y-3">
        {(data ?? []).length === 0 && !isLoading && (
          <p className="text-muted-foreground text-sm">No inquiries yet. The web form on /legal is live.</p>
        )}
        {(data ?? []).map((item) => {
          const Icon = MAILBOX_ICONS[item.mailbox as keyof typeof MAILBOX_ICONS] ?? Inbox;
          return (
            <Card
              key={item.id}
              className={`card-premium ${item.status === "new" ? "border-amber-500/30" : "border-primary/10"}`}
            >
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{item.subject}</span>
                    {item.status === "new" && (
                      <Badge variant="outline" className="text-[10px] uppercase">
                        New
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    #{item.id} · {item.mailbox} · {item.source}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {item.senderName ?? "—"} &lt;{item.senderEmail}&gt;
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString("en-ZA") : "—"}
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed border-t border-primary/10 pt-3">
                  {item.message}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {item.status === "new" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate({ id: item.id })}
                    >
                      Mark read
                    </Button>
                  )}
                  {(item.status === "new" || item.status === "read") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-amber-500/40 text-amber-700 hover:bg-amber-50"
                      disabled={markFollowUp.isPending}
                      onClick={() => markFollowUp.mutate({ id: item.id })}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Assign to human
                    </Button>
                  )}
                  {(item.status === "read" || item.status === "replied" || item.status === "archived") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-red-500/40 text-red-600 hover:bg-red-50"
                      disabled={deleteRecord.isPending}
                      onClick={() => {
                        if (confirm(`Delete compliance record #${item.id}? This cannot be undone.`)) {
                          deleteRecord.mutate({ id: item.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
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
