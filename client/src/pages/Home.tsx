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
  Scale,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LeadCaptureFormOptimized from "@/components/LeadCaptureFormOptimized";
import HomeFeaturedDeals from "@/components/HomeFeaturedDeals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { trpc } from "@/lib/trpc";
import { buildEditorialPanels } from "@/lib/showroomImagery";
import { HERO_SHOWCASE_CORVETTE } from "@shared/imagePipeline";
import { TIER_FEATURE_ROWS, PILOT_PARTNER } from "@shared/subscriptionTiers";
import { AGENTS } from "@shared/agents";
import { useMemo, useState, useEffect } from "react";


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
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1400&q=88&auto=format&fit=crop", // BMW M5
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1400&q=88&auto=format&fit=crop", // Lamborghini Huracán
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=88&auto=format&fit=crop", // Porsche 911
      "https://images.unsplash.com/photo-1580274455191-1c62238fa1c6?w=1400&q=88&auto=format&fit=crop", // Audi R8
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1400&q=88&auto=format&fit=crop", // Lamborghini dark
    ],
  },
  {
    title: "Digital showroom",
    tagline: "Be bold.",
    cta: "Explore",
    href: "/showroom",
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=88&auto=format&fit=crop", // Mercedes C200
      "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=1200&q=88&auto=format&fit=crop", // Porsche GT3
      "https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=1200&q=88&auto=format&fit=crop", // BMW X5
      "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=1200&q=88&auto=format&fit=crop", // Land Rover Defender
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=88&auto=format&fit=crop", // BMW M5 studio
    ],
  },
  {
    title: "Trade-in intelligence",
    tagline: "Know your number.",
    cta: "Get valuation",
    href: "/trade-in",
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=88&auto=format&fit=crop", // Toyota Hilux
      "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=1200&q=88&auto=format&fit=crop", // Land Rover
      "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=1200&q=88&auto=format&fit=crop", // car on highway
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=88&auto=format&fit=crop", // Porsche 911
      "https://images.unsplash.com/photo-1580274455191-1c62238fa1c6?w=1200&q=88&auto=format&fit=crop", // Audi R8
    ],
  },
  {
    title: "AI platform",
    tagline: "For the dealers.",
    cta: "Read more",
    href: "/help",
    images: [
      "https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=1200&q=88&auto=format&fit=crop", // BMW X5 night
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=88&auto=format&fit=crop", // Lambo
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=88&auto=format&fit=crop", // dark Lambo
      "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=1200&q=88&auto=format&fit=crop", // Porsche GT3
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=88&auto=format&fit=crop", // Mercedes
    ],
  },
];

function PanelSlideshow({ images, eager }: { images: string[]; eager?: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading={eager && i === 0 ? "eager" : "lazy"}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
    </>
  );
}

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
    desc: "Your CSV or DMS export syncs showroom, chat, and WhatsApp from one source of truth.",
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
  "Legal centre",
];

