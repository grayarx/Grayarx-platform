import { useRef, useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MakeSelect, ModelSelect } from "@/components/SmartVehicleSelect";
import SearchableSelect from "@/components/SearchableSelect";
import { BODY_TYPES, resolveMake, resolveModel } from "@shared/vehicleCatalog";
import { SA_PROVINCES } from "@shared/saProvinces";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { saveTradeInSession } from "@/lib/tradeInSession";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { ArrowRight, Car, ImagePlus, Sparkles, X, Bell } from "lucide-react";
import UpgradeJourneyCard, { GrayArxAdvantages } from "@/components/UpgradeJourneyCard";

function renderMemoMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

export default function TradeIn() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{
    quoteId: number;
    estimateLow: number;
    estimateMid: number;
    estimateHigh: number;
    confidence: string;
    memoMarkdown: string;
    networkListed: boolean;
  } | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    mileageKm: "",
    transmission: "automatic" as "manual" | "automatic" | "cvt" | "dct",
    fuel: "petrol" as "petrol" | "diesel" | "hybrid" | "electric",
    bodyType: "Sedan",
    condition: "good" as "excellent" | "good" | "fair" | "poor",
    serviceHistory: "full_dealer" as "full_dealer" | "full_independent" | "partial" | "none",
    province: "",
    listOnNetwork: false,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
  });

  const uploadPhoto = trpc.tradeIn.uploadPhoto.useMutation();
  const estimate = trpc.tradeIn.estimate.useMutation({
    onSuccess: (data, variables) => {
      setResult({
        quoteId: data.quoteId,
        estimateLow: data.estimateLow,
        estimateMid: data.estimateMid,
        estimateHigh: data.estimateHigh,
        confidence: data.confidence,
        memoMarkdown: data.memoMarkdown,
        networkListed: data.networkListed,
      });
      saveTradeInSession({
        quoteId: data.quoteId,
        estimateMid: data.estimateMid,
        estimateLow: data.estimateLow,
        estimateHigh: data.estimateHigh,
        make: variables.make,
        model: variables.model,
        year: variables.year,
        savedAt: new Date().toISOString(),
      });
      toast.success(
        data.networkListed
          ? "Estimate ready — listed for participating dealerships"
          : "Trade-in estimate ready",
      );
    },
    onError: (e) => toast.error(e.message || "Could not generate estimate"),
  });

  const handlePhotoPick = async (files: FileList | null) => {
    if (!files?.length || photoUrls.length >= 4) return;
    setUploading(true);
    try {
      const next = [...photoUrls];
      for (const file of Array.from(files).slice(0, 4 - next.length)) {
        if (!file.type.startsWith("image/")) continue;
        const dataBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        const { url } = await uploadPhoto.mutateAsync({
          dataBase64,
          mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
          filename: file.name,
        });
        next.push(url);
      }
      setPhotoUrls(next);
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const make = resolveMake(form.make);
    const model = resolveModel(make, form.model);
    if (!make || !model) {
      toast.error("Make and model are required");
      return;
    }
    if (form.listOnNetwork && !form.province) {
      toast.error("Select your province to list on the dealer network");
      return;
    }
    if (form.listOnNetwork && !form.contactPhone && !form.contactEmail) {
      toast.error("Phone or email required so dealerships can contact you");
      return;
    }
    estimate.mutate({
      make,
      model,
      year: Number(form.year),
      mileageKm: Number(form.mileageKm) || 0,
      transmission: form.transmission,
      fuel: form.fuel,
      bodyType: form.bodyType,
      condition: form.condition,
      serviceHistory: form.serviceHistory,
      province: form.province || undefined,
      photoUrls: photoUrls.length ? photoUrls : undefined,
      listOnNetwork: form.listOnNetwork || undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      notes: form.notes || undefined,
    });
  };

  const fmt = (n: number) => formatVehiclePrice(n);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-32 pb-12 gradient-mesh">
        <div className="container max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full glass-gold text-xs font-medium uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Tumi — Trade-In Agent
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Get an instant <span className="text-gold-gradient">trade-in estimate</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Online range is indicative only. Any participating GrayArx dealership will inspect your car
            and do a test drive before confirming a written offer.
          </p>
          <GrayArxAdvantages compact />
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-2xl">
          <form onSubmit={handleSubmit}>
            <Card className="glass border-primary/15 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Car className="h-5 w-5 text-primary" /> Your vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Make *</Label>
                  <div className="mt-1">
                    <MakeSelect
                      value={form.make}
                      onChange={(make) => setForm({ ...form, make, model: "" })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Model *</Label>
                  <div className="mt-1">
                    <ModelSelect
                      make={form.make}
                      value={form.model}
                      onChange={(model) => setForm({ ...form, model })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Year</Label>
                  <Input type="number" className="mt-1" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </div>
                <div>
                  <Label>Mileage (km)</Label>
                  <Input type="number" className="mt-1" value={form.mileageKm} onChange={(e) => setForm({ ...form, mileageKm: e.target.value })} placeholder="65000" />
                </div>
                <div>
                  <Label>Province</Label>
                  <Select value={form.province || "_"} onValueChange={(v) => setForm({ ...form, province: v === "_" ? "" : v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select province" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">—</SelectItem>
                      {SA_PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Body type</Label>
                  <div className="mt-1">
                    <SearchableSelect
                      value={form.bodyType}
                      onChange={(bodyType) => setForm({ ...form, bodyType })}
                      options={BODY_TYPES}
                      placeholder="SUV / Sedan / Bakkie…"
                    />
                  </div>
                </div>
                <div>
                  <Label>Transmission</Label>
                  <Select value={form.transmission} onValueChange={(v) => setForm({ ...form, transmission: v as typeof form.transmission })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="dct">DCT</SelectItem>
                      <SelectItem value="cvt">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fuel</Label>
                  <Select value={form.fuel} onValueChange={(v) => setForm({ ...form, fuel: v as typeof form.fuel })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as typeof form.condition })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service history</Label>
                  <Select value={form.serviceHistory} onValueChange={(v) => setForm({ ...form, serviceHistory: v as typeof form.serviceHistory })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_dealer">Full dealer history</SelectItem>
                      <SelectItem value="full_independent">Full independent</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-full">
                  <Label>Photos (optional, up to 4)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {photoUrls.map((url, i) => (
                      <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden ring-1 ring-primary/20">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5"
                          onClick={() => setPhotoUrls(photoUrls.filter((_, j) => j !== i))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {photoUrls.length < 4 && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="w-20 h-20 rounded-lg border border-dashed border-primary/30 flex flex-col items-center justify-center text-xs text-muted-foreground hover:border-primary/60"
                      >
                        <ImagePlus className="h-5 w-5 mb-1" />
                        {uploading ? "…" : "Add"}
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    multiple
                    onChange={(e) => handlePhotoPick(e.target.files)}
                  />
                </div>
                <div className="col-span-full">
                  <Label>Notes (optional)</Label>
                  <Textarea className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Accident-free, two keys, recent tyres…" rows={2} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-primary/15 mb-8">
              <CardHeader>
                <CardTitle className="font-display text-base">Contact & dealer network</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input className="mt-1" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input className="mt-1" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+27" />
                  </div>
                  <div className="col-span-full">
                    <Label>Email</Label>
                    <Input type="email" className="mt-1" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
                  </div>
                </div>
                <label className="flex items-start gap-3 rounded-lg border border-primary/15 p-3 cursor-pointer hover:bg-primary/5">
                  <Checkbox
                    checked={form.listOnNetwork}
                    onCheckedChange={(c) => setForm({ ...form, listOnNetwork: c === true })}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">List on GrayArx dealer network</span>
                    <span className="block text-muted-foreground mt-1">
                      Participating dealerships can view your photos and details, then invite you to
                      their showroom for inspection — you choose where to go.
                    </span>
                  </span>
                </label>
              </CardContent>
            </Card>

            <Button type="submit" className="btn-gold w-full h-12 font-semibold" disabled={estimate.isPending || uploading}>
              {estimate.isPending ? "Calculating…" : "Get my estimate"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {result && (
            <Card className="glass-gold border-primary/30 mt-8">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Your estimated range</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">Confidence: {result.confidence}</p>
                {result.networkListed && (
                  <p className="text-sm text-primary mt-1">
                    Listed on the dealer network — expect calls or messages to book an inspection.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Low</p>
                    <p className="font-display text-xl font-bold">{fmt(result.estimateLow)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary uppercase tracking-wider mb-1">Mid</p>
                    <p className="font-display text-2xl font-bold text-primary">{fmt(result.estimateMid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">High</p>
                    <p className="font-display text-xl font-bold">{fmt(result.estimateHigh)}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {renderMemoMarkdown(result.memoMarkdown)}
                </div>
                <p className="text-xs text-muted-foreground mt-4 border-t border-primary/10 pt-4">
                  Reference #{result.quoteId}. Final trade-in value is only confirmed after a dealership
                  inspects your vehicle in person.
                  {form.contactPhone && (
                    <Link
                      href={`/trade-in/status?quote=${result.quoteId}&phone=${encodeURIComponent(form.contactPhone)}`}
                      className="mt-2 flex items-center gap-1.5 text-primary hover:underline font-medium"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Track dealer invites & notifications
                    </Link>
                  )}
                </p>
                <Button asChild className="btn-gold mt-6 w-full">
                  <Link href="/showroom?sort=best_deals">Browse best deals <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <UpgradeJourneyCard
                  tradeInMid={result.estimateMid}
                  tradeInLow={result.estimateLow}
                  tradeInHigh={result.estimateHigh}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
