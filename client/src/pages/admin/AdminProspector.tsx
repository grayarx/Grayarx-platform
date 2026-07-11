import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminProspector() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.prospects.list.useQuery();
  const [poolRemaining, setPoolRemaining] = useState<number | null>(null);
  const [poolExhausted, setPoolExhausted] = useState(false);

  const scout = trpc.prospects.scout.useMutation({
    onSuccess: (result) => {
      utils.prospects.list.invalidate();
      if (result.created === 0 && "message" in result) {
        setPoolExhausted(true);
        setPoolRemaining(0);
        toast.warning(result.message as string);
      } else {
        setPoolExhausted(false);
        if ("poolRemaining" in result && typeof result.poolRemaining === "number") {
          setPoolRemaining(result.poolRemaining);
          toast.success(`${result.created} new prospect${result.created === 1 ? "" : "s"} added — ${result.poolRemaining} more in pool`);
        } else {
          toast.success(`${result.created} new prospect${result.created === 1 ? "" : "s"} added`);
        }
      }
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <AdminShell
      title="Prospector"
      subtitle="Dealerships our outreach team should target. AI-scored and refreshed daily. NOT visible to current dealerships."
      actions={
        <Button
          className="btn-gold"
          onClick={() => scout.mutate({ region: "Gauteng", count: 5 })}
          disabled={scout.isPending}
        >
          {scout.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate prospects
        </Button>
      }
    >
      {isLoading && <p className="text-muted-foreground">Loading prospects…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No prospects yet.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Click &ldquo;Generate prospects&rdquo; to have Sipho scout dealerships.
          </p>
        </div>
      )}
      {poolExhausted && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 mb-4">
          All dealerships in the local prospect pool have been added. Expand the pool or wait until next month.
        </div>
      )}
      {!poolExhausted && poolRemaining !== null && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground mb-4">
          <span className="font-medium text-foreground">{poolRemaining}</span> dealership{poolRemaining === 1 ? "" : "s"} remaining in the local prospect pool
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((p: any) => (
          <Card key={p.id} className="card-premium">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold leading-tight truncate">
                  {p.dealershipName}
                </h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  Score {p.score ?? "—"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {p.region && <div>{p.region}</div>}
                {p.website && (
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline truncate"
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.website}</span>
                  </a>
                )}
                {p.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {p.email}
                  </div>
                )}
                {p.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {p.phone}
                  </div>
                )}
              </div>
              {p.brandsCarried && (
                <div className="flex flex-wrap gap-1">
                  {p.brandsCarried.split(",").slice(0, 4).map((b: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {b.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
