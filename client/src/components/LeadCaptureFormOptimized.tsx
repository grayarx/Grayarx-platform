import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, Loader2, TrendingUp, Users, Zap } from "lucide-react";
import { CASH_CTAS, CASH_FORM } from "@shared/cashvertising";

export default function LeadCaptureFormOptimized() {
  const [submitting, setSubmitting] = useState(false);
  const renderedAtRef = useRef<number>(Date.now());
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    dealershipName: "",
    email: "",
    phone: "",
    popiaConsent: false,
  });

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("🎉 Welcome to GrayArx!", {
        description: "We'll confirm your 14-day Pilot next steps.",
      });
      setForm({
        dealershipName: "",
        email: "",
        phone: "",
        popiaConsent: false,
      });
    },
    onError: (e) => toast.error(e.message || "Something went wrong"),
    onSettled: () => setSubmitting(false),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.popiaConsent) {
      toast.error("Please accept the POPIA consent to continue.");
      return;
    }
    setSubmitting(true);
    createLead.mutate({
      dealershipName: form.dealershipName,
      contactName: form.email.split("@")[0],
      email: form.email,
      phone: form.phone,
      honeypot: honeypotRef.current?.value || undefined,
      renderedAtMs: renderedAtRef.current,
    });
  };

  return (
    <div className="space-y-8">
      {/* SOCIAL PROOF SECTION */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-gold rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-display text-2xl font-bold text-gold-gradient">24/7</span>
          </div>
          <p className="text-xs text-muted-foreground">WhatsApp replies</p>
        </div>
        <div className="glass-gold rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-display text-2xl font-bold text-gold-gradient">CSV</span>
          </div>
          <p className="text-xs text-muted-foreground">Your stock live</p>
        </div>
        <div className="glass-gold rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-display text-2xl font-bold text-gold-gradient">Free</span>
          </div>
          <p className="text-xs text-muted-foreground">14-day Pilot · no card</p>
        </div>
      </div>

      {/* OPTIMIZED FORM */}
      <form onSubmit={onSubmit} className="glass-gold rounded-2xl p-8 md:p-10 space-y-6">
        {/* Honeypot */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-10000px",
            top: "auto",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          <label htmlFor="company_website">Company website</label>
          <input
            ref={honeypotRef}
            id="company_website"
            name="company_website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-[0.2em]">
              {CASH_FORM.scarcity}
            </span>
          </div>
          <h3 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {CASH_FORM.h3}
          </h3>
          <p className="text-muted-foreground text-sm">
            {CASH_FORM.sub}
          </p>
        </div>

        {/* FORM FIELDS - MINIMAL */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dealership-opt">Dealership Name *</Label>
            <Input
              id="dealership-opt"
              required
              value={form.dealershipName}
              onChange={(e) => setForm({ ...form, dealershipName: e.target.value })}
              placeholder="e.g. ABC Motors"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-opt">Email *</Label>
            <Input
              id="email-opt"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@dealership.co.za"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-opt">Phone *</Label>
            <Input
              id="phone-opt"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+27 82 000 0000"
              className="h-11"
            />
          </div>
        </div>

        {/* POPIA CONSENT */}
        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id="popia-opt"
            checked={form.popiaConsent}
            onCheckedChange={(checked) =>
              setForm({ ...form, popiaConsent: checked === true })
            }
          />
          <Label
            htmlFor="popia-opt"
            className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer"
          >
            I consent to GrayArx processing my information per POPIA and{" "}
            <a href="/privacy-policy" className="text-primary underline">
              Privacy Policy
            </a>
          </Label>
        </div>

        {/* CTA BUTTON */}
        <Button
          type="submit"
          disabled={submitting}
          className="btn-gold w-full font-semibold h-12 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up your trial...
            </>
          ) : (
            CASH_CTAS.formSubmit
          )}
        </Button>

        {/* TRUST SIGNALS */}
        <div className="pt-4 border-t border-primary/20 space-y-3">
          <p className="text-xs text-center text-muted-foreground font-medium">
            {CASH_FORM.trust}
          </p>
        </div>
      </form>

      <div className="glass rounded-xl p-6 border border-primary/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
          {CASH_FORM.proofTitle}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {CASH_FORM.proofBody}
        </p>
      </div>
    </div>
  );
}
