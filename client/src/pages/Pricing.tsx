import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DealerRoiProof from "@/components/DealerRoiProof";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { OWNER_WHATSAPP_URL } from "@/lib/contact";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  PILOT_PARTNER,
  TIER_DISPLAY_NAMES,
  TIER_FEATURE_ROWS,
  TIER_PRICES_ZAR,
} from "@shared/subscriptionTiers";
import { formatZar } from "@shared/dealerRoiMath";

const PILOT_FEATURES = TIER_FEATURE_ROWS.filter((f) =>
  f.tiers.includes(PILOT_PARTNER.featureTier),
).map((f) => f.label);

const TERMS = [
  "Free pilot — no credit card to start",
  `${TIER_DISPLAY_NAMES.professional} features while you prove one recovered lead`,
  `Billing only after written confirm — soft floor from ${formatZar(TIER_PRICES_ZAR.starter)}/mo (Showroom list)`,
  "Month-to-month with 30 days’ notice (or 12-month founder rate lock)",
  "Runs alongside AutoTrader / DMS / Meta — no cancel required",
];

/**
 * Honest pilot pricing page — soft floor + ROI, not a full locked list table.
 * Upgrade UI still uses PILOT_PRICING_HIDDEN for the comparison grid.
 */
export default function Pricing() {
  useDocumentMeta({
    title: "Pilot terms & pricing | GrayArx",
    description:
      "Free dealership pilot for independent SA yards. Growth features, no card to start. Soft floor from Showroom list after written confirmation.",
    canonicalPath: "/pricing",
    ogType: "website",
  });

  return (
    <div className="min-h-screen bg-[#060608] text-foreground">
      <Navigation />

      <section className="pt-28 md:pt-32 pb-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-50" aria-hidden />
        <div className="container max-w-3xl relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-primary/25 bg-primary/5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Pilot honesty
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
            Free pilot. Soft floor.{" "}
            <span className="text-cyber-gradient">No surprise invoice.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Pilot partners get <strong className="text-foreground">Growth-level features</strong> —
            showroom, CSV stock, WhatsApp Nala, Mia drip, leads. We confirm the monthly rate{" "}
            <em className="not-italic text-foreground">in writing</em> before billing. Typical
            Pilot Partner floor:{" "}
            <strong className="text-foreground">
              {formatZar(PILOT_PARTNER.monthlyPriceZar)}/mo
            </strong>{" "}
            (Showroom list) — not the full Growth list of{" "}
            {formatZar(TIER_PRICES_ZAR.professional)}/mo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="btn-gold h-12 px-8 font-semibold">
              <Link href="/#lead-capture">
                Start free pilot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8 btn-cyber bg-transparent">
              <a href={OWNER_WHATSAPP_URL} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat with founder
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container max-w-3xl">
          <ul className="space-y-3 mb-12">
            {TERMS.map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 text-base text-white/85 border-b border-primary/10 pb-3"
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-primary/15 holo-card p-6 md:p-8 mb-12">
            <p className="font-tech text-[10px] uppercase tracking-[0.25em] text-primary/80 mb-3">
              What’s included (pilot)
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {PILOT_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <DealerRoiProof ctaHref="/#lead-capture" showPricingLink={false} />

          <p className="text-xs text-muted-foreground mt-10 text-center max-w-xl mx-auto leading-relaxed">
            Full tier comparison stays soft during pilot so we learn what yards actually use.
            Founder rate exceptions are written only — see legal pack at{" "}
            <Link href="/legal" className="text-primary hover:underline">
              /legal
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
