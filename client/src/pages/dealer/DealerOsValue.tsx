import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";

type ValuePayload = {
  value: {
    monthly: { gpLostZar: number; grayArxCostZar: number };
  };
  processes: Array<{ id: string; name: string }>;
};

export default function DealerOsValue() {
  const [data, setData] = useState<ValuePayload | null>(null);

  useEffect(() => {
    void fetch("/api/value")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const monthly = data?.value?.monthly;

  return (
    <AdminShell title="Yard value" subtitle="What after-hours leakage costs vs the GrayArx local fee.">
      {monthly && (
        <Card className="card-premium mb-6">
          <CardContent className="p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Monthly GP lost vs GrayArx</p>
            <p className="text-3xl font-display font-bold">
              R{monthly.gpLostZar.toLocaleString("en-ZA")} lost
            </p>
            <p className="text-sm">
              GrayArx costs R{monthly.grayArxCostZar.toLocaleString("en-ZA")} — keep the difference.
            </p>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data?.processes?.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <p className="font-medium">{p.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
