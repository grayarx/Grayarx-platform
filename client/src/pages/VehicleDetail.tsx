import { useParams, Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Fuel,
  Gauge,
  MapPin,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Mail,
  Phone,
  Car,
  Sparkles,
  Banknote,
  GitCompare,
  TrendingUp,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ShowroomChatAgent } from "@/components/ShowroomChatAgent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { OWNER_PHONE_DISPLAY, OWNER_PHONE_E164, OWNER_WHATSAPP_URL, OWNER_EMAIL } from "@/lib/contact";
import { toast } from "sonner";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

import { formatVehiclePrice, isSuspiciousPrice } from "@/lib/formatPrice";
import DealScoreBadge from "@/components/DealScoreBadge";
import UpgradeJourneyCard from "@/components/UpgradeJourneyCard";
import VehicleGallery from "@/components/VehicleGallery";
import { loadTradeInSession } from "@/lib/tradeInSession";
import { scoreListingDeal } from "@shared/priceIntelligence";
import { mergeVehicleGallery, vehiclePrimaryUrl } from "@shared/imagePipeline";

function formatKm(km: number | null | undefined): string {
  if (km === null || km === undefined) return "—";
  return `${km.toLocaleString("en-ZA")} km`;
}

export default function VehicleDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const vehicleId = Number(params.id);
  const tradeInSession = useMemo(() => loadTradeInSession(), []);
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { data: vehicle, isLoading, error } = trpc.showroom.get.useQuery(
    { id: vehicleId },
    { enabled: Number.isFinite(vehicleId) && vehicleId > 0 },
  );
  const { data: contactOptions } = trpc.showroom.contactOptions.useQuery();

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const dealScore = useMemo(() => {
    if (!vehicle || isSuspiciousPrice(vehicle.price)) return null;
    const price = Number(vehicle.price);
    return scoreListingDeal(price, {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileageKm: vehicle.km,
      title: vehicle.title,
    });
  }, [vehicle]);

  const galleryImages = useMemo(() => {
    if (!vehicle) return [];
    const gallery = (vehicle as { gallery?: Array<{ url: string }> }).gallery ?? [];
    return mergeVehicleGallery(vehiclePrimaryUrl(vehicle), gallery);
  }, [vehicle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(
    `${vehicle?.title ?? "GrayArx vehicle"} — ${shareUrl}`,
  )}`;
  const emailShare = `mailto:?subject=${encodeURIComponent(
    `Have a look at this ${vehicle?.title ?? "vehicle"}`,
  )}&body=${encodeURIComponent(`I thought you might like this:\n\n${shareUrl}`)}`;

  if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-32 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Vehicle not found</h1>
          <p className="text-muted-foreground mb-8">The link you followed is invalid.</p>
          <Button onClick={() => setLocation("/showroom")}>Back to showroom</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Per-page meta tags for rich social previews when a vehicle URL is
  // shared on WhatsApp/iMessage/X.
  useDocumentMeta({
    title: vehicle
      ? `${vehicle.title} — GrayArx Showroom`
      : "Vehicle — GrayArx Showroom",
    description: vehicle
      ? vehicle.description ??
        `${vehicle.title}${vehicle.km != null ? ` · ${vehicle.km.toLocaleString("en-ZA")} km` : ""}${vehicle.location ? ` · ${vehicle.location}` : ""}`
      : undefined,
    ogImage: vehicle?.primaryPhotoUrl ?? undefined,
    ogUrl: typeof window !== "undefined" ? window.location.href : undefined,
    ogType: "product",
  });

  // JSON-LD Vehicle schema for Google rich results.
  // Crawlers parse the static HTML and re-execute JS, so injecting this in
  // the React tree (via a script tag) is sufficient for Googlebot/Bingbot.
  const jsonLd =
    vehicle
      ? {
          "@context": "https://schema.org",
          "@type": "Vehicle",
          name: vehicle.title,
          description:
            vehicle.description ??
            `${vehicle.title} — available on the GrayArx showroom.`,
          brand: vehicle.make ? { "@type": "Brand", name: vehicle.make } : undefined,
          model: vehicle.model ?? undefined,
          vehicleModelDate: vehicle.year ? String(vehicle.year) : undefined,
          mileageFromOdometer:
            vehicle.km != null
              ? {
                  "@type": "QuantitativeValue",
                  value: vehicle.km,
                  unitCode: "KMT",
                }
              : undefined,
          fuelType: vehicle.fuel ?? undefined,
          vehicleTransmission: vehicle.transmission ?? undefined,
          color: (vehicle as { color?: string | null }).color ?? undefined,
          itemCondition:
            vehicle.condition === "new"
              ? "https://schema.org/NewCondition"
              : "https://schema.org/UsedCondition",
          image: vehicle.primaryPhotoUrl ? [vehicle.primaryPhotoUrl] : undefined,
          offers:
            vehicle.price != null
              ? {
                  "@type": "Offer",
                  priceCurrency: "ZAR",
                  price: String(vehicle.price),
                  availability:
                    vehicle.status === "available"
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                  url:
                    typeof window !== "undefined" ? window.location.href : undefined,
                }
              : undefined,
        }
      : null;

  return (
    <div className="min-h-screen flex flex-col">
      {jsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <Navigation />

      <main className="flex-1 pt-8">
        <div className="container">
          <Link
            href="/showroom"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to showroom
          </Link>

          {isLoading && (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 aspect-[16/10] rounded-2xl bg-muted animate-pulse" />
              <div className="lg:col-span-2 space-y-4">
                <div className="h-10 w-2/3 bg-muted rounded animate-pulse" />
                <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
                <div className="h-24 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-destructive font-medium mb-2">Couldn't load this vehicle.</p>
              <p className="text-sm text-muted-foreground">Please try again in a moment.</p>
            </div>
          )}

          {!isLoading && !error && !vehicle && (
            <div className="text-center py-20">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Vehicle not found</h2>
              <p className="text-muted-foreground mb-6">
                It may have been reserved or removed from the showroom.
              </p>
              <Button onClick={() => setLocation("/showroom")}>Browse other vehicles</Button>
            </div>
          )}

          {vehicle && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-5 gap-8 pb-16"
            >
              {/* Left: Gallery */}
              <div className="lg:col-span-3 relative">
                {vehicle.status && vehicle.status !== "available" && (
                  <Badge
                    variant="secondary"
                    className="absolute top-4 left-4 z-20 capitalize text-sm px-3 py-1"
                  >
                    {vehicle.status}
                  </Badge>
                )}
                <VehicleGallery title={vehicle.title} images={galleryImages} />

                {vehicle.description && (
                  <div className="mt-6 rounded-2xl border border-primary/10 bg-card/50 p-6">
                    <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      About this vehicle
                    </h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {vehicle.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Details + CTAs */}
              <aside className="lg:col-span-2 space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-primary mb-2">
                    {vehicle.make ?? "Premium"}
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-3">
                    {vehicle.title}
                  </h1>
                  <div
                    className={`text-3xl font-display font-bold ${isSuspiciousPrice(vehicle.price) ? "text-amber-400" : "text-gold-gradient"}`}
                  >
                    {formatVehiclePrice(vehicle.price)}
                  </div>
                  {isSuspiciousPrice(vehicle.price) && (
                    <p className="text-xs text-amber-400/80 mt-1">Price on application — contact dealer for quote</p>
                  )}
                  {dealScore && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <DealScoreBadge score={dealScore} showDelta />
                    </div>
                  )}
                </div>

                {dealScore && (
                  <div className="rounded-2xl border border-primary/15 bg-card/60 p-5 text-sm space-y-2">
                    <h3 className="font-display font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      GrayArx price intelligence
                    </h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      AutoTrader shows asking prices. We compare this listing to our SA market guide so you know if
                      you're saving or overpaying before you enquire.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Listed at</p>
                        <p className="font-semibold">{formatVehiclePrice(dealScore.listingPrice)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Market guide</p>
                        <p className="font-semibold">{formatVehiclePrice(dealScore.marketMid)}</p>
                      </div>
                    </div>
                    {dealScore.deltaZar > 0 ? (
                      <p className="text-green-300 text-xs font-medium">
                        ~{formatVehiclePrice(dealScore.deltaZar)} below typical market ({dealScore.deltaPct}%)
                      </p>
                    ) : dealScore.deltaZar < 0 ? (
                      <p className="text-amber-300 text-xs font-medium">
                        ~{formatVehiclePrice(Math.abs(dealScore.deltaZar))} above typical market — compare similar stock
                      </p>
                    ) : null}
                    <Link
                      href="/compare"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <GitCompare className="h-3 w-3" /> Compare with other listings
                    </Link>
                  </div>
                )}

                {tradeInSession && vehicle && (
                  <UpgradeJourneyCard
                    tradeInMid={tradeInSession.estimateMid}
                    tradeInLow={tradeInSession.estimateLow}
                    tradeInHigh={tradeInSession.estimateHigh}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  {vehicle.year && (
                    <SpecCard icon={<Calendar className="h-4 w-4" />} label="Year" value={String(vehicle.year)} />
                  )}
                  <SpecCard icon={<Gauge className="h-4 w-4" />} label="Mileage" value={formatKm(vehicle.km)} />
                  {vehicle.fuel && (
                    <SpecCard icon={<Fuel className="h-4 w-4" />} label="Fuel" value={vehicle.fuel} />
                  )}
                  {vehicle.transmission && (
                    <SpecCard
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Transmission"
                      value={vehicle.transmission}
                    />
                  )}
                  {vehicle.location && (
                    <SpecCard
                      icon={<MapPin className="h-4 w-4" />}
                      label="Location"
                      value={vehicle.location}
                    />
                  )}
                </div>

                {/* CTAs */}
                <Button
                  className="w-full btn-gold h-12 font-semibold"
                  onClick={() => setChatOpen(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Chat with Nala about this car
                </Button>
                <PreApprovedCTA vehicleId={vehicle.id} />
                <BookTestDriveCTA vehicleId={vehicle.id} />
                {!isSuspiciousPrice(vehicle.price) && (
                  <Link
                    href={`/finance?price=${Math.round(Number(vehicle.price))}`}
                    className="block rounded-2xl border border-primary/20 bg-card/40 p-5 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-base font-semibold">Estimate monthly instalment</div>
                        <div className="text-xs text-muted-foreground">
                          Finance calculator pre-filled for {formatVehiclePrice(vehicle.price)}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                <div className="rounded-2xl border border-primary/15 bg-card/60 p-5 space-y-3">
                  <a
                    href={OWNER_WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-95 active:scale-[0.98] transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp the dealer
                  </a>
                  <a
                    href={`tel:${OWNER_PHONE_E164}`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-primary/30 bg-transparent text-foreground font-semibold py-3 hover:bg-primary/10 active:scale-[0.98] transition"
                  >
                    <Phone className="h-4 w-4" />
                    Call {OWNER_PHONE_DISPLAY}
                  </a>
                  <a
                    href={`mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
                      `Enquiry — ${vehicle.title}`,
                    )}`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-primary/15 bg-transparent text-foreground font-semibold py-3 hover:bg-primary/5 active:scale-[0.98] transition"
                  >
                    <Mail className="h-4 w-4" />
                    Email enquiry
                  </a>
                </div>

                {/* Share & compare */}
                <div className="flex gap-2">
                  <Link
                    href={`/compare?ids=${vehicle.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-transparent text-foreground font-semibold py-3 hover:bg-primary/10 active:scale-[0.98] transition text-sm"
                  >
                    <GitCompare className="h-4 w-4" />
                    Add to compare
                  </Link>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share with a customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share this vehicle</DialogTitle>
                      <DialogDescription>
                        Send the link by WhatsApp, email, or copy it to share anywhere.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-primary/15 bg-muted/40 p-3 text-sm break-all">
                        {shareUrl}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" onClick={handleCopy}>
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <a
                          href={whatsappShare}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary/20 px-3 py-2 hover:bg-primary/10"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          WhatsApp
                        </a>
                        <a
                          href={emailShare}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary/20 px-3 py-2 hover:bg-primary/10"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </a>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </aside>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {vehicle && (
        <ShowroomChatAgent
          vehicle={{
            id: String(vehicle.id),
            title: vehicle.title,
            price: Number(vehicle.price),
            year: vehicle.year ?? 0,
            km: vehicle.km ?? 0,
            fuel: vehicle.fuel ?? "—",
            transmission: vehicle.transmission ?? "—",
            image: vehicle.primaryPhotoUrl || vehicle.imageUrl || undefined,
            location: vehicle.location ?? undefined,
            make: vehicle.make ?? undefined,
            model: vehicle.model ?? undefined,
            color: vehicle.color ?? undefined,
            description: vehicle.description ?? undefined,
          }}
          open={chatOpen}
          onOpenChange={setChatOpen}
          dealershipName={contactOptions?.dealershipName ?? "GrayArx Dealership"}
          shortcode={contactOptions?.shortcode}
        />
      )}
    </div>
  );
}

