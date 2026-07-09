import { useMemo, useState, useEffect } from "react";
import { useParams, useSearch, Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ShieldCheck, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { clearTradeInSession } from "@/lib/tradeInSession";

type Step = 1 | 2 | 3 | 4;

interface FormState {
  // Step 1 — identity
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
  language: string;
  // Step 2 — employment
  employmentStatus: "permanent" | "contract" | "self_employed" | "pensioner" | "unemployed" | "";
  employer: string;
  monthsEmployed: string;
  // Step 3 — affordability
  grossMonthlyIncome: string;
  netMonthlyIncome: string;
  totalMonthlyExpenses: string;
  existingDebtMonthly: string;
  // Step 4 — deal
  vehiclePrice: string;
  desiredDeposit: string;
  desiredTermMonths: string;
  hasTradeIn: boolean;
  tradeInDescription: string;
  notes: string;
  consent: boolean;
}

const EMPTY: FormState = {
  fullName: "",
  idNumber: "",
  email: "",
  phone: "",
  language: "en",
  employmentStatus: "",
  employer: "",
  monthsEmployed: "",
  grossMonthlyIncome: "",
  netMonthlyIncome: "",
  totalMonthlyExpenses: "",
  existingDebtMonthly: "",
  vehiclePrice: "",
  desiredDeposit: "",
  desiredTermMonths: "",
  hasTradeIn: false,
  tradeInDescription: "",
  notes: "",
  consent: false,
};

const TOTAL_STEPS = 4;

function num(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

export default function PreApproval() {
  const params = useParams<{ shortcode: string }>();
  const shortcode = (params.shortcode ?? "").toLowerCase();
  const search = useSearch();
  const vehicleId = (() => {
    const v = new URLSearchParams(search).get("vehicle");
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();
  const { data: linkedVehicle } = trpc.showroom.get.useQuery(
    { id: vehicleId ?? 0 },
    { enabled: !!vehicleId },
  );
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState<{
    reference: string;
    reply: string;
  } | null>(null);

  const submit = trpc.publicPreApproval.submit.useMutation({
    onSuccess: (res) => {
      // Application submitted — clear trade-in cache for a fresh next journey.
      clearTradeInSession();
      setSubmitted({ reference: res.reference, reply: res.replyToCustomer });
    },
    onError: (err) => {
      toast.error(err.message || "Could not submit your application");
    },
  });

  const progress = useMemo(() => Math.round(((step - 1) / TOTAL_STEPS) * 100), [step]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  useEffect(() => {
    if (linkedVehicle?.price) {
      const p = Number(linkedVehicle.price);
      if (Number.isFinite(p) && p > 1) {
        setForm((f) =>
          f.vehiclePrice ? f : { ...f, vehiclePrice: String(Math.round(p)) },
        );
      }
    }
  }, [linkedVehicle?.id, linkedVehicle?.price]);

  const canProceed = (s: Step): boolean => {
    if (s === 1) {
      return (
        form.fullName.trim().length >= 2 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) &&
        form.phone.replace(/\D/g, "").length >= 9
      );
    }
    if (s === 2) return true; // employment is optional but recommended
    if (s === 3) return true;
    if (s === 4) return form.consent;
    return false;
  };

  const onSubmit = () => {
    if (!form.consent) {
      toast.error("Please accept the consent statement before submitting.");
      return;
    }
    submit.mutate({
      shortcode,
      vehicleId,
      fullName: form.fullName.trim(),
      idNumber: form.idNumber.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim(),
      language: form.language,
      employmentStatus: form.employmentStatus || undefined,
      employer: form.employer.trim() || undefined,
      monthsEmployed: num(form.monthsEmployed),
      grossMonthlyIncome: num(form.grossMonthlyIncome),
      netMonthlyIncome: num(form.netMonthlyIncome),
      totalMonthlyExpenses: num(form.totalMonthlyExpenses),
      existingDebtMonthly: num(form.existingDebtMonthly),
      vehiclePrice: num(form.vehiclePrice),
      desiredDeposit: num(form.desiredDeposit),
      desiredTermMonths: num(form.desiredTermMonths),
      hasTradeIn: form.hasTradeIn,
      tradeInDescription: form.tradeInDescription.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="container max-w-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight">
                We've got it
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Thank you. Your pre-approval request has been received safely. A
                member of the dealership's finance team will personally review
                it and reach out shortly. <strong>No automated approval is given here.</strong>
              </p>
            </div>

            <Card className="mt-10 border-primary/20">
              <CardHeader>
                <CardDescription>Reference number</CardDescription>
                <CardTitle className="font-mono text-xl tracking-wider">
                  {submitted.reference}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{submitted.reply}</p>
                <Separator />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Your details are encrypted, your ID number is masked at storage,
                  and only the dealership's finance team can see them.
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-8">
              <Button asChild variant="outline">
                <Link href="/showroom">Browse the showroom</Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <section className="pt-28 pb-20">
        <div className="container max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
            Finance · Pre-Approval
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-2">
            Let's get you a few steps closer.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Fill in the details below. Naledi, our finance concierge, will
            acknowledge your application immediately and pass it on to a human
            reviewer — no automated approval or rejection happens here.
          </p>

          {linkedVehicle && (
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
              {linkedVehicle.imageUrl ? (
                <img
                  src={linkedVehicle.imageUrl}
                  alt={linkedVehicle.title}
                  className="h-14 w-20 rounded-md object-cover object-center img-premium"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
                  Applying for
                </div>
                <div className="font-display text-base font-semibold truncate">
                  {linkedVehicle.title}
                </div>
                {linkedVehicle.price ? (
                  <div className="text-sm text-muted-foreground">
                    {formatVehiclePrice(linkedVehicle.price)}
                  </div>
                ) : null}
              </div>
              <Link
                href={`/showroom/${linkedVehicle.id}`}
                className="text-xs text-primary hover:underline shrink-0"
              >
                View vehicle
              </Link>
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Step {step} of {TOTAL_STEPS}</span>
              <span>{progress}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6 space-y-5">
              {step === 1 && (
                <>
                  <div>
                    <Label>Full name</Label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="As it appears on your ID"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>SA ID number (optional)</Label>
                      <Input
                        value={form.idNumber}
                        onChange={(e) => update("idNumber", e.target.value)}
                        placeholder="13 digits"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Stored masked — only the
                        last 4 digits are kept.
                      </p>
                    </div>
                    <div>
                      <Label>Preferred language</Label>
                      <Select
                        value={form.language}
                        onValueChange={(v) => update("language", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="af">Afrikaans</SelectItem>
                          <SelectItem value="nr">isiNdebele</SelectItem>
                          <SelectItem value="xh">isiXhosa</SelectItem>
                          <SelectItem value="zu">isiZulu</SelectItem>
                          <SelectItem value="nso">Sepedi (Northern Sotho)</SelectItem>
                          <SelectItem value="st">Sesotho</SelectItem>
                          <SelectItem value="tn">Setswana</SelectItem>
                          <SelectItem value="ss">siSwati</SelectItem>
                          <SelectItem value="ve">Tshivenḓa</SelectItem>
                          <SelectItem value="ts">Xitsonga</SelectItem>
                          <SelectItem value="pt">Português</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Mobile number</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="+27 79 491 5187"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label>Employment status</Label>
                    <Select
                      value={form.employmentStatus}
                      onValueChange={(v) => update("employmentStatus", v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="self_employed">Self-employed</SelectItem>
                        <SelectItem value="pensioner">Pensioner</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Employer (optional)</Label>
                      <Input
                        value={form.employer}
                        onChange={(e) => update("employer", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Months in current role</Label>
                      <Input
                        inputMode="numeric"
                        value={form.monthsEmployed}
                        onChange={(e) => update("monthsEmployed", e.target.value)}
                        placeholder="e.g. 18"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These help the dealership's finance team gauge stability.
                    Nothing here is used to make an automated decision.
                  </p>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Gross monthly income (R)</Label>
                      <Input
                        inputMode="decimal"
                        value={form.grossMonthlyIncome}
                        onChange={(e) =>
                          update("grossMonthlyIncome", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Net monthly income (R)</Label>
                      <Input
                        inputMode="decimal"
                        value={form.netMonthlyIncome}
                        onChange={(e) =>
                          update("netMonthlyIncome", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Total monthly expenses (R)</Label>
                      <Input
                        inputMode="decimal"
                        value={form.totalMonthlyExpenses}
                        onChange={(e) =>
                          update("totalMonthlyExpenses", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Existing monthly debt repayments (R)</Label>
                      <Input
                        inputMode="decimal"
                        value={form.existingDebtMonthly}
                        onChange={(e) =>
                          update("existingDebtMonthly", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All amounts in South African Rand. Approximate values are fine.
                  </p>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Vehicle price (R)</Label>
                      <Input
                        inputMode="decimal"
                        value={form.vehiclePrice}
                        onChange={(e) => update("vehiclePrice", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Deposit (R)</Label>
                      <Input
                        inputMode="decimal"
                        value={form.desiredDeposit}
                        onChange={(e) =>
                          update("desiredDeposit", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Term (months)</Label>
                      <Input
                        inputMode="numeric"
                        value={form.desiredTermMonths}
                        onChange={(e) =>
                          update("desiredTermMonths", e.target.value)
                        }
                        placeholder="60"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="hasTradeIn"
                      checked={form.hasTradeIn}
                      onCheckedChange={(v) => update("hasTradeIn", Boolean(v))}
                    />
                    <div>
                      <Label htmlFor="hasTradeIn">I have a trade-in</Label>
                      {form.hasTradeIn && (
                        <Textarea
                          className="mt-2"
                          placeholder="Year, make, model, mileage, condition…"
                          value={form.tradeInDescription}
                          onChange={(e) =>
                            update("tradeInDescription", e.target.value)
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Anything else we should know? (optional)</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="Special requests, preferred contact times…"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent"
                      checked={form.consent}
                      onCheckedChange={(v) => update("consent", Boolean(v))}
                    />
                    <Label htmlFor="consent" className="leading-relaxed text-sm">
                      I consent (POPIA) to the dealership's finance team
                      receiving and reviewing the information above for the
                      purpose of assessing this pre-approval request. I
                      understand <strong>no automated decision</strong> is made by
                      this form.
                    </Label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {step < TOTAL_STEPS ? (
              <Button
                className="btn-gold"
                onClick={() => {
                  if (!canProceed(step)) {
                    toast.error("Please complete the highlighted fields.");
                    return;
                  }
                  setStep((s) => ((s + 1) as Step));
                }}
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="btn-gold"
                onClick={onSubmit}
                disabled={submit.isPending || !form.consent}
              >
                {submit.isPending ? "Submitting…" : "Submit application"}
              </Button>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
