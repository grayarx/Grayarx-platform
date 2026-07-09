import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  FileUp,
  Car,
  Gauge,
  Fuel,
} from "lucide-react";
import { Link } from "wouter";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar, LoadingSpinner } from "@/components/LoadingAnimations";
import { cn } from "@/lib/utils";
import { formatVehiclePrice, isSuspiciousPrice } from "@/lib/formatPrice";

import { photoQualityLabel } from "@shared/photoStandards";

const SAMPLE = `title,make,model,year,price,km,fuel,transmission,location,image,stock
2022 Toyota Corolla 1.8 XS,Toyota,Corolla,2022,329900,42000,Petrol,Automatic,Sandton,https://images.unsplash.com/photo-1621007947382-b3763c082179?w=1200|https://images.unsplash.com/photo-1621007947382-b3763c082179?w=1200,STK-001
2020 VW Polo 1.0 TSI Comfortline,VW,Polo,2020,224900,68000,Petrol,Manual,Pretoria,,STK-002`;

const TEMPLATE_CSV = SAMPLE;

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60' viewBox='0 0 80 60'%3E%3Crect fill='%231a1a1a' width='80' height='60'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23D4AF37' font-size='10'%3ENo photo%3C/text%3E%3C/svg%3E";

type PreviewRow = {
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  km: number | null;
  fuel: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  photoScore?: number;
  photoWarnings?: string[];
};


