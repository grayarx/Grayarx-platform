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
import {
  CASH_CTAS,
  CASH_FASCINATIONS,
  CASH_FOR_DEALERS,
  CASH_FOR_DEALERS_PROOF,
  CASH_FOR_YOU_IF,
  CASH_PAS,
  CASH_RISK_REVERSAL,
} from "@shared/cashvertising";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
};

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
              {CASH_FOR_DEALERS.eyebrow}
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              {CASH_FOR_DEALERS.h1Before}
              <span className="text-cyber-gradient">{CASH_FOR_DEALERS.h1Accent}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              {CASH_FOR_DEALERS.sub}
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Button asChild className="btn-gold h-12 px-8 font-semibold uppercase tracking-wider text-sm">
                <Link href="/onboarding">
                  {CASH_CTAS.primary} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="btn-cyber h-12 bg-transparent">
                <a href="#roi">{CASH_CTAS.seeCost}</a>
              </Button>
            </div>
            <p className="text-base text-white/80 leading-relaxed border-l border-primary/40 pl-5">
              {CASH_PAS.problem} {CASH_PAS.solve}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp} className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <p className="font-tech text-[10px] uppercase tracking-[0.22em] text-primary/80 mb-4">
              This desk fits if
            </p>
            <ul className="space-y-3">
              {CASH_FOR_YOU_IF.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-white/90">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
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

      <section className="pb-16 border-t border-primary/10 pt-16">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
              Inside the Pilot — what you will actually see
            </h2>
            <ol className="space-y-4 mb-12">
              {CASH_FASCINATIONS.map((line, i) => (
                <li key={line} className="flex gap-4 border-l border-primary/30 pl-5">
                  <span className="font-tech text-[10px] text-primary/70 tracking-widest tabular-nums mt-1">
                    0{i + 1}
                  </span>
                  <p className="text-base text-white/90 leading-relaxed">{line}</p>
                </li>
              ))}
            </ol>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
              {CASH_FOR_DEALERS.proofH2}
            </h2>
            <ul className="space-y-3 mb-8">
              {CASH_FOR_DEALERS_PROOF.map((line) => (
                <li key={line} className="flex items-start gap-3 text-base text-white/85">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <ul className="space-y-2 mb-8 text-sm text-muted-foreground">
              {CASH_RISK_REVERSAL.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mb-8">{CASH_FOR_DEALERS.reasonWhy}</p>
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
              <h2 className="font-display text-3xl font-bold mb-4">{CASH_FOR_DEALERS.closeH2}</h2>
              <p className="text-muted-foreground leading-relaxed">{CASH_FOR_DEALERS.closeSub}</p>
            </div>
            <LeadCaptureFormOptimized />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
