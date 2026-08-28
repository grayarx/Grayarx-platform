import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  dealershipName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  region: string;
  monthlyVolume: string;
  vehicleTypes: string[];
  languages: string[];
  deploymentType: "web" | "whatsapp" | "both";
  inventoryFile?: File;
  notes: string;
  agreeToTerms: boolean;
}

const REGIONS = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Free State",
];

const VEHICLE_TYPES = [
  { id: "sedan", label: "Sedans" },
  { id: "suv", label: "SUVs" },
  { id: "bakkie", label: "Bakkies" },
  { id: "hatchback", label: "Hatchbacks" },
  { id: "mpv", label: "MPVs" },
  { id: "luxury", label: "Luxury" },
  { id: "commercial", label: "Commercial" },
];

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "af", label: "Afrikaans" },
  { id: "zu", label: "Zulu" },
  { id: "xh", label: "Xhosa" },
  { id: "st", label: "Sotho" },
  { id: "tn", label: "Tswana" },
  { id: "nd", label: "Ndebele" },
];

/**
 * Dealership Onboarding Form
 * Streamlined form for pilot signup
 * Supports file upload for inventory CSV
 */
export function DealershipOnboardingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<FormData>({
    dealershipName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    region: "",
    monthlyVolume: "",
    vehicleTypes: [],
    languages: ["en"],
    deploymentType: "both",
    notes: "",
    agreeToTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fileSelected, setFileSelected] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVehicleTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type) ? prev.vehicleTypes.filter((t) => t !== type) : [...prev.vehicleTypes, type],
    }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang],
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        inventoryFile: file,
      }));
      setFileSelected(file.name);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.dealershipName.trim()) {
      toast.error("Dealership name is required");
      return false;
    }
    if (!formData.ownerName.trim()) {
      toast.error("Owner name is required");
      return false;
    }
    if (!formData.ownerEmail.includes("@")) {
      toast.error("Valid email is required");
      return false;
    }
    if (!formData.ownerPhone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    if (!formData.region) {
      toast.error("Region is required");
      return false;
    }
    if (!formData.monthlyVolume) {
      toast.error("Monthly vehicle volume is required");
      return false;
    }
    if (formData.vehicleTypes.length === 0) {
      toast.error("Select at least one vehicle type");
      return false;
    }
    if (!formData.agreeToTerms) {
      toast.error("You must agree to the terms");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate form submission
      // In production, this would call the backend API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitted(true);
      toast.success("Application submitted! We'll be in touch within 2 hours.");

      if (onSuccess) {
        onSuccess();
      }

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          dealershipName: "",
          ownerName: "",
          ownerEmail: "",
          ownerPhone: "",
          region: "",
          monthlyVolume: "",
          vehicleTypes: [],
          languages: ["en"],
          deploymentType: "both",
          notes: "",
          agreeToTerms: false,
        });
        setSubmitted(false);
        setFileSelected(null);
      }, 3000);
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-500 bg-green-50">
        <CardContent className="pt-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">Application Submitted!</h3>
          <p className="text-green-700 mb-4">We'll review your application and contact you within 2 hours.</p>
          <p className="text-sm text-green-600">Check your email for updates: {formData.ownerEmail}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Join the GrayArx Pilot</CardTitle>
        <CardDescription>Get 30 days free access to our customer engagement platform. Only 5 spots available.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dealership Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Dealership Information</h3>

            <div>
              <label className="text-sm font-medium">Dealership Name *</label>
              <Input
                placeholder="e.g., Prestige Motors"
                value={formData.dealershipName}
                onChange={(e) => handleInputChange("dealershipName", e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Owner Name *</label>
                <Input
                  placeholder="Your full name"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange("ownerName", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.ownerEmail}
                  onChange={(e) => handleInputChange("ownerEmail", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone Number *</label>
                <Input
                  placeholder="+27 123 456 7890"
                  value={formData.ownerPhone}
                  onChange={(e) => handleInputChange("ownerPhone", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Region *</label>
                <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Business Details</h3>

            <div>
              <label className="text-sm font-medium">Monthly Vehicle Volume *</label>
              <Select value={formData.monthlyVolume} onValueChange={(value) => handleInputChange("monthlyVolume", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select volume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-10">5-10 vehicles</SelectItem>
                  <SelectItem value="10-20">10-20 vehicles</SelectItem>
                  <SelectItem value="20-50">20-50 vehicles</SelectItem>
                  <SelectItem value="50-100">50-100 vehicles</SelectItem>
                  <SelectItem value="100+">100+ vehicles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Vehicle Types You Sell *</label>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPES.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={formData.vehicleTypes.includes(type.id)}
                      onCheckedChange={() => handleVehicleTypeToggle(type.id)}
                    />
                    <label htmlFor={type.id} className="text-sm cursor-pointer">
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Setup */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Platform Setup</h3>

            <div>
              <label className="text-sm font-medium mb-3 block">Deployment Option</label>
              <Select value={formData.deploymentType} onValueChange={(value: any) => handleInputChange("deploymentType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web Chatbot Only</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp Chatbot Only</SelectItem>
                  <SelectItem value="both">Web + WhatsApp (Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Languages for Chatbot</label>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <div key={lang.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={lang.id}
                      checked={formData.languages.includes(lang.id)}
                      onCheckedChange={() => handleLanguageToggle(lang.id)}
                    />
                    <label htmlFor={lang.id} className="text-sm cursor-pointer">
                      {lang.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Upload */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Inventory (Optional)</h3>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Upload a CSV file with your current inventory. We'll set it up for you during onboarding.</AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition">
              <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="inventory-file" />
              <label htmlFor="inventory-file" className="cursor-pointer block">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium">Click to upload inventory CSV</p>
                <p className="text-xs text-slate-500">or drag and drop</p>
                {fileSelected && <p className="text-xs text-green-600 mt-2">✓ {fileSelected}</p>}
              </label>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Additional Information</h3>

            <div>
              <label className="text-sm font-medium">Anything else we should know?</label>
              <Textarea
                placeholder="Tell us about your dealership, goals, or any specific requirements..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="mt-1 h-24"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked)}
            />
            <label htmlFor="terms" className="text-sm text-slate-600">
              I agree to the terms and conditions and understand that this is a 14-day free Pilot of Nala Dealership OS.
            </label>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Apply for Pilot Access"
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">We'll review your application and contact you within 2 hours.</p>
        </form>
      </CardContent>
    </Card>
  );
}

export default DealershipOnboardingForm;
