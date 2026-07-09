import { useState } from "react";
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
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  Car as CarIcon,
  ArrowRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { clearTradeInSession } from "@/lib/tradeInSession";
import { ALL_LANGUAGE_CODES, LANGUAGES } from "@shared/languages";

/**
 * Public test-drive booking page. Wired to `publicBooking.submit`
 * (Lerato). The page deliberately keeps friction low (name + contact +
 * optional preferred slot) — Lerato persists the request, suggests an
 * in-hours slot if needed, and notifies the dealership owner. A human
 * confirms from /dealer/bookings.
 */
export default function Book() {
  const params = useParams<{ shortcode: string }>();
  const search = useSearch();
  const shortcode = (params.shortcode || "").toLowerCase();
  const vehicleId = (() => {
    const sp = new URLSearchParams(search);
    const raw = sp.get("vehicle");
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [language, setLanguage] = useState("en");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<{
    reference: string;
    replyToCustomer: string;
    suggestedSlotStart: string;
    slotShifted: boolean;
  } | null>(null);

  const { data: linkedVehicle } = trpc.showroom.get.useQuery(
    { id: vehicleId ?? 0 },
    { enabled: !!vehicleId },
  );

  const submit = trpc.publicBooking.submit.useMutation({
    onSuccess: (res) => {
      // Journey complete — drop the trade-in cache so a later visit starts fresh.
      clearTradeInSession();
      setDone({
        reference: res.reference,
        replyToCustomer: res.replyToCustomer,
        suggestedSlotStart: res.suggestedSlotStart,
        slotShifted: res.slotShifted,
      });
      toast.success("Test drive request received");
    },
    onError: (e) => toast.error(e.message),
  });

  const composeIso = (d: string, t: string): string | undefined => {
    if (!d) return undefined;
    const time = t || "10:00";
    // Treat the picker as Africa/Johannesburg (SAST = UTC+2). We send a
    // local-wall-clock ISO with no zone — the server reads it as a Date
    // object and the slot suggester realigns to in-hours anyway.
    return `${d}T${time}:00`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      toast.error("Please share your name and a contact number or email.");
      return;
    }
    submit.mutate({
      shortcode,
      vehicleId: vehicleId ?? undefined,
      customerName: name.trim(),
      customerContact: contact.trim(),
      channel: "website",
      inboundMessage: notes.trim() || undefined,
      requestedSlotStart: composeIso(preferredDate, preferredTime),
      language,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-28 md:pt-32 pb-16">
        <div className="container max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-2 flex items-center gap-2">
            <CarIcon className="h-3.5 w-3.5" /> Book a test drive
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Pick a time. Lerato will confirm.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl">
            Lerato is our AI booking assistant. She handles requests in all 11
            South African official languages plus Portuguese. A human at the
            dealership confirms every booking before it goes on the calendar.
          </p>

          {linkedVehicle && (
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
              {linkedVehicle.imageUrl ? (
                <img
                  src={linkedVehicle.imageUrl}
                  alt={linkedVehicle.title}
                  className="h-16 w-24 rounded-lg object-cover object-center img-premium shrink-0"
                />
              ) : (
                <div className="h-16 w-24 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  <CarIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
                  Test drive for
                </div>
                <div className="font-display text-base font-semibold truncate">{linkedVehicle.title}</div>
                <div className="text-sm text-muted-foreground">{formatVehiclePrice(linkedVehicle.price)}</div>
              </div>
              <Link href={`/showroom/${linkedVehicle.id}`} className="text-xs text-primary hover:underline shrink-0">
                View vehicle
              </Link>
            </div>
          )}

          {done ? (
            <Card className="mt-8 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" /> Request received
                </CardTitle>
                <CardDescription>
                  Reference{" "}
                  <span className="font-mono text-foreground">
                    {done.reference}
                  </span>
                  {done.slotShifted && (
                    <>
                      {" "}
                      · we nudged the slot to your dealer's working hours
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-primary/10 bg-card/50 p-4 text-sm whitespace-pre-wrap">
                  {done.replyToCustomer}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Suggested slot:{" "}
                  {new Date(done.suggestedSlotStart).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="h-10">
                    <Link href="/showroom">Browse more vehicles</Link>
                  </Button>
                  <Button
                    onClick={() => {
                      setDone(null);
                      setName("");
                      setContact("");
                      setNotes("");
                      setPreferredDate("");
                      setPreferredTime("");
                    }}
                    variant="ghost"
                    className="h-10"
                  >
                    Book another
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-8 border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Your details</CardTitle>
                <CardDescription>
                  Lerato will reply on the contact you provide. We never share
                  your details with third parties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="bk-name">Full name</Label>
                    <Input
                      id="bk-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Thandiwe Dlamini"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bk-contact">Phone or email</Label>
                    <Input
                      id="bk-contact"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+27 82 123 4567 or you@example.co.za"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="bk-date">Preferred date (optional)</Label>
                      <Input
                        id="bk-date"
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bk-time">Preferred time</Label>
                      <Input
                        id="bk-time"
                        type="time"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bk-lang">Reply language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="bk-lang">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_LANGUAGE_CODES.map((code) => (
                          <SelectItem key={code} value={code}>
                            {LANGUAGES[code].endonym}{" "}
                            <span className="text-muted-foreground text-xs">
                              ({LANGUAGES[code].englishName})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bk-notes">Anything we should know?</Label>
                    <Textarea
                      id="bk-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Looking for an automatic, will bring my licence."
                      rows={3}
                    />
                  </div>

                  {vehicleId && linkedVehicle && (
                    <div className="flex items-center gap-3 text-sm border border-primary/10 rounded-md px-3 py-2 bg-card/40">
                      {linkedVehicle.imageUrl ? (
                        <img
                          src={linkedVehicle.imageUrl}
                          alt=""
                          className="h-12 w-16 rounded object-cover object-center img-premium"
                        />
                      ) : null}
                      <div>
                        <p className="text-xs text-muted-foreground">Test drive for</p>
                        <p className="font-medium">{linkedVehicle.title}</p>
                        <p className="text-xs text-muted-foreground">{formatVehiclePrice(linkedVehicle.price)}</p>
                      </div>
                    </div>
                  )}

                  {vehicleId && !linkedVehicle && (
                    <div className="text-xs text-muted-foreground border border-primary/10 rounded-md px-3 py-2 bg-card/40">
                      Booking a test drive for vehicle #{vehicleId}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="btn-gold h-12 px-6 font-semibold w-full sm:w-auto"
                    disabled={submit.isPending}
                  >
                    {submit.isPending ? "Sending…" : "Request test drive"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
