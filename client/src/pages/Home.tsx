import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  BarChart3,
  Car,
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
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
};

const JOURNEY = [
  {
    icon: Handshake,
    title: "Trade-in intelligence",
    desc: "Instant SA market ranges that feed finance and stock — not a dead-end guide number.",
    href: "/trade-in",
  },
  {
    icon: TrendingUp,
    title: "Deal scores on every car",
    desc: "See how each listing sits versus market mid before a buyer ever walks the floor.",
    href: "/showroom?sort=best_deals",
  },
  {
    icon: BarChart3,
    title: "Finance that closes",
    desc: "Bridge the upgrade gap with instalments calibrated for South African VAF reality.",
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

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />

      {/* Full-bleed cinematic hero — brand + one line + CTA + car plane */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden"
      >
        <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="absolute inset-0">
          <img
            src="/hero-car.jpg"
            alt=""
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_40%] img-premium"
          />
          <div className="absolute inset-0 hero-cinematic-veil" />
          <div className="absolute inset-0 hero-gold-sweep pointer-events-none" aria-hidden />
          <div className="absolute inset-0 noise-overlay pointer-events-none" />
        </motion.div>

        <motion.div
          style={{ y: copyY }}
          className="container relative z-10 pb-16 pt-32 md:pb-24 md:pt-28"
        >
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <p className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gold-gradient mb-5 md:mb-6">
              GrayArx
            </p>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.15] tracking-tight text-foreground/95 mb-5 max-w-2xl">
              The dealership operating system built to outsell classifieds.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
              Deal scores, multi-dealer trade-in, and finance — one premium stack for South African
              retail.
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button asChild className="btn-gold h-12 px-8 text-base font-semibold">
                <Link href="/trade-in">
                  Value my trade-in <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 px-8 border-primary/35 bg-background/20 backdrop-blur-sm hover:bg-background/40"
              >
                <Link href="/showroom?sort=best_deals">Browse scored deals</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      <HomeFeaturedDeals />

      {/* Buyer journey — one job: connect trade-in → stock → finance */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <div className="container relative">
          <motion.div {...fadeUp} className="max-w-2xl mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
              From valuation to keys —{" "}
              <span className="text-gold-gradient">without the friction</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              AutoTrader stops at a listing. GrayArx carries the buyer through the money decisions
              that actually close the deal.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            {JOURNEY.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              >
                <Link href={item.href} className="group block">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-display text-sm text-primary/70 tabular-nums">
                      0{i + 1}
                    </span>
                    <item.icon className="h-5 w-5 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                  <span className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-primary/80 group-hover:text-primary">
                    Explore <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform capabilities — editorial, not card grid clutter */}
      <section id="features" className="py-20 md:py-28 border-y border-primary/10 bg-card/25">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Infrastructure for modern retail
            </h2>
            <p className="text-muted-foreground text-lg">
              Built like a product company — not a bolted-on chatbot widget.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-12 max-w-5xl">
            {CAPABILITIES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="relative pl-0 sm:pl-0"
              >
                <div className="divider-premium mb-6 max-w-[8rem]" />
                <div className="flex items-start gap-4">
                  <f.icon className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip — sparse, expensive */}
      <section className="py-16 md:py-20">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 border-t border-primary/15 pt-10"
          >
            <div className="max-w-xl">
              <p className="font-display text-2xl md:text-3xl font-semibold leading-snug">
                Designed for dealerships that refuse to look like everyone else online.
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {["POPIA-ready", "11 SA languages", "CSV / DMS import", "Deal scores"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Pilot CTA */}
      <section id="lead-capture" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-primary/[0.04] pointer-events-none" />
        <div className="container relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div {...fadeUp}>
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
          </motion.div>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
            <LeadCaptureFormOptimized />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
