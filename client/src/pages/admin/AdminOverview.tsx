import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, UserPlus, CheckSquare, Sparkles, Mailbox, Bot } from "lucide-react";
import { Link } from "wouter";

export default function AdminOverview() {
  const { data: overview, isLoading } = trpc.admin.overview.useQuery();

  const tiles = [
    {
      icon: Building2,
      label: "Total dealerships",
      value: overview?.dealershipsCount ?? "—",
      sub: `system-wide`,
      href: "/admin/dealerships",
    },
    {
      icon: UserPlus,
      label: "New onboarding",
      value: overview?.pendingOnboarding ?? "—",
      sub: `awaiting your review`,
      href: "/admin/onboarding",
    },
    {
      icon: CheckSquare,
      label: "Pending approvals",
      value: overview?.pendingApprovals ?? "—",
      sub: `agent actions queued`,
      href: "/admin/approvals",
    },
    {
      icon: Sparkles,
      label: "Kagiso roadmap",
      value: overview?.pendingRoadmap ?? "—",
      sub: `proposals to review`,
      href: "/admin/kagiso-roadmap",
    },
    {
      icon: Mailbox,
      label: "Fallback inbox",
      value: overview?.pendingFallback ?? "—",
      sub: `unresolved messages`,
      href: "/admin/fallback",
    },
    {
      icon: Bot,
      label: "Agent network",
      value: "6",
      sub: `across all dealerships`,
      href: "/admin/agents",
    },
  ];

  return (
    <AdminShell
      title="Operations overview"
      subtitle="Everything happening across GrayArx in one place. Anything red needs your attention."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.label} href={t.href}>
              <Card className="card-premium cursor-pointer hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t.label}
                      </div>
                      <div className="font-display text-4xl font-bold mt-2">
                        {isLoading ? "…" : t.value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{t.sub}</div>
                    </div>
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}
