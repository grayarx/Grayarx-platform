import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
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
import OptimizedImage from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { trpc } from "@/lib/trpc";
import { buildEditorialPanels, pickHeroImage } from "@/lib/showroomImagery";
import { LOCAL_EDITORIAL_IMAGES } from "@shared/imagePipeline";
import { TIER_FEATURE_ROWS, PILOT_PARTNER } from "@shared/subscriptionTiers";
import { useMemo } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const MARQUEE_ITEMS = [
  "Deal scores live",
  "11 SA languages",
  "POPIA compliant",
  "WhatsApp journeys",
  "Trade-in intelligence",
  "Finance calibrated",
  "Multi-dealer network",
  "AI-powered showroom",
];

const EDITORIAL_STATIC = [
  {
    title: "Scored inventory",
    tagline: "Precision. Priced.",
    cta: "View more",
    href: "/showroom?sort=best_deals",
  },
  {
    title: "Digital showroom",
    tagline: "Be bold.",
    cta: "Explore",
    href: "/showroom",
  },
  {
    title: "Trade-in intelligence",
    tagline: "Know your number.",
    cta: "Get valuation",
    href: "/trade-in",
  },
  {
    title: "AI platform",
    tagline: "For the dealers.",
    cta: "Read more",
    href: "/help",
  },
] as const;

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

const PILOT_FEATURES = TIER_FEATURE_ROWS.filter((f) =>
  f.tiers.includes(PILOT_PARTNER.featureTier),
).map((f) => f.label);

const TRUST_POINTS = [
  "POPIA-ready",
  "11 SA languages",
  "CSV / DMS import",
  "Deal scores",
];