function PreApprovedCTA({ vehicleId }: { vehicleId: number }) {
  const { data, isLoading } = trpc.showroom.primaryShortcode.useQuery();
  const shortcode = data?.shortcode ?? null;
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-pulse">
        <div className="h-5 w-1/2 bg-muted rounded mb-2" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    );
  }
  if (!shortcode) {
    return (
      <div className="rounded-2xl border border-primary/15 bg-card/40 p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Banknote className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold">Finance pre-approval</div>
            <div className="text-xs text-muted-foreground">
              Chat with Nala above or contact the dealer — online pre-approval opens once the dealership completes setup.
            </div>
          </div>
        </div>
      </div>
    );
  }
  const href = `/apply/${shortcode}?vehicle=${vehicleId}`;
  // Note: BookTestDriveCTA below reuses the same `showroom.primaryShortcode`
  // query; tRPC dedupes the request so we don't pay for it twice.
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 hover:border-primary/60 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
          <Banknote className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-base font-semibold">
            Get pre-approved for finance
          </div>
          <div className="text-xs text-muted-foreground">
            Naledi will acknowledge your application within seconds. A human
            makes the final call — no automated approvals.
          </div>
        </div>
      </div>
    </Link>
  );
}

function BookTestDriveCTA({ vehicleId }: { vehicleId: number }) {
  const { data, isLoading } = trpc.showroom.primaryShortcode.useQuery();
  const shortcode = data?.shortcode ?? null;
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-pulse">
        <div className="h-5 w-1/2 bg-muted rounded mb-2" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    );
  }
  if (!shortcode) {
    return (
      <div className="rounded-2xl border border-primary/15 bg-card/40 p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold">Book a test drive</div>
            <div className="text-xs text-muted-foreground">
              Use the chat button or call the dealer to arrange a test drive for this vehicle.
            </div>
          </div>
        </div>
      </div>
    );
  }
  const href = `/book/${shortcode}?vehicle=${vehicleId}`;
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 hover:border-primary/60 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-base font-semibold">
            Book a test drive
          </div>
          <div className="text-xs text-muted-foreground">
            Lerato will reply in your language and pencil in a slot in the
            dealer's working hours. A human confirms before it's locked in.
          </div>
        </div>
      </div>
    </Link>
  );
}

function SpecCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-primary/10 bg-card/50 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="font-display text-base font-semibold">{value}</div>
    </div>
  );
}
