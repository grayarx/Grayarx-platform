import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export function AdminBilling() {
  const [selectedDealership, setSelectedDealership] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional" | "enterprise">("starter");
  const [customPrice, setCustomPrice] = useState<string>("");

  // Fetch all dealerships
  const { data: dealerships, isLoading: loadingDealerships } = trpc.adminDealerships.list.useQuery();

  // Fetch pricing tiers
  const { data: pricingTiers } = trpc.billing.getPricingTiers.useQuery(undefined);

  // Create subscription mutation
  const createSubscription = trpc.billing.createSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription created successfully");
      setSelectedDealership(null);
      setSelectedPlan("starter");
      setCustomPrice("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Generate invoice mutation
  const generateInvoice = trpc.billing.generateInvoice.useMutation({
    onSuccess: (invoice) => {
      toast.success(`Invoice ${invoice.invoiceNumber} generated`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Record payment mutation
  const recordPayment = trpc.billing.recordBankTransfer.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateSubscription = () => {
    if (!selectedDealership) {
      toast.error("Please select a dealership");
      return;
    }

    const monthlyPrice =
      selectedPlan === "enterprise" && customPrice
        ? parseFloat(customPrice)
        : undefined;

    createSubscription.mutate({
      dealershipId: selectedDealership,
      plan: selectedPlan,
      monthlyPriceZar: monthlyPrice,
    });
  };

  const handleGenerateInvoice = (dealershipId: number) => {
    generateInvoice.mutate({ dealershipId });
  };

  if (loadingDealerships) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Billing Management</h1>
        <p className="text-muted-foreground">Manage subscriptions and invoices for dealerships</p>
      </div>

      {/* Create Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Subscription</CardTitle>
          <CardDescription>Set up a new subscription for a dealership</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dealership">Dealership</Label>
            <Select value={selectedDealership?.toString() || ""} onValueChange={(v) => setSelectedDealership(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a dealership" />
              </SelectTrigger>
              <SelectContent>
                {dealerships?.map((d: any) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter - R{pricingTiers?.starter || 3500}/month</SelectItem>
                <SelectItem value="professional">Professional - R{pricingTiers?.professional || 8750}/month</SelectItem>
                <SelectItem value="enterprise">Enterprise - Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedPlan === "enterprise" && (
            <div className="space-y-2">
              <Label htmlFor="customPrice">Custom Monthly Price (ZAR)</Label>
              <Input
                id="customPrice"
                type="number"
                placeholder="e.g., 15000"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleCreateSubscription} disabled={createSubscription.isPending}>
            {createSubscription.isPending ? "Creating..." : "Create Subscription"}
          </Button>
        </CardContent>
      </Card>

      {/* Dealerships List */}
      <Card>
        <CardHeader>
          <CardTitle>Dealerships</CardTitle>
          <CardDescription>View and manage dealership subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealerships?.map((dealership: any) => (
                  <TableRow key={dealership.id}>
                    <TableCell className="font-medium">{dealership.name}</TableCell>
                    <TableCell className="capitalize">{dealership.plan}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {dealership.status}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateInvoice(dealership.id)}
                        disabled={generateInvoice.isPending}
                      >
                        Generate Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Tiers</CardTitle>
          <CardDescription>Current pricing structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Starter</h3>
              <p className="text-2xl font-bold text-gold">R{pricingTiers?.starter || 3500}</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Professional</h3>
              <p className="text-2xl font-bold text-gold">R{pricingTiers?.professional || 8750}</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Enterprise</h3>
              <p className="text-2xl font-bold text-gold">Custom</p>
              <p className="text-sm text-muted-foreground">Contact us</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
