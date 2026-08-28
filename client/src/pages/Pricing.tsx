import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { OWNER_WHATSAPP_URL } from "@/lib/contact";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SEO_PAGES, SEO_OS_OFFERS } from "@shared/seo";

/**
 * Public /pricing currently redirects home (see App.tsx). Keep this page
 * aligned with OS list prices so it is accurate if the redirect is lifted.
 */
export default function Pricing() {
  useDocumentMeta({
    title: "Dealership OS pricing | GrayArx",
    description: SEO_PAGES.forDealers.description,
    keywords: SEO_PAGES.forDealers.keywords,
    canonicalPath: "/for-dealers",
    ogType: "website",
    noIndex: true,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-32 pb-20 min-h-[70vh] flex items-center">
        <div className="container max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full glass-gold text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Nala Dealership OS
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
            14-day Pilot, then a <span className="text-gold-gradient">fixed OS desk</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Pilot is R0 for 14 days (150 WhatsApp conversations). After Monday proof, most yards
            close Professional OS at R14,990/mo.
          </p>
          <ul className="text-left space-y-3 mb-10 max-w-md mx-auto text-sm text-muted-foreground">
            {SEO_OS_OFFERS.map((o) => (
              <li key={o.name} className="flex justify-between gap-4 border-b border-primary/10 pb-2">
                <span className="text-foreground font-medium">{o.name}</span>
                <span>
                  {o.price === "0" ? "R0 / 14 days" : o.name.startsWith("Enterprise") ? `From R${Number(o.price).toLocaleString("en-ZA")}/mo` : `R${Number(o.price).toLocaleString("en-ZA")}/mo`}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="btn-gold h-12 px-8 font-semibold">
              <Link href="/onboarding">
                Start 14-day Pilot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8">
              <a href={OWNER_WHATSAPP_URL} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat with us
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-8">
            14-day Pilot · No credit card · Template fallback if LLM credits run out
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
