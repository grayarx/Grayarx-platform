import { useMemo, useState } from "react";
import { Search, Shield, Users, ShieldCheck, AlertCircle } from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dealerships() {
  const { user, loading: authLoading } = useAuth();
  const isOwner = user?.role === "admin" || user?.role === "founder";
  const { data, isLoading } = trpc.admin.listDealerships.useQuery(undefined, {
    enabled: isOwner,
  });

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !data) return data ?? [];
    return data.filter((d) =>
      [d.name, d.contactEmail, d.region].some((v) => (v ?? "").toString().toLowerCase().includes(q)),
    );
  }, [query, data]);

  // Show a friendly access-denied state for non-owners rather than crashing.
  if (!authLoading && !isOwner) {
    return (
      <DealerShell title="Dealerships" subtitle="Owner access only.">
        <div className="card-premium rounded-2xl p-10 text-center border border-amber-500/20">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h1 className="font-serif text-2xl">Owner access only</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            The Dealerships directory is restricted to the GrayArx owner. If you
            believe you should have access, contact the platform owner.
          </p>
        </div>
      </DealerShell>
    );
  }

  return (
    <DealerShell title="Dealerships" subtitle="Every account that has signed up to the GrayArx platform.">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary mb-1 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Owner directory
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9 h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total dealerships" value={data?.length ?? 0} icon={Users} />
        <StatCard
          label="Active"
          value={(data ?? []).filter((d) => d.status === "active").length}
          icon={ShieldCheck}
        />
        <StatCard
          label="Total vehicles"
          value={(data ?? []).reduce((sum, d) => sum + (d.vehiclesCount ?? 0), 0)}
          icon={Users}
        />
        <StatCard
          label="Total leads"
          value={(data ?? []).reduce((sum, d) => sum + (d.leadsCount ?? 0), 0)}
          icon={Users}
        />
      </div>

      <div className="card-premium rounded-2xl border border-primary/10 overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Dealership</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Leads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || authLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No dealerships match your search yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.contactEmail ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "active" ? "default" : "secondary"}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {d.vehiclesCount ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {d.leadsCount ?? 0}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DealerShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="card-premium rounded-xl p-4 border border-primary/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-primary/70" />
      </div>
      <p className="font-display text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
