import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  Clock,
  MessageCircle,
  Scale,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LeadCaptureFormOptimized from "@/components/LeadCaptureFormOptimized";
import HomeFeaturedDeals from "@/components/HomeFeaturedDeals";
import IcpRoiCalculator from "@/components/IcpRoiCalculator";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { HERO_SHOWCASE_CORVETTE } from "@shared/imagePipeline";
import { SEO_PAGES, buildHomeJsonLd } from "@shared/seo";
import {
  CASH_CAPABILITIES,
  CASH_CTAS,
  CASH_FASCINATIONS,
  CASH_FOR_YOU_IF,
  CASH_HOME,
  CASH_MARQUEE,
  CASH_PAS,
  CASH_PILOT_FEATURES,
  CASH_PROOF_STEPS,
  CASH_RISK_REVERSAL,
} from "@shared/cashvertising";

const HOME_JSON_LD = buildHomeJsonLd();

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const STEP_ICONS = [Upload, Car, MessageCircle, Clock] as const;
const CAPABILITY_ICONS = [Zap, Car, MessageCircle, Shield] as const;

export default function Home() {
  useDocumentMeta({
    title: SEO_PAGES.home.title,
    description: SEO_PAGES.home.description,
    keywords: SEO_PAGES.home.keywords,
    ogImage: "https://www.grayarx.com/hero-car.jpg",
    canonicalPath: "/",
    ogType: "website",
    themeColor: "#060608",
    jsonLd: HOME_JSON_LD,
  });

  return (
    <div className="min-h-screen bg-[#060608] text-foreground overflow-x-hidden">
      <Navigation />

      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="orb-gold -top-20 -right-20 h-[32rem] w-[32rem]" />
        <div className="orb-cyan bottom-1/4 -left-32 h-[28rem] w-[28rem]" />
        <div className="absolute inset-0 cyber-grid opacity-80" />
        <div className="absolute inset-0 gradient-mesh opacity-40" />
      </div>

      {/* Hero — Fear + specificity + risk reversal */}
      <section className="relative home-hero-stage overflow-hidden">
        <img
          src={HERO_SHOWCASE_CORVETTE}
          alt="GrayArx showcase"
          className="absolute inset-0 w-full h-full object-cover object-center"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-[#060608]/85 to-[#060608]/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/40 to-transparent pointer-events-none" />

        <div className="relative z-10 container w-full py-28 md:py-32 lg:py-36">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
                {CASH_HOME.eyebrow}
              </p>
              <p className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-8">
                Gray<span className="text-cyber-gradient">Arx</span>
              </p>

              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white leading-[1.15] mb-5">
                {CASH_HOME.h1Before}
                <span className="text-cyber-gradient">{CASH_HOME.h1Accent}</span>
              </h1>

              <p className="text-lg md:text-xl text-white/75 max-w-xl leading-relaxed mb-10">
                {CASH_HOME.sub}
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Button asChild className="btn-gold h-12 px-10 text-sm font-semibold uppercase tracking-wider">
                  <a href="#lead-capture">
                    {CASH_CTAS.primary} <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="btn-cyber h-12 px-8 text-sm font-semibold uppercase tracking-wider bg-transparent"
                >
                  <a href="#roi">{CASH_CTAS.seeCost}</a>
                </Button>
              </div>

              <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-white/45">
                {CASH_HOME.trustLine}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="relative border-y border-primary/10 bg-black/60 backdrop-blur-sm overflow-hidden py-4">
        <div className="marquee-track">
          {[...CASH_MARQUEE, ...CASH_MARQUEE].map((item, i) => (
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

      {/* Qualifier — independent WhatsApp-heavy yards */}
      <section id="right-yards" className="relative py-20 md:py-24">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-12">
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
              {CASH_HOME.qualifierEyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
              {CASH_HOME.qualifierH2}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{CASH_HOME.qualifierSub}</p>
          </motion.div>

          <motion.div {...fadeUp} className="rounded-2xl border border-primary/20 bg-primary/5 p-7 md:p-8 max-w-3xl">
            <p className="font-tech text-[10px] uppercase tracking-[0.22em] text-primary/80 mb-5">
              {CASH_HOME.forYouLabel}
            </p>
            <ul className="space-y-3">
              {CASH_FOR_YOU_IF.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm md:text-base text-white/90">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      <div className="section-divider-glow mx-auto max-w-4xl" />

      {/* Path — simplicity + instant gratification */}
      <section id="how-it-works" className="relative py-20 md:py-28">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-14">
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
              {CASH_HOME.pathEyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              {CASH_HOME.pathH2Before}
              <span className="text-cyber-gradient">{CASH_HOME.pathH2Accent}</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{CASH_HOME.pathSub}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {CASH_PROOF_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? Upload;
              return (
                <motion.div
                  key={step.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                  className="relative border-l border-primary/25 pl-5 py-1"
                >
                  <span className="font-tech text-[10px] text-primary/60 tracking-widest tabular-nums">
                    0{i + 1}
                  </span>
                  <div className="mt-3 mb-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.div {...fadeUp} className="mt-12 flex flex-wrap items-center gap-4">
            <Button asChild className="btn-gold h-11 px-8 font-semibold uppercase tracking-wider text-sm">
              <a href="#lead-capture">
                {CASH_CTAS.primary} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link
              href="/onboarding"
              className="font-tech text-xs uppercase tracking-[0.2em] text-primary/80 hover:text-primary"
            >
              {CASH_CTAS.selfServe}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* PAS — agitate */}
      <section className="relative py-20 md:py-24 border-t border-primary/10">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <motion.div {...fadeUp}>
              <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
                {CASH_HOME.pasEyebrow}
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-5">
                {CASH_HOME.pasH2}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">{CASH_PAS.problem}</p>
              <p className="text-white/85 text-base leading-relaxed mb-8">{CASH_PAS.solve}</p>
              <Button asChild className="btn-gold h-11 px-8 font-semibold uppercase tracking-wider text-sm">
                <a href="#lead-capture">{CASH_CTAS.primary}</a>
              </Button>
            </motion.div>

            <motion.ul {...fadeUp} className="space-y-4">
              {CASH_PAS.agitate.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 border-b border-primary/10 pb-4 text-base md:text-lg text-white/85"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      {/* What you'll see */}
      <section className="relative py-16 md:py-20 border-t border-primary/10">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp}>
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
              Inside the 14-day Pilot
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-8">
              What you will see on{" "}
              <span className="text-cyber-gradient">your</span> stock
            </h2>
            <ol className="space-y-4">
              {CASH_FASCINATIONS.map((line, i) => (
                <li key={line} className="flex gap-4 border-l border-primary/30 pl-5 py-1">
                  <span className="font-tech text-[10px] text-primary/70 tracking-widest tabular-nums mt-1">
                    0{i + 1}
                  </span>
                  <p className="text-base md:text-lg text-white/90 leading-relaxed">{line}</p>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      </section>

      {/* Your numbers — ROI */}
      <section id="roi" className="relative py-16 md:py-24 border-t border-primary/10">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp}>
            <IcpRoiCalculator />
            <p className="mt-4 text-center font-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Full dealer brief →{" "}
              <Link href="/for-dealers" className="text-primary hover:underline">
                /for-dealers
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className="relative py-20 md:py-28 border-t border-primary/10">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-14 md:mb-16">
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
              {CASH_HOME.capabilitiesEyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              {CASH_HOME.capabilitiesH2Before}
              <span className="text-cyber-gradient">{CASH_HOME.capabilitiesH2Accent}</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {CASH_HOME.capabilitiesSub}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 md:gap-5 max-w-5xl">
            {CASH_CAPABILITIES.map((feature, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? Zap;
              return (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                  className="group holo-card rounded-2xl p-8 md:p-9"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-primary/10 bg-[#08080a]/90">
        <HomeFeaturedDeals />
      </section>

      <section className="relative py-14 md:py-16 border-t border-primary/10">
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
                  POPIA &amp; legal
                </p>
                <h2 className="font-display text-xl md:text-2xl font-bold mb-2">
                  Attorney-ready from day one
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Terms, privacy, DPA, dealer agreement — one link for your team. South African law,
                  not a US template with the logo swapped.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="btn-cyber h-12 px-8 shrink-0 bg-transparent font-semibold uppercase tracking-wider text-sm">
              <Link href="/legal">
                Legal centre <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Risk reversal + form */}
      <section id="lead-capture" className="pb-24 md:pb-32">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-primary/25 holo-card p-8 md:p-12 lg:p-16"
          >
            <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
                  {CASH_HOME.ctaEyebrow}
                </p>
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight leading-tight">
                  {CASH_HOME.ctaH2Before}
                  <span className="text-cyber-gradient">{CASH_HOME.ctaH2Accent}</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md">
                  {CASH_HOME.ctaSub}
                </p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                  {CASH_PILOT_FEATURES.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2 text-sm text-white/70 mb-8">
                  {CASH_RISK_REVERSAL.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {line}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="btn-cyber h-11 bg-transparent">
                  <Link href="/onboarding">{CASH_CTAS.selfServe}</Link>
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
