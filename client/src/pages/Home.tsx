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
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { TIER_FEATURE_ROWS, PILOT_PARTNER } from "@shared/subscriptionTiers";

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

/** SA yard stock energy — Hilux / working inventory, not supercar theatre. */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1800&q=88&auto=format&fit=crop";

const MARQUEE_ITEMS = [
  "After-hours WhatsApp",
  "CSV stock live tonight",
  "Booked test drives",
  "Mia follow-up drip",
  "Independent SA yards",
  "POPIA compliant",
  "Your cars — not classifieds",
  "Free pilot",
];

const PROOF_STEPS = [
  {
    icon: Upload,
    title: "Drop your CSV",
    desc: "DMS or spreadsheet — your stock becomes the source of truth.",
  },
  {
    icon: Car,
    title: "Showroom goes live",
    desc: "Buyers browse your yard, not a random marketplace dump.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp after hours",
    desc: "Nala answers when you are closed. Mia drips the cold ones.",
  },
  {
    icon: Clock,
    title: "Drives in your inbox",
    desc: "Bookings and leads land where your team already works.",
  },
];

const PAIN_MIRRORS = [
  "Leads from AutoTrader go cold after 6pm",
  "WhatsApp sits unread while you are with a customer",
  "Follow-ups depend on whoever remembers",
  "Your website still looks like 2014 stock photos",
];

const CAPABILITIES = [
  {
    icon: Zap,
    title: "After-hours that actually reply",
    desc: "Nala on WhatsApp + Mia drip so overnight interest becomes a booked drive — not a missed call list.",
  },
  {
    icon: Car,
    title: "Your stock, one truth",
    desc: "CSV / DMS sync keeps showroom, chat, and WhatsApp on the same cars. Sold stays sold.",
  },
  {
    icon: MessageCircle,
    title: "Buyer path that closes",
    desc: "Trade-in → finance → pre-approval → booking on the car they want — without five browser tabs.",
  },
  {
    icon: Shield,
    title: "Built for SA dealers",
    desc: "POPIA-aware flows, 11 languages, and human control — for independent yards, not enterprise theatre.",
  },
];

const PILOT_FEATURES = TIER_FEATURE_ROWS.filter((f) =>
  f.tiers.includes(PILOT_PARTNER.featureTier),
).map((f) => f.label);

export default function Home() {
  useDocumentMeta({
    title: "GrayArx — Stop losing after-hours deals",
    description:
      "For independent SA dealerships: put your CSV stock live, answer WhatsApp after hours, and book test drives before morning. Free pilot.",
    ogImage: "https://www.grayarx.com/hero-car.jpg",
    ogUrl: "https://www.grayarx.com/",
    ogType: "website",
    themeColor: "#060608",
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

      {/* ── Hero: ICP in three seconds ── */}
      <section className="relative home-hero-stage overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
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
              <p className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-8">
                Gray<span className="text-cyber-gradient">Arx</span>
              </p>

              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white leading-[1.15] mb-5">
                Your after-hours leads are{" "}
                <span className="text-cyber-gradient">dying on WhatsApp</span>
              </h1>

              <p className="text-lg md:text-xl text-white/75 max-w-xl leading-relaxed mb-10">
                Independent SA yards put CSV stock live — we answer buyers overnight and book the
                test drive on <em className="not-italic text-white">your</em> cars.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Button asChild className="btn-gold h-12 px-10 text-sm font-semibold uppercase tracking-wider">
                  <a href="#lead-capture">
                    Start free pilot <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="btn-cyber h-12 px-8 text-sm font-semibold uppercase tracking-wider bg-transparent"
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>

              <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-white/45">
                Free pilot · No credit card · Live on your stock
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee */}
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

      {/* Proof path */}
      <section id="how-it-works" className="relative py-20 md:py-28">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-14">
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
              Path to customers
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              From spreadsheet to{" "}
              <span className="text-cyber-gradient">booked drive</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              One lost lead recovered pays for the month. This is the loop we run on your yard.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {PROOF_STEPS.map((step, i) => (
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
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-12 flex flex-wrap items-center gap-4">
            <Button asChild className="btn-gold h-11 px-8 font-semibold uppercase tracking-wider text-sm">
              <a href="#lead-capture">
                Put my stock live <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link
              href="/onboarding"
              className="font-tech text-xs uppercase tracking-[0.2em] text-primary/80 hover:text-primary"
            >
              Or open self-serve setup →
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="section-divider-glow mx-auto max-w-4xl" />

      {/* Pain mirror */}
      <section className="relative py-20 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <motion.div {...fadeUp}>
              <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
                We know the yard
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-5">
                Built for the DP who still answers their own phone
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Independent used and multi-brand stock. Thirty to two hundred cars. Heavy WhatsApp.
                GrayArx sits beside AutoTrader and your DMS — it does not rip them out.
              </p>
              <Button asChild className="btn-gold h-11 px-8 font-semibold uppercase tracking-wider text-sm">
                <a href="#lead-capture">Start free pilot</a>
              </Button>
            </motion.div>

            <motion.ul {...fadeUp} className="space-y-4">
              {PAIN_MIRRORS.map((line) => (
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

      {/* Capabilities */}
      <section id="features" className="relative py-20 md:py-28 border-t border-primary/10">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-14 md:mb-16">
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
              What you get
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              The wedge that{" "}
              <span className="text-cyber-gradient">pays for itself</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Not another chatbot widget. A dealer OS tuned for after-hours leakage on South African
              yards.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 md:gap-5 max-w-5xl">
            {CAPABILITIES.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="group holo-card rounded-2xl p-8 md:p-9"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live stock social proof — buyers already shopping */}
      <section className="border-t border-primary/10 bg-[#08080a]/90">
        <HomeFeaturedDeals />
      </section>

      {/* Compliance — light, below conversion narrative */}
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

      {/* Pilot CTA */}
      <section id="lead-capture" className="pb-24 md:pb-32">
        <div className="container">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-primary/25 holo-card p-8 md:p-12 lg:p-16"
          >
            <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
                  Free pilot
                </p>
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight leading-tight">
                  Prove one recovered lead on{" "}
                  <span className="text-cyber-gradient">your stock</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md">
                  Small group of SA dealerships. You get Growth-level features — showroom, inventory,
                  WhatsApp Nala, Mia drip, leads, trade-ins. Pricing confirmed before billing.
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
                  <Link href="/onboarding">Prefer self-serve onboarding →</Link>
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
