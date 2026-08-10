import { useMemo, useState } from "react";
import { Store, Copy, Check, MessageCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * "Share your showroom" — gives a dealer the public link to their own showroom
 * (buyers don't need to log in) plus one-tap Copy / WhatsApp / Open actions.
 * Hidden for accounts with no dealership (e.g. founders viewing the console).
 */
export default function ShareShowroomCard() {
  const { user } = useAuth();
  const dealershipId = (user as { dealershipId?: number | null } | null)?.dealershipId ?? null;

  const { data: appearance } = trpc.showroom.appearance.useQuery(
    { dealershipId: dealershipId ?? undefined },
    { enabled: dealershipId != null },
  );

  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (dealershipId == null) return null;
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://www.grayarx.com";
    const shortcode = appearance?.publicShortcode?.trim();
    const query = shortcode
      ? `shortcode=${encodeURIComponent(shortcode)}`
      : `dealershipId=${dealershipId}`;
    return `${origin}/showroom?${query}`;
  }, [dealershipId, appearance?.publicShortcode]);

  if (dealershipId == null || !url) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Showroom link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press the link to copy it manually.");
    }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(
    `Browse our latest stock on GrayArx: ${url}`,
  )}`;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg glass-gold flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">Share your showroom</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send this link to buyers — they can browse your stock and enquire without logging in.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="font-mono text-xs bg-background/60"
              />
              <div className="flex gap-2 shrink-0">
                <Button type="button" size="sm" className="btn-gold" onClick={copy}>
                  {copied ? (
                    <Check className="h-4 w-4 sm:mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                </Button>
                <Button asChild type="button" size="sm" variant="outline">
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </Button>
                <Button asChild type="button" size="sm" variant="outline">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Open</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
