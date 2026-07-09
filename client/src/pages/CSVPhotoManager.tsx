import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RECOMMENDED_ANGLE_COUNT } from "@shared/photoAngles";

export default function CSVPhotoManager() {
  const utils = trpc.useUtils();
  const { data: health, isLoading } = trpc.inventoryImport.photoHealth.useQuery();
  const mirrorMutation = trpc.inventoryImport.mirrorMissingPhotos.useMutation({
    onSuccess: (res) => {
      utils.inventoryImport.photoHealth.invalidate();
      utils.dealer.listVehicles.invalidate();
      utils.showroom.list.invalidate();
      toast.success(
        `Saved ${res.mirrored} photo${res.mirrored === 1 ? "" : "s"} to GrayArx` +
          (res.failed ? ` (${res.failed} could not download)` : ""),
      );
    },
    onError: (e) => toast.error(e.message),
  });

  const readyPct = health
    ? Math.round(
        ((health.totalVehicles - health.withoutPhoto - health.externalOnly) /
          Math.max(1, health.totalVehicles)) *
          100,
      )
    : 0;

  return (
    <DealerShell
      title="Photo manager"
      subtitle="One-click fixes — save AutoTrader photos permanently and see what's missing."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-primary" />
              Showroom photo health
            </CardTitle>
            <CardDescription>
              Luxury listings use {RECOMMENDED_ANGLE_COUNT}+ angles. GrayArx tracks this for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : health ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Showroom ready</span>
                    <span className="font-semibold">{readyPct}%</span>
                  </div>
                  <Progress value={readyPct} className="h-2" />
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Total vehicles</span>
                    <span>{health.totalVehicles}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Missing any photo</span>
                    <span className={health.withoutPhoto ? "text-amber-400 font-medium" : ""}>
                      {health.withoutPhoto}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">External links (need saving)</span>
                    <span className={health.externalOnly ? "text-amber-400 font-medium" : ""}>
                      {health.externalOnly}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Below 8-photo standard</span>
                    <span>{health.belowRecommended}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Avg photos per car</span>
                    <span>{health.avgPhotosPerVehicle}</span>
                  </li>
                </ul>
                {health.showroomReady && (
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> All photos hosted and present
                  </p>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-5 w-5 text-primary" />
              Save external photos
            </CardTitle>
            <CardDescription>
              Copies AutoTrader &amp; Cars.co.za images into GrayArx so links never break when listings
              expire.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full btn-gold h-12"
              disabled={mirrorMutation.isPending || !health?.externalOnly}
              onClick={() => mirrorMutation.mutate()}
            >
              {mirrorMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving photos…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Save {health?.externalOnly ?? 0} external photo
                  {(health?.externalOnly ?? 0) === 1 ? "" : "s"} now
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No setup required — click once after CSV import. Photos are stored on GrayArx permanently.
            </p>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 grid gap-4 sm:grid-cols-3"
      >
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="pt-6">
            <ImageIcon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Add photos per car</h3>
            <p className="text-xs text-muted-foreground mb-4">
              8-angle checklist with drag &amp; drop — no technical skills.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dealer/inventory">Open inventory</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="pt-6">
            <Upload className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Import from CSV</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Paste AutoTrader export — use | between photo URLs for galleries.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dealer/inventory/import">Import CSV</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="pt-6">
            <ExternalLink className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Preview showroom</h3>
            <p className="text-xs text-muted-foreground mb-4">
              See exactly what buyers see — classic luxury layout by default.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/showroom" target="_blank">
                View showroom
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </DealerShell>
  );
}
