import AdminShell from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function AdminBilling() {
  return (
    <AdminShell
      title="Billing"
      subtitle="Subscription revenue across all dealerships. Stripe + manual invoicing."
    >
      <Card className="card-premium">
        <CardContent className="p-12 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold">Billing dashboard coming soon</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Stripe integration ships next. Until then, create and reconcile invoices on the
            Invoices page.
          </p>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