export default function Home() {
  const { data: inventory } = trpc.showroom.list.useQuery();

  const editorialPanels = useMemo(() => {
    const live = buildEditorialPanels(inventory ?? []);
    // Use live listing photos if any vehicle has a non-stock photo
    const hasRealPhotos = live.some((p) => p.liveListing);
    if (hasRealPhotos) return live;

    // Each static panel has its own curated image — use it directly
    return EDITORIAL_STATIC.map((p) => ({
      ...p,
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

      {/* ── Full-bleed cinematic hero ── */}
      <section className="relative home-hero-stage overflow-hidden">
        {/* Full-bleed car background */}
        <img
          src={HERO_SHOWCASE_CORVETTE}
          alt="GrayArx futuristic hypercar showcase"
          className="absolute inset-0 w-full h-full object-cover object-center"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
        />

        {/* Gradient overlays — keep left text readable, let car breathe on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-[#060608]/80 to-[#060608]/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608]/70 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 container w-full py-28 md:py-32 lg:py-36">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="status-pill font-tech inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] mb-8">
                <span className="status-dot" />
                South Africa&apos;s dealership OS
              </span>

              <p className="tagline-xl text-white mb-2">
                Precision.
                <br />
                <span className="text-cyber-gradient">At scale.</span>
              </p>

              <h1 className="font-serif text-xl sm:text-2xl md:text-[1.65rem] font-light text-white/80 max-w-xl leading-relaxed mb-10 tracking-wide">
                Deal scores, AI agents, and a showroom that outsells classifieds — built for how
                SA dealers actually sell.
              </h1>

              <div className="flex flex-wrap gap-4 mb-10">
                <Button asChild className="btn-gold h-12 px-10 text-sm font-semibold uppercase tracking-wider">
                  <Link href="/showroom?sort=best_deals">
                    Browse scored deals <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="btn-cyber h-12 px-10 text-sm font-semibold uppercase tracking-wider bg-transparent"
                >
                  <Link href="/onboarding">Start free pilot</Link>
                </Button>
              </div>

              <ul className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-tech uppercase tracking-[0.15em] text-white/50">
                {["Free pilot", "No credit card", "POPIA ready"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="hidden lg:flex absolute bottom-8 right-8 flex-col items-center gap-2 text-white/30"
          >
            <span className="font-tech text-[9px] uppercase tracking-[0.3em] [writing-mode:vertical-lr]">
              Scroll
            </span>
            <div className="h-12 w-px bg-gradient-to-b from-primary/50 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Luxury vehicle showcase strip */}
      <section className="relative border-y border-primary/10 bg-[#08080a]/90 py-10 md:py-14 overflow-hidden">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-2">
                Scored inventory
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                Precision-priced. Ready to deal.
              </h2>
            </div>
            <Link
              href="/showroom?sort=best_deals"
              className="font-tech text-xs uppercase tracking-[0.2em] text-primary hover:text-primary/80 inline-flex items-center gap-2 shrink-0"
            >
              Browse all deals <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=85&auto=format&fit=crop",
                make: "Porsche", model: "911 Carrera S", year: 2023, price: "R1 890 000", score: "Great Deal", pct: -8,
              },
              {
                img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=85&auto=format&fit=crop",
                make: "Mercedes-Benz", model: "C63 AMG", year: 2022, price: "R1 245 000", score: "Great Deal", pct: -11,
              },
              {
                img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=85&auto=format&fit=crop",
                make: "Lamborghini", model: "Huracán EVO", year: 2021, price: "R4 750 000", score: "Fair Price", pct: -3,
              },
              {
                img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=85&auto=format&fit=crop",
                make: "Ferrari", model: "Roma", year: 2022, price: "R5 100 000", score: "Great Deal", pct: -7,
              },
            ].map((car, i) => (
              <motion.div
                key={car.model}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              >
                <Link
                  href="/showroom?sort=best_deals"
                  className="group block rounded-xl overflow-hidden border border-white/8 hover:border-primary/30 transition-colors relative"
                >
                  {/* Car image */}
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={car.img}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  {/* Deal score badge */}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 font-tech text-[9px] font-semibold uppercase tracking-[0.15em] text-black backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-black/60" />
                    {car.score} · {car.pct}%
                  </span>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-tech text-[9px] uppercase tracking-[0.18em] text-white/50 mb-0.5">
                      {car.year} · {car.make}
                    </p>
                    <p className="font-display text-sm font-bold text-white leading-tight">
                      {car.model}
                    </p>
                    <p className="font-tech text-[11px] text-primary mt-1">
                      {car.price}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
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

          <div className="grid md:grid-cols-2 gap-3 md:gap-4 editorial-bento">
            {editorialPanels.map((panel, i) => (
              <motion.div
                key={`${panel.title}-${i}`}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className={cn(i === 0 && "md:col-span-2")}
              >
                <Link
                  href={panel.href}
                  className={cn("editorial-panel group block rounded-xl md:rounded-2xl border border-white/5 holo-card", i === 0 && "min-h-[380px] md:min-h-[480px]")}
                >
                  {"images" in panel && Array.isArray(panel.images) ? (
                    <PanelSlideshow images={panel.images} eager={i === 0} />
                  ) : (
                    <img
                      src={(panel as { image: string }).image}
                      alt=""
                      loading={i === 0 ? "eager" : "lazy"}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="relative z-10 flex h-full min-h-[320px] md:min-h-[420px] flex-col justify-end p-6 md:p-10">
                    {"liveListing" in panel && panel.liveListing && (
                      <span className="mb-2 inline-flex w-fit rounded-full bg-black/45 px-3 py-1 font-tech text-[9px] uppercase tracking-[0.2em] text-primary/90 backdrop-blur-sm">
                        Live listing
                      </span>
                    )}
                    <p className="font-tech text-[10px] uppercase tracking-[0.25em] text-primary/70 mb-4">
                      {panel.subtitle ?? panel.tagline}
                    </p>
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
              Classified portals stop at a listing. GrayArx carries the buyer through the money decisions
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
                  {t === "Legal centre" ? (
                    <Link href="/legal" className="hover:text-primary transition-colors">
                      {t}
                    </Link>
                  ) : (
                    t
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Compliance strip */}
      <section className="relative py-14 md:py-16 border-t border-primary/10 bg-[#08080a]/80">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 rounded-2xl border border-primary/15 holo-card p-8 md:p-10"
          >
            <div className="flex items-start gap-4 max-w-xl">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-tech text-[10px] uppercase tracking-[0.28em] text-primary/80 mb-2">
                  Compliance
                </p>
                <h2 className="font-display text-xl md:text-2xl font-bold mb-2">
                  Enterprise-grade legal pack
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Terms, privacy, DPA, dealer agreement, and POPIA forms — one link for your team
                  or attorney. Built for South African law from day one.
                </p>
              </div>
            </div>
            <Button asChild className="btn-gold h-12 px-8 shrink-0 font-semibold uppercase tracking-wider text-sm">
              <Link href="/legal">
                Open legal centre <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
