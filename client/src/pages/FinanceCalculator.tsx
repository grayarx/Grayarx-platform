import { useMemo, useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Info, Banknote, ArrowRight } from "lucide-react";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { loadTradeInSession } from "@/lib/tradeInSession";
import { trpc } from "@/lib/trpc";
import {
  SA_CREDIT_PROFILES,
  SA_FINANCE_DEFAULTS,
  SA_PRIME_RATE_PCT,
  calcMonthlyInstalment,
} from "@shared/saFinance";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SEO_PAGES } from "@shared/seo";

export default function FinanceCalculator() {
  useDocumentMeta({
    title: SEO_PAGES.finance.title,
    description: SEO_PAGES.finance.description,
    keywords: SEO_PAGES.finance.keywords,
    canonicalPath: "/finance",
    ogType: "website",
  });
  const search = useSearch();
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const rawPrice = params.get("price");
    const price =
      rawPrice && Number.isFinite(Number(rawPrice)) && Number(rawPrice) > 1
        ? Math.round(Number(rawPrice))
        : null;
    const rawDeposit = params.get("deposit");
    const deposit =
      rawDeposit && Number.isFinite(Number(rawDeposit)) && Number(rawDeposit) >= 0
        ? Math.round(Number(rawDeposit))
        : null;
    const rawVehicle = params.get("vehicle");
    const vehicleId =
      rawVehicle && Number(rawVehicle) > 0 ? Number(rawVehicle) : null;
    return { price, deposit, vehicleId };
  }, [search]);

  const tradeInSession = useMemo(() => loadTradeInSession(), []);
  const { data: shortcodeData } = trpc.showroom.primaryShortcode.useQuery();
  const shortcode = shortcodeData?.shortcode ?? null;

  const [vehiclePrice, setVehiclePrice] = useState(650000);
  const [deposit, setDeposit] = useState(65000);
  const [termMonths, setTermMonths] = useState(SA_FINANCE_DEFAULTS.defaultTermMonths);
  const [interestRate, setInterestRate] = useState(SA_FINANCE_DEFAULTS.ratePct);
  const [grossIncome, setGrossIncome] = useState<number | "">("");

  useEffect(() => {
    if (urlParams.price != null) {
      setVehiclePrice(urlParams.price);
      const tradeInDeposit = tradeInSession?.estimateMid ?? 0;
      const fromUrl = urlParams.deposit;
      setDeposit(
        fromUrl != null
          ? fromUrl
          : Math.max(Math.round(urlParams.price * 0.1), tradeInDeposit),
      );
    } else if (urlParams.deposit != null) {
      // Trade-in → finance: `/finance?deposit=` without a vehicle price yet
      setDeposit(urlParams.deposit);
    } else if (tradeInSession?.estimateMid) {
      setDeposit(tradeInSession.estimateMid);
    }
  }, [urlParams.price, urlParams.deposit, tradeInSession?.estimateMid]);

  const principal = Math.max(0, vehiclePrice - deposit);
  const monthly = calcMonthlyInstalment(principal, interestRate, termMonths);
  const total = monthly * termMonths + deposit;
  const interest = total - vehiclePrice;

  const affordability = useMemo(() => {
    if (grossIncome === "" || grossIncome <= 0) return null;
    const maxInstalment = grossIncome * SA_FINANCE_DEFAULTS.maxInstalmentIncomeRatio;
    const ratio = monthly / grossIncome;
    const ok = monthly <= maxInstalment;
    return { maxInstalment, ratio, ok };
  }, [grossIncome, monthly]);

  const fmt = (n: number) => formatVehiclePrice(n);

  const applyHref = shortcode
    ? `/apply/${shortcode}?${new URLSearchParams({
        ...(urlParams.vehicleId ? { vehicle: String(urlParams.vehicleId) } : {}),
        price: String(Math.round(vehiclePrice)),
        deposit: String(Math.round(deposit)),
        term: String(termMonths),
      }).toString()}`
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-32 pb-12 gradient-mesh">
        <div className="container max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full glass-gold text-xs font-medium uppercase tracking-widest text-primary">
            <Calculator className="h-3.5 w-3.5" /> Finance Calculator
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Estimate your <span className="text-gold-gradient">monthly instalment</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Calibrated for South Africa — prime {SA_PRIME_RATE_PCT}% · typical offers prime +2% · NCA VAF cap ~{SA_FINANCE_DEFAULTS.ncaCapPct}%
          </p>
          {tradeInSession && (
            <p className="text-sm text-primary mt-3">
              Using your Tumi trade-in estimate ({fmt(tradeInSession.estimateMid)}) as deposit.
            </p>
          )}
          {urlParams.price != null && (
            <p className="text-sm text-primary mt-3">
              Pre-filled from vehicle price — adjust deposit and term below.
            </p>
          )}
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass border-primary/15">
            <CardHeader>
              <CardTitle className="font-display">Vehicle details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Vehicle price (ZAR)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={vehiclePrice}
                  onChange={(e) => setVehiclePrice(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Deposit (ZAR)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value) || 0)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {vehiclePrice > 0
                    ? `${Math.round((deposit / vehiclePrice) * 100)}% deposit — banks often want 10%+`
                    : "10% deposit is typical for average credit"}
                </p>
              </div>
              <div>
                <Label>Term: {termMonths} months ({Math.round(termMonths / 12)} years)</Label>
                <Slider
                  className="mt-3"
                  min={SA_FINANCE_DEFAULTS.minTermMonths}
                  max={SA_FINANCE_DEFAULTS.maxTermMonths}
                  step={6}
                  value={[termMonths]}
                  onValueChange={([v]) => setTermMonths(v)}
                />
              </div>
              <div>
                <Label>Interest rate: {interestRate.toFixed(1)}% p.a.</Label>
                {interestRate > SA_FINANCE_DEFAULTS.ncaCapPct && (
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Above typical NCA vehicle-finance cap (~{SA_FINANCE_DEFAULTS.ncaCapPct}%) — stress-test only; most banks decline well before 26%.
                  </p>
                )}
                <Slider
                  className="mt-3"
                  min={SA_FINANCE_DEFAULTS.minRatePct}
                  max={SA_FINANCE_DEFAULTS.maxRatePct}
                  step={0.25}
                  value={[interestRate]}
                  onValueChange={([v]) => setInterestRate(v)}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {SA_CREDIT_PROFILES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setInterestRate(p.ratePct)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        Math.abs(interestRate - p.ratePct) < 0.3
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40"
                      }`}
                      title={p.hint}
                    >
                      {p.label} ({p.ratePct.toFixed(1)}%)
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Gross monthly income (optional affordability check)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  placeholder="e.g. 45000"
                  value={grossIncome}
                  onChange={(e) =>
                    setGrossIncome(e.target.value === "" ? "" : Number(e.target.value) || 0)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-gold border-primary/30">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Your estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Monthly instalment</p>
                <p className="font-display text-5xl font-bold text-primary">{fmt(monthly)}</p>
                <p className="text-sm text-muted-foreground mt-1">per month for {termMonths} months at {interestRate.toFixed(1)}%</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/15">
                <div>
                  <p className="text-xs text-muted-foreground">Amount financed</p>
                  <p className="font-semibold">{fmt(principal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total interest</p>
                  <p className="font-semibold">{fmt(Math.max(0, interest))}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Total cost of credit</p>
                  <p className="font-semibold">{fmt(total)}</p>
                </div>
              </div>

              {affordability && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    affordability.ok
                      ? "border-green-500/30 bg-green-500/10 text-green-200"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      {affordability.ok ? (
                        <span>
                          Within typical bank guideline — instalment is{" "}
                          {Math.round(affordability.ratio * 100)}% of gross income (target ≤25%).
                        </span>
                      ) : (
                        <span>
                          Above typical 25% gross-income guideline (yours would be{" "}
                          {Math.round(affordability.ratio * 100)}%). Consider a larger deposit or longer term.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">
                  NCA VAF cap ~{SA_FINANCE_DEFAULTS.ncaCapPct}%
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Slider to 26% (sub-prime stress)
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  WesBank · MFC · Std Bank VAF
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Indicative only — not a finance offer. Your bank quotes prime plus a spread based on credit score,
                deposit, vehicle age, and term. Initiation & admin fees (NCA-capped) are not included.
              </p>

              {applyHref ? (
                <Button asChild className="btn-gold w-full h-11 font-semibold">
                  <Link href={applyHref}>
                    <Banknote className="h-4 w-4 mr-2" />
                    Apply for pre-approval
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                  Online pre-approval opens once a dealership completes setup. Browse the{" "}
                  <Link href="/showroom" className="text-primary hover:underline">
                    showroom
                  </Link>{" "}
                  and apply from a vehicle page.
                </div>
              )}
              <p className="text-[11px] text-muted-foreground text-center">
                Same car context → Naledi pre-approval (not a credit decision).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
