import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Package = {
  id: string;
  name: string;
  priceLabel: string;
  headline: string;
  vsMarket: string;
  includedWhatsAppConversations: number;
  overagePerConversationZar: number;
  estimatedCogsZar: number;
  grossMarginPercent: number;
  profitNote: string;
};

type PricingPayload = {
  packages: Package[];
  economics: { rules: string[] };
  pricingStrategy: { principle: string; whyNotCheaper: string };
};

type UsagePayload = {
  snapshot: {
    planId: string;
    package: { name: string; priceLabel: string };
    whatsapp: { used: number; included: number; remaining: number; hardStop: boolean };
    llmPolish: { used: number; included: number; remaining: number; currentMode: string; modeReason: string };
  };
};

export default function AdminOsPricing() {
  const [data, setData] = useState<PricingPayload | null>(null);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [region, setRegion] = useState<{ currency: string; packages: Record<string, { label: string }> } | null>(null);

  useEffect(() => {
    void fetch("/api/pricing").then((r) => r.json()).then(setData);
    void fetch("/api/billing/usage?dealershipId=demo-yard").then((r) => r.json()).then(setUsage);
    void fetch("/api/regions?region=US").then((r) => r.json()).then((j) => setRegion(j.region));
  }, []);

  async function setPlan(planId: string) {
    await fetch("/api/billing/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_plan", dealershipId: "demo-yard", planId }),
    });
    const snap = await fetch("/api/billing/usage?dealershipId=demo-yard").then((r) => r.json());
    setUsage(snap);
  }

  return (
    <AdminShell title="OS pricing" subtitle="Pilot is free and capped. Paid plans meter WhatsApp + polish, then auto-fallback to templates.">
      {usage && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-2 text-sm">
            <p>
              Demo yard plan: <strong>{usage.snapshot.package.name}</strong> ({usage.snapshot.package.priceLabel}) · polish mode{" "}
              <Badge variant="outline">{usage.snapshot.llmPolish.currentMode}</Badge>
            </p>
            <p className="text-muted-foreground">{usage.snapshot.llmPolish.modeReason}</p>
            <p>
              WhatsApp {usage.snapshot.whatsapp.used}/{usage.snapshot.whatsapp.included}
              {usage.snapshot.whatsapp.hardStop ? " · Pilot hard-stop" : " · paid overage"}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["pilot", "starter", "professional", "enterprise"].map((id) => (
                <Button key={id} size="sm" variant="outline" onClick={() => void setPlan(id)}>
                  Set {id}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {region && (
        <p className="text-sm text-muted-foreground mb-4">
          US package check: {region.currency} · Professional {region.packages.professional.label}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.packages.map((pkg) => (
          <Card key={pkg.id} className="card-premium">
            <CardContent className="p-5 space-y-2">
              <div className="flex justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{pkg.name}</h3>
                <Badge>{pkg.priceLabel}</Badge>
              </div>
              <p className="text-sm">{pkg.headline}</p>
              <p className="text-xs text-muted-foreground">{pkg.vsMarket}</p>
              <p className="text-xs">
                {pkg.includedWhatsAppConversations} WA · overage R{pkg.overagePerConversationZar} · COGS R{pkg.estimatedCogsZar} · {pkg.grossMarginPercent}% GM
              </p>
              <p className="text-xs text-muted-foreground">{pkg.profitNote}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