export default function Home() {
  const { data: inventory } = trpc.showroom.list.useQuery();

  const heroSrc = useMemo(
    () => pickHeroImage(inventory ?? []),
    [inventory],
  );

  const editorialPanels = useMemo(() => {
    const live = buildEditorialPanels(inventory ?? []);
    if ((inventory ?? []).some((v) => v.primaryPhotoUrl || v.imageUrl)) return live;
    return EDITORIAL_STATIC.map((p, i) => ({
      ...p,
      image: LOCAL_EDITORIAL_IMAGES[i % LOCAL_EDITORIAL_IMAGES.length],
      liveListing: false,
      subtitle: p.tagline,
    }));
  }, [inventory]);

  useDocumentMeta({
    title: "GrayArx — Dealership Operating System",
    description:
      "Deal scores, trade-in intelligence, and finance for South African dealerships. Built to outsell classifieds.",
    ogImage: "https://www.grayarx.com/hero-car.jpg",
    ogUrl: "https://www.grayarx.com/",
    ogType: "website",
    themeColor: "#060608",
  });

  return (
    <div className="min-h-screen bg-[#060608] text-foreground overflow-x-hidden">
      <Navigation />

      {/* Ambient futurism */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="orb-gold -top-20 -right-20 h-[32rem] w-[32rem]" />
        <div className="orb-cyan bottom-1/4 -left-32 h-[28rem] w-[28rem]" />
        <div className="absolute inset-0 cyber-grid opacity-80" />
        <div className="absolute inset-0 gradient-mesh opacity-40" />
      </div>

      {/* ── Cinematic full-bleed hero (Daytona-style) ── */}
      <section className="relative hero-cinematic scan-line">
        <div className="hero-cinematic-bg">
          <OptimizedImage
            src={heroSrc}
            alt=""
            priority
            staticAsset={heroSrc.startsWith("/")}
            sizes="100vw"
            className="img-premium absolute inset-0 h-full w-full"
            fallbackSrc="/hero-car.jpg"
          />
        </div>
        <div className="hero-cinematic-veil-full" />

        <div className="relative z-10 container w-full pb-16 md:pb-24 pt-28 md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <span className="status-pill font-tech inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] mb-8">
              <span className="status-dot" />
              Next-gen dealership OS
            </span>

            <p className="tagline-xl text-white mb-2">
              Intensity.
              <br />
              <span className="text-cyber-gradient">Scored.</span>
            </p>

            <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-light text-white/75 max-w-2xl leading-relaxed mb-10 tracking-wide">
              Deal scores, trade-in intelligence, and finance — one futuristic stack built to
              outsell classifieds.
            </h1>

            <div className="flex flex-wrap gap-4 mb-10">
              <Button asChild className="btn-gold h-12 px-10 text-sm font-semibold uppercase tracking-wider">
                <Link href="/trade-in">
                  Value my trade-in <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="btn-cyber h-12 px-10 text-sm font-semibold uppercase tracking-wider bg-transparent"
              >
                <Link href="/showroom?sort=best_deals">Browse scored deals</Link>
              </Button>
            </div>

            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-tech uppercase tracking-[0.15em] text-white/50">
              {["Free pilot", "No credit card", "SA-built"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="hidden md:flex absolute bottom-8 right-8 flex-col items-center gap-2 text-white/30"
          >
            <span className="font-tech text-[9px] uppercase tracking-[0.3em] [writing-mode:vertical-lr]">
              Scroll
            </span>
            <div className="h-12 w-px bg-gradient-to-b from-primary/50 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Marquee ticker */}
      <div className="relative border-y border-primary/10 bg-black/60 backdrop-blur-sm overflow-hidden py-4">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="font-tech flex items-center gap-6 px-8 text-[11px] uppercase tracking-[0.22em] text-muted-foreground whitespace-nowrap"
            >
              {item}
              <span className="h-1 w-1 rounded-full bg-primary/60" />
            </span>
          ))}
        </div>
      </div>

      {/* Editorial showcase panels — Daytona grid */}
      <section className="relative py-4 md:py-6">
        <div className="container">
          <motion.div {...fadeUp} className="mb-8 md:mb-10 pt-12 md:pt-16">
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
              Explore
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              The future of <span className="text-cyber-gradient">retail</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {editorialPanels.map((panel, i) => (
              <motion.div
                key={`${panel.title}-${i}`}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              >
                <Link
                  href={panel.href}
                  className="editorial-panel group block rounded-xl md:rounded-2xl border border-white/5 holo-card"
                >
                  <OptimizedImage
                    src={panel.image}
                    alt=""
                    sizes="(max-width: 768px) 100vw, 50vw"
                    staticAsset={panel.image.startsWith("/")}
                    className="absolute inset-0 h-full w-full"
                  />
                  <div className="relative z-10 flex h-full min-h-[320px] md:min-h-[420px] flex-col justify-end p-6 md:p-10">
                    {"liveListing" in panel && panel.liveListing && (
                      <span className="mb-2 inline-flex w-fit rounded-full bg-black/45 px-3 py-1 font-tech text-[9px] uppercase tracking-[0.2em] text-primary/90 backdrop-blur-sm">
                        Live listing
                      </span>
                    )}
                    <p className="font-tech text-[10px] uppercase tracking-[0.25em] text-primary/70 mb-2">
                      {panel.subtitle ?? panel.tagline}
                    </p>
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-primary transition-colors duration-300">
                      {panel.title}
                    </h3>
                    <span className="inline-flex items-center gap-2 font-tech text-xs uppercase tracking-[0.2em] text-white/70 group-hover:text-primary transition-colors">
                      {panel.cta}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider-glow mx-auto max-w-4xl" />

      {/* Pillars */}
      <section className="relative py-16 md:py-20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="text-center md:text-left group"
              >
                <p className="font-display text-4xl md:text-5xl font-bold text-cyber-gradient tabular-nums group-hover:scale-105 transition-transform origin-left">
                  {pillar.value}
                </p>
                <p className="mt-3 font-tech text-[11px] uppercase tracking-[0.15em] text-muted-foreground leading-relaxed max-w-[14rem] mx-auto md:mx-0">
                  {pillar.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <HomeFeaturedDeals />

      {/* Capabilities */}
      <section id="features" className="relative py-20 md:py-28">
        <div className="container">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
              Platform
            </p>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.05]">
              Infrastructure for{" "}
              <span className="text-cyber-gradient">modern retail</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Built like a product company — not a bolted-on chatbot widget.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 md:gap-5 max-w-5xl mx-auto">
            {CAPABILITIES.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="group holo-card rounded-2xl p-8 md:p-9 scan-line"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 transition-all group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer journey */}
      <section className="py-20 md:py-28 border-t border-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="container relative">
          <motion.div {...fadeUp} className="max-w-2xl mb-14 md:mb-16">
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
              Journey
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-tight">
              From valuation to keys —{" "}
              <span className="text-cyber-gradient">without friction</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              AutoTrader stops at a listing. GrayArx carries the buyer through the money decisions
              that actually close the deal.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {JOURNEY.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="group flex h-full flex-col holo-card rounded-2xl p-7 md:p-8"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-tech text-xs text-primary/60 tabular-nums tracking-widest">
                      0{i + 1}
                    </span>
                    <item.icon className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                    {item.desc}
                  </p>
                  <span className="inline-flex items-center font-tech text-[10px] uppercase tracking-[0.25em] text-primary/70 group-hover:text-primary">
                    Explore
                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-16 md:py-20">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 border-t border-primary/15 pt-12"
          >
            <p className="font-display text-2xl md:text-4xl font-bold leading-tight max-w-2xl">
              Designed for dealerships that refuse to look like{" "}
              <span className="text-cyber-gradient">everyone else</span> online.
            </p>
            <ul className="flex flex-wrap gap-x-10 gap-y-4 font-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {TRUST_POINTS.map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Pilot CTA */}
      <section id="lead-capture" className="pb-24 md:pb-32">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-primary/25 holo-card p-8 md:p-12 lg:p-16 scan-line"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, transparent 25%, rgba(212,175,55,.03) 25%, rgba(212,175,55,.03) 50%, transparent 50%, transparent 75%, rgba(125,211,252,.03) 75%, rgba(125,211,252,.03))",
                backgroundSize: "56px 56px",
              }}
              aria-hidden
            />
            <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
                  Pilot programme
                </p>
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight leading-tight">
                  Start your <span className="text-cyber-gradient">pilot</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md">
                  A small group of SA dealerships. Pilot partners get{" "}
                  <strong className="text-foreground">Growth-level features</strong> — showroom, inventory,
                  WhatsApp Nala, leads, and trade-ins. Pricing confirmed before billing goes live.
                </p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground mb-8">
                  {PILOT_FEATURES.slice(0, 8).map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="btn-cyber h-11 bg-transparent">
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
