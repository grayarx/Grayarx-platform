import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Loader2 } from "lucide-react";

const onboardingSchema = z.object({
  dealershipName: z.string().min(2, "Dealership name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  ownerEmail: z.string().email("Valid email required"),
  ownerPhone: z.string().min(10, "Valid phone number required"),
  region: z.string().optional(),
  staffCount: z.coerce.number().min(1).default(5),
  monthlyVolume: z.coerce.number().optional(),
  vehicleTypes: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  csvUrl: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["card", "bank_transfer"]).default("card"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Type assertion to fix react-hook-form control type inference
type FormDataWithControl = OnboardingFormData & { control?: any };

const VEHICLE_TYPES = ["Sedan", "SUV", "Bakkie", "Hatchback", "Coupe", "MPV", "Van", "Truck"];
const LANGUAGES = ["English", "Afrikaans", "Zulu", "Xhosa", "Sotho", "Tswana"];

export function DealershipOnboarding() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [step, setStep] = useState<"business" | "agents" | "payment" | "complete">("business");
  const [staffCount, setStaffCount] = useState(5);

  const calculateTier = (staff: number) => {
    if (staff <= 5) return "starter";
    if (staff <= 15) return "professional";
    return "enterprise";
  };

  const currentTier = calculateTier(staffCount);
  const tierPricing = {
    starter: { base: 1500, desc: "1-5 sales staff" },
    professional: { base: 3500, desc: "6-15 sales staff" },
    enterprise: { base: 7500, desc: "15+ sales staff" },
  };

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      dealershipName: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      region: "",
      monthlyVolume: undefined,
      vehicleTypes: [],
      languages: [],
      csvUrl: "",
      notes: "",
    },
  });

  const submitOnboarding = trpc.marketplace.submitOnboarding.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();
      setSelectedVehicles([]);
      setSelectedLanguages([]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
      await submitOnboarding.mutateAsync({
        ...data,
        vehicleTypes: selectedVehicles.length > 0 ? selectedVehicles : undefined,
        languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleVehicleType = (type: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-border shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
            <CardTitle className="text-3xl">Join GrayArx Marketplace</CardTitle>
            <CardDescription className="text-base mt-2">
              Apply to become a dealership partner and access our unified showroom platform
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dealership Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Dealership Information</h3>

                  <FormField
                    control={form.control as any}
                    name="dealershipName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dealership Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Premium Motors SA"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner/Manager Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Full name"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <FormField
                    control={form.control as any}
                    name="ownerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+27 123 456 7890"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control as any}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="owner@dealership.co.za"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
            control={form.control as any}
            name="staffCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Sales Staff: <span className="font-bold text-blue-600">{staffCount}</span></FormLabel>
                        <FormControl>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={staffCount}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setStaffCount(val);
                              field.onChange(val);
                            }}
                            className="w-full"
                          />
                        </FormControl>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{currentTier.toUpperCase()}</Badge>
                          <span className="text-sm text-slate-600">{tierPricing[currentTier as keyof typeof tierPricing].desc}</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
            control={form.control as any}
            name="vehicleTypes"               render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region/Province</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Gauteng, Western Cape"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Where your dealership is located
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Business Details</h3>

          <FormField
            control={form.control as any}
            name="monthlyVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Sales Volume</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 50"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Approximate number of vehicles sold per month
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel className="mb-3 block">Vehicle Types You Sell</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {VEHICLE_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedVehicles.includes(type)}
                            onCheckedChange={() => toggleVehicleType(type)}
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor={type}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FormLabel className="mb-3 block">Languages Supported</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {LANGUAGES.map((lang) => (
                        <div key={lang} className="flex items-center space-x-2">
                          <Checkbox
                            id={lang}
                            checked={selectedLanguages.includes(lang)}
                            onCheckedChange={() => toggleLanguage(lang)}
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor={lang}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {lang}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>

          <FormField
            control={form.control as any}
            name="csvUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory CSV URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/inventory.csv"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to your vehicle inventory CSV file for bulk upload
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

          <FormField
            control={form.control as any}
            name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your dealership, any special requirements, or questions..."
                            className="resize-none"
                            rows={4}
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={isSubmitting || submitOnboarding.isPending}
                  >
                    {isSubmitting || submitOnboarding.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                  <p className="text-sm text-blue-900">
                    <strong>Pricing:</strong> Your {currentTier} plan starts at R{tierPricing[currentTier as keyof typeof tierPricing].base.toLocaleString()}/month, plus per-lead and per-booking charges based on performance.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  We'll review your application within 24 hours and contact you via email.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
