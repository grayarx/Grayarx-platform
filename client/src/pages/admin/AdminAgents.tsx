import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminAgents() {
  const { data, isLoading } = trpc.adminAgents.systemWideStats.useQuery();

  return (
    <AdminShell
      title="Agent performance (system-wide)"
      subtitle="Aggregated across every dealership. Compare which agents are pulling their weight."
    >
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((a: any) => (
          <Card key={a.agentId} className="card-premium">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                {a.avatarUrl && (
                  <img
                    src={a.avatarUrl}
                    alt={a.name}
                    className="w-12 h-12 rounded-full object-cover border border-primary/20"
                  />
                )}
                <div>
                  <h3 className="font-display text-lg font-semibold">{a.name}</h3>
                  <p className="text-xs text-muted-foreground">{a.role}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-display text-xl font-bold">{a.totalActions ?? 0}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Actions</div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold">
                    {a.dealershipsServed ?? 0}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">Dealers</div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold">
                    {a.avgConfidence ? a.avgConfidence.toFixed(2) : "—"}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">Conf.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
