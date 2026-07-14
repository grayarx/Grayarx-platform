import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { Link, useRoute } from "wouter";

/**
 * Minimal multi-branch group overview (Step 4 lite):
 * lists sibling dealerships with stock + leads counts.
 */
export default function AdminGroupOverview() {
  const [, params] = useRoute("/admin/groups/:groupKey");
  const groupKey = params?.groupKey ? decodeURIComponent(params.groupKey) : "";

  const { data, isLoading, error } = trpc.adminDealerships.groupOverview.useQuery(
    { groupKey },
    { enabled: groupKey.length > 0 },
  );

  return (
    <AdminShell
      title={data?.group.name ?? `Group · ${groupKey || "…"}`}
      subtitle={
        groupKey
          ? `Multi-branch overview for groupKey “${groupKey}”. Each row is a separate dealership (own stock, WhatsApp, shortcode).`
          : "Missing group key."
      }
      actions={
        <Link href="/admin/dealerships" className="text-sm text-primary hover:underline">
          ← Dealerships
        </Link>
      }
    >
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive text-sm">{error.message}</p>}
      {!isLoading && data && data.branches.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No branches assigned to this group yet.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Set groupKey on dealership cards under Admin → Dealerships.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.branches.map((b) => (
          <Card key={b.id} className="card-premium">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold">{b.name}</h3>
                  <p className="text-sm text-muted-foreground">{b.region ?? "—"}</p>
                  {b.publicShortcode && (
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      /{b.publicShortcode}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="capitalize">
                  {b.status}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="font-display text-2xl font-bold">{b.vehiclesCount}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Stock</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{b.leadsCount}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Leads</div>
                </div>
              </div>
              {b.whatsappPhoneNumberId && (
                <p className="text-[11px] font-mono text-muted-foreground mt-3 truncate">
                  WA · {b.whatsappPhoneNumberId}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
