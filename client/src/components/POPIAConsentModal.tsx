import { useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, ShieldCheck, ExternalLink } from "lucide-react";

interface POPIAConsentModalProps {
  open: boolean;
  onClose: () => void;
  onSign: (signedName: string) => Promise<void>;
  isLoading?: boolean;
}

type PopiaSection = {
  title: string;
  body: string;
  bullets?: string[];
};

const POPIA_SECTIONS: PopiaSection[] = [
  {
    title: "Introduction",
    body: "This form records your explicit consent and acknowledgment under the Protection of Personal Information Act, 2013 (POPIA). By signing, you confirm you understand your obligations when using GrayArx.",
  },
  {
    title: "Responsible party",
    body: "You are the Responsible Party under POPIA. You determine the purpose and means of processing, bear compliance responsibility, and are liable for POPIA violations. GrayArx acts as Processor and processes personal information only on your instructions.",
  },
  {
    title: "Lawful basis",
    body: "Personal information on GrayArx must rest on a lawful basis:",
    bullets: [
      "Consent — explicit, informed consent from the data subject",
      "Contract — necessary to perform a contract with the data subject",
      "Legal obligation — required by law",
      "Legitimate interest — a genuine business interest in processing",
    ],
  },
  {
    title: "Consent & purpose",
    body: "Sensitive personal information needs explicit consent. Consent must be freely given, specific, informed, and unambiguous — and documented for audit. Processing is limited to disclosed purposes: leads & CRM, inventory & sales, customer follow-up, finance/credit assessment, service & warranty, and regulatory reporting.",
  },
  {
    title: "Data subject rights",
    body: "You will honour requests for access, correction, deletion (15 business days), marketing opt-out (48 hours), portability (15 business days), and complaints to the Information Regulator.",
  },
  {
    title: "Security & sub-processors",
    body: "GrayArx uses TLS 1.2+, AES-256 at rest, access controls, MFA, perimeter protection, monitoring, and daily backups. You protect credentials, report breaches promptly, and limit access to authorised staff. Sub-processors (bound by confidentiality) may include AWS, Stripe, Twilio, Resend, Google Analytics, and GrayArx AI infrastructure.",
  },
  {
    title: "Retention & deletion",
    body: "Typical retention: leads and trade-ins — subscription + 12 months; communications — subscription + 6 months; payment records — 7 years; server logs — 90 days. After account termination, personal information is deleted within 30 days.",
  },
  {
    title: "Compliance & liability",
    body: "You commit to POPIA, processing records, privacy-by-design, staff training, and applicable NCA / CPA / ECTA duties. You remain solely liable for POPIA compliance and indemnify GrayArx for claims arising from your violations, unlawful processing, or failure to obtain consent or honour data-subject rights. This form is re-confirmed annually.",
  },
];

export function POPIAConsentModal({
  open,
  onClose,
  onSign,
  isLoading = false,
}: POPIAConsentModalProps) {
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSign = async () => {
    if (!signedName.trim() || !agreed) return;

    setSubmitting(true);
    try {
      await onSign(signedName);
      setSignedName("");
      setAgreed(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = signedName.trim().length >= 2 && agreed;
  const busy = submitting || isLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,840px)] w-full flex-col gap-0 overflow-hidden border-primary/25 bg-[#0a0a0c] p-0 text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:max-w-2xl"
      >
        <div className="relative shrink-0 border-b border-primary/15 bg-gradient-to-br from-primary/[0.12] via-transparent to-transparent px-6 pb-5 pt-6 pr-12">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Scale className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="font-display text-xl font-bold tracking-tight md:text-2xl">
              POPIA consent & acknowledgment
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Required before your yard operates on GrayArx. Scroll the summary, then sign —
              you remain the Responsible Party under POPIA.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-emerald-200/90">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Effective 1 June 2026 · Annual re-confirm
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.35)_transparent]">
          <div className="space-y-4">
            {POPIA_SECTIONS.map((section) => (
              <section
                key={section.title}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <h3 className="font-tech mb-2 text-[10px] uppercase tracking-[0.22em] text-primary/85">
                  {section.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/75">{section.body}</p>
                {section.bullets ? (
                  <ul className="mt-3 space-y-1.5 border-l border-primary/20 pl-3">
                    {section.bullets.map((item) => (
                      <li key={item} className="text-sm leading-snug text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <Link
            href="/legal/popia-consent-form"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Full POPIA consent form
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="shrink-0 space-y-4 border-t border-primary/15 bg-[#0c0c10] px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="popia-sign-name" className="text-xs uppercase tracking-wider text-muted-foreground">
              Full name (e-signature)
            </Label>
            <Input
              id="popia-sign-name"
              placeholder="e.g. Thabo Molefe"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              disabled={busy}
              className="h-11 border-white/15 bg-black/40 focus-visible:border-primary/40"
              autoComplete="name"
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-black/30 p-3">
            <Checkbox
              id="popia-agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              disabled={busy}
              className="mt-0.5 border-white/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <label htmlFor="popia-agree" className="cursor-pointer text-sm leading-snug text-white/80">
              I have read and agree to this POPIA Consent & Acknowledgment and understand my
              obligations as the Responsible Party.
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
              className="h-11 border-white/20 bg-transparent hover:bg-white/5"
            >
              Remind me later
            </Button>
            <Button
              type="button"
              onClick={handleSign}
              disabled={!isValid || busy}
              className="btn-gold h-11 px-8 font-semibold uppercase tracking-wider"
            >
              {busy ? "Signing…" : "Sign & agree"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
