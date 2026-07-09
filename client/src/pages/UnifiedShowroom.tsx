import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, MapPin, Gauge, Zap, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const MAKES = ["Toyota", "BMW", "Mercedes", "Volkswagen", "Ford", "Hyundai", "Kia", "Nissan", "Honda", "Audi"];
const BODY_TYPES = ["Sedan", "SUV", "Bakkie", "Hatchback", "Coupe", "MPV"];

export function UnifiedShowroom() {
  const [search, setSearch] = useState("");
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedBodyType, setSelectedBodyType] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [inquiryText, setInquiryText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Fetch vehicles with filters
  const { data: vehiclesData, isLoading: vehiclesLoading } = trpc.marketplace.getShowroomVehicles.useQuery(
    {
      search: search || undefined,
      make: selectedMake || undefined,
      bodyType: selectedBodyType || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      limit: 20,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const vehicles = vehiclesData || [];

  // Fetch vehicle detail when selected
  const { data: vehicleDetail } = trpc.marketplace.getVehicleDetail.useQuery(
    { vehicleId: selectedVehicleId || 0 },
    { enabled: selectedVehicleId !== null }
  );

  // Create inquiry mutation
  const createInquiry = trpc.marketplace.createInquiry.useMutation({
    onSuccess: (data) => {
      toast.success("Inquiry sent! We'll get back to you soon.");
      setInquiryText("");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setSelectedVehicleId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send inquiry");
    },
  });

  const handleSubmitInquiry = async () => {
    if (!selectedVehicleId || !inquiryText.trim()) {
      toast.error("Please provide an inquiry message");
      return;
    }

    await createInquiry.mutateAsync({
      dealershipId: 1, // TODO: Get from context
      vehicleId: selectedVehicleId,
      customerName: customerName || undefined,
      customerEmail: customerEmail || undefined,
      customerPhone: customerPhone || undefined,
      inquiryText,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">GrayArx Unified Showroom</h1>
          <p className="text-lg text-muted-foreground">
            Browse thousands of vehicles from trusted dealerships across South Africa
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-border">
          <CardHeader>
            <CardTitle className="text-xl">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Make, model, year..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Make</label>
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger>
                    <SelectValue placeholder="All makes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All makes</SelectItem>
                    {MAKES.map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Body Type</label>
                <Select value={selectedBodyType} onValueChange={setSelectedBodyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {BODY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Min Price (R)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minPrice || ""}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Max Price (R)</label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={maxPrice || ""}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {vehiclesLoading ? "Loading..." : `${vehicles.length} Vehicles Available`}
            </h2>
          </div>

          {vehiclesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : vehicles.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-lg">No vehicles found matching your criteria.</p>
                <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className="border-border hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                >
                  {/* Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                    <div className="text-center">
                      <Zap className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {vehicle.year} {vehicle.make}
                      </p>
                    </div>
                  </div>

                  <CardContent className="pt-4">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{vehicle.bodyType}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span>{vehicle.km?.toLocaleString() || "N/A"} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>{vehicle.fuel || "N/A"}</span>
                      </div>
                      {vehicle.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{vehicle.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">
                        R{Number(vehicle.price).toLocaleString()}
                      </span>
                      <Badge variant="outline">{vehicle.condition}</Badge>
                    </div>

                    {/* Quick Inquiry Dialog */}
                    <Dialog open={selectedVehicleId === vehicle.id} onOpenChange={(open) => {
                      if (!open) setSelectedVehicleId(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicleId(vehicle.id);
                        }}>
                          Send Inquiry
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            Inquire About {vehicle.year} {vehicle.make} {vehicle.model}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Your Name</label>
                            <Input
                              placeholder="John Doe"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Email Address</label>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Phone Number</label>
                            <Input
                              placeholder="+27 123 456 7890"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Your Question *</label>
                            <textarea
                              className="w-full px-3 py-2 border border-input rounded-md text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Ask about features, availability, test drive, etc."
                              rows={4}
                              value={inquiryText}
                              onChange={(e) => setInquiryText(e.target.value)}
                            />
                          </div>

                          <Button
                            className="w-full"
                            onClick={handleSubmitInquiry}
                            disabled={createInquiry.isPending}
                          >
                            {createInquiry.isPending ? "Sending..." : "Send Inquiry"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
