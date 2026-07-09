import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Car,
  CheckCircle2,
  Handshake,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LeadCaptureFormOptimized from "@/components/LeadCaptureFormOptimized";
import HomeFeaturedDeals from "@/components/HomeFeaturedDeals";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
};

const PILLARS = [
  { value: "Live", label: "Deal scores on every listing" },
  { value: "11", label: "Official SA languages" },
  { value: "POPIA", label: "Compliant data flows" },
  { value: "24/7", label: "WhatsApp buyer journeys" },
];

const JOURNEY = [
  {
    icon: Handshake,
    title: "Trade-in intelligence",
    desc: "Instant SA market ranges that feed finance and stock.",
    href: "/trade-in",
  },
  {
    icon: TrendingUp,
    title: "Deal scores on every car",
    desc: "See how each listing sits versus market mid.",
    href: "/showroom?sort=best_deals",
  },
  {
    icon: BarChart3,
    title: "Finance that closes",
    desc: "Instalments calibrated for South African VAF reality.",
    href: "/finance",
  },
];

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: "Price intelligence",
    desc: "Live deal scores against SA market guides so buyers trust the number — and dealers defend margin.",
  },
  {
    icon: Car,
    title: "Inventory that stays honest",
    desc: "CSV from AutoTrader or your DMS syncs showroom, chat, and WhatsApp from one source of truth.",
  },
  {
    icon: Zap,
    title: "Always-on buyer journeys",
    desc: "Trade-in → upgrade path → finance → booking. One platform instead of five browser tabs.",
  },
  {
    icon: Shield,
    title: "Built for SA compliance",
    desc: "POPIA-aware flows, 11 official languages, and dealer controls that keep humans in the loop.",
  },
];

const TRUST_POINTS = [
  "POPIA-ready",
  "11 SA languages",
  "CSV / DMS import",
  "Deal scores",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />

      {/* Subtle ambient depth — Manus-style orbs, toned down */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute inset-0 gradient-mesh opacity-60" />
      </div>

      {/* Split hero — Manus layout, premium v2 finish */}
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center lg:min-h-[calc(100svh-7rem)]">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10"
            >
              <span className="status-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide mb-6">
                <span className="status-dot" />
                Dealership operating system
              </span>

              <p className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gold-gradient mb-4">
                GrayArx
              </p>

              <h1 className="font-display text-2xl sm:text-3xl md:text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-foreground mb-5 max-w-xl">
                Built to outsell classifieds — with deal scores, trade-in, and finance in one stack.
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed mb-8">
                The premium platform for South African retail. Price intelligence, multi-dealer
                trade-in, and finance — without the friction.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Button asChild className="btn-gold h-12 px-8 text-base font-semibold">
                  <Link href="/trade-in">
                    Value my trade-in <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 px-8 border-primary/30 bg-card/40 backdrop-blur-sm hover:bg-card/60"
                >
                  <Link href="/showroom?sort=best_deals">Browse scored deals</Link>
                </Button>
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Free pilot", "No credit card", "SA-built"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary/80 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-primary/20 shadow-2xl shadow-black/40">
                <img
                  src="/hero-car.jpg"
                  alt="Premium vehicle showroom"
                  loading="eager"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center img-premium"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute inset-0 hero-gold-sweep pointer-events-none" />
              </div>
              <div className="absolute -inset-4 -z-10 rounded-3xl border border-primary/10 bg-primary/[0.03] blur-sm" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product pillars — honest signals, not inflated stats */}
      <section className="relative border-y border-primary/10 bg-card/20">
        <div className="container py-12 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="text-center md:text-left"
              >
                <p className="font-display text-3xl md:text-4xl font-bold text-gold-gradient tabular-nums">
                  {pillar.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground leading-snug max-w-[12rem] mx-auto md:mx-0">
                  {pillar.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <HomeFeaturedDeals />

      {/* Feature grid — Manus card rhythm, cleaner glass */}
      <section id="features" className="relative py-20 md:py-28">
        <div className="container">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
              Platform
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Infrastructure for <span className="text-gold-gradient">modern retail</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Built like a product company — not a bolted-on chatbot widget.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
            {CAPABILITIES.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
                className="group rounded-2xl border border-primary/15 bg-card/50 p-7 md:p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/35 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer journey */}
      <section className="py-20 md:py-24 border-t border-primary/10 bg-card/15">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-12 md:mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
              From valuation to keys —{" "}
              <span className="text-gold-gradient">without the friction</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              AutoTrader stops at a listing. GrayArx carries the buyer through the money decisions
              that actually close the deal.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {JOURNEY.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              >
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-primary/12 p-6 transition-all hover:border-primary/30 hover:bg-card/40"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-display text-xs text-primary/70 tabular-nums">
                      0{i + 1}
                    </span>
                    <item.icon className="h-5 w-5 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                    {item.desc}
                  </p>
                  <span className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-primary/80 group-hover:text-primary">
                    Explore{" "}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-14 md:py-16">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 border-t border-primary/15 pt-10"
          >
            <p className="font-display text-2xl md:text-3xl font-semibold leading-snug max-w-xl">
              Designed for dealerships that refuse to look like everyone else online.
            </p>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {TRUST_POINTS.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Pilot CTA — Manus gradient card, refined */}
      <section id="lead-capture" className="pb-24 md:pb-28">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-card/60 to-primary/[0.04] p-8 md:p-12 lg:p-14"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, transparent 25%, rgba(212,175,55,.04) 25%, rgba(212,175,55,.04) 50%, transparent 50%, transparent 75%, rgba(212,175,55,.04) 75%, rgba(212,175,55,.04))",
                backgroundSize: "48px 48px",
              }}
              aria-hidden
            />
            <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                  Start your <span className="text-gold-gradient">pilot</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed max-w-md">
                  A small group of SA dealerships. Pricing tailored to what you actually use — from{" "}
                  <span className="text-foreground font-medium">R4,000/month</span> once the pilot
                  proves value.
                </p>
                <Button asChild variant="outline" className="h-11 border-primary/30">
                  <Link href="/dealer/inventory/import">Already signed up? Import CSV →</Link>
                </Button>
              </div>
              <LeadCaptureFormOptimized />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
