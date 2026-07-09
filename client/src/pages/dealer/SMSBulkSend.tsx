/**
 * SMS Bulk Send Page
 * Send SMS messages to multiple customers at once
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Send, CheckCircle2, AlertCircle, Loader2, Copy, Download } from "lucide-react";

interface BulkRecipient {
  phone: string;
  message: string;
}

interface BulkResult {
  phone: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export function SMSBulkSendPage() {
  const [recipients, setRecipients] = useState<BulkRecipient[]>([]);
  const [csvInput, setCsvInput] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Mutations
  const sendBulkMutation = trpc.sms.sendBulk.useMutation({
    onSuccess: (data) => {
      setBulkResults(data.results);
      setShowResults(true);
    },
  });

  // Parse CSV input
  const parseCSV = (csv: string): BulkRecipient[] => {
    const lines = csv.trim().split("\n");
    const parsed: BulkRecipient[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Support formats: "phone,message" or just "phone" (with default message)
      const parts = line.split(",");
      if (parts.length >= 1) {
        const phone = parts[0].trim();
        const message = parts.slice(1).join(",").trim() || "Hi! We have a special offer for you. Would you like to hear more?";

        if (phone) {
          parsed.push({ phone, message });
        }
      }
    }

    return parsed;
  };

  const handlePasteCSV = () => {
    const parsed = parseCSV(csvInput);
    setRecipients(parsed);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      setCsvInput(csv);
      const parsed = parseCSV(csv);
      setRecipients(parsed);
    };
    reader.readAsText(file);
  };

  const handleSendBulk = async () => {
    if (recipients.length === 0) {
      alert("Please add recipients first");
      return;
    }

    await sendBulkMutation.mutateAsync({
      recipients: recipients.map((r) => ({
        phone: r.phone,
        message: r.message,
        dealershipId: 1, // TODO: Get from auth context
      })),
    });
  };

  const handleDownloadTemplate = () => {
    const template = `phone,message
+27821234567,Hi! We have a special offer for you. Would you like to hear more?
+27831234567,Thanks for your interest. Let's schedule a test drive!
+27841234567,Don't miss out on our limited-time offer!`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(template));
    element.setAttribute("download", "sms_template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const successCount = bulkResults.filter((r) => r.success).length;
  const failureCount = bulkResults.filter((r) => !r.success).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Send className="w-8 h-8 text-gold" />
          Bulk SMS Send
        </h1>
        <p className="text-muted-foreground mt-1">Send SMS messages to multiple customers at once</p>
      </div>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">Input Recipients</TabsTrigger>
          <TabsTrigger value="results" disabled={!showResults}>
            Results {showResults && <Badge className="ml-2">{bulkResults.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Input Tab */}
        <TabsContent value="input" className="space-y-6">
          {/* Instructions */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">How to Use</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li>1. Download the template or paste CSV data below</li>
              <li>2. Format: phone,message (one per line)</li>
              <li>3. Phone format: +27821234567 or 0821234567</li>
              <li>4. Message is optional (uses default if omitted)</li>
              <li>5. Click "Send Bulk SMS" to send to all recipients</li>
            </ol>
          </Card>

          {/* Download Template */}
          <div className="flex gap-2">
            <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          {/* CSV Input */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Paste CSV Data</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recipients (CSV Format)</label>
                <Textarea
                  placeholder={`phone,message\n+27821234567,Hi! We have a special offer\n+27831234567,Thanks for your interest`}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handlePasteCSV} variant="outline" className="flex-1">
                  Parse CSV
                </Button>
                <label className="flex-1">
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      Upload CSV File
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUploadFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* Recipients Preview */}
          {recipients.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Recipients Preview ({recipients.length})
              </h2>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Message Preview</TableHead>
                      <TableHead className="w-20">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.slice(0, 10).map((recipient, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{recipient.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                          {recipient.message}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(recipient.phone);
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {recipients.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2">
                  ... and {recipients.length - 10} more recipients
                </p>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSendBulk}
                disabled={sendBulkMutation.isPending || recipients.length === 0}
                className="w-full mt-6 bg-gold hover:bg-gold/90 text-black"
                size="lg"
              >
                {sendBulkMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending to {recipients.length} recipients...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Bulk SMS to {recipients.length} Recipients
                  </>
                )}
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {showResults && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{bulkResults.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </Card>
                <Card className="p-4 text-center bg-green-50 border-green-200">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </Card>
                <Card className="p-4 text-center bg-red-50 border-red-200">
                  <div className="text-2xl font-bold text-red-600">{failureCount}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </Card>
              </div>

              {/* Results Table */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Detailed Results</h2>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message ID</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkResults.map((result, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{result.phone}</TableCell>
                          <TableCell>
                            {result.success ? (
                              <Badge className="bg-green-100 text-green-800 gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Sent
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {result.messageId || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-red-600">
                            {result.error || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowResults(false);
                    setRecipients([]);
                    setCsvInput("");
                    setBulkResults([]);
                  }}
                  className="flex-1"
                >
                  Send Another Batch
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
