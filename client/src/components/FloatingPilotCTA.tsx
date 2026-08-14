import { Link } from "wouter";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

/** Sticky pilot CTA — converts anonymous showroom browsers into pilot applications. */
export default function FloatingPilotCTA() {
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("grayarx_pilot_cta_dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  // Never pitch the pilot to people who are already signed in (dealers, founders, staff).
  if (loading || user || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-500"
      role="complementary"
      aria-label="Pilot programme offer"
    >
      <div className="relative rounded-2xl border border-primary/25 bg-[#0c0c0e]/95 backdrop-blur-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-md"
          aria-label="Dismiss"
          onClick={() => {
            sessionStorage.setItem("grayarx_pilot_cta_dismissed", "1");
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
        <p className="font-tech text-[9px] uppercase tracking-[0.25em] text-primary/80 mb-1 pr-6">
          Dealership pilot
        </p>
        <p className="font-display font-semibold text-sm mb-1.5 leading-snug">
          Free pilot on your stock — no card.
        </p>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          One recovered lead usually pays for the month. Soft floor after written confirm.
        </p>
        <Button asChild className="btn-gold w-full h-10 text-xs font-semibold uppercase tracking-wider">
          <Link href="/#lead-capture">Start free pilot</Link>
        </Button>
        <Link
          href="/pricing"
          className="mt-2 block text-center font-tech text-[9px] uppercase tracking-[0.18em] text-primary/70 hover:text-primary"
        >
          Pilot terms →
        </Link>
      </div>
    </div>
  );
}
