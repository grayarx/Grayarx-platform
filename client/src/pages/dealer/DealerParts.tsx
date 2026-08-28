import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileUp,
  Package,
  Plus,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SAMPLE = `sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier
OA-OF-POLO,03C115561H,Oil filter,Volkswagen Polo|Hyundai i20,Volkswagen,Polo,2018,2024,95,189,24,Local OEM
BR-PAD-HILUX,04465-0K290,Front brake pads — Hilux GD-6,Toyota Hilux,Toyota,Hilux,2016,2024,780,1450,8,`;

const TEMPLATE_CSV = `# GrayArx parts template
# Re-import any time — rows match on SKU for this dealership. fits is pipe-separated.
# Pricing: retailPrice as-is, OR costPrice × (1 + markup %). Rows with neither are skipped.
${SAMPLE}`;

type CatalogPart = {
  id: string;
  sku: string;
  oemNumber?: string;
  name: string;
  fits: string[];
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  retailPrice: number;
  qty: number;
  updatedAt: string;
};

type ImportResult = {
  imported: number;
  updated: number;
  skipped: Array<{ sku: string; reason: string }>;
  parts?: CatalogPart[];
};

type PartsPayload = {
  parts: CatalogPart[];
  lastImportAt?: string | null;
  csvTemplateFile?: string;
};

const EMPTY_FORM = {
  sku: "",
  name: "",
  oemNumber: "",
  make: "",
  model: "",
  yearFrom: "",
  yearTo: "",
  costPrice: "",
  retailPrice: "",
  qty: "1",
};

async function partsFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof body.error === "string" ? body.error : `Request failed (${res.status})`,
    );
  }
  return body;
}

function formatZar(n: number) {
  return `R${Number(n).toLocaleString("en-ZA")}`;
}

function fitmentLabel(p: CatalogPart) {
  if (p.fits?.length) return p.fits.join(", ");
  const years =
    p.yearFrom || p.yearTo
      ? ` ${p.yearFrom ?? "…"}–${p.yearTo ?? "…"}`
      : "";
  const mm = [p.make, p.model].filter(Boolean).join(" ");
  return `${mm}${years}`.trim() || "—";
}

