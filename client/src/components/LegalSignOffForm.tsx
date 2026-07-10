import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, PenLine, CheckCircle2 } from "lucide-react";
import MailtoLink from "@/components/MailtoLink";
import { GRAYARX_LEGAL } from "@shared/companyLegal";

type SignOffType = "dealer_agreement" | "popia_consent";

export default function LegalSignOffForm({ type }: { type: SignOffType }) {
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    dealershipLegalName: "",
    companyRegistration: "",
    signatoryName: "",
    signatoryTitle: "",
    contactEmail: "",
    contactPhone: "",
    registeredAddress: "",
  });

  const submit = trpc.legalSignOff.submit.useMutation({
    onSuccess: () => {
      setDone(true);
      toast.success("Signed and submitted — our legal team has been notified.");
    },
    onError: (e) => toast.error(e.message),
  });

  if (done) {
    return (
      <div className="not-prose rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
        <p className="font-semibold text-lg">Agreement submitted</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          We received your electronic sign-off for <strong>{form.dealershipLegalName}</strong>.
          You can also email a scanned copy to{" "}
          <MailtoLink email={GRAYARX_LEGAL.legalEmail} /> if your attorney requires it.
        </p>
      </div>
    );
  }

  const title =
    type === "dealer_agreement" ? "Sign dealer agreement online" : "Sign POPIA consent online";

  return (
    <div className="not-prose mt-10 rounded-xl border border-primary/20 bg-card/30 p-6 md:p-8 space-y-5">
      <div className="flex items-start gap-3">
        <PenLine className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in your dealership details below — no printing required. We log this as your
            electronic acceptance and notify{" "}
            <MailtoLink email={GRAYARX_LEGAL.legalEmail} /> immediately.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="ls-dealer">Dealership legal name *</Label>
          <Input
            id="ls-dealer"
            value={form.dealershipLegalName}
            onChange={(e) => setForm({ ...form, dealershipLegalName: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ls-reg">Company registration no. *</Label>
          <Input
            id="ls-reg"
            value={form.companyRegistration}
            onChange={(e) => setForm({ ...form, companyRegistration: e.target.value })}
            className="mt-1"
            placeholder="2020/123456/07"
          />
        </div>
        <div>
          <Label htmlFor="ls-email">Contact email *</Label>
          <Input
            id="ls-email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ls-name">Authorised signatory *</Label>
          <Input
            id="ls-name"
            value={form.signatoryName}
            onChange={(e) => setForm({ ...form, signatoryName: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ls-title">Title / role *</Label>
          <Input
            id="ls-title"
            value={form.signatoryTitle}
            onChange={(e) => setForm({ ...form, signatoryTitle: e.target.value })}
            className="mt-1"
            placeholder="Director / Owner"
          />
        </div>
        <div>
          <Label htmlFor="ls-phone">Phone</Label>
          <Input
            id="ls-phone"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ls-addr">Registered address</Label>
          <Input
            id="ls-addr"
            value={form.registeredAddress}
            onChange={(e) => setForm({ ...form, registeredAddress: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <input ref={honeypotRef} type="text" name="website" tabIndex={-1} className="hidden" aria-hidden />

      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
        <span className="text-muted-foreground leading-relaxed">
          I am authorised to bind the dealership named above. I have read and accept this document
          on behalf of the dealership.
        </span>
      </label>

      <Button
        className="btn-gold"
        disabled={
          submit.isPending ||
          !agreed ||
          !form.dealershipLegalName ||
          !form.companyRegistration ||
          !form.signatoryName ||
          !form.signatoryTitle ||
          !form.contactEmail
        }
        onClick={() =>
          submit.mutate({
            type,
            ...form,
            contactPhone: form.contactPhone || undefined,
            registeredAddress: form.registeredAddress || undefined,
            agreed: true,
            honeypot: honeypotRef.current?.value,
          })
        }
      >
        {submit.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          "Submit signed agreement"
        )}
      </Button>
    </div>
  );
}