export default function InventoryImportPage() {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const [preview, setPreview] = useState<{
    totalRows: number;
    validRows: PreviewRow[];
    skippedRows: Array<{ index: number; reason: string }>;
    duplicateRefs: string[];
    photoSummary?: {
      avgScore: number;
      rowsWithoutPhotos: number;
      rowsBelowRecommended: number;
    };
  } | null>(null);

  const [mirrorPhotos, setMirrorPhotos] = useState(true);

  const [lastImport, setLastImport] = useState<{
    created: number;
    repaired: number;
    failed: Array<{ title: string; reason: string }>;
  } | null>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please upload a .csv file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("CSV is too large (max 5 MB). Split into smaller files.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsv(text);
      setFileName(file.name);
      setPreview(null);
      setLastImport(null);
      toast.success(`Loaded ${file.name}`);
    };
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const previewMutation = trpc.inventoryImport.preview.useMutation({
    onSuccess: (res) => {
      setPreview(res);
      setLastImport(null);
      if (res.validRows.length === 0) {
        toast.error("No valid rows found — check headers (title or make+model required, price mandatory).");
      } else {
        toast.success(
          `${res.validRows.length} vehicle${res.validRows.length === 1 ? "" : "s"} ready to import`,
        );
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const commitMutation = trpc.inventoryImport.commit.useMutation({
    onSuccess: (res) => {
      setImportProgress(100);
      setTimeout(() => setImportProgress(null), 800);
      setLastImport({
        created: res.created,
        repaired: res.repaired ?? 0,
        failed: res.failedRows ?? [],
      });
      utils.dealer.listVehicles.invalidate();
      utils.showroom.list.invalidate();
      utils.inventoryImport.suspiciousPriceCount.invalidate();
      utils.agent.feed.invalidate();
      const parts = [];
      if (res.created > 0) {
        parts.push(`Imported ${res.created} vehicle${res.created === 1 ? "" : "s"}`);
      }
      if (res.repaired && res.repaired > 0) {
        parts.push(`updated ${res.repaired} price${res.repaired === 1 ? "" : "s"}`);
      }
      toast.success(
        parts.length > 0 ? parts.join(" · ") + "." : "No new vehicles to import.",
      );
      if (res.created > 0) {
        setCsv("");
        setFileName(null);
        setPreview(null);
      }
    },
    onError: (e) => {
      setImportProgress(null);
      toast.error(e.message);
    },
  });

  const handleImport = () => {
    setImportProgress(5);
    commitMutation.mutate(
      { csv, skipPhotoMirror: !mirrorPhotos },
      {
        onSettled: () => {
          if (!commitMutation.isSuccess) setImportProgress(null);
        },
      },
    );
    const id = setInterval(() => {
      setImportProgress((p) => (p === null || p >= 90 ? p : p + 4));
    }, 350);
    setTimeout(() => clearInterval(id), 120_000);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grayarx-inventory-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isImporting = commitMutation.isPending || importProgress !== null;

  return (
    <DealerShell
      title="Import Inventory CSV"
      subtitle="Drag a file from AutoTrader, Cars.co.za, or your DMS. Stock feeds your showroom instantly."
    >
      <AnimatePresence>
        {isImporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
          >
            <div className="w-full max-w-md mx-4 rounded-2xl border border-primary/20 bg-card p-8 shadow-2xl">
              <LoadingSpinner
                text={`Importing ${preview?.validRows.length ?? ""} vehicles…`}
                size="lg"
              />
              <div className="mt-6">
                <ProgressBar
                  progress={importProgress ?? 5}
                  label="Processing inventory"
                  animated
                />
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Large files may take a minute. Don&apos;t close this tab.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Required:</strong>{" "}
          <span className="font-mono text-foreground">title</span> (or{" "}
          <span className="font-mono">make + model</span>) and a valid{" "}
          <span className="font-mono">price</span>. Re-importing the same file updates any vehicles that were missing prices.
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileUp className="h-4 w-4 text-primary" />
              Upload CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all duration-300",
                dragOver
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-primary/25 hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              <Upload className="h-10 w-10 text-primary/70 mb-3" />
              <p className="text-sm font-medium text-foreground">
                Drop your CSV here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {fileName ?? "Supports .csv up to 5 MB — 500+ vehicles OK"}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or paste</span>
              </div>
            </div>

            <Textarea
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value);
                setFileName(null);
                setPreview(null);
              }}
              placeholder={SAMPLE}
              className="h-48 font-mono text-xs"
            />

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download template
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCsv(SAMPLE);
                  setFileName("sample.csv");
                  setPreview(null);
                }}
                disabled={previewMutation.isPending || isImporting}
              >
                Load sample
              </Button>
              <Button
                type="button"
                onClick={() => previewMutation.mutate({ csv })}
                disabled={!csv.trim() || previewMutation.isPending || isImporting}
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing…
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Headers we recognise: title, make, model, year, price/price_zar, km/mileage_km, fuel,
              transmission, location, image/photos (use <strong>|</strong> for multiple angles — aim for 8+),
              stock/vin/ref.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview & import</CardTitle>
          </CardHeader>
          <CardContent>
            {previewMutation.isPending ? (
              <div className="py-12">
                <LoadingSpinner text="Analysing your CSV…" />
              </div>
            ) : !preview ? (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                <Upload className="mb-3 h-8 w-8 text-muted-foreground/60" />
                Upload or paste a CSV, then click <span className="px-1 text-foreground">Preview</span>.
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Total rows" value={preview.totalRows} />
                  <Stat label="Valid" value={preview.validRows.length} tone="good" />
                  <Stat
                    label="Skipped"
                    value={preview.skippedRows.length + preview.duplicateRefs.length}
                    tone={
                      preview.skippedRows.length + preview.duplicateRefs.length > 0
                        ? "warn"
                        : "neutral"
                    }
                  />
                </div>

                {preview.photoSummary && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm space-y-2">
                    <p className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      Photography quality — avg {preview.photoSummary.avgScore}/100 (
                      {photoQualityLabel(preview.photoSummary.avgScore)})
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      {preview.photoSummary.rowsWithoutPhotos > 0 && (
                        <li>{preview.photoSummary.rowsWithoutPhotos} row(s) missing photos</li>
                      )}
                      {preview.photoSummary.rowsBelowRecommended > 0 && (
                        <li>
                          {preview.photoSummary.rowsBelowRecommended} listing(s) below 8-photo luxury
                          standard
                        </li>
                      )}
                      {preview.photoSummary.rowsWithoutPhotos === 0 &&
                        preview.photoSummary.rowsBelowRecommended === 0 && (
                          <li>Photo coverage meets GrayArx showroom standards.</li>
                        )}
                    </ul>
                  </div>
                )}

                {preview.validRows.length > 0 && (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Will import ({preview.validRows.length})
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                      {preview.validRows.slice(0, 20).map((r, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.25 }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors"
                        >
                          <div className="w-14 h-10 rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                            <img
                              src={r.imageUrl || PLACEHOLDER_IMG}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG;
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {r.title}
                            </div>
                            {typeof r.photoScore === "number" && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                Photo score: {r.photoScore}/100
                                {r.imageUrls && r.imageUrls.length > 1
                                  ? ` · ${r.imageUrls.length} angles`
                                  : ""}
                              </div>
                            )}
                            {r.photoWarnings && r.photoWarnings.length > 0 && (
                              <p className="text-[10px] text-amber-500/90 mt-0.5 truncate">
                                {r.photoWarnings[0]}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                              {r.year && (
                                <span className="flex items-center gap-0.5">
                                  <Car className="h-2.5 w-2.5" />
                                  {r.year}
                                </span>
                              )}
                              {r.km != null && (
                                <span className="flex items-center gap-0.5">
                                  <Gauge className="h-2.5 w-2.5" />
                                  {(r.km / 1000).toFixed(0)}k km
                                </span>
                              )}
                              {r.fuel && (
                                <span className="flex items-center gap-0.5">
                                  <Fuel className="h-2.5 w-2.5" />
                                  {r.fuel}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 text-sm font-semibold ${isSuspiciousPrice(r.price) ? "text-amber-400" : "text-primary"}`}
                          >
                            {formatVehiclePrice(r.price)}
                          </span>
                        </motion.div>
                      ))}
                      {preview.validRows.length > 20 && (
                        <div className="px-4 py-2.5 text-xs text-muted-foreground text-center">
                          + {preview.validRows.length - 20} more vehicles
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(preview.skippedRows.length > 0 || preview.duplicateRefs.length > 0) && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200 max-h-40 overflow-y-auto">
                    <div className="mb-1 flex items-center gap-2 font-semibold sticky top-0">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Skipped rows ({preview.skippedRows.length + preview.duplicateRefs.length})
                    </div>
                    <ul className="ml-4 list-disc space-y-0.5">
                      {preview.skippedRows.slice(0, 8).map((s) => (
                        <li key={s.index}>
                          Row {s.index}: {s.reason}
                        </li>
                      ))}
                      {preview.duplicateRefs.length > 0 && (
                        <li>{preview.duplicateRefs.length} duplicate stock ref(s) in file</li>
                      )}
                    </ul>
                  </div>
                )}

                {preview.validRows.length > 0 && (
                  <>
                    <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-muted/20 px-4 py-3">
                      <div>
                        <Label htmlFor="mirror-photos" className="text-sm font-medium">
                          Save photos to GrayArx
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Recommended — copies AutoTrader/Cars.co.za images so links never break
                        </p>
                      </div>
                      <Switch
                        id="mirror-photos"
                        checked={mirrorPhotos}
                        onCheckedChange={setMirrorPhotos}
                      />
                    </div>
                    <Button
                      className="w-full btn-gold h-12"
                      onClick={handleImport}
                      disabled={isImporting}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Import {preview.validRows.length} vehicle
                      {preview.validRows.length === 1 ? "" : "s"}
                      {mirrorPhotos ? " + save photos" : ""}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      After import, open{" "}
                      <Link href="/dealer/csv-photo" className="text-primary underline">
                        Photo manager
                      </Link>{" "}
                      to fix any missing angles.
                    </p>
                  </>
                )}

                {lastImport && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm"
                  >
                    <p className="text-green-300 font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {lastImport.created > 0 &&
                        `${lastImport.created} vehicle${lastImport.created === 1 ? "" : "s"} imported`}
                      {lastImport.created > 0 && lastImport.repaired > 0 && " · "}
                      {lastImport.repaired > 0 &&
                        `${lastImport.repaired} price${lastImport.repaired === 1 ? "" : "s"} updated`}
                      {lastImport.created === 0 && lastImport.repaired === 0 && "Import complete"}
                    </p>
                    {lastImport.failed.length > 0 && (
                      <ul className="mt-2 text-xs text-amber-200 list-disc ml-4">
                        {lastImport.failed.slice(0, 5).map((f, i) => (
                          <li key={i}>
                            {f.title}: {f.reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </DealerShell>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-green-300"
      : tone === "warn"
        ? "text-amber-300"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
