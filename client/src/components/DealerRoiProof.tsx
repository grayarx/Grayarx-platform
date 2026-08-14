import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeDealerRoi,
  formatZar,
  ROI_DEFAULT_CLOSE_RATE,
  ROI_DEFAULT_GROSS_PROFIT_ZAR,
  ROI_DEFAULT_MISSED_LEADS_PER_MONTH,
  ROI_DEFAULT_MONTHLY_COST_ZAR,
} from "@shared/dealerRoiMath";

type Props = {
  /** Primary CTA href (hash or path). */
  ctaHref?: string;
  showPricingLink?: boolean;
};

/**
 * On-site ICP proof: one recovered lead vs monthly cost after pilot.
 */
export default function DealerRoiProof({
  ctaHref = "#lead-capture",
  showPricingLink = true,
}: Props) {
  const [gp, setGp] = useState(String(ROI_DEFAULT_GROSS_PROFIT_ZAR));
  const [missed, setMissed] = useState(String(ROI_DEFAULT_MISSED_LEADS_PER_MONTH));
  const [cost, setCost] = useState(String(ROI_DEFAULT_MONTHLY_COST_ZAR));

  const result = useMemo(() => {
    return computeDealerRoi({
      grossProfitPerSaleZar: Number(gp) || ROI_DEFAULT_GROSS_PROFIT_ZAR,
      missedLeadsPerMonth: Number(missed) || ROI_DEFAULT_MISSED_LEADS_PER_MONTH,
      monthlyCostZar: Number(cost) || ROI_DEFAULT_MONTHLY_COST_ZAR,
      closeRate: ROI_DEFAULT_CLOSE_RATE,
    });
  }, [gp, missed, cost]);

  return (
    <div className="rounded-2xl border border-primary/20 holo-card p-6 md:p-10">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-tech text-[10px] uppercase tracking-[0.28em] text-primary/80 mb-1">
            Proof of better
          </p>
          <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
            {result.headline}
          </h3>
          <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
            {result.subline} Conservative close rate{" "}
            {Math.round(ROI_DEFAULT_CLOSE_RATE * 100)}% on recovered after-hours leads.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="roi-gp" className="text-xs text-muted-foreground">
            Gross profit per close (ZAR)
          </Label>
          <Input
            id="roi-gp"
            type="number"
            min={1000}
            step={500}
            value={gp}
            onChange={(e) => setGp(e.target.value)}
            className="mt-1.5 bg-black/40"
          />
        </div>
        <div>
          <Label htmlFor="roi-missed" className="text-xs text-muted-foreground">
            Missed after-hours leads / mo
          </Label>
          <Input
            id="roi-missed"
            type="number"
            min={1}
            step={1}
            value={missed}
            onChange={(e) => setMissed(e.target.value)}
            className="mt-1.5 bg-black/40"
          />
        </div>
        <div>
          <Label htmlFor="roi-cost" className="text-xs text-muted-foreground">
            Monthly cost after pilot (ZAR)
          </Label>
          <Input
            id="roi-cost"
            type="number"
            min={1000}
            step={100}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="mt-1.5 bg-black/40"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Soft floor · Showroom list / Pilot Partner
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-primary/15 bg-black/30 p-4">
          <p className="font-tech text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
            Expected recovered sales / mo
          </p>
          <p className="font-display text-2xl font-bold tabular-nums">
            {result.expectedSalesPerMonth.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-black/30 p-4">
          <p className="font-tech text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
            Expected GP / mo
          </p>
          <p className="font-display text-2xl font-bold tabular-nums text-primary">
            {formatZar(result.expectedMonthlyGpZar)}
          </p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-black/30 p-4">
          <p className="font-tech text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
            Net vs GrayArx
          </p>
          <p className="font-display text-2xl font-bold tabular-nums">
            {formatZar(result.netMonthlyZar)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button asChild className="btn-gold h-11 px-8 font-semibold uppercase tracking-wider text-sm">
          <a href={ctaHref}>
            Start free pilot <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        {showPricingLink ? (
          <Link
            href="/pricing"
            className="font-tech text-xs uppercase tracking-[0.2em] text-primary/80 hover:text-primary"
          >
            Pilot terms &amp; soft floor →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
