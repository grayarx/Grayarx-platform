import { ReactNode } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  effectiveDate: string;
  children: ReactNode;
}

export default function LegalLayout({
  title,
  subtitle,
  effectiveDate,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-32 pb-12 gradient-mesh">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full glass-gold text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Legal & Compliance
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground mb-3">{subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Effective: <span className="text-primary">{effectiveDate}</span>
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-4xl">
          <article className="prose prose-invert prose-headings:font-display prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary max-w-none">
            {children}
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
}
