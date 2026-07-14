import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Phone, MapPin, FileText, Car } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  reviewing: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  provisioned: "bg-primary/10 text-primary border-primary/30",
};

export default function AdminOnboarding() {
  const utils = trpc.useUtils();
  const { data: submissions, isLoading } =
    trpc.adminOnboarding.list.useQuery();

  const decide = trpc.adminOnboarding.decide.useMutation({
    onSuccess: (data, vars) => {
      if (vars.decision === "approved") {
        const dealershipId = (data as { dealershipId?: number })?.dealershipId;
        toast.success(
          dealershipId
            ? `Dealership #${dealershipId} provisioned — WhatsApp will auto-link when Meta phone matches contact phone`
            : "Submission approved",
        );
      } else if (vars.decision === "rejected") {
        toast.success("Submission rejected");
      } else {
        toast.success("Marked as reviewing");
      }
      utils.adminOnboarding.list.invalidate();
      utils.admin.overview.invalidate();
      utils.adminDealerships.list.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const [busyId, setBusyId] = useState<number | null>(null);
  /** Optional multi-branch groupKey per submission (same slug on sibling branches). */
  const [groupKeys, setGroupKeys] = useState<Record<number, string>>({});

  return (
    <AdminShell
      title="Onboarding queue"
      subtitle="New dealership applications from the public /onboarding form. Approve to auto-provision their dealership, agents, and stock. Multi-branch: one dealership per branch, same groupKey."
    >
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && (!submissions || submissions.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No onboarding submissions yet.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Share <code className="text-primary">/onboarding</code> with prospective dealerships.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {submissions?.map((s: any) => (
          <Card key={s.id} className="card-premium">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold">{s.dealershipName}</h3>
                  <p className="text-sm text-muted-foreground">{s.ownerName}</p>
                </div>
                <Badge className={STATUS_COLORS[s.status] ?? ""}>{s.status}</Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {s.ownerEmail}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {s.ownerPhone}
                </div>
                {s.region && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {s.region}
                  </div>
                )}
                {s.whatsappPhoneNumberId && (
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                    Meta WA ID: {s.whatsappPhoneNumberId}
                  </div>
                )}
                {s.provisionedDealershipId && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    Dealership #{s.provisionedDealershipId}
                  </div>
                )}
                {s.monthlyVolume && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-3.5 w-3.5" /> {s.monthlyVolume} vehicles / month
                  </div>
                )}
                {s.csvUrl && (
                  <a
                    href={s.csvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" /> Stock CSV
                  </a>
                )}
              </div>

              {s.notes && (
                <p className="text-sm text-muted-foreground italic">&ldquo;{s.notes}&rdquo;</p>
              )}

              {s.status === "new" || s.status === "reviewing" ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <Label htmlFor={`gk-${s.id}`} className="text-xs text-muted-foreground">
                      Group key (optional) — multi-branch: same slug on each branch
                    </Label>
                    <Input
                      id={`gk-${s.id}`}
                      className="font-mono mt-1 h-9"
                      value={groupKeys[s.id] ?? ""}
                      onChange={(e) =>
                        setGroupKeys((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      placeholder="e.g. acme"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="btn-gold flex-1"
                      disabled={busyId === s.id}
                      onClick={() => {
                        setBusyId(s.id);
                        const gk = (groupKeys[s.id] ?? "").trim();
                        decide.mutate(
                          {
                            id: s.id,
                            decision: "approved",
                            groupKey: gk || null,
                          },
                          { onSettled: () => setBusyId(null) },
                        );
                      }}
                    >
                      {busyId === s.id ? "Provisioning…" : "Approve & provision"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busyId === s.id}
                      onClick={() => {
                        setBusyId(s.id);
                        decide.mutate(
                          { id: s.id, decision: "rejected" },
                          { onSettled: () => setBusyId(null) },
                        );
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Decided {s.reviewedAt ? new Date(s.reviewedAt).toLocaleString() : "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
