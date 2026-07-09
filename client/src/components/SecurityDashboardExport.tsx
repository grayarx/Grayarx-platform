/**
 * Security Dashboard Export
 * Export functionality for all security dashboards (CSV, JSON, PDF)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileJson, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportOption {
  id: string;
  label: string;
  selected: boolean;
}

export function SecurityDashboardExport() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDashboards, setSelectedDashboards] = useState<ExportOption[]>([
    { id: "threats", label: "Threat Dashboard", selected: true },
    { id: "alerts", label: "Alert History", selected: true },
    { id: "incidents", label: "Incident Tracking", selected: false },
    { id: "webhooks", label: "Webhook Logs", selected: false },
    { id: "audit", label: "Audit Logs", selected: true },
    { id: "compliance", label: "Compliance Reports", selected: false },
  ]);

  const handleDashboardToggle = (id: string) => {
    setSelectedDashboards(
      selectedDashboards.map((d) =>
        d.id === id ? { ...d, selected: !d.selected } : d
      )
    );
  };

  const handleExport = async () => {
    const selected = selectedDashboards.filter((d) => d.selected);
    if (selected.length === 0) {
      toast.error("Please select at least one dashboard to export");
      return;
    }

    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fileName = `security-export-${Date.now()}.${exportFormat}`;
      const content = generateExportContent(selected, exportFormat);

      // Create download link
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        `data:text/${exportFormat === "json" ? "json" : "plain"};charset=utf-8,${encodeURIComponent(content)}`
      );
      element.setAttribute("download", fileName);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success(`Exported ${selected.length} dashboard(s) as ${exportFormat.toUpperCase()}`);
      setShowExportDialog(false);
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportContent = (
    selected: ExportOption[],
    format: "csv" | "json" | "pdf"
  ): string => {
    if (format === "json") {
      return JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          dashboards: selected.map((d) => ({
            name: d.label,
            data: generateMockData(d.id),
          })),
        },
        null,
        2
      );
    } else if (format === "csv") {
      let csv = "Dashboard,Metric,Value,Timestamp\n";
      selected.forEach((d) => {
        const data = generateMockData(d.id);
        csv += `${d.label},Total Items,${data.total},${new Date().toISOString()}\n`;
        csv += `${d.label},Critical Count,${data.critical},${new Date().toISOString()}\n`;
      });
      return csv;
    } else {
      // PDF format (simplified)
      return `Security Dashboard Export\nGenerated: ${new Date().toISOString()}\n\n${selected
        .map((d) => `${d.label}: ${generateMockData(d.id).total} items`)
        .join("\n")}`;
    }
  };

  const generateMockData = (dashboardId: string) => {
    const dataMap: Record<string, { total: number; critical: number }> = {
      threats: { total: 24, critical: 3 },
      alerts: { total: 156, critical: 8 },
      incidents: { total: 42, critical: 2 },
      webhooks: { total: 2, critical: 0 },
      audit: { total: 5000, critical: 45 },
      compliance: { total: 5, critical: 0 },
    };
    return dataMap[dashboardId] || { total: 0, critical: 0 };
  };

  const getFormatIcon = () => {
    switch (exportFormat) {
      case "csv":
        return <FileSpreadsheet className="w-4 h-4" />;
      case "json":
        return <FileJson className="w-4 h-4" />;
      case "pdf":
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowExportDialog(true)}
        variant="outline"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </Button>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Security Data</DialogTitle>
            <DialogDescription>
              Select dashboards and format to export your security data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV (Spreadsheet)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      JSON (Data)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      PDF (Report)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dashboard Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Select Dashboards</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedDashboards.map((dashboard) => (
                  <div key={dashboard.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={dashboard.selected}
                      onCheckedChange={() => handleDashboardToggle(dashboard.id)}
                    />
                    <Label className="text-sm cursor-pointer flex-1">
                      {dashboard.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Format:</strong> {exportFormat.toUpperCase()}
                  </p>
                  <p>
                    <strong>Dashboards:</strong>{" "}
                    {selectedDashboards.filter((d) => d.selected).length} selected
                  </p>
                  <p>
                    <strong>Size:</strong> ~{Math.floor(Math.random() * 5) + 1} MB
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(false)}
                disabled={isExporting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    {getFormatIcon()}
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
