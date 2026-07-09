import { useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Wrench,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Car,
  FileUp,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/LoadingAnimations";
import { formatVehiclePrice } from "@/lib/formatPrice";

export default function R1PriceManager() {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [repairCsv, setRepairCsv] = useState<string | null>(null);
  const [repairFileName, setRepairFileName] = useState<string | null>(null);
  const [repairProgress, setRepairProgress] = useState<number | null>(null);
  const [repairStatus, setRepairStatus] = useState<string | null>(null);

  const clearProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const { data: suspicious, isLoading } = trpc.inventoryImport.suspiciousPriceCount.useQuery();
  const { data: vehicleList } = trpc.inventoryImport.suspiciousVehicles.useQuery();

  const repairMutation = trpc.inventoryImport.repairPrices.useMutation({
    onSuccess: (res) => {
      clearProgressTimer();
      setRepairProgress(100);
      setRepairStatus(null);
      setTimeout(() => setRepairProgress(null), 600);
      utils.inventoryImport.suspiciousPriceCount.invalidate();
      utils.inventoryImport.suspiciousVehicles.invalidate();
      utils.dealer.listVehicles.invalidate();
      utils.showroom.list.invalidate();
      toast.success(
        `Fixed ${res.updated} price${res.updated === 1 ? "" : "s"}` +
          (res.notFound ? ` · ${res.notFound} not matched` : "") +
          (res.alreadyCorrect ? ` · ${res.alreadyCorrect} already correct` : ""),
      );
    },
    onError: (e) => {
      clearProgressTimer();
      setRepairProgress(null);
      setRepairStatus(null);
      toast.error(e.message);
    },
  });

  const loadRepairFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setRepairCsv(String(reader.result ?? ""));
      setRepairFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleRepair = () => {
    if (!repairCsv?.trim()) {
      toast.error("Upload the same CSV you imported originally");
      return;
    }
    clearProgressTimer();
    setRepairProgress(8);
    setRepairStatus("Matching CSV rows to your inventory…");
    repairMutation.mutate({ csv: repairCsv });
    progressTimerRef.current = setInterval(() => {
      setRepairProgress((p) => {
        if (p === null) return p;
        if (p >= 88) {
          setRepairStatus("Saving prices to database… almost done");
          return p;
        }
        if (p >= 50) setRepairStatus("Updating vehicle prices…");
        return p + 3;
      });
    }, 400);
  };

  const suspiciousCount = suspicious?.count ?? 0;
  const vehicles = vehicleList?.vehicles ?? [];

  return (
    <DealerShell
      title="Fix R1 prices"
      subtitle="Bulk-repair vehicles stuck at R1 from a bad import — one CSV upload fixes them all."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Affected inventory
            </CardTitle>
            <CardDescription>
              These vehicles show POA on your showroom instead of real prices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : suspiciousCount === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                All prices look correct — nothing to fix.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-2xl font-bold text-amber-200">{suspiciousCount}</p>
                  <p className="text-xs text-amber-200/70 mt-1">
                    vehicle{suspiciousCount === 1 ? "" : "s"} priced at R1 or less
                  </p>
                </div>
                {vehicles.length > 0 && (
                  <ul className="max-h-64 overflow-y-auto space-y-2 text-sm">
                    {vehicles.slice(0, 20).map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2"
                      >
                        <span className="truncate flex items-center gap-2 min-w-0">
                          <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {v.title}
                        </span>
                        <span className="text-amber-400 font-mono text-xs shrink-0">
                          {formatVehiclePrice(v.price)}
                        </span>
                      </li>
                    ))}
                    {suspiciousCount > 20 && (
                      <li className="text-xs text-muted-foreground text-center pt-1">
                        +{suspiciousCount - 20} more
                      </li>
                    )}
                  </ul>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-primary" />
              Bulk repair from CSV
            </CardTitle>
            <CardDescription>
              Upload your original import file. We match by stock ID, then make/model/year, then
              title — and only update vehicles at R1.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/25 hover:border-primary/50 hover:bg-primary/5 px-6 py-8 cursor-pointer transition-all"
            >
              <Upload className="h-8 w-8 text-primary/60 mb-2" />
              <p className="text-sm font-medium">{repairFileName ?? "Upload original CSV"}</p>
              <p className="text-xs text-muted-foreground mt-1">Same file used for bulk import</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadRepairFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            {repairProgress !== null && (
              <div className="space-y-2">
                <ProgressBar progress={repairProgress} label="Repairing prices…" animated />
                {repairStatus && (
                  <p className="text-xs text-center text-muted-foreground">{repairStatus}</p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleRepair}
              disabled={!repairCsv || repairMutation.isPending}
            >
              {repairMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Repairing…
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  Repair all R1 prices
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Tip:</strong> You can also re-import the same CSV
              on{" "}
              <Link href="/dealer/inventory/import" className="text-primary underline">
                CSV Import
              </Link>{" "}
              — duplicates at R1 are auto-repaired now.
            </p>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-xl border border-primary/15 bg-card/40 p-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
      >
        <FileUp className="h-4 w-4 text-primary shrink-0" />
        <span>
          Need to fix photos too? Head to{" "}
          <Link href="/dealer/csv-photo" className="text-primary underline">
            Photo manager
          </Link>
          .
        </span>
      </motion.div>
    </DealerShell>
  );
}
