import { useMemo, useState } from "react";
import {
  Car,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Mail,
  Search,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { SA_PROVINCES } from "@shared/saProvinces";
import { formatRelativeTime, formatResponseBadge } from "@shared/formatRelativeTime";

function fmtKm(km: number) {
  return `${km.toLocaleString("en-ZA")} km`;
}

export default function TradeInNetwork() {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState<string>("all");
  const [inviteTarget, setInviteTarget] = useState<number | null>(null);
  const [offerTarget, setOfferTarget] = useState<number | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const [indicativeOffer, setIndicativeOffer] = useState("");
  const [writtenOffer, setWrittenOffer] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const { data, isLoading, refetch } = trpc.dealer.listNetworkTradeIns.useQuery();
  const invite = trpc.dealer.requestTradeInInspection.useMutation({
    onSuccess: (res) => {
      toast.success("Inspection invite logged — contact the seller below.");
      if (res.notifications?.smsSent || res.notifications?.emailSent || res.notifications?.whatsappSent) {
        const channels = [
          res.notifications.smsSent && "SMS",
          res.notifications.whatsappSent && "WhatsApp",
          res.notifications.emailSent && "email",
        ].filter(Boolean);
        toast.success(`Seller notified via ${channels.join(" + ")}`);
      } else {
        toast.message("Seller notification queued (check Twilio/Resend config)");
      }
      setInviteTarget(null);
      setInviteMessage("");
      if (res.contactPhone) {
        navigator.clipboard.writeText(res.inviteMessage).catch(() => {});
      }
      refetch();
    },
    onError: (e) => toast.error(e.message || "Could not send invite"),
  });
  const confirmOffer = trpc.dealer.confirmTradeInOffer.useMutation({
    onSuccess: (res) => {
      toast.success("Written offer sent to seller");
      if (res.notifications?.smsSent || res.notifications?.whatsappSent) {
        toast.success("Seller notified via SMS/WhatsApp");
      }
      setOfferTarget(null);
      setWrittenOffer("");
      setOfferMessage("");
      refetch();
    },
    onError: (e) => toast.error(e.message || "Could not confirm offer"),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      if (province !== "all" && row.province !== province) return false;
      if (!q) return true;
      const hay = `${row.year} ${row.make} ${row.model} ${row.province ?? ""} ${row.notes ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, search, province]);

  const fmt = (n: number) => formatVehiclePrice(n);

  const openInvite = (id: number) => {
    setInviteTarget(id);
    setInviteMessage("");
  };

  return (
    <DealerShell
      title="Trade-In Network"
      subtitle="Sellers who opted in after Tumi's estimate. Review photos and details, then invite them for an in-person inspection and test drive before confirming a written offer."
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search make, model, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[160px]"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="all">All provinces</option>
          {SA_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading listings…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass border-primary/15">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No trade-ins on the network yet.</p>
            <p className="text-sm mt-1">
              When a private seller gets an estimate on{" "}
              <a href="/trade-in" className="text-primary underline underline-offset-2">
                /trade-in
              </a>{" "}
              and opts in to list, they appear here for every dealership to invite for inspection.
            </p>
            <p className="text-xs mt-3 text-muted-foreground/80">
              Filters and invite / written-offer actions are live — the list is empty until the first seller opts in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((row) => (
            <Card key={row.id} className="glass border-primary/15 overflow-hidden flex flex-col">
              {row.photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-0.5 bg-black/40">
                  {row.photoUrls.slice(0, 4).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="aspect-[4/3] object-cover w-full img-premium"
                    />
                  ))}
                </div>
              ) : (
                <div className="aspect-[16/9] bg-muted/30 flex items-center justify-center">
                  <Car className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
              <CardContent className="p-4 flex flex-col flex-1 gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    {row.year} {row.make} {row.model}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtKm(row.mileageKm)} · {row.transmission} · {row.condition}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.province && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <MapPin className="h-3 w-3" /> {row.province}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {row.confidence} confidence
                  </Badge>
                  {row.listingAgeHours < 48 ? (
                    <Badge className="text-[10px] bg-primary/20 text-primary border-0">
                      Listed {row.listingAgeHours}h ago
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Listed {Math.round(row.listingAgeHours / 24)}d ago
                    </Badge>
                  )}
                  {row.inviteCount > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {row.inviteCount} dealer{row.inviteCount === 1 ? "" : "s"} interested
                    </Badge>
                  )}
                  {row.dealerAlreadyInvited && (
                    <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-0">
                      You invited
                    </Badge>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Tumi range: </span>
                  <span className="font-semibold text-primary">
                    {fmt(row.estimateLow)} – {fmt(row.estimateHigh)}
                  </span>
                </div>
                {row.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{row.notes}</p>
                )}
                <div className="mt-auto pt-2 flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                    {row.contactName && <span>{row.contactName}</span>}
                    {row.contactPhone && (
                      <a href={`tel:${row.contactPhone}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3 w-3" /> {row.contactPhone}
                      </a>
                    )}
                    {row.contactEmail && (
                      <a href={`mailto:${row.contactEmail}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Mail className="h-3 w-3" /> Email
                      </a>
                    )}
                  </div>
                  <Button
                    className="btn-gold w-full"
                    size="sm"
                    onClick={() => openInvite(row.id)}
                    disabled={invite.isPending}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {row.dealerAlreadyInvited ? "Invite again" : "Invite for inspection"}
                  </Button>
                  {row.dealerAlreadyInvited && (
                    <Button
                      variant="outline"
                      className="w-full border-primary/25"
                      size="sm"
                      onClick={() => {
                        setOfferTarget(row.id);
                        setWrittenOffer(String(row.estimateMid));
                        setOfferMessage("");
                      }}
                      disabled={confirmOffer.isPending}
                    >
                      Confirm written offer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={inviteTarget != null} onOpenChange={(o) => !o && setInviteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Invite seller for inspection</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This creates a lead in your console and copies a suggested message. Final offers are only
            confirmed after physical inspection and test drive — never from the online estimate alone.
          </p>
          <Textarea
            rows={4}
            placeholder="Optional custom message…"
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
          />
          <div>
            <label className="text-xs text-muted-foreground">Indicative offer (ZAR, optional — pre-inspection)</label>
            <Input
              type="number"
              className="mt-1"
              placeholder="e.g. 95000"
              value={indicativeOffer}
              onChange={(e) => setIndicativeOffer(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteTarget(null)}>
              Cancel
            </Button>
            <Button
              className="btn-gold"
              disabled={invite.isPending || inviteTarget == null}
              onClick={() =>
                inviteTarget != null &&
                invite.mutate({
                  quoteId: inviteTarget,
                  message: inviteMessage || undefined,
                  indicativeOfferZar: indicativeOffer ? Number(indicativeOffer) : undefined,
                })
              }
            >
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={offerTarget != null} onOpenChange={(o) => !o && setOfferTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Confirm written offer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            After inspection, send the confirmed trade-in offer. The seller gets SMS, WhatsApp, and email
            with a link to track status.
          </p>
          <div>
            <label className="text-xs text-muted-foreground">Written offer (ZAR)</label>
            <Input
              type="number"
              className="mt-1"
              value={writtenOffer}
              onChange={(e) => setWrittenOffer(e.target.value)}
            />
          </div>
          <Textarea
            rows={3}
            placeholder="Optional message to seller…"
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferTarget(null)}>
              Cancel
            </Button>
            <Button
              className="btn-gold"
              disabled={confirmOffer.isPending || offerTarget == null || !writtenOffer}
              onClick={() =>
                offerTarget != null &&
                confirmOffer.mutate({
                  quoteId: offerTarget,
                  writtenOfferZar: Number(writtenOffer),
                  message: offerMessage || undefined,
                })
              }
            >
              {confirmOffer.isPending ? "Sending…" : "Send written offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DealerShell>
  );
}
