import { useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DealerShell from "@/components/DealerShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Phone,
  Calendar,
  Compass,
  Activity,
  Filter,
  Inbox,
  Sparkles,
  MessageCircle,
  Calculator,
  Moon,
  Bot,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AgentId } from "@shared/agents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Icon + accent ring per agent. Kept as a Partial map with a default fallback
 * so adding a new AgentId server-side never crashes this page (the previous
 * version did, throwing React #130).
 */
const ICONS: Partial<Record<AgentId, LucideIcon>> = {
  email: Mail,
  calling: Phone,
  booking: Calendar,
  prospector: Compass,
  improvement: Sparkles,
  whatsapp: MessageCircle,
  accountant: Calculator,
  fallback: Moon,
};

const RING_COLORS: Partial<Record<AgentId, string>> = {
  email: "from-blue-500/30 to-blue-500/0 ring-blue-500/40",
  calling: "from-amber-500/30 to-amber-500/0 ring-amber-500/40",
  booking: "from-emerald-500/30 to-emerald-500/0 ring-emerald-500/40",
  prospector: "from-fuchsia-500/30 to-fuchsia-500/0 ring-fuchsia-500/40",
  improvement: "from-yellow-500/30 to-yellow-500/0 ring-yellow-500/40",
  whatsapp: "from-green-500/30 to-green-500/0 ring-green-500/40",
  accountant: "from-cyan-500/30 to-cyan-500/0 ring-cyan-500/40",
  fallback: "from-slate-500/30 to-slate-500/0 ring-slate-500/40",
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRelative(date: Date | string | null): string {
  if (!date) return "no activity yet";
  const ts = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  if (!Number.isFinite(ts)) return "no activity yet";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function Agents() {
  const [filter, setFilter] = useState<AgentId | "all">("all");
  const feedRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const roster = trpc.agent.list.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  const feedInput = useMemo(
    () => ({
      limit: 100,
      ...(filter !== "all" ? { agentId: filter } : {}),
    }),
    [filter],
  );

  const feed = trpc.agent.feed.useQuery(feedInput, {
    refetchInterval: 10_000,
  });

  const agentById = useMemo(
    () =>
      Object.fromEntries(
        (roster.data?.agents ?? []).map((a) => [a.id, a]),
      ) as Record<string, (typeof roster.data)["agents"][number]>,
    [roster.data],
  );

  const selectAgentFilter = (id: AgentId) => {
    setFilter((prev) => (prev === id ? "all" : id));
  };

  useEffect(() => {
    if (filter !== "all") {
      feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [filter]);

  const ping = trpc.agent.ping.useMutation({
    onSuccess: (res) => {
      utils.agent.list.invalidate();
      utils.agent.feed.invalidate();
      toast.success(res.message);
    },
    onError: (e) => toast.error(e.message),
  });

  // Build the filter chips dynamically from the roster so we never hardcode a
  // stale list of agent ids.
  const filterChips: Array<AgentId | "all"> = [
    "all",
    ...((roster.data?.agents.map((a) => a.id as AgentId)) ?? []),
  ];

  return (
    <DealerShell
      title="Agents"
      subtitle="Your AI teammates — who they are, what they're doing, and how they talk to each other."
    >
      {/* Inbox header */}
      <Card className="bg-card/60 border-white/10 backdrop-blur p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 ring-1 ring-gold/30 flex items-center justify-center">
            <Inbox className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Primary inbox (where every reply lands)
            </p>
            <p className="font-semibold">
              {roster.data?.primaryInbox ?? "hello@grayarx.com"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground max-w-md">
          Each agent has their own @grayarx.com address used for outbound mail.
          Replies all consolidate into this inbox so nothing falls through the
          cracks.
        </p>
      </Card>

      {/* Agent roster cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {roster.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 bg-card/60 border-white/10">
                <Skeleton className="h-6 w-24 mb-3" />
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </Card>
            ))
          : roster.data?.agents.map((agent) => {
              const id = agent.id as AgentId;
              const Icon: LucideIcon = ICONS[id] ?? Bot;
              const ring =
                RING_COLORS[id] ??
                "from-gold/30 to-gold/0 ring-gold/40";
              return (
                <Card
                  key={agent.id}
                  role="button"
                  tabIndex={0}
                  title={`View ${agent.displayName}'s activity`}
                  onClick={() => selectAgentFilter(id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectAgentFilter(id);
                    }
                  }}
                  className={cn(
                    "relative overflow-hidden p-6 bg-card/60 border-white/10 backdrop-blur transition cursor-pointer hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                    filter === id && "border-gold/60 ring-1 ring-gold/30",
                  )}
                >
                  <div
                    className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${ring} blur-2xl pointer-events-none`}
                  />
                  <div className="flex items-start justify-between mb-4 relative">
                    <div className="relative">
                      {agent.avatarUrl ? (
                        <img
                          src={agent.avatarUrl}
                          alt={`${agent.displayName} portrait`}
                          loading="lazy"
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-gold/40 shadow-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gold/10 ring-2 ring-gold/40 shadow-lg flex items-center justify-center font-serif text-gold text-xl">
                          {getInitials(agent.displayName)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-charcoal ring-2 ring-gold/40 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        agent.status === "active"
                          ? "border-emerald-500/40 text-emerald-300"
                          : "border-white/20 text-muted-foreground"
                      }
                    >
                      {agent.status === "active" ? "● Active" : "○ Idle"}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-serif text-foreground">
                    {agent.displayName}
                  </h3>
                  <span className="mt-1 mb-2 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse"></span>
                    AI Agent
                  </span>
                  <p className="text-sm text-muted-foreground mb-3">
                    {agent.role}
                  </p>
                  <p className="text-xs font-mono text-gold/80 break-all mb-3">
                    {agent.email}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                    {agent.description}
                  </p>
                  <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3">
                    <span className="text-muted-foreground">
                      {agent.stats.actionCount} action
                      {agent.stats.actionCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatRelative(agent.stats.lastActionAt)}
                    </span>
                  </div>
                  {agent.stats.lastAction && (
                    <p className="text-xs text-foreground/80 mt-2 line-clamp-2">
                      {agent.stats.lastAction}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs flex-1"
                      disabled={ping.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        ping.mutate({ agentId: id });
                      }}
                    >
                      <Zap className="h-3 w-3 mr-1 text-gold" />
                      Test agent
                    </Button>
                  </div>
                  <p className="text-[10px] text-gold/70 mt-2 uppercase tracking-wider">
                    Click card to filter activity →
                  </p>
                </Card>
              );
            })}
      </div>

      {/* Unified activity feed */}
      <div ref={feedRef} className="scroll-mt-24">
      <Card className="p-0 bg-card/60 border-white/10 backdrop-blur overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/10 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-serif text-lg">Shared Activity Feed</h3>
              <p className="text-xs text-muted-foreground">
                {filter === "all"
                  ? "Every action by every agent — the shared memory they all read."
                  : `Filtered to ${agentById[filter]?.displayName ?? filter} — click the card again or All to reset.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground mr-1" />
            {filterChips.map((key) => (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "default" : "ghost"}
                onClick={() => setFilter(key)}
                className={
                  filter === key
                    ? "bg-gold text-charcoal hover:bg-gold/90"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {key === "all"
                  ? "All"
                  : agentById[key]?.displayName ?? key}
              </Button>
            ))}
          </div>
        </div>
        {filter !== "all" && (
          <div className="px-5 py-2 border-b border-gold/20 bg-gold/5 flex items-center justify-between gap-2 text-xs">
            <span>
              Showing activity for{" "}
              <strong className="text-gold">
                {agentById[filter]?.displayName ?? filter}
              </strong>
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gold hover:text-gold"
              onClick={() => setFilter("all")}
            >
              Clear filter
            </Button>
          </div>
        )}
        <div className="max-h-[520px] overflow-y-auto">
          {(feed.isLoading || feed.isFetching) && !feed.data?.length && (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
          {!feed.isLoading && !feed.isFetching && (feed.data?.length ?? 0) === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground space-y-3">
              {filter === "all" ? (
                <>
                  <p>
                    No activity logged yet. Agents wake up when leads arrive,
                    WhatsApp messages come in, or you hit <strong>Test agent</strong> on a
                    card above.
                  </p>
                  <p className="text-xs">
                    Tip: click any agent card to filter this feed to just that agent.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>{agentById[filter]?.displayName ?? filter}</strong> has no
                    logged actions yet.
                  </p>
                  <p className="text-xs">
                    Use <strong>Test agent</strong> on their card to verify wiring, or wait
                    for a real lead/booking/WhatsApp event.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setFilter("all")}
                  >
                    Show all agents
                  </Button>
                </>
              )}
            </div>
          )}
          {feed.data?.map((row) => {
            const id = row.agentId as AgentId;
            const persona = roster.data?.agents.find((a) => a.id === id);
            return (
              <div
                key={row.id}
                className="px-5 py-3 border-b border-white/5 last:border-0 flex items-start gap-3 hover:bg-white/[0.02] transition"
              >
                {persona?.avatarUrl ? (
                  <img
                    src={persona.avatarUrl}
                    alt={persona.displayName}
                    loading="lazy"
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-gold/30 mt-0.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gold/10 ring-1 ring-gold/30 mt-0.5 flex items-center justify-center font-serif text-xs text-gold">
                    {getInitials(persona?.displayName ?? row.agentName ?? "?")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm">
                      {row.agentName}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {row.agentRole}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelative(row.createdAt as Date)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">{row.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      </div>
    </DealerShell>
  );
}
