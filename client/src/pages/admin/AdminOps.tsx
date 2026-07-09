import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Building2,
  Inbox,
  CalendarCheck,
  CalendarClock,
  Car,
  Search,
  ListChecks,
  CheckCircle2,
  Activity,
} from "lucide-react";

function relativeTime(ms: number | null): string {
  if (!ms) return "never";
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function AdminOps() {
  const { data, isLoading, refetch, isFetching } =
    trpc.adminOps.snapshot.useQuery(undefined, {
      refetchInterval: 30_000,
      staleTime: 15_000,
    });

  const tiles = data
    ? [
        {
          icon: UserPlus,
          label: "Signups today",
          value: data.signupsToday,
          sub: `${data.signupsLast7d} last 7d · ${data.totalUsers} total`,
        },
        {
          icon: Building2,
          label: "Dealerships",
          value: data.activeDealerships,
          sub: `${data.totalDealerships} total · ${data.activeDealerships} active`,
        },
        {
          icon: Inbox,
          label: "Leads today",
          value: data.leadsToday,
          sub: `${data.leadsLast7d} last 7d · last lead ${relativeTime(data.lastLeadAt)}`,
        },
        {
          icon: CalendarClock,
          label: "Test drives requested",
          value: data.testDrivesPending,
          sub: `${data.testDrivesToday} today · ${data.totalTestDrives} all-time`,
        },
        {
          icon: CalendarCheck,
          label: "Test drives confirmed",
          value: data.testDrivesConfirmed,
          sub: `last booking ${relativeTime(data.lastTestDriveAt)}`,
        },
        {
          icon: Car,
          label: "Vehicles available",
          value: data.vehiclesAvailable,
          sub: `${data.vehiclesTotal} total stock`,
        },
        {
          icon: Search,
          label: "Prospects scouted",
          value: data.prospectsTotal,
          sub: `${data.prospectsLast7d} last 7d`,
        },
        {
          icon: ListChecks,
          label: "Kagiso roadmap (open)",
          value: data.upgradeRoadmapOpen,
          sub: `${data.upgradeRoadmapAutoResolved} auto-resolved`,
        },
        {
          icon: CheckCircle2,
          label: "Last autonomous audit",
          value: data.lastAuditRunAt ? relativeTime(data.lastAuditRunAt) : "never",
          sub: data.lastAuditRunAt
            ? new Date(data.lastAuditRunAt).toLocaleString("en-ZA")
            : "Kagiso has not run yet",
        },
        {
          icon: Users,
          label: "Demo bookings",
          value: data.bookingsToday,
          sub: `${data.totalBookings} all-time`,
        },
      ]
    : [];

  return (
    <AdminShell
      title="Operations dashboard"
      subtitle="Live platform-wide KPIs. Auto-refreshes every 30 seconds."
      actions={
        <div className="flex items-center gap-2">
          {isFetching ? (
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3 animate-pulse" /> refreshing
            </Badge>
          ) : null}
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={() => void refetch()}
          >
            Refresh now
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(isLoading ? Array.from({ length: 8 }) : tiles).map((t, i) => {
          if (!t) {
            return (
              <Card key={i} className="card-premium">
                <CardContent className="p-6 h-32 animate-pulse" />
              </Card>
            );
          }
          const tile = t as (typeof tiles)[number];
          const Icon = tile.icon;
          return (
            <Card key={tile.label} className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground truncate">
                      {tile.label}
                    </div>
                    <div className="font-display text-4xl font-bold mt-2 truncate">
                      {tile.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {tile.sub}
                    </div>
                  </div>
                  <Icon className="h-6 w-6 text-primary shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {data ? (
        <p className="text-xs text-muted-foreground mt-6">
          Snapshot generated{" "}
          {new Date(data.generatedAt).toLocaleTimeString("en-ZA")}.
        </p>
      ) : null}
    </AdminShell>
  );
}
