import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
} from "lucide-react";

type Step = 1 | 2 | 3;

interface DealershipInfo {
  dealershipName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  vehicleTypes: string[];
  estimatedMonthlyLeads: number;
  languages: string[];
}

interface TeamMember {
  name: string;
  email: string;
  role: "owner" | "manager" | "consultant";
}

const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Truck",
  "Van",
  "Luxury",
  "Electric",
];
const LANGUAGES = ["English", "Afrikaans", "Zulu", "Xhosa", "Sotho"];
const PROVINCES = [
  "Western Cape",
  "Eastern Cape",
  "Northern Cape",
  "Free State",
  "KwaZulu-Natal",
  "Gauteng",
  "Limpopo",
  "Mpumalanga",
  "North West",
];

export default function OnboardingWizardNew() {
  const [step, setStep] = useState<Step>(1);
  const [dealershipId, setDealershipId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [savedDraft, setSavedDraft] = useState<any>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Step 1: Dealership Info
  const [dealershipInfo, setDealershipInfo] = useState<DealershipInfo>({
    dealershipName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    vehicleTypes: [],
    estimatedMonthlyLeads: 100,
    languages: ["English"],
  });

  // Step 2: Vehicle Import
  const [csvContent, setCsvContent] = useState("");
  const [vehiclePreview, setVehiclePreview] = useState<any>(null);

  // Step 3: Team Setup
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: "", email: "", role: "owner" },
  ]);

  // tRPC mutations
  const submitDealershipInfo = trpc.onboarding.submitDealershipInfo.useMutation();
  const validateVehicleCSV = trpc.onboarding.validateVehicleCSV.useQuery(
    {
      csvContent,
    },
    {
      enabled: false,
    }
  );
  const importVehicles = trpc.onboarding.importVehicles.useMutation();
  const addTeamMembers = trpc.onboarding.addTeamMembers.useMutation();
  const saveDraft = trpc.onboarding.saveDraft.useMutation();
  const loadDraft = trpc.onboarding.loadDraft.useQuery(
    { sessionId },
    { enabled: false }
  );
  const deleteDraft = trpc.onboarding.deleteDraft.useMutation();

  // Initialize session and check for draft on mount
  useEffect(() => {
    const storedSessionId =
      localStorage.getItem("onboarding_session_id") ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(storedSessionId);
    localStorage.setItem("onboarding_session_id", storedSessionId);

    // Check for saved draft
    checkForDraft(storedSessionId);
  }, []);

  // Auto-save on data changes (debounced)
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      if (sessionId && (dealershipInfo.dealershipName || csvContent || teamMembers.length > 0)) {
        performAutoSave();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [dealershipInfo, csvContent, teamMembers, step, sessionId]);

  // Check for existing draft
  const checkForDraft = async (sid: string) => {
    try {
      const result = await loadDraft.refetch();
      if (result.data) {
        setSavedDraft(result.data);
        setShowDraftRecovery(true);
      }
    } catch (err) {
      // No draft found, continue normally
    }
  };

  // Auto-save draft
  const performAutoSave = async () => {
    try {
      await saveDraft.mutateAsync({
        sessionId,
        step,
        dealershipInfo:
          step >= 1 && dealershipInfo.dealershipName ? dealershipInfo : undefined,
        vehicleData: step >= 2 && csvContent ? csvContent : undefined,
        teamMembers: step >= 3 && teamMembers.length > 0 ? teamMembers : undefined,
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000); // Show indicator for 3 seconds
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  };

  // Manual save draft
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await saveDraft.mutateAsync({
        sessionId,
        step,
        dealershipInfo:
          step >= 1 && dealershipInfo.dealershipName ? dealershipInfo : undefined,
        vehicleData: step >= 2 && csvContent ? csvContent : undefined,
        teamMembers: step >= 3 && teamMembers.length > 0 ? teamMembers : undefined,
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  // Resume from draft
  const handleResumeDraft = () => {
    if (savedDraft) {
      if (savedDraft.dealershipInfo) {
        setDealershipInfo(savedDraft.dealershipInfo);
      }
      if (savedDraft.vehicleData) {
        setCsvContent(savedDraft.vehicleData);
      }
      if (savedDraft.teamMembers) {
        setTeamMembers(savedDraft.teamMembers);
      }
      setStep(savedDraft.step || 1);
      setShowDraftRecovery(false);
    }
  };

  // Discard draft
  const handleDiscardDraft = async () => {
    try {
      await deleteDraft.mutateAsync({ sessionId });
      setSavedDraft(null);
      setShowDraftRecovery(false);
    } catch (err) {
      console.error("Failed to discard draft:", err);
    }
  };

  // Step 1: Submit dealership info
  const handleStep1Submit = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await submitDealershipInfo.mutateAsync(dealershipInfo);
      setDealershipId(result.submissionId);
      setStep(2);
      // Clear draft after successful submission
      await deleteDraft.mutateAsync({ sessionId });
    } catch (err: any) {
      setError(err.message || "Failed to save dealership info");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Preview vehicles
  const handlePreviewVehicles = async () => {
    if (!csvContent.trim()) {
      setError("Please paste CSV content");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await validateVehicleCSV.refetch();
      if (result.data) {
        setVehiclePreview(result.data);
        if (result.data.summary.errors > 0) {
          setError(`${result.data.summary.errors} rows have errors`);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to preview vehicles");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm import
  const handleConfirmImport = async () => {
    setLoading(true);
    setError("");

    try {
      await importVehicles.mutateAsync({
        submissionId: dealershipId,
        csvContent,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to import vehicles");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Add team members
  const handleAddTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      { name: "", email: "", role: "consultant" },
    ]);
  };

  const handleRemoveTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleTeamMemberChange = (
    index: number,
    field: keyof TeamMember,
    value: string
  ) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  // Step 3: Submit team
  const handleSubmitTeam = async () => {
    if (teamMembers.some((m) => !m.name || !m.email)) {
      setError("All team members must have name and email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addTeamMembers.mutateAsync({
        submissionId: dealershipId,
        teamMembers,
      });
      setSuccess(true);
      // Clear draft after successful completion
      await deleteDraft.mutateAsync({ sessionId });
      localStorage.removeItem("onboarding_session_id");
    } catch (err: any) {
      setError(err.message || "Failed to set up team");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (step / 3) * 100;

  // Draft recovery modal
  if (showDraftRecovery && savedDraft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-gold/20">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Resume Your Signup?
            </h2>
            <p className="text-slate-300 mb-6">
              We found a draft from{" "}
              {new Date(savedDraft.lastSavedAt).toLocaleDateString()}. You can
              resume from step {savedDraft.step} or start fresh.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleResumeDraft}
                className="w-full bg-gold hover:bg-gold/90 text-black"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resume Draft
              </Button>
              <Button
                onClick={handleDiscardDraft}
                variant="outline"
                className="w-full"
              >
                Start Fresh
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-gold/20">
          <div className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome to GrayArx!
            </h1>
            <p className="text-slate-300 mb-6">
              Your dealership is now set up and ready to go. Your team members
              have been sent invitation emails.
            </p>
            <Button
              onClick={() => (window.location.href = "/login")}
              className="w-full bg-gold hover:bg-gold/90 text-black"
            >
              Sign In to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to GrayArx
          </h1>
          <p className="text-slate-300">Set up your dealership in 3 easy steps</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-300">
              Step {step} of 3: {step === 1 && "Dealership Info"}
              {step === 2 && "Vehicle Import"}
              {step === 3 && "Team Setup"}
            </span>
            <span className="text-sm text-gold">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Draft Saved Indicator */}
        {draftSaved && (
          <Alert className="mb-6 border-green-500/50 bg-green-500/10">
            <Save className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              Draft saved successfully
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Dealership Info */}
        {step === 1 && (
          <Card className="bg-slate-800 border-gold/20 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-6">
              Dealership Information
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Dealership Name *</Label>
                <Input
                  value={dealershipInfo.dealershipName}
                  onChange={(e) =>
                    setDealershipInfo({
                      ...dealershipInfo,
                      dealershipName: e.target.value,
                    })
                  }
                  placeholder="e.g., Premium Motors"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Owner Name *</Label>
                <Input
                  value={dealershipInfo.ownerName}
                  onChange={(e) =>
                    setDealershipInfo({
                      ...dealershipInfo,
                      ownerName: e.target.value,
                    })
                  }
                  placeholder="e.g., John Smith"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Email *</Label>
                  <Input
                    type="email"
                    value={dealershipInfo.email}
                    onChange={(e) =>
                      setDealershipInfo({
                        ...dealershipInfo,
                        email: e.target.value,
                      })
                    }
                    placeholder="info@dealership.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Phone *</Label>
                  <Input
                    value={dealershipInfo.phone}
                    onChange={(e) =>
                      setDealershipInfo({
                        ...dealershipInfo,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+27 123 456 789"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Address *</Label>
                <Input
                  value={dealershipInfo.address}
                  onChange={(e) =>
                    setDealershipInfo({
                      ...dealershipInfo,
                      address: e.target.value,
                    })
                  }
                  placeholder="123 Main Street"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">City *</Label>
                  <Input
                    value={dealershipInfo.city}
                    onChange={(e) =>
                      setDealershipInfo({
                        ...dealershipInfo,
                        city: e.target.value,
                      })
                    }
                    placeholder="Johannesburg"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Province *</Label>
                  <select
                    value={dealershipInfo.province}
                    onChange={(e) =>
                      setDealershipInfo({
                        ...dealershipInfo,
                        province: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  >
                    <option value="">Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Vehicle Types *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={dealershipInfo.vehicleTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDealershipInfo({
                              ...dealershipInfo,
                              vehicleTypes: [
                                ...dealershipInfo.vehicleTypes,
                                type,
                              ],
                            });
                          } else {
                            setDealershipInfo({
                              ...dealershipInfo,
                              vehicleTypes: dealershipInfo.vehicleTypes.filter(
                                (v) => v !== type
                              ),
                            });
                          }
                        }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Estimated Monthly Leads *</Label>
                <Input
                  type="number"
                  min="1"
                  value={dealershipInfo.estimatedMonthlyLeads}
                  onChange={(e) =>
                    setDealershipInfo({
                      ...dealershipInfo,
                      estimatedMonthlyLeads: parseInt(e.target.value) || 1,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Languages *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((lang) => (
                    <label
                      key={lang}
                      className="flex items-center gap-2 text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={dealershipInfo.languages.includes(lang)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDealershipInfo({
                              ...dealershipInfo,
                              languages: [
                                ...dealershipInfo.languages,
                                lang,
                              ],
                            });
                          } else {
                            setDealershipInfo({
                              ...dealershipInfo,
                              languages: dealershipInfo.languages.filter(
                                (l) => l !== lang
                              ),
                            });
                          }
                        }}
                      />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleStep1Submit}
                disabled={loading}
                className="flex-1 bg-gold hover:bg-gold/90 text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue to Step 2"
                )}
              </Button>
              <Button
                onClick={handleSaveDraft}
                disabled={loading}
                variant="outline"
                className="px-4"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Vehicle Import */}
        {step === 2 && (
          <Card className="bg-slate-800 border-gold/20 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-6">Vehicle Import</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">
                  Paste CSV Content (make, model, year, price)
                </Label>
                <Textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="make,model,year,price&#10;Toyota,Corolla,2023,250000&#10;Honda,Civic,2022,280000"
                  className="bg-slate-700 border-slate-600 text-white h-32"
                />
              </div>

              {vehiclePreview && (
                <div className="bg-slate-700 p-4 rounded">
                  <p className="text-slate-300 text-sm">
                    Valid vehicles: {vehiclePreview.summary.valid} | Errors:{" "}
                    {vehiclePreview.summary.errors}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handlePreviewVehicles}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Previewing...
                  </>
                ) : (
                  "Preview"
                )}
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={loading || !vehiclePreview}
                className="flex-1 bg-gold hover:bg-gold/90 text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Continue to Step 3"
                )}
              </Button>
              <Button
                onClick={handleSaveDraft}
                disabled={loading}
                variant="outline"
                className="px-4"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={() => setStep(1)}
              variant="ghost"
              className="w-full mt-3 text-slate-400"
            >
              Back to Step 1
            </Button>
          </Card>
        )}

        {/* Step 3: Team Setup */}
        {step === 3 && (
          <Card className="bg-slate-800 border-gold/20 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-6">Team Setup</h2>

            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="border border-slate-600 p-4 rounded">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-slate-300 text-sm">Name</Label>
                      <Input
                        value={member.name}
                        onChange={(e) =>
                          handleTeamMemberChange(index, "name", e.target.value)
                        }
                        placeholder="John Doe"
                        className="bg-slate-700 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-sm">Email</Label>
                      <Input
                        type="email"
                        value={member.email}
                        onChange={(e) =>
                          handleTeamMemberChange(index, "email", e.target.value)
                        }
                        placeholder="john@dealership.com"
                        className="bg-slate-700 border-slate-600 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleTeamMemberChange(
                          index,
                          "role",
                          e.target.value as TeamMember["role"]
                        )
                      }
                      className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm"
                    >
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="consultant">Consultant</option>
                    </select>
                    {teamMembers.length > 1 && (
                      <Button
                        onClick={() => handleRemoveTeamMember(index)}
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleAddTeamMember}
              variant="outline"
              className="w-full mt-4"
            >
              + Add Team Member
            </Button>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSubmitTeam}
                disabled={loading}
                className="flex-1 bg-gold hover:bg-gold/90 text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
              <Button
                onClick={handleSaveDraft}
                disabled={loading}
                variant="outline"
                className="px-4"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={() => setStep(2)}
              variant="ghost"
              className="w-full mt-3 text-slate-400"
            >
              Back to Step 2
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
