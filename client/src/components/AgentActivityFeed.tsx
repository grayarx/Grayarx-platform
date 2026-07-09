import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { AGENT_LIST } from "../../../shared/agents";

function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/**
 * Per-agent activity feed: shows each registered agent and the last
 * three events they emitted, side-by-side. Lightweight (1 query, polled).
 */
export default function AgentActivityFeed({
  perAgent = 3,
  fetchLimit = 200,
}: {
  perAgent?: number;
  fetchLimit?: number;
}) {
  const { data, isLoading } = trpc.agent.feed.useQuery(
    { limit: fetchLimit },
    { refetchInterval: 60_000, staleTime: 30_000 },
  );

  const grouped = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>>();
    for (const a of AGENT_LIST) map.set(a.id, [] as never);
    for (const row of data ?? []) {
      const list = map.get(row.agentId) ?? ([] as never);
      if (list.length < perAgent) {
        (list as unknown as Array<typeof row>).push(row);
        map.set(row.agentId, list);
      }
    }
    return map;
  }, [data, perAgent]);

  return (
    <Card className="glass card-premium">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          Per-agent activity
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Latest moves from every named agent on your team.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {AGENT_LIST.map((agent, i) => {
            const events = grouped.get(agent.id) ?? [];
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-lg border border-border/40 bg-background/60 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0">
                    <div className="font-display text-sm truncate">
                      {agent.displayName}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                      {agent.role}
                    </div>
                  </div>
                  <Badge variant="outline" className={agent.color}>
                    {events.length}
                  </Badge>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: perAgent }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-3 rounded bg-muted/40 animate-pulse"
                      />
                    ))}
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {agent.displayName} hasn't moved yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {(events as Array<{
                      id: number;
                      action: string;
                      summary: string | null;
                      createdAt: string | Date;
                    }>).map((e) => (
                      <li key={e.id} className="text-xs leading-snug">
                        <div className="text-foreground/90 line-clamp-2">
                          {e.summary ?? e.action}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {e.action.replaceAll("_", " ")} ·{" "}
                          {formatRelative(e.createdAt)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
