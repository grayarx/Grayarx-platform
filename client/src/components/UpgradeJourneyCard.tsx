import { Link } from "wouter";
import { ArrowRight, Car, Handshake, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { calcUpgradeGap } from "@shared/priceIntelligence";
import { useState } from "react";

export default function UpgradeJourneyCard({
  tradeInMid,
  tradeInLow,
  tradeInHigh,
}: {
  tradeInMid: number;
  tradeInLow: number;
  tradeInHigh: number;
}) {
  const [targetPrice, setTargetPrice] = useState(450_000);
  const [extraDeposit, setExtraDeposit] = useState(0);

  const gap = calcUpgradeGap(targetPrice, tradeInMid, extraDeposit);
  const fmt = (n: number) => formatVehiclePrice(n);

  return (
    <Card className="glass border-primary/20 mt-6">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Your upgrade path</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Classified portals stop at a single guide number. GrayArx connects your trade-in to finance and
          stock — see what you actually need to bridge.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Replacement vehicle price</Label>
            <Input
              type="number"
              className="mt-1"
              value={targetPrice}
              onChange={(e) => setTargetPrice(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs">Extra cash deposit</Label>
            <Input
              type="number"
              className="mt-1"
              value={extraDeposit}
              onChange={(e) => setExtraDeposit(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-primary/15 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trade-in (mid)</span>
            <span className="font-medium text-primary">− {fmt(tradeInMid)}</span>
          </div>
          {extraDeposit > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your deposit</span>
              <span className="font-medium">− {fmt(extraDeposit)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-primary/10 pt-2">
            <span className="font-semibold">Amount to finance</span>
            <span className="font-display text-lg font-bold">{fmt(gap.netCashRequired)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Trade-in range applied: {fmt(tradeInLow)} – {fmt(tradeInHigh)} (confirmed after inspection).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild className="btn-gold flex-1">
            <Link href={`/finance?price=${gap.netCashRequired}`}>
              Finance this gap <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 border-primary/25">
            <Link href={`/showroom?sort=best_deals&maxPrice=${targetPrice}`}>
              <Car className="mr-2 h-4 w-4" /> Find cars in budget
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function GrayArxAdvantages({ compact }: { compact?: boolean }) {
  const items = [
    {
      icon: Handshake,
      title: "Multi-dealer trade-in network",
      desc: "List once — participating dealers compete to inspect and offer. Not one anonymous guide.",
    },
    {
      icon: Sparkles,
      title: "Transparent deal scores",
      desc: "Every listing vs SA market guide — see great deals, not just pretty photos.",
    },
    {
      icon: Car,
      title: "Full buyer journey",
      desc: "Trade-in → upgrade gap → finance → showroom. One platform, not five tabs.",
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
        {items.map((item) => (
          <div key={item.title} className="rounded-lg border border-primary/10 p-3">
            <item.icon className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="font-medium">{item.title}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      {items.map((item) => (
        <Card key={item.title} className="glass border-primary/10">
          <CardContent className="pt-5">
            <item.icon className="h-5 w-5 text-primary mb-2" />
            <h4 className="font-display font-semibold text-sm">{item.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
