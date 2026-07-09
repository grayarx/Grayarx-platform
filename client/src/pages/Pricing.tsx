import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { OWNER_WHATSAPP_URL } from "@/lib/contact";

/**
 * Pricing is intentionally hidden during the pilot phase.
 * We want to learn what dealerships actually use and what they'd
 * pay before anchoring them to a number.
 */
export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-32 pb-20 min-h-[70vh] flex items-center">
        <div className="container max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full glass-gold text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Pilot Programme
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Pricing is tailored during our <span className="text-gold-gradient">pilot phase</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            We're working closely with early dealerships to understand which features drive the most value.
            Pilot partners receive <strong className="text-foreground">Growth-level features</strong> — final
            pricing is confirmed before billing goes live.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="btn-gold h-12 px-8 font-semibold">
              <Link href="/signup">
                Join the pilot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8">
              <a href={OWNER_WHATSAPP_URL} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat with us
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-8">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
