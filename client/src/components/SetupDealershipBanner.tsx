import { Loader2, Store } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown when a logged-in account can see the dealer console but cannot import
 * (role "user" / no dealership). One click creates their garage and promotes
 * them to dealer_owner — no Railway env var needed.
 */
export default function SetupDealershipBanner() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const role = user?.role;
  const dealershipId = (user as { dealershipId?: number | null } | null)?.dealershipId ?? null;
  const needsSetup =
    !!user &&
    role !== "founder" &&
    role !== "admin" &&
    (role === "user" || dealershipId == null);

  const setup = trpc.auth.setupMyDealership.useMutation({
    onSuccess: async (res) => {
      await utils.auth.me.invalidate();
      toast.success(res.message || "Dealership ready");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!needsSetup) return null;

  return (
    <Card className="mb-6 border-amber-500/40 bg-amber-500/10">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Your account isn’t a dealer yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              That’s why Preview / Import says “Dealer or admin access required”.
              Tap once to create your garage and unlock CSV upload.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="btn-gold shrink-0"
          disabled={setup.isPending}
          onClick={() => setup.mutate(undefined)}
        >
          {setup.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Store className="h-4 w-4 mr-2" />
          )}
          Set up my dealership
        </Button>
      </CardContent>
    </Card>
  );
}
