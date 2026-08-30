import { Mail, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/** Overview preview of this week's DP brief + one-click email. */
export default function WeeklyBriefCard() {
  const { data, isLoading } = trpc.dealer.weeklyBrief.useQuery(undefined, {
    staleTime: 60_000,
  });
  const send = trpc.dealer.sendWeeklyBrief.useMutation({
    onSuccess: (r) => {
      if (r.emailed) toast.success("This week's numbers emailed to your dealership contact");
      else toast.message(r.reason === "no_contact_email" ? "Add a contact email on the dealership first" : r.reason === "module_disabled" ? "Weekly numbers module is off" : "Numbers ready — email not sent");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !data) return null;

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">This week's numbers</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your yard desk for the last {data.periodDays} days — email this to yourself or the owner.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            disabled={send.isPending}
            onClick={() => send.mutate()}
          >
            {send.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            Email brief
          </Button>
        </div>
        <ul className="space-y-1.5">
          {data.talkingPoints.slice(0, 4).map((t) => (
            <li key={t} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            ["After-hours", data.afterHoursRepliesLast7Days],
            ["Leads", data.leadsLast7Days],
            ["Drives", data.bookingsLast7Days],
            ["Mia overdue", data.overdueFollowups],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-border/50 bg-card/30 px-2 py-2">
              <div className="text-lg font-display font-bold">{value}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
