import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { formatVehiclePrice } from "@/lib/formatPrice";

export default function AdminMarketGuide() {
  const { data, isLoading, refetch } = trpc.admin.marketGuideStatus.useQuery();
  const refresh = trpc.admin.triggerMarketGuideRefresh.useMutation({
    onSuccess: (res) => {
      toast.success(
        res.ran
          ? `Refreshed ${res.result?.yearsUpdated ?? 0} guide values`
          : "Cache is fresh — skipped",
      );
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AdminShell title="Market guides" subtitle="Live Tumi valuation refresh — AutoTrader / Cars.co.za signals">
      <div className="flex gap-3 mb-6">
        <Button
          className="btn-gold"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          {refresh.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Run refresh now
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-primary/15">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Refresh status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Last run:{" "}
                {data?.meta?.lastRunAt
                  ? new Date(data.meta.lastRunAt).toLocaleString("en-ZA")
                  : "Never"}
              </p>
              <p>Last model batch: {data?.meta?.lastGuideKey ?? "—"}</p>
              <p>Live DB entries: {data?.liveEntries ?? 0}</p>
              <p>Cache loaded: {data?.cache?.lastLoadedAt ?? "—"}</p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/15 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Recent live overrides</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.recent?.length ? (
                <p className="text-sm text-muted-foreground">
                  No live overrides yet — run refresh or wait for the weekly job.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.recent.map((r, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-border/40 pb-2"
                    >
                      <span className="font-medium">
                        {r.guideKey} · {r.year}
                      </span>
                      <span>{formatVehiclePrice(r.tradeInValueZar)}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {r.confidence}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground w-full">{r.source}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
