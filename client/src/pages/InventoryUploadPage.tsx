import { useState, useRef } from "react";
import { Upload, Download, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  repairs: Array<{ row: number; action: string }>;
}

export default function InventoryUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "confirm">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = trpc.inventory.preview.useMutation();
  const commitMutation = trpc.inventory.commit.useMutation();
  const listQuery = trpc.inventory.list.useQuery({ limit: 50, offset: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setStep("preview");
    handlePreview(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      setStep("preview");
      handlePreview(droppedFile);
    } else {
      toast.error("Please drop a CSV file");
    }
  };

  const handlePreview = async (csvFile: File) => {
    setIsLoading(true);
    try {
      const text = await csvFile.text();
      const result = await previewMutation.mutateAsync({ csvContent: text });
      setParsedData(result as ParsedCSV);
      setStep("preview");
    } catch (error: any) {
      toast.error(error.message || "Failed to parse CSV");
      setStep("upload");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!parsedData || !file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const result = await commitMutation.mutateAsync({ csvContent: text });
      toast.success(`Successfully imported ${result.imported} vehicles`);
      setStep("upload");
      setFile(null);
      setParsedData(null);
      fileInputRef.current?.form?.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to import CSV");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Make,Model,Year,Price,Mileage,Color,Transmission,Fuel Type,VIN,Registration Number
Toyota,Fortuner,2022,450000,25000,Silver,Automatic,Diesel,WVWZZZ3CZ9E123456,GP 23-456789
BMW,X5,2021,650000,35000,Black,Automatic,Petrol,WBADT43452G123456,GP 21-789012`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Import Inventory</h1>
          <p className="text-slate-400">Upload your vehicle inventory via CSV file</p>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-4 mb-8">
          {["upload", "preview", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s
                    ? "bg-gold text-slate-900"
                    : step > s || ["upload", "preview", "confirm"].indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-sm font-medium text-slate-300 capitalize">{s}</span>
              {i < 2 && <div className="flex-1 h-0.5 bg-slate-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-gold transition-colors"
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Drag and drop your CSV file</h3>
              <p className="text-slate-400 mb-6">or click to browse</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gold hover:bg-gold/90 text-slate-900 font-semibold mb-6"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select CSV File
              </Button>

              <div className="flex gap-4 justify-center mt-8 pt-8 border-t border-slate-700">
                <div className="text-left">
                  <p className="text-sm text-slate-400 mb-2">Need help?</p>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* File Info */}
            {file && (
              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gold" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setParsedData(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Preview Step */}
        {step === "preview" && parsedData && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{parsedData.rows.length}</p>
                  <p className="text-sm text-slate-400">Total Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">{parsedData.repairs.length}</p>
                  <p className="text-sm text-slate-400">Auto-Repaired</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-500">{parsedData.warnings.length}</p>
                  <p className="text-sm text-slate-400">Warnings</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{parsedData.errors.length}</p>
                  <p className="text-sm text-slate-400">Errors</p>
                </div>
              </div>
            </Card>

            {/* Alerts */}
            {parsedData.repairs.length > 0 && (
              <Alert className="bg-green-900/20 border-green-700 text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {parsedData.repairs.length} rows were automatically repaired
                </AlertDescription>
              </Alert>
            )}

            {parsedData.warnings.length > 0 && (
              <Alert className="bg-yellow-900/20 border-yellow-700 text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {parsedData.warnings.length} rows have warnings - review before importing
                </AlertDescription>
              </Alert>
            )}

            {parsedData.errors.length > 0 && (
              <Alert className="bg-red-900/20 border-red-700 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {parsedData.errors.length} rows have errors and cannot be imported
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview Table */}
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">Row</th>
                      {parsedData.headers.map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-slate-300 font-medium">
                          {header}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.map((row, idx) => {
                      const error = parsedData.errors.find((e) => e.row === idx);
                      const warning = parsedData.warnings.find((w) => w.row === idx);
                      const repair = parsedData.repairs.find((r) => r.row === idx);

                      return (
                        <tr
                          key={idx}
                          className={`border-t border-slate-700 ${
                            error
                              ? "bg-red-900/10"
                              : warning
                              ? "bg-yellow-900/10"
                              : repair
                              ? "bg-green-900/10"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                          {parsedData.headers.map((header) => (
                            <td key={header} className="px-4 py-3 text-slate-300">
                              {row[header] || "-"}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            {error && <Badge variant="destructive">Error</Badge>}
                            {warning && <Badge variant="secondary">Warning</Badge>}
                            {repair && <Badge className="bg-green-600">Repaired</Badge>}
                            {!error && !warning && !repair && (
                              <Badge className="bg-slate-600">OK</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setFile(null);
                  setParsedData(null);
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={parsedData.errors.length > 0 || isLoading}
                className="bg-gold hover:bg-gold/90 text-slate-900 font-semibold"
              >
                Continue to Import
              </Button>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && parsedData && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Import</h2>
              <p className="text-slate-400">
                {parsedData.rows.length - parsedData.errors.length} vehicles will be imported
              </p>
            </div>

            {parsedData.errors.length > 0 && (
              <Alert className="mb-6 bg-yellow-900/20 border-yellow-700 text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {parsedData.errors.length} rows with errors will be skipped
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex justify-between p-4 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Total Rows:</span>
                <span className="font-semibold text-white">{parsedData.rows.length}</span>
              </div>
              <div className="flex justify-between p-4 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Will Import:</span>
                <span className="font-semibold text-green-400">
                  {parsedData.rows.length - parsedData.errors.length}
                </span>
              </div>
              <div className="flex justify-between p-4 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Will Skip:</span>
                <span className="font-semibold text-red-400">{parsedData.errors.length}</span>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setStep("preview")}
                disabled={isLoading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Back
              </Button>
              <Button
                onClick={handleCommit}
                disabled={isLoading}
                className="bg-gold hover:bg-gold/90 text-slate-900 font-semibold"
              >
                {isLoading ? "Importing..." : "Import Now"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
