import { Link } from "wouter";
import { Moon, Users, Calendar, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

/**
 * Hero wedge metric: after-hours → leads → test drives (+ Mia overdue).
 */
export default function AfterHoursFunnelCard() {
  const { data: stats, isLoading } = trpc.dealer.stats.useQuery();
  const { data: goLive } = trpc.dealer.goLive.useQuery(undefined, {
    staleTime: 30_000,
  });

  if (isLoading || !stats) return null;

  const afterHours =
    goLive?.funnel.afterHoursRepliesLast7Days ??
    stats.afterHoursRepliesLast7Days ??
    0;
  const leads7 = stats.leadsLast7Days ?? 0;
  const bookings7 = stats.bookingsLast7Days ?? 0;
  const overdue = stats.overdueFollowups ?? 0;

  const cells = [
    {
      icon: Moon,
      label: "After-hours caught",
      value: afterHours,
      hint: "Last 7 days · Bongi/Nala desk",
      href: "/dealer/settings",
    },
    {
      icon: Users,
      label: "New leads",
      value: leads7,
      hint: "Last 7 days",
      href: "/dealer/leads",
    },
    {
      icon: Calendar,
      label: "Test drives",
      value: bookings7,
      hint: "Booked last 7 days",
      href: "/dealer/bookings",
    },
    {
      icon: Mail,
      label: "Mia overdue",
      value: overdue,
      hint: overdue > 0 ? "Follow-ups past due — send or mark done" : "Drip on track",
      href: "/dealer/leads?filter=followups",
    },
  ];

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <div className="mb-3">
          <p className="text-sm font-semibold">This week’s yard desk</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            After-hours attention → leads → booked drives. That is the GrayArx job.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cells.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl border border-border/60 bg-card/40 p-3 hover:border-primary/35 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <c.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </span>
              </div>
              <div className="text-2xl font-display font-bold">{c.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{c.hint}</div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
