import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Users,
  Phone,
  Calendar as CalendarIcon,
  Car,
  Activity,
  Sparkles,
  ArrowUpRight,
  Upload,
  Settings,
  Store,
  Bot,
  Shield,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DealerShell from "@/components/DealerShell";
import { PhotoGuideCard } from "@/components/PhotoGuide";
import ShareShowroomCard from "@/components/ShareShowroomCard";
import GoLiveChecklistCard from "@/components/GoLiveChecklistCard";
import AfterHoursFunnelCard from "@/components/AfterHoursFunnelCard";
import WeeklyBriefCard from "@/components/WeeklyBriefCard";
import RetentionToolsCard from "@/components/RetentionToolsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  delta,
  delay,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  hint?: string;
  delta?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      <Card className="card-premium glass">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg glass-gold flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {delta && (
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {delta}
              </div>
            )}
          </div>
          <div className="text-3xl font-display font-bold">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
          {hint && <div className="text-[10px] text-muted-foreground/60 mt-1">{hint}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dealer.stats.useQuery();
  const { data: activity } = trpc.dealer.activity.useQuery();
  const { data: trend } = trpc.dealer.leadsTrend.useQuery();

  // Format trend for chart (fill blanks)
  const trendData = (trend ?? []).map((t) => ({
    day: new Date(t.day).toLocaleDateString("en-ZA", { weekday: "short" }),
    leads: t.count,
  }));

  const channelData = [
    { channel: "Leads", value: stats?.totalLeads ?? 0 },
    { channel: "Bookings", value: stats?.totalBookings ?? 0 },
    { channel: "Inventory", value: stats?.totalVehicles ?? 0 },
  ];

  const isFounder = user?.role === "founder" || user?.role === "admin";

  return (
    <DealerShell
      title={`Welcome, ${user?.name?.split(" ")[0] ?? "Dealer"}`}
      subtitle="After-hours desk → leads → bookings. Get live this week, then watch the funnel."
      actions={
        <div
          className="status-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0"
          aria-label="System status: all systems operational"
        >
          <span className="status-dot" aria-hidden />
          All systems operational
        </div>
      }
    >
      <PhotoGuideCard />
      <GoLiveChecklistCard />
      <AfterHoursFunnelCard />
      <WeeklyBriefCard />
      <RetentionToolsCard />
      <ShareShowroomCard />

      {isFounder && (
        <Card className="mb-6 border-primary/25 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Founder console</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Compliance inbox (Production A-test), AI agents roster, and platform ops.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button asChild variant="outline" size="sm" className="border-primary/30">
                <Link href="/admin/compliance">Compliance inbox</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-primary/30">
                <Link href="/dealer/agents">
                  <Bot className="h-3.5 w-3.5 mr-1.5" /> AI agents
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { href: "/dealer/inventory/import", icon: Upload, label: "Import CSV", hint: "Bulk stock upload" },
          { href: "/dealer/settings", icon: Settings, label: "Settings", hint: "Showroom & WhatsApp" },
          { href: "/showroom", icon: Store, label: "View showroom", hint: "Public stock page" },
          { href: "/dealer/inventory", icon: Car, label: "Inventory", hint: "Manage vehicles" },
        ].map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
          >
            <Link
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-primary/15 bg-card/40 p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg glass-gold flex items-center justify-center shrink-0">
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold group-hover:text-primary transition-colors">{action.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{action.hint}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total leads"
          value={statsLoading ? "…" : stats?.totalLeads ?? 0}
          hint={`+${stats?.leadsLast7Days ?? 0} in last 7 days`}
          delay={0}
        />
        <StatCard
          icon={CalendarIcon}
          label="Test-drive bookings"
          value={statsLoading ? "…" : stats?.totalBookings ?? 0}
          hint={`+${stats?.bookingsLast7Days ?? 0} in last 7 days`}
          delay={0.05}
        />
        <StatCard
          icon={Car}
          label="Live on showroom"
          value={statsLoading ? "…" : stats?.availableVehicles ?? 0}
          hint={`${stats?.totalVehicles ?? 0} imported · ${stats?.soldVehicles ?? 0} sold · ${stats?.reservedVehicles ?? 0} reserved`}
          delay={0.1}
        />
        <StatCard
          icon={Sparkles}
          label="New leads"
          value={statsLoading ? "…" : stats?.newLeads ?? 0}
          delay={0.15}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Phone}
          label="Qualified leads"
          value={statsLoading ? "…" : stats?.qualifiedLeads ?? 0}
          delay={0}
        />
        <StatCard
          icon={ArrowUpRight}
          label="Converted leads"
          value={statsLoading ? "…" : stats?.convertedLeads ?? 0}
          delay={0.05}
        />
        <StatCard
          icon={CalendarIcon}
          label="Confirmed bookings"
          value={statsLoading ? "…" : stats?.confirmedBookings ?? 0}
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Pending bookings"
          value={statsLoading ? "…" : stats?.pendingBookings ?? 0}
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="glass card-premium lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Lead trend</CardTitle>
            <p className="text-xs text-muted-foreground">Last 14 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                <XAxis dataKey="day" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(26,26,26,0.95)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Area type="monotone" dataKey="leads" stroke="#d4af37" strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass card-premium">
          <CardHeader>
            <CardTitle className="font-display text-lg">Pipeline mix</CardTitle>
            <p className="text-xs text-muted-foreground">Volume by record type</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                <XAxis type="number" stroke="#888" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="channel" stroke="#888" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(26,26,26,0.95)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#d4af37" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity feed */}
      <Card className="glass card-premium">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            Live activity
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            New leads and test-drive bookings for your dealership.
          </p>
        </CardHeader>
        <CardContent>
          {(!activity || activity.length === 0) ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No activity yet. Capture your first lead or book a test drive to see it appear here.
            </p>
          ) : (
            <div className="space-y-1">
              {activity.map((a, i) => {
                const Icon = a.type === "lead" ? Users : CalendarIcon;
                return (
                  <motion.div
                    key={`${a.type}-${a.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full glass-gold flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{a.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.subtitle}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DealerShell>
  );
}
