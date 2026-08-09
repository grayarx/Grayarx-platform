import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Mail, Shield } from "lucide-react";
import { GRAYARX_LEGAL } from "@shared/companyLegal";

const MAILBOX_OPTIONS = [
  {
    value: "privacy" as const,
    label: "Privacy / POPIA",
    email: GRAYARX_LEGAL.informationOfficerEmail,
    desc: "Data subject requests, POPIA queries, breach reports",
  },
  {
    value: "legal" as const,
    label: "Legal & contracts",
    email: GRAYARX_LEGAL.legalEmail,
    desc: "Dealer agreements, signed forms, contract questions",
  },
  {
    value: "hello" as const,
    label: "General support",
    email: GRAYARX_LEGAL.supportEmail,
    desc: "Platform help, billing, pilot questions",
  },
];

export default function ComplianceContactForm({ compact }: { compact?: boolean }) {
  const [mailbox, setMailbox] = useState<"privacy" | "legal" | "hello">("privacy");
  const [sent, setSent] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const submit = trpc.complianceMailbox.submit.useMutation({
    onSuccess: () => {
      setSent(true);
      toast.success("Message sent — we respond within 30 days for POPIA, 1 business day for pilot queries.");
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-6 text-center">
        <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
        <p className="font-semibold">Message received</p>
        <p className="text-sm text-muted-foreground mt-2">
          Our team and Information Officer queue has been notified. You can also email{" "}
          {MAILBOX_OPTIONS.find((m) => m.value === mailbox)?.email} directly.
        </p>
      </div>
    );
  }

  const selected = MAILBOX_OPTIONS.find((m) => m.value === mailbox)!;

  return (
    <div className={compact ? "space-y-4" : "not-prose space-y-5 rounded-xl border border-primary/15 bg-card/40 p-6 md:p-8"}>
      {!compact && (
        <div className="flex items-start gap-3 mb-2">
          <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-lg font-semibold">Contact compliance team</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Messages are logged and monitored by the GrayArx compliance team — same as emailing{" "}
              {selected.email}. This is support for legal/POPIA questions, not one of your dealership AI agents.
            </p>
          </div>
        </div>
      )}

      <div>
        <Label>Send to</Label>
        <Select value={mailbox} onValueChange={(v) => setMailbox(v as typeof mailbox)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAILBOX_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label} ({m.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">{selected.desc}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="compliance-name">Your name *</Label>
          <Input
            id="compliance-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="compliance-email">Email *</Label>
          <Input
            id="compliance-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="compliance-subject">Subject *</Label>
        <Input
          id="compliance-subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="mt-1"
          placeholder={mailbox === "privacy" ? "POPIA data subject request" : "Dealer agreement question"}
        />
      </div>

      <div>
        <Label htmlFor="compliance-message">Message *</Label>
        <Textarea
          id="compliance-message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1 min-h-[120px]"
          rows={5}
        />
        {form.message.length > 0 && form.message.length < 10 && (
          <p className="text-xs text-muted-foreground mt-1">{10 - form.message.length} more characters needed</p>
        )}
      </div>

      <input
        ref={honeypotRef}
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute opacity-0 pointer-events-none h-0 w-0"
        aria-hidden
      />

      <Button
        className="btn-gold w-full sm:w-auto"
        disabled={
          submit.isPending ||
          !form.name.trim() ||
          !form.email.trim() ||
          form.subject.trim().length < 3 ||
          form.message.trim().length < 10
        }
        onClick={() =>
          submit.mutate({
            mailbox,
            ...form,
            honeypot: honeypotRef.current?.value,
          })
        }
      >
        {submit.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </div>
  );
}
