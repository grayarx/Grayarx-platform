import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  effectiveDate: string;
  children: ReactNode;
  /** Show breadcrumb back to /legal hub */
  showHubCrumb?: boolean;
}

export default function LegalLayout({
  title,
  subtitle,
  effectiveDate,
  children,
  showHubCrumb = true,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[#060608] text-foreground overflow-x-hidden">
      <Navigation />

      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="orb-gold -top-32 -right-32 h-[28rem] w-[28rem] opacity-60" />
        <div className="absolute inset-0 cyber-grid opacity-40" />
      </div>

      <section className="relative pt-32 pb-10 gradient-mesh noise-overlay">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {showHubCrumb && (
              <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link href="/legal" className="hover:text-primary transition-colors">
                  Legal centre
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
                <span className="text-foreground/80 truncate">{title}</span>
              </nav>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full glass-gold text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Legal & Compliance
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground mb-3 max-w-2xl leading-relaxed">{subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground font-tech uppercase tracking-[0.12em]">
              Effective: <span className="text-primary">{effectiveDate}</span>
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="container max-w-4xl">
          <div className="legal-content-card rounded-2xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6 md:p-10 lg:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <article className="prose prose-invert prose-headings:font-display prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline max-w-none">
              {children}
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
