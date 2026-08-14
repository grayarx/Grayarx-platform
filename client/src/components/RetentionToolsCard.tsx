import { Link } from "wouter";
import { Copy, Link2, Star, HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

async function copyText(text: string, ok: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
  } catch {
    toast.error("Could not copy — select the text manually");
  }
}

/** Reputation ask + aftercare drafts + dealer invite link. */
export default function RetentionToolsCard() {
  const { data, isLoading } = trpc.dealer.retentionTools.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (isLoading || !data) return null;
  if (!data.modules.aftercare && !data.modules.dealerReferral) return null;

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5 space-y-5">
        <div>
          <p className="text-sm font-semibold">Keep customers — grow the network</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ask for Google reviews, check in after the sale, invite a peer yard.
          </p>
        </div>

        {data.modules.aftercare && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-primary" />
              Reputation
            </div>
            {!data.googleReviewUrl && (
              <p className="text-xs text-amber-400/90">
                Add your Google review link in{" "}
                <Link href="/dealer/settings" className="underline hover:text-primary">
                  Settings
                </Link>{" "}
                so the ask message includes a one-tap URL.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyText(data.reviewDraft, "Review ask copied")}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy review ask
              </Button>
            </div>

            {data.recentSold.length > 0 && (
              <div className="rounded-xl border border-border/50 divide-y divide-border/40">
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <HeartHandshake className="h-3.5 w-3.5 text-primary" />
                  Recent sold — aftercare check-in
                </div>
                {data.recentSold.slice(0, 4).map((v) => (
                  <div
                    key={v.id}
                    className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <span className="text-sm font-medium truncate">{v.label}</span>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => copyText(v.checkInDraft, "Check-in copied")}
                      >
                        Check-in
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => copyText(v.reviewDraft, "Review ask copied")}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {data.modules.dealerReferral && data.inviteUrl && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              Invite a dealer
            </div>
            <p className="text-xs text-muted-foreground">
              Share your invite link — applications land with your shortcode so we can credit the intro.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <code className="text-[11px] bg-muted/50 px-2 py-1 rounded max-w-full truncate">
                {data.inviteUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyText(data.inviteUrl!, "Invite link copied")}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy invite
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
