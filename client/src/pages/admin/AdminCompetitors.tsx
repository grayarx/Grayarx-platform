import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";

type Competitor = {
  id: string;
  name: string;
  categoryLabel: string;
  pricing: string;
  oneLiner: string;
};

export default function AdminCompetitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [card, setCard] = useState<{ pricingContrast?: string } | null>(null);

  useEffect(() => {
    void fetch("/api/competitors")
      .then((r) => r.json())
      .then((j) => setCompetitors(j.competitors ?? []));
    void fetch("/api/competitors?q=" + encodeURIComponent("We use MotorX"))
      .then((r) => r.json())
      .then((j) => setCard(j.card ?? null));
  }, []);

  return (
    <AdminShell title="Competitors" subtitle="Battlecards aligned to live OS pricing (Professional R14,990).">
      {card?.pricingContrast && (
        <p className="text-sm mb-4 rounded-md border px-3 py-2">{card.pricingContrast}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {competitors.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-1">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground">{c.categoryLabel} · {c.pricing}</p>
              <p className="text-sm">{c.oneLiner}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
