import { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useSearch } from "wouter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SEO_PAGES } from "@shared/seo";

const REGIONS = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

/**
 * All 11 SA official languages, in constitutional order.
 * Kept in sync with `shared/languages.ts`.
 */
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "af", label: "Afrikaans" },
  { code: "nr", label: "isiNdebele" },
  { code: "xh", label: "isiXhosa" },
  { code: "zu", label: "isiZulu" },
  { code: "nso", label: "Sepedi (Northern Sotho)" },
  { code: "st", label: "Sesotho" },
  { code: "tn", label: "Setswana" },
  { code: "ss", label: "siSwati" },
  { code: "ve", label: "Tshivenḓa" },
  { code: "ts", label: "Xitsonga" },
];

export default function Onboarding() {
  useDocumentMeta({
    title: SEO_PAGES.onboarding.title,
    description: SEO_PAGES.onboarding.description,
    keywords: SEO_PAGES.onboarding.keywords,
    canonicalPath: "/onboarding",
    ogType: "website",
  });
  const search = useSearch();
  const referredBy = useMemo(() => {
    const raw = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("ref");
    return raw?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  }, [search]);
  const [submitted, setSubmitted] = useState<{ reference: string } | null>(null);
  const submit = trpc.publicOnboarding.submit.useMutation({
    onSuccess: (r: any) => setSubmitted({ reference: r.reference }),
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    dealershipName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    region: "",
    monthlyVolume: "",
    primaryLanguage: "en",
    brandsCarried: "",
    csvUrl: "",
    notes: "",
    whatsappPhoneNumberId: "",
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="container max-w-xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 mb-8">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h1 className="font-display text-4xl font-bold">Thanks — we've got it.</h1>
            <p className="text-muted-foreground mt-4">
              Our team will review your application within one business day. You'll receive
              a welcome email at <span className="text-primary">{form.ownerEmail}</span> with
              next steps.
            </p>
            <div className="card-premium rounded-2xl border border-primary/10 p-6 mt-8 text-left">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Your reference number
              </div>
              <div className="font-mono text-2xl font-bold text-primary mt-1">
                {submitted.reference}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Keep this for your records. Quote it when calling or emailing support.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button asChild variant="outline">
                <a href="/legal">Review legal documents</a>
              </Button>
              <Button asChild variant="ghost">
                <a href="/">Back to home</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6 max-w-md mx-auto">
              Before go-live we will send the Dealer Agreement and POPIA form for signature.
              You can preview everything now at{" "}
              <a href="/legal" className="text-primary hover:underline">grayarx.com/legal</a>.
            </p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060608] text-foreground">
      <Navigation />
      <section className="pt-24 pb-20 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" aria-hidden />
        <div className="container max-w-2xl relative">
          <div className="text-center mb-10">
            <Logo variant="full" size={100} className="mx-auto" />
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-6">
              Onboard your dealership
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
              Tell us a bit about your business. Our team reviews every application and
              gets back within one business day.
            </p>
            {referredBy ? (
              <p className="mt-3 text-xs text-primary/90 font-tech uppercase tracking-wider">
                Referred by dealer · {referredBy}
              </p>
            ) : null}
            <p className="mt-4 text-xs text-muted-foreground">
              Preview agreements at{" "}
              <a href="/legal" className="text-primary hover:underline">grayarx.com/legal</a>
            </p>
          </div>

          <Card className="card-premium border-primary/20 shadow-2xl">
            <CardContent className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dealershipName">Dealership name *</Label>
                  <Input
                    id="dealershipName"
                    value={form.dealershipName}
                    onChange={(e) => setForm({ ...form, dealershipName: e.target.value })}
                    placeholder="ABC Motors"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region *</Label>
                  <Select
                    value={form.region}
                    onValueChange={(v) => setForm({ ...form, region: v })}
                  >
                    <SelectTrigger id="region" className="mt-1">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Owner name *</Label>
                  <Input
                    id="ownerName"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    placeholder="Sipho Khumalo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail">Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={form.ownerEmail}
                    onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                    placeholder="sipho@abcmotors.co.za"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerPhone">Phone *</Label>
                  <Input
                    id="ownerPhone"
                    value={form.ownerPhone}
                    onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                    placeholder="+27 82 123 4567"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Prefer your WhatsApp Business number — we use it to auto-link Meta routing.
                  </p>
                </div>
                <div>
                  <Label htmlFor="monthlyVolume">Monthly vehicle sales</Label>
                  <Input
                    id="monthlyVolume"
                    type="number"
                    min={0}
                    value={form.monthlyVolume}
                    onChange={(e) => setForm({ ...form, monthlyVolume: e.target.value })}
                    placeholder="25"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryLanguage">Primary language *</Label>
                  <Select
                    value={form.primaryLanguage}
                    onValueChange={(v) => setForm({ ...form, primaryLanguage: v })}
                  >
                    <SelectTrigger id="primaryLanguage" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="brandsCarried">Brands you sell</Label>
                  <Input
                    id="brandsCarried"
                    value={form.brandsCarried}
                    onChange={(e) => setForm({ ...form, brandsCarried: e.target.value })}
                    placeholder="Toyota, VW, Ford"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="csvUrl">Stock CSV link (optional)</Label>
                <Input
                  id="csvUrl"
                  value={form.csvUrl}
                  onChange={(e) => setForm({ ...form, csvUrl: e.target.value })}
                  placeholder="https://yourdms.co.za/export/stock.csv"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Paste a public link to your DMS or stock export CSV. We'll import it automatically.
                </p>
              </div>

              <div>
                <Label htmlFor="whatsappPhoneNumberId">Meta Phone Number ID (optional)</Label>
                <Input
                  id="whatsappPhoneNumberId"
                  value={form.whatsappPhoneNumberId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      whatsappPhoneNumberId: e.target.value.replace(/\D/g, "").slice(0, 64),
                    })
                  }
                  placeholder="e.g. 1245737138612982"
                  className="mt-1 font-mono"
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  From Meta Developer → WhatsApp → API Setup. Leave blank if you don’t have it yet —
                  we’ll link it automatically when the first WhatsApp message arrives on your business number
                  (must match the phone above).
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Anything else?</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Tell us about your current sales process, pain points, or anything we should know."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <Button
                className="btn-gold w-full h-12 font-semibold"
                disabled={
                  submit.isPending ||
                  !form.dealershipName ||
                  !form.ownerName ||
                  !form.ownerEmail ||
                  !form.ownerPhone ||
                  !form.region
                }
                onClick={() =>
                  submit.mutate({
                    ...form,
                    ...(referredBy ? { referredBy } : {}),
                  })
                }
              >
                {submit.isPending ? "Submitting…" : "Submit application"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>,{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>, and{" "}
                <a href="/dpa" className="text-primary hover:underline">Data Processing Agreement</a>,{" "}
                and consent to processing your data for the purpose of evaluating this application.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
