import { useState } from "react";
import { Link, useSearch } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatVehiclePrice } from "@/lib/formatPrice";
import UpgradeJourneyCard from "@/components/UpgradeJourneyCard";
import { formatRelativeTime, formatResponseBadge } from "@shared/formatRelativeTime";
import { Bell, Car, Handshake, Loader2, Phone } from "lucide-react";

export default function TradeInStatus() {
  const search = useSearch();
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const initialQuote = params.get("quote") ?? "";
  const initialPhone = params.get("phone") ?? "";

  const [quoteId, setQuoteId] = useState(initialQuote);
  const [phone, setPhone] = useState(initialPhone);
  const [lookup, setLookup] = useState<{ quoteId: number; phone: string } | null>(
    initialQuote && initialPhone
      ? { quoteId: Number(initialQuote), phone: initialPhone }
      : null,
  );

  const { data, isLoading, error, refetch } = trpc.tradeIn.sellerStatus.useQuery(
    { quoteId: lookup!.quoteId, phone: lookup!.phone },
    { enabled: lookup != null && Number.isFinite(lookup.quoteId) && lookup.quoteId > 0 },
  );

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(quoteId);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error("Enter a valid quote reference number");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
      toast.error("Enter the phone number you used on your trade-in");
      return;
    }
    setLookup({ quoteId: id, phone: phone.trim() });
  };

  const fmt = (n: number) => formatVehiclePrice(n);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-32 pb-12 gradient-mesh">
        <div className="container max-w-xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full glass-gold text-xs font-medium uppercase tracking-widest text-primary">
            <Bell className="h-3.5 w-3.5" /> Seller dashboard
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Track your trade-in activity
          </h1>
          <p className="text-muted-foreground">
            See which dealerships invited you for inspection. Classified portals don't tell you who's interested — we do.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-lg">
          <Card className="glass border-primary/15 mb-8">
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Look up your quote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <Label>Quote reference #</Label>
                  <Input
                    className="mt-1"
                    value={quoteId}
                    onChange={(e) => setQuoteId(e.target.value)}
                    placeholder="From your estimate result"
                  />
                </div>
                <div>
                  <Label>Phone number</Label>
                  <Input
                    className="mt-1"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 … (must match your listing)"
                  />
                </div>
                <Button type="submit" className="btn-gold w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
                    </>
                  ) : (
                    "View activity"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-6 text-center text-sm text-destructive">
                {error.message}
              </CardContent>
            </Card>
          )}

          {data && (
            <div className="space-y-6">
              <Card className="glass-gold border-primary/25">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    {data.vehicle}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tumi range: {fmt(data.estimateLow)} – {fmt(data.estimateHigh)} ·{" "}
                    <span className="capitalize">{data.confidence}</span> confidence
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {data.networkListed && (
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                      Listed on dealer network
                    </Badge>
                  )}
                  {data.province && (
                    <Badge variant="outline" className="text-[10px]">
                      {data.province}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Handshake className="h-3 w-3" />
                    {data.inviteCount} dealer invite{data.inviteCount === 1 ? "" : "s"}
                  </Badge>
                </CardContent>
              </Card>

              {data.inviteCount === 0 ? (
                <Card className="glass border-primary/15">
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    No dealership invites yet. When a dealer invites you, you'll get SMS / email / WhatsApp
                    and it will appear here.
                    <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                data.invites.map((inv) => {
                  const badge = formatResponseBadge(inv.responseMinutes);
                  const channels = [
                    inv.smsSent && "SMS",
                    inv.whatsappSent && "WhatsApp",
                    inv.emailSent && "Email",
                  ].filter(Boolean);
                  return (
                  <Card key={inv.id} className="glass border-primary/15">
                    <CardContent className="pt-5 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-semibold">{inv.dealershipName}</h3>
                        <div className="flex gap-2 flex-wrap">
                          <Badge
                            variant={badge.variant === "fast" ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {badge.label}
                          </Badge>
                          <Badge
                            variant={inv.offerType === "written" ? "default" : "outline"}
                            className="text-[10px] capitalize"
                          >
                            {inv.offerType === "written" ? "Written offer" : "Inspection invite"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(new Date(inv.createdAt))}
                        {channels.length > 0 && ` · Notified via ${channels.join(" + ")}`}
                      </p>
                      {inv.indicativeOfferZar != null && (
                        <p className="text-primary font-display font-bold">
                          {inv.offerType === "written" ? "Offer" : "Indicative"}: {fmt(inv.indicativeOfferZar)}
                          {inv.offerType !== "written" && (
                            <span className="text-[10px] font-normal text-muted-foreground ml-2">
                              pre-inspection
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {inv.messagePreview}
                        {inv.messagePreview.length >= 200 ? "…" : ""}
                      </p>
                    </CardContent>
                  </Card>
                  );
                })
              )}

              <UpgradeJourneyCard
                tradeInMid={data.estimateMid}
                tradeInLow={data.estimateLow}
                tradeInHigh={data.estimateHigh}
              />

              <Button asChild variant="outline" className="w-full border-primary/25">
                <Link href="/trade-in">Get another estimate</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
