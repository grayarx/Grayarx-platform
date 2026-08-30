import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LeadCaptureFormOptimized from "@/components/LeadCaptureFormOptimized";
import IcpRoiCalculator from "@/components/IcpRoiCalculator";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SEO_PAGES } from "@shared/seo";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
};

const PROOF = [
  "CSV / DMS stock live on your showroom the same day",
  "WhatsApp after hours — Nala answers; missed calls bounce to WhatsApp",
  "Parts desk, service bookings, and trade-in intake on Professional OS",
  "This week's numbers so you see recovered deals vs the R14,990 desk",
  "14-day Pilot (150 WA cap) — then Starter R7,990 or Professional R14,990/mo",
];

export default function ForDealers() {
  useDocumentMeta({
    title: SEO_PAGES.forDealers.title,
    description: SEO_PAGES.forDealers.description,
    keywords: SEO_PAGES.forDealers.keywords,
    canonicalPath: "/for-dealers",
    ogType: "website",
  });

  return (
    <div className="min-h-screen bg-[#060608] text-foreground overflow-x-hidden">
      <Navigation />

      <section className="relative pt-28 md:pt-32 pb-16 gradient-mesh">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp}>
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-4">
              For dealership principals
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              Make GrayArx a{" "}
              <span className="text-cyber-gradient">no-brainer</span> with your own math
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              Yards lose deals after 6pm on WhatsApp. Put your stock live, catch those leads
              overnight, and book the drive — 14-day Pilot until you see this week's numbers on your cars.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Button asChild className="btn-gold h-12 px-8 font-semibold uppercase tracking-wider text-sm">
                <Link href="/onboarding">
                  Start 14-day Pilot <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="btn-cyber h-12 bg-transparent">
                <a href="#roi">Run the numbers</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="roi" className="pb-20 md:pb-28">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp}>
            <IcpRoiCalculator />
          </motion.div>
        </div>
      </section>

      <section className="pb-20 border-t border-primary/10 pt-16">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
              What you get in the 14-day Pilot
            </h2>
            <ul className="space-y-3 mb-10">
              {PROOF.map((line) => (
                <li key={line} className="flex items-start gap-3 text-base text-white/85">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mb-8">
              We sit beside AutoTrader and your DMS — not a rip-replace. After the Pilot, most
              yards close Professional OS (R14,990/mo). Month-to-month once you see proof.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="lead-capture" className="pb-24">
        <div className="container max-w-5xl">
          <motion.div
            {...fadeUp}
            className="grid lg:grid-cols-2 gap-12 items-start rounded-2xl border border-primary/20 holo-card p-8 md:p-12"
          >
            <div>
              <h2 className="font-display text-3xl font-bold mb-4">
                Ready when your next after-hours lead hits
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tell us the yard. We’ll get CSV + WhatsApp live and prove one recovered path on
                your stock.
              </p>
            </div>
            <LeadCaptureFormOptimized />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
