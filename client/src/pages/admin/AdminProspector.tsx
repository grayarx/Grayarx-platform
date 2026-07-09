import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminProspector() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.prospects.list.useQuery();
  const scout = trpc.prospects.scout.useMutation({
    onSuccess: () => {
      utils.prospects.list.invalidate();
      toast.success("New prospects added");
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((p: any) => (
          <Card key={p.id} className="card-premium">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold leading-tight truncate">
                  {p.businessName}
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
                {p.contactEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {p.contactEmail}
                  </div>
                )}
                {p.contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {p.contactPhone}
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
