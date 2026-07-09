import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export default function LeadCaptureForm() {
  const [submitting, setSubmitting] = useState(false);
  // `useRef` so renderedAt is fixed at mount; never re-runs on re-render.
  // The honeypot field is also a ref because real users will never type into
  // it — so React state is wasted overhead.
  const renderedAtRef = useRef<number>(Date.now());
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    dealershipName: "",
    contactName: "",
    email: "",
    phone: "",
    monthlyVehicles: "",
    notes: "",
    popiaConsent: false,
  });

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Thank you! We'll be in touch within 24 hours.", {
        description: "Check your inbox for a welcome email from our team.",
      });
      setForm({
        dealershipName: "",
        contactName: "",
        email: "",
        phone: "",
        monthlyVehicles: "",
        notes: "",
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
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      monthlyVehicles: form.monthlyVehicles ? parseInt(form.monthlyVehicles) : undefined,
      notes: form.notes || undefined,
      honeypot: honeypotRef.current?.value || undefined,
      renderedAtMs: renderedAtRef.current,
    });
  };

  return (
    <form onSubmit={onSubmit} className="glass-gold rounded-2xl p-8 md:p-10 space-y-6">
      {/*
        Honeypot — invisible to real users (CSS-hidden, off-screen, no tab
        index, fake but realistic name to attract bots). Filled values are
        treated as bot signal on the server and the submission is rejected.
      */}
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
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-[0.2em]">
          Free 14-Day Trial
        </span>
      </div>

      <div>
        <h3 className="font-display text-3xl md:text-4xl font-bold mb-2">
          Start Your Free Trial
        </h3>
        <p className="text-muted-foreground">
          No credit card required. Setup in under 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dealership">Dealership name *</Label>
          <Input
            id="dealership"
            required
            value={form.dealershipName}
            onChange={(e) => setForm({ ...form, dealershipName: e.target.value })}
            placeholder="ABC Motors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact">Your name *</Label>
          <Input
            id="contact"
            required
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            placeholder="Jane Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@dealership.co.za"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+27 82 000 0000"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="vehicles">Vehicles sold per month (optional)</Label>
          <Input
            id="vehicles"
            type="number"
            value={form.monthlyVehicles}
            onChange={(e) => setForm({ ...form, monthlyVehicles: e.target.value })}
            placeholder="50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">What would you like AI to handle? (optional)</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Lead qualification, after-hours enquiries, finance pre-approval..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="popia"
          checked={form.popiaConsent}
          onCheckedChange={(checked) =>
            setForm({ ...form, popiaConsent: checked === true })
          }
        />
        <Label
          htmlFor="popia"
          className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer"
        >
          I consent to GrayArx processing my personal information in accordance with POPIA
          and the{" "}
          <a href="/privacy-policy" className="text-primary underline">
            Privacy Policy
          </a>
          . I understand I can withdraw consent at any time.
        </Label>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="btn-gold w-full font-semibold h-12 text-base"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Start Free Trial"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Trusted by dealerships across South Africa · POPIA compliant · 99.5% uptime SLA
      </p>
    </form>
  );
}
