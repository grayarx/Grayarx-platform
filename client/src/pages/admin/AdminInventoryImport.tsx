import AdminShell from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function AdminInventoryImport() {
  return (
    <AdminShell
      title="Inventory import"
      subtitle="Import stock CSVs on behalf of any dealership. Photos are auto-downloaded from AutoTrader / Cars.co.za and stored in S3."
    >
      <Card className="card-premium">
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Open a dealership from{" "}
            <a href="/admin/dealerships" className="text-primary hover:underline">
              Dealerships
            </a>{" "}
            to import their stock CSV. Each import dedupes against existing inventory.
          </p>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