export default function DealerPartsPage() {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [lastImportAt, setLastImportAt] = useState<string | null>(null);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const [template, setTemplate] = useState(TEMPLATE_CSV);
  const [form, setForm] = useState(EMPTY_FORM);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadCatalog = useCallback(async () => {
    const data = (await partsFetch("/api/parts")) as PartsPayload;
    setParts(Array.isArray(data.parts) ? data.parts : []);
    setLastImportAt(data.lastImportAt ?? null);
    if (typeof data.csvTemplateFile === "string" && data.csvTemplateFile.trim()) {
      setTemplate(data.csvTemplateFile);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadCatalog()
      .catch((e: Error) => toast.error(e.message || "Could not load parts catalog"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadCatalog]);

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
      setCsv(String(reader.result ?? ""));
      setFileName(file.name);
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

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grayarx-parts-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!csv.trim()) {
      toast.error("Upload or paste a CSV first");
      return;
    }
    setImporting(true);
    try {
      const res = (await partsFetch("/api/parts", {
        method: "POST",
        body: JSON.stringify({ action: "import_csv", csv }),
      })) as ImportResult;
      setLastImport(res);
      setParts(res.parts ?? []);
      await loadCatalog();
      const bits = [
        res.imported > 0 ? `${res.imported} imported` : "",
        res.updated > 0 ? `${res.updated} updated` : "",
        res.skipped.length > 0 ? `${res.skipped.length} skipped` : "",
      ].filter(Boolean);
      if (res.imported + res.updated > 0) {
        toast.success(bits.join(" · ") || "Import complete");
        setCsv("");
        setFileName(null);
      } else if (res.skipped.length > 0) {
        toast.error("Nothing imported — see skipped rows below");
      } else {
        toast.message("Nothing to import");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleAddOne = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error("SKU and name are required");
      return;
    }
    setAdding(true);
    try {
      const res = (await partsFetch("/api/parts", {
        method: "POST",
        body: JSON.stringify({
          action: "add_one",
          sku: form.sku.trim(),
          name: form.name.trim(),
          oemNumber: form.oemNumber.trim() || undefined,
          make: form.make.trim() || undefined,
          model: form.model.trim() || undefined,
          yearFrom: form.yearFrom ? Number(form.yearFrom) : undefined,
          yearTo: form.yearTo ? Number(form.yearTo) : undefined,
          costPrice: form.costPrice ? Number(form.costPrice) : undefined,
          retailPrice: form.retailPrice ? Number(form.retailPrice) : undefined,
          qty: form.qty ? Number(form.qty) : 0,
          fits:
            form.make.trim() && form.model.trim()
              ? `${form.make.trim()} ${form.model.trim()}`
              : undefined,
        }),
      })) as ImportResult;
      setLastImport(res);
      if (res.skipped.length && res.imported + res.updated === 0) {
        toast.error(res.skipped[0]?.reason || "Could not add that part");
      } else {
        toast.success(res.updated ? "Part updated" : "Part added");
        setForm(EMPTY_FORM);
        await loadCatalog();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add part");
    } finally {
      setAdding(false);
    }
  };

  const empty = !loading && parts.length === 0;

  return (
    <DealerShell
      title="Parts"
      subtitle="Same idea as vehicle CSV — import your SKUs and prices. Nala quotes only what is on this list."
    >
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Required:</strong>{" "}
          <span className="font-mono text-foreground">sku</span> +{" "}
          <span className="font-mono text-foreground">name</span> and either{" "}
          <span className="font-mono">retailPrice</span> or{" "}
          <span className="font-mono">costPrice</span> (we mark up cost). GrayArx never
          invents a parts price. Re-importing the same SKU updates qty and price.
          {lastImportAt ? (
            <span className="block mt-1">
              Last import:{" "}
              <span className="text-foreground">
                {new Date(lastImportAt).toLocaleString("en-ZA")}
              </span>
            </span>
          ) : (
            <span className="block mt-1">No catalog imported yet for this yard.</span>
          )}
        </CardContent>
      </Card>

      {empty && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 text-sm text-amber-200">
          <p className="font-semibold flex items-center gap-2 text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            Nala cannot quote parts yet
          </p>
          <p className="mt-1 text-amber-200/90">
            There is no catalogue for this dealership. WhatsApp buyers who ask for a
            filter, pads, or a battery will be told the parts desk still needs SKUs
            and prices — we will not pretend stock exists. Upload a CSV or add one
            part below.
          </p>
        </div>
      )}

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
                Drop your parts CSV here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {fileName ?? "Supports .csv up to 5 MB"}
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
                setLastImport(null);
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
                  setLastImport(null);
                }}
                disabled={importing}
              >
                Load sample
              </Button>
              <Button
                type="button"
                className="btn-gold"
                onClick={handleImport}
                disabled={!csv.trim() || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Import CSV
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Headers: sku, oemNumber, name, fits (use <strong>|</strong> for several
              vehicles), make, model, yearFrom, yearTo, costPrice, retailPrice, qty,
              supplier.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-primary" />
              Add one part
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleAddOne}>
              <p className="text-xs text-muted-foreground">
                Small yard, no Excel — add a single SKU. Same pricing rules as CSV.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="part-sku">SKU</Label>
                  <Input
                    id="part-sku"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="BR-PAD-HILUX"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="part-oem">OEM number</Label>
                  <Input
                    id="part-oem"
                    value={form.oemNumber}
                    onChange={(e) => setForm((f) => ({ ...f, oemNumber: e.target.value }))}
                    placeholder="04465-0K290"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="part-name">Name</Label>
                <Input
                  id="part-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Front brake pads — Hilux GD-6"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="part-make">Make</Label>
                  <Input
                    id="part-make"
                    value={form.make}
                    onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                    placeholder="Toyota"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="part-model">Model</Label>
                  <Input
                    id="part-model"
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    placeholder="Hilux"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="part-year-from">Year from</Label>
                  <Input
                    id="part-year-from"
                    inputMode="numeric"
                    value={form.yearFrom}
                    onChange={(e) => setForm((f) => ({ ...f, yearFrom: e.target.value }))}
                    placeholder="2016"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="part-year-to">Year to</Label>
                  <Input
                    id="part-year-to"
                    inputMode="numeric"
                    value={form.yearTo}
                    onChange={(e) => setForm((f) => ({ ...f, yearTo: e.target.value }))}
                    placeholder="2024"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="part-cost">Cost</Label>
                  <Input
                    id="part-cost"
                    inputMode="decimal"
                    value={form.costPrice}
                    onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                    placeholder="780"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="part-retail">Retail</Label>
                  <Input
                    id="part-retail"
                    inputMode="decimal"
                    value={form.retailPrice}
                    onChange={(e) => setForm((f) => ({ ...f, retailPrice: e.target.value }))}
                    placeholder="1450"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="part-qty">Qty</Label>
                  <Input
                    id="part-qty"
                    inputMode="numeric"
                    value={form.qty}
                    onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                    placeholder="8"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full btn-gold" disabled={adding}>
                {adding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Save part
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {lastImport && (
        <Card className="mt-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Import results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Imported" value={lastImport.imported} tone="good" />
              <Stat label="Updated" value={lastImport.updated} tone="good" />
              <Stat
                label="Skipped"
                value={lastImport.skipped.length}
                tone={lastImport.skipped.length > 0 ? "error" : "neutral"}
              />
            </div>
            {lastImport.skipped.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200 max-h-48 overflow-y-auto">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Skipped rows ({lastImport.skipped.length}) — not a silent failure
                </div>
                <ul className="ml-4 list-disc space-y-0.5">
                  {lastImport.skipped.slice(0, 40).map((s, i) => (
                    <li key={`${s.sku}-${i}`}>
                      {s.sku}: {s.reason}
                    </li>
                  ))}
                  {lastImport.skipped.length > 40 && (
                    <li>+ {lastImport.skipped.length - 40} more</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" />
            Current catalog
            <span className="text-xs font-normal text-muted-foreground">
              {parts.length} SKU{parts.length === 1 ? "" : "s"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading catalog…
            </div>
          ) : parts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Empty — import SKUs so Nala can quote this yard’s prices on WhatsApp.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold">SKU</th>
                    <th className="text-left px-3 py-2.5 font-semibold">Name</th>
                    <th className="text-left px-3 py-2.5 font-semibold">Fitment</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Qty</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Retail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {parts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">
                        {p.sku}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground">{p.name}</div>
                        {p.oemNumber ? (
                          <div className="text-[11px] text-muted-foreground">
                            OEM {p.oemNumber}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs">
                        {fitmentLabel(p)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{p.qty}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-primary whitespace-nowrap">
                        {formatZar(p.retailPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
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
  tone?: "neutral" | "good" | "error";
}) {
  const toneClass =
    tone === "good"
      ? "text-green-300"
      : tone === "error"
        ? "text-red-400"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
