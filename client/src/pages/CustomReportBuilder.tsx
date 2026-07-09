import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Download, Save, Settings } from "lucide-react";

/**
 * Custom Report Builder
 * Allows users to create custom reports with selected metrics and formatting
 */

export default function CustomReportBuilder() {
  const { user } = useAuth();
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [format, setFormat] = useState<"pdf" | "csv" | "html">("pdf");
  const [chartType, setChartType] = useState<"line" | "bar" | "pie" | "area" | "table">("bar");
  const [colorScheme, setColorScheme] = useState<"default" | "professional" | "vibrant" | "grayscale">("default");
  const [includeBranding, setIncludeBranding] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Queries
  const { data: metricsData } = trpc.customReportBuilder.getAvailableMetrics.useQuery();
  const { data: formattingData } = trpc.customReportBuilder.getFormattingOptions.useQuery();
  const { data: presetsData } = trpc.customReportBuilder.getPresets.useQuery();
  const { data: templatesData } = trpc.customReportBuilder.getSavedTemplates.useQuery();

  // Mutations
  const createTemplateMutation = trpc.customReportBuilder.createReportTemplate.useMutation();
  const generateReportMutation = trpc.customReportBuilder.generateReportFromTemplate.useMutation();
  const deleteTemplateMutation = trpc.customReportBuilder.deleteTemplate.useMutation();

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((m) => m !== metricId) : [...prev, metricId]
    );
  };

  const handleCreateTemplate = async () => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }

    if (selectedMetrics.length === 0) {
      toast.error("Please select at least one metric");
      return;
    }

    try {
      await createTemplateMutation.mutateAsync({
        name: reportName,
        description: reportDescription,
        selectedMetrics,
        format,
        chartType,
        colorScheme,
        includeBranding,
        includeInsights,
        includeRecommendations,
        dateRange: {
          startDate,
          endDate,
        },
      });

      toast.success("Report template created successfully!");
      setReportName("");
      setReportDescription("");
      setSelectedMetrics([]);
    } catch (error) {
      toast.error("Failed to create report template");
      console.error(error);
    }
  };

  const handleGenerateReport = async (templateId: number) => {
    try {
      const result = await generateReportMutation.mutateAsync({
        templateId,
        dateRange: {
          startDate,
          endDate,
        },
      });

      if (result.success) {
        toast.success("Report generated successfully!");
      }
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await deleteTemplateMutation.mutateAsync({ templateId });
      toast.success("Template deleted successfully");
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const handleApplyPreset = (preset: any) => {
    setSelectedMetrics(preset.metrics);
    setFormat(preset.format);
    setChartType(preset.chartType);
    setReportName(preset.name);
    setReportDescription(preset.description);
    toast.success(`Applied preset: ${preset.name}`);
  };

  const groupedMetrics = useMemo(() => {
    if (!metricsData) return {};
    return metricsData.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.category]) acc[metric.category] = [];
        acc[metric.category].push(metric);
        return acc;
      },
      {} as Record<string, any[]>
    );
  }, [metricsData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Custom Report Builder</h1>
          <p className="text-slate-400">Create tailored reports with selected metrics and formatting options</p>
        </div>

        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="builder">Build Report</TabsTrigger>
            <TabsTrigger value="templates">Saved Templates</TabsTrigger>
            <TabsTrigger value="presets">Quick Presets</TabsTrigger>
          </TabsList>

          {/* Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Report Details */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Report Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">Report Name</Label>
                      <Input
                        placeholder="e.g., Monthly Sales Report"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300 mb-2 block">Description</Label>
                      <Input
                        placeholder="Optional description"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300 mb-2 block">Format</Label>
                      <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="pdf" className="text-white">
                            PDF Report
                          </SelectItem>
                          <SelectItem value="csv" className="text-white">
                            CSV Spreadsheet
                          </SelectItem>
                          <SelectItem value="html" className="text-white">
                            HTML Report
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300 mb-2 block">Chart Type</Label>
                      <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="line" className="text-white">
                            Line Chart
                          </SelectItem>
                          <SelectItem value="bar" className="text-white">
                            Bar Chart
                          </SelectItem>
                          <SelectItem value="pie" className="text-white">
                            Pie Chart
                          </SelectItem>
                          <SelectItem value="area" className="text-white">
                            Area Chart
                          </SelectItem>
                          <SelectItem value="table" className="text-white">
                            Data Table
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300 mb-2 block">Color Scheme</Label>
                      <Select value={colorScheme} onValueChange={(value: any) => setColorScheme(value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="default" className="text-white">
                            Default
                          </SelectItem>
                          <SelectItem value="professional" className="text-white">
                            Professional
                          </SelectItem>
                          <SelectItem value="vibrant" className="text-white">
                            Vibrant
                          </SelectItem>
                          <SelectItem value="grayscale" className="text-white">
                            Grayscale
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Date Range */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Date Range</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300 mb-2 block">End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Options */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="branding"
                        checked={includeBranding}
                        onCheckedChange={(checked) => setIncludeBranding(checked as boolean)}
                        className="border-slate-500"
                      />
                      <Label htmlFor="branding" className="text-slate-300 cursor-pointer">
                        Include Branding
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="insights"
                        checked={includeInsights}
                        onCheckedChange={(checked) => setIncludeInsights(checked as boolean)}
                        className="border-slate-500"
                      />
                      <Label htmlFor="insights" className="text-slate-300 cursor-pointer">
                        Include AI Insights
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="recommendations"
                        checked={includeRecommendations}
                        onCheckedChange={(checked) => setIncludeRecommendations(checked as boolean)}
                        className="border-slate-500"
                      />
                      <Label htmlFor="recommendations" className="text-slate-300 cursor-pointer">
                        Include Recommendations
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={createTemplateMutation.isPending}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {createTemplateMutation.isPending ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </div>

              {/* Right Column - Metrics Selection */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Select Metrics</CardTitle>
                    <CardDescription className="text-slate-400">
                      {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? "s" : ""} selected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(groupedMetrics).map(([category, metrics]) => (
                        <div key={category}>
                          <h3 className="text-sm font-semibold text-slate-300 mb-3 capitalize">{category}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {metrics.map((metric) => (
                              <div key={metric.id} className="flex items-start space-x-3 p-3 rounded bg-slate-700 hover:bg-slate-600 transition">
                                <Checkbox
                                  id={metric.id}
                                  checked={selectedMetrics.includes(metric.id)}
                                  onCheckedChange={() => handleMetricToggle(metric.id)}
                                  className="mt-1 border-slate-500"
                                />
                                <div className="flex-1">
                                  <Label htmlFor={metric.id} className="text-slate-200 font-medium cursor-pointer">
                                    {metric.name}
                                  </Label>
                                  <p className="text-xs text-slate-400 mt-1">{metric.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Saved Templates</CardTitle>
                <CardDescription className="text-slate-400">Your custom report templates</CardDescription>
              </CardHeader>
              <CardContent>
                {templatesData?.templates && templatesData.templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templatesData.templates.map((template: any) => (
                      <Card key={template.id} className="bg-slate-700 border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-slate-400">{template.metricsCount} metrics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-slate-300">{template.description}</p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleGenerateReport(template.id)}
                              disabled={generateReportMutation.isPending}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Generate
                            </Button>
                            <Button
                              onClick={() => handleDeleteTemplate(template.id)}
                              disabled={deleteTemplateMutation.isPending}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No templates saved yet. Create one in the Builder tab!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Presets</CardTitle>
                <CardDescription className="text-slate-400">Pre-configured report templates for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {presetsData?.presets.map((preset: any) => (
                    <Card key={preset.id} className="bg-slate-700 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">{preset.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-slate-300">{preset.description}</p>
                        <div className="text-xs text-slate-400 space-y-1">
                          <p>📊 Format: {preset.format.toUpperCase()}</p>
                          <p>📈 Chart: {preset.chartType}</p>
                          <p>📋 Metrics: {preset.metrics.length}</p>
                        </div>
                        <Button
                          onClick={() => handleApplyPreset(preset)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Use Preset
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
