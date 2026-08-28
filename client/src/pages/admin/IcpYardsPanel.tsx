import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type RegionMeta = {
  id: string;
  name: string;
  currency: string;
  professional: string;
  count: number;
};

type IcpProspect = {
  id: string;
  name: string;
  city: string;
  location: string;
  regionId: string;
  score: number;
  segment: string;
  abilityToPay: string;
  stockHint: string;
  phone?: string;
  email?: string;
};

export default function IcpYardsPanel() {
  const [prospects, setProspects] = useState<IcpProspect[]>([]);
  const [regions, setRegions] = useState<RegionMeta[]>([]);
  const [totalSeeded, setTotalSeeded] = useState(0);
  const [regionFilter, setRegionFilter] = useState("ZA");
  const [highOnly, setHighOnly] = useState(true);
  const [csvText, setCsvText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (regionFilter) q.set("region", regionFilter);
    if (highOnly) q.set("highAbility", "1");
    const res = await fetch(`/api/prospector/prospects?${q}`);
    const data = (await res.json()) as {
      prospects: IcpProspect[];
      regions: RegionMeta[];
      totalSeeded: number;
    };
    setProspects(data.prospects ?? []);
    setRegions(data.regions ?? []);
    setTotalSeeded(data.totalSeeded ?? 0);
  }, [regionFilter, highOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  async function importCsv() {
    const res = await fetch("/api/prospector/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText }),
    });
    const data = (await res.json()) as { imported?: number; skipped?: unknown[]; error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "CSV import failed");
      return;
    }
    setImportMsg(`Imported ${data.imported ?? 0} yards${data.skipped?.length ? ` · skipped ${data.skipped.length}` : ""}`);
    toast.success(`Imported ${data.imported ?? 0} ICP yards`);
  }

  const regionPrice = regions.find((r) => r.id === regionFilter)?.professional;

  return (
    <section className="mb-10 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">ICP yards ({totalSeeded} seeded)</h2>
          <p className="text-sm text-muted-foreground">
            Filter ZA / AU / GB / AE / US / NZ. High-ability first. Paste phones from public listings, then Pilot → Monday proof → Professional
            {regionPrice ? ` (${regionPrice})` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            {["ZA", "AU", "GB", "AE", "US", "NZ"].map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <Button variant={highOnly ? "default" : "outline"} size="sm" onClick={() => setHighOnly((v) => !v)}>
            {highOnly ? "High ability" : "All ability"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/prospector/prospects?template=1">CSV template</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {prospects.slice(0, 24).map((p) => (
          <Card key={p.id} className="card-premium">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{p.name}</h3>
                <Badge variant="outline"> {p.score}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{p.location}</p>
              <p className="text-xs">{p.stockHint}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">{p.segment.replace(/_/g, " ")}</Badge>
                <Badge variant="secondary" className="text-[10px]">{p.abilityToPay}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {prospects.length > 24 && (
        <p className="text-xs text-muted-foreground">Showing 24 of {prospects.length} in this filter.</p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Import more yards (CSV)</p>
        <Textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="name,city,regionId,segment,abilityToPay,score,stockHint,phone,email,website,contactName,status"
          className="min-h-[90px] font-mono text-xs"
        />
        <Button size="sm" onClick={() => void importCsv()} disabled={!csvText.trim()}>
          Import CSV
        </Button>
        {importMsg && <p className="text-xs text-muted-foreground">{importMsg}</p>}
      </div>
    </section>
  );
}
