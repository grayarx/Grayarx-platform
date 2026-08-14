import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ICP_ROI_DEFAULTS,
  computeIcpRoi,
  formatZarWhole,
} from "@shared/icpRoi";

/**
 * Interactive status-quo math for SA DPs — makes GrayArx a no-brainer on the call.
 */
export default function IcpRoiCalculator({ compact = false }: { compact?: boolean }) {
  const [deadLeadsPerWeek, setDeadLeadsPerWeek] = useState(ICP_ROI_DEFAULTS.deadLeadsPerWeek);
  const [bookRatePct, setBookRatePct] = useState(ICP_ROI_DEFAULTS.bookRatePct);
  const [grossProfitPerDealZar, setGross] = useState(ICP_ROI_DEFAULTS.grossProfitPerDealZar);

  const result = useMemo(
    () =>
      computeIcpRoi({
        deadLeadsPerWeek,
        bookRatePct,
        grossProfitPerDealZar,
      }),
    [deadLeadsPerWeek, bookRatePct, grossProfitPerDealZar],
  );

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-primary/20 bg-card/40 p-5 md:p-6"
          : "rounded-2xl md:rounded-3xl border border-primary/25 holo-card p-6 md:p-10"
      }
    >
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-tech text-[10px] uppercase tracking-[0.28em] text-primary/80 mb-1">
            Status-quo math
          </p>
          <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight">
            Is GrayArx a no-brainer for your yard?
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Use your numbers. One recovered deal a month usually covers the desk.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="space-y-2">
          <Label htmlFor="dead-leads">After-hours leads ignored / week</Label>
          <Input
            id="dead-leads"
            type="number"
            min={0}
            max={100}
            value={deadLeadsPerWeek}
            onChange={(e) => setDeadLeadsPerWeek(Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between gap-2">
            <Label>Would book if answered same night</Label>
            <span className="font-tech text-xs text-primary">{bookRatePct}%</span>
          </div>
          <Slider
            value={[bookRatePct]}
            min={5}
            max={40}
            step={1}
            onValueChange={(v) => setBookRatePct(v[0] ?? 15)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gross">Gross profit on one closed deal (R)</Label>
          <Input
            id="gross"
            type="number"
            min={1000}
            step={500}
            value={grossProfitPerDealZar}
            onChange={(e) => setGross(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-border/50 bg-background/40 p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Recoverable drives / mo
          </p>
          <p className="font-display text-2xl font-bold">{result.recoverableDealsPerMonth}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/40 p-4 text-center sm:col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Monthly leakage (status quo)
          </p>
          <p className="font-display text-2xl md:text-3xl font-bold text-cyber-gradient">
            {formatZarWhole(result.monthlyLeakageZar)}
          </p>
        </div>
      </div>

      <div
        className={`rounded-xl border p-4 mb-6 text-sm leading-relaxed ${
          result.noBrainer
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100/90"
            : "border-amber-500/25 bg-amber-500/10 text-amber-100/90"
        }`}
      >
        {result.noBrainer ? (
          <>
            <strong className="text-foreground">No-brainer.</strong> At your numbers, after-hours
            leakage is {formatZarWhole(result.monthlyLeakageZar)}/mo. One deal at{" "}
            {formatZarWhole(grossProfitPerDealZar)} gross already covers a GrayArx month — free
            pilot until you see proof on your stock.
          </>
        ) : (
          <>
            Tighten the inputs with your real after-hours volume. If one closed deal’s gross is
            above ~{formatZarWhole(ICP_ROI_DEFAULTS.coversMonthBelowZar)}, recovering a single
            overnight lead pays for the desk.
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild className="btn-gold h-11 px-8 font-semibold uppercase tracking-wider text-sm">
          <Link href="/onboarding">
            Start free pilot <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="btn-cyber h-11 bg-transparent">
          <a href="#lead-capture">Talk to us</a>
        </Button>
      </div>
    </div>
  );
}
