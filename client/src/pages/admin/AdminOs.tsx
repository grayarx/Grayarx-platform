import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type OsPayload = {
  modules: Array<{ id: string; name: string; job: string; status: string }>;
  packages: Array<{
    id: string;
    name: string;
    priceLabel: string;
    headline: string;
    includedWhatsAppConversations: number;
    grossMarginPercent: number;
  }>;
};

export default function AdminOs() {
  const [data, setData] = useState<OsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/os")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<OsPayload>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AdminShell title="Dealership OS" subtitle="Nala modules + sell packages. WhatsApp webhooks stay on /api/webhooks/whatsapp.">
      {error && <p className="text-destructive">{error}</p>}
      {!data && !error && <p className="text-muted-foreground">Loading OS…</p>}
      {data && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.packages.map((pkg) => (
              <Card key={pkg.id} className="card-premium">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{pkg.name}</h3>
                    <Badge variant="outline">{pkg.priceLabel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.headline}</p>
                  <p className="text-xs">{pkg.includedWhatsAppConversations} WA conversations · {pkg.grossMarginPercent}% GM</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.modules.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{m.name}</h3>
                    <Badge variant="secondary">{m.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{m.job}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
