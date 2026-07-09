import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, TrendingUp, TrendingDown, Download, FileText, Sheet } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Comparison Analytics Dashboard
 * Compare performance metrics across two different date ranges
 */

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface ComparisonMetrics {
  totalLeads: number;
  totalSales: number;
  conversionRate: number;
  avgLeadValue: number;
  totalRevenue: number;
  avgROI: number;
}

interface MetricComparison {
  metric: string;
  period1Value: number;
  period2Value: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "neutral";
}

export default function ComparisonAnalytics() {
  const { user } = useAuth();
  const [period1Range, setPeriod1Range] = useState<DateRange | null>(null);
  const [period2Range, setPeriod2Range] = useState<DateRange | null>(null);
  const [showPeriod1Picker, setShowPeriod1Picker] = useState(false);
  const [showPeriod2Picker, setShowPeriod2Picker] = useState(false);
  const [tempPeriod1Start, setTempPeriod1Start] = useState("");
  const [tempPeriod1End, setTempPeriod1End] = useState("");
  const [tempPeriod2Start, setTempPeriod2Start] = useState("");
  const [tempPeriod2End, setTempPeriod2End] = useState("");

  // Get default date ranges
  const getDefaultDateRange = (daysBack: number): DateRange => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysBack);

    return {
      startDate,
      endDate: today,
      label: `Last ${daysBack} Days`,
    };
  };

  // Initialize with default ranges if not set
  const period1 = period1Range || getDefaultDateRange(30);
  const period2 = period2Range || getDefaultDateRange(60);

  // Generate metrics for a date range
  const generateMetrics = (range: DateRange): ComparisonMetrics => {
    const multiplier = Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const baseLeads = 2500;
    const baseConversion = 1.2;
    const variance = Math.random() * 0.4 - 0.2; // -20% to +20% variance

    const totalLeads = Math.floor(baseLeads * multiplier * (1 + variance));
    const conversionRate = baseConversion + variance;
    const totalSales = Math.floor((totalLeads * conversionRate) / 100);
    const avgLeadValue = 140000;
    const totalRevenue = totalSales * 350000;
    const avgROI = 191 + Math.random() * 40 - 20;

    return {
      totalLeads,
      totalSales,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      avgLeadValue,
      totalRevenue,
      avgROI: parseFloat(avgROI.toFixed(0)) as number,
    };
  };

  const metrics1 = useMemo(() => generateMetrics(period1), [period1]);
  const metrics2 = useMemo(() => generateMetrics(period2), [period2]);

  // Calculate comparisons
  const comparisons: MetricComparison[] = useMemo(() => {
    const calculateChange = (val1: number, val2: number) => {
      const change = val2 - val1;
      const changePercent = val1 !== 0 ? (change / val1) * 100 : 0;
      const trend: "up" | "down" | "neutral" = change > 0 ? "up" : change < 0 ? "down" : "neutral";
      return { change, changePercent, trend };
    };

    return [
      {
        metric: "Total Leads",
        period1Value: metrics1.totalLeads,
        period2Value: metrics2.totalLeads,
        ...calculateChange(metrics1.totalLeads, metrics2.totalLeads),
      } as MetricComparison,
      {
        metric: "Total Sales",
        period1Value: metrics1.totalSales,
        period2Value: metrics2.totalSales,
        ...calculateChange(metrics1.totalSales, metrics2.totalSales),
      } as MetricComparison,
      {
        metric: "Conversion Rate (%)",
        period1Value: metrics1.conversionRate,
        period2Value: metrics2.conversionRate,
        ...calculateChange(metrics1.conversionRate, metrics2.conversionRate),
      } as MetricComparison,
      {
        metric: "Total Revenue (R)",
        period1Value: metrics1.totalRevenue,
        period2Value: metrics2.totalRevenue,
        ...calculateChange(metrics1.totalRevenue, metrics2.totalRevenue),
      } as MetricComparison,
      {
        metric: "Average ROI (%)",
        period1Value: metrics1.avgROI,
        period2Value: metrics2.avgROI,
        ...calculateChange(metrics1.avgROI, metrics2.avgROI),
      } as MetricComparison,
    ] as MetricComparison[];
  }, [metrics1, metrics2]);

  // Generate comparison chart data
  const comparisonChartData = useMemo(() => {
    return comparisons.map((comp) => ({
      name: comp.metric,
      "Period 1": comp.period1Value,
      "Period 2": comp.period2Value,
    }));
  }, [comparisons]);

  // Generate trend data
  const generateTrendData = () => {
    const data = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        week: `Week ${i + 1}`,
        period1: Math.floor(100 + Math.random() * 50),
        period2: Math.floor(100 + Math.random() * 50),
      });
    }
    return data;
  };

  const trendData = useMemo(() => generateTrendData(), [period1, period2]);

  // Handle period 1 date selection
  const handlePeriod1DateRange = () => {
    if (tempPeriod1Start && tempPeriod1End) {
      const startDate = new Date(tempPeriod1Start);
      const endDate = new Date(tempPeriod1End);

      if (startDate <= endDate) {
        setPeriod1Range({
          startDate,
          endDate,
          label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        });
        setShowPeriod1Picker(false);
      }
    }
  };

  // Handle period 2 date selection
  const handlePeriod2DateRange = () => {
    if (tempPeriod2Start && tempPeriod2End) {
      const startDate = new Date(tempPeriod2Start);
      const endDate = new Date(tempPeriod2End);

      if (startDate <= endDate) {
        setPeriod2Range({
          startDate,
          endDate,
          label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        });
        setShowPeriod2Picker(false);
      }
    }
  };

  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  // Get trend color
  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-green-400";
    if (trend === "down") return "text-red-400";
    return "text-slate-400";
  };

  // Export mutations
  const exportPDFMutation = trpc.export.exportComparisonReportPDF.useMutation();
  const exportCSVMutation = trpc.export.exportComparisonReportCSV.useMutation();

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      const reportData = {
        period1: {
          label: period1.label,
          startDate: period1.startDate.toLocaleDateString(),
          endDate: period1.endDate.toLocaleDateString(),
          metrics: metrics1,
        },
        period2: {
          label: period2.label,
          startDate: period2.startDate.toLocaleDateString(),
          endDate: period2.endDate.toLocaleDateString(),
          metrics: metrics2,
        },
        comparisons,
        insights: {
          bestImprovement: (() => {
            const best = comparisons.reduce((prev, current) =>
              prev.changePercent > current.changePercent ? prev : current
            );
            return `${best.metric} improved by ${best.changePercent.toFixed(1)}%`;
          })(),
          worstPerformance: (() => {
            const worst = comparisons.reduce((prev, current) =>
              prev.changePercent < current.changePercent ? prev : current
            );
            return `${worst.metric} declined by ${Math.abs(worst.changePercent).toFixed(1)}%`;
          })(),
          overallTrend: (() => {
            const avgChange = comparisons.reduce((sum, c) => sum + c.changePercent, 0) / comparisons.length;
            return `Overall performance ${avgChange > 0 ? "improved" : "declined"} by ${Math.abs(avgChange).toFixed(1)}% on average`;
          })(),
          recommendations: [
            "Focus on lead quality improvements - conversion rate is a key metric",
            "Analyze top-performing vehicle models and replicate their success",
            "Review marketing channels that drove the highest ROI",
            "Consider seasonal factors when comparing distant periods",
            "Set targets based on Period 1 performance + 15% growth",
          ],
        },
        dealershipName: user?.name || "GrayArx Dealership",
      };

      const result = await exportPDFMutation.mutateAsync(reportData);
      if (result.success) {
        // Download the PDF
        const binaryString = atob(result.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`PDF exported: ${result.filename}`);
      }
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      const reportData = {
        period1: {
          label: period1.label,
          startDate: period1.startDate.toLocaleDateString(),
          endDate: period1.endDate.toLocaleDateString(),
          metrics: metrics1,
        },
        period2: {
          label: period2.label,
          startDate: period2.startDate.toLocaleDateString(),
          endDate: period2.endDate.toLocaleDateString(),
          metrics: metrics2,
        },
        comparisons,
        insights: {
          bestImprovement: (() => {
            const best = comparisons.reduce((prev, current) =>
              prev.changePercent > current.changePercent ? prev : current
            );
            return `${best.metric} improved by ${best.changePercent.toFixed(1)}%`;
          })(),
          worstPerformance: (() => {
            const worst = comparisons.reduce((prev, current) =>
              prev.changePercent < current.changePercent ? prev : current
            );
            return `${worst.metric} declined by ${Math.abs(worst.changePercent).toFixed(1)}%`;
          })(),
          overallTrend: (() => {
            const avgChange = comparisons.reduce((sum, c) => sum + c.changePercent, 0) / comparisons.length;
            return `Overall performance ${avgChange > 0 ? "improved" : "declined"} by ${Math.abs(avgChange).toFixed(1)}% on average`;
          })(),
          recommendations: [
            "Focus on lead quality improvements - conversion rate is a key metric",
            "Analyze top-performing vehicle models and replicate their success",
            "Review marketing channels that drove the highest ROI",
            "Consider seasonal factors when comparing distant periods",
            "Set targets based on Period 1 performance + 15% growth",
          ],
        },
        dealershipName: user?.name || "GrayArx Dealership",
      };

      const result = await exportCSVMutation.mutateAsync(reportData);
      if (result.success) {
        // Download the CSV
        const binaryString = atob(result.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`CSV exported: ${result.filename}`);
      }
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Performance Comparison</h1>
            <p className="text-slate-400">Compare metrics across two different time periods to identify trends and improvements</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={exportPDFMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {exportPDFMutation.isPending ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={exportCSVMutation.isPending}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center gap-2"
            >
              <Sheet className="w-4 h-4" />
              {exportCSVMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>
      </div>

        {/* Period Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Period 1 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Period 1
              </CardTitle>
              <CardDescription className="text-slate-400">
                {period1.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showPeriod1Picker} onOpenChange={setShowPeriod1Picker}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                    Change Date Range
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Select Period 1 Date Range</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">Start Date</Label>
                      <Input
                        type="date"
                        value={tempPeriod1Start}
                        onChange={(e) => setTempPeriod1Start(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 mb-2 block">End Date</Label>
                      <Input
                        type="date"
                        value={tempPeriod1End}
                        onChange={(e) => setTempPeriod1End(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowPeriod1Picker(false)}
                        className="text-slate-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePeriod1DateRange}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Period 1 KPIs */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Total Leads</span>
                  <span className="text-white font-bold">{metrics1.totalLeads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Sales</span>
                  <span className="text-white font-bold">{metrics1.totalSales}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Conversion Rate</span>
                  <span className="text-white font-bold">{metrics1.conversionRate}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Revenue</span>
                  <span className="text-white font-bold">{formatNumber(metrics1.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Avg ROI</span>
                  <span className="text-white font-bold">{metrics1.avgROI}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Period 2 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Period 2
              </CardTitle>
              <CardDescription className="text-slate-400">
                {period2.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showPeriod2Picker} onOpenChange={setShowPeriod2Picker}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                    Change Date Range
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Select Period 2 Date Range</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">Start Date</Label>
                      <Input
                        type="date"
                        value={tempPeriod2Start}
                        onChange={(e) => setTempPeriod2Start(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 mb-2 block">End Date</Label>
                      <Input
                        type="date"
                        value={tempPeriod2End}
                        onChange={(e) => setTempPeriod2End(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowPeriod2Picker(false)}
                        className="text-slate-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePeriod2DateRange}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Period 2 KPIs */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Total Leads</span>
                  <span className="text-white font-bold">{metrics2.totalLeads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Sales</span>
                  <span className="text-white font-bold">{metrics2.totalSales}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Conversion Rate</span>
                  <span className="text-white font-bold">{metrics2.conversionRate}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Revenue</span>
                  <span className="text-white font-bold">{formatNumber(metrics2.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Avg ROI</span>
                  <span className="text-white font-bold">{metrics2.avgROI}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Results */}
        <Tabs defaultValue="metrics" className="mb-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="metrics">Metric Comparison</TabsTrigger>
            <TabsTrigger value="trends">Trend Comparison</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Metrics Comparison */}
          <TabsContent value="metrics">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Side-by-Side Metrics</CardTitle>
                <CardDescription className="text-slate-400">
                  Compare key performance indicators between the two periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparisons.map((comp, idx) => (
                    <div key={idx} className="p-4 bg-slate-700 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-white font-semibold">{comp.metric}</h3>
                        <div className="flex items-center gap-2">
                          {comp.trend === "up" && (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          )}
                          {comp.trend === "down" && (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          )}
                          <span className={`font-bold ${getTrendColor(comp.trend)}`}>
                            {comp.changePercent > 0 ? "+" : ""}
                            {comp.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Period 1</p>
                          <p className="text-white font-bold text-lg">
                            {typeof comp.period1Value === "number" && comp.period1Value > 1000
                              ? formatNumber(comp.period1Value)
                              : comp.period1Value.toFixed(comp.metric.includes("%") ? 2 : 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Period 2</p>
                          <p className="text-white font-bold text-lg">
                            {typeof comp.period2Value === "number" && comp.period2Value > 1000
                              ? formatNumber(comp.period2Value)
                              : comp.period2Value.toFixed(comp.metric.includes("%") ? 2 : 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Change</p>
                          <p className={`font-bold text-lg ${getTrendColor(comp.trend)}`}>
                            {comp.change > 0 ? "+" : ""}
                            {typeof comp.change === "number" && comp.change > 1000
                              ? formatNumber(comp.change)
                              : comp.change.toFixed(comp.metric.includes("%") ? 2 : 0)}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            comp.trend === "up"
                              ? "bg-green-500"
                              : comp.trend === "down"
                              ? "bg-red-500"
                              : "bg-slate-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (comp.period2Value / Math.max(comp.period1Value, comp.period2Value)) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Comparison */}
          <TabsContent value="trends">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Trends</CardTitle>
                <CardDescription className="text-slate-400">
                  Weekly performance comparison between periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="week" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="period1"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Period 1"
                    />
                    <Line
                      type="monotone"
                      dataKey="period2"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Period 2"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Key Insights</CardTitle>
                <CardDescription className="text-slate-400">
                  Analysis and recommendations based on the comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Best performing metric */}
                  <div className="p-4 bg-gradient-to-r from-green-900 to-green-800 rounded-lg border border-green-700">
                    <h4 className="text-white font-semibold mb-2">📈 Best Improvement</h4>
                    {(() => {
                      const bestImprovement = comparisons.reduce((prev, current) =>
                        prev.changePercent > current.changePercent ? prev : current
                      );
                      return (
                        <p className="text-green-200">
                          <span className="font-bold">{bestImprovement.metric}</span> improved by{" "}
                          <span className="font-bold text-green-300">{bestImprovement.changePercent.toFixed(1)}%</span>
                        </p>
                      );
                    })()}
                  </div>

                  {/* Worst performing metric */}
                  <div className="p-4 bg-gradient-to-r from-red-900 to-red-800 rounded-lg border border-red-700">
                    <h4 className="text-white font-semibold mb-2">📉 Areas to Watch</h4>
                    {(() => {
                      const worstPerformance = comparisons.reduce((prev, current) =>
                        prev.changePercent < current.changePercent ? prev : current
                      );
                      return (
                        <p className="text-red-200">
                          <span className="font-bold">{worstPerformance.metric}</span> declined by{" "}
                          <span className="font-bold text-red-300">{Math.abs(worstPerformance.changePercent).toFixed(1)}%</span>
                        </p>
                      );
                    })()}
                  </div>

                  {/* Overall trend */}
                  <div className="p-4 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg border border-blue-700">
                    <h4 className="text-white font-semibold mb-2">📊 Overall Trend</h4>
                    {(() => {
                      const avgChange = comparisons.reduce((sum, c) => sum + c.changePercent, 0) / comparisons.length;
                      return (
                        <p className="text-blue-200">
                          Overall performance{" "}
                          <span className={avgChange > 0 ? "text-green-300 font-bold" : "text-red-300 font-bold"}>
                            {avgChange > 0 ? "improved" : "declined"}
                          </span>{" "}
                          by <span className="font-bold">{Math.abs(avgChange).toFixed(1)}%</span> on average
                        </p>
                      );
                    })()}
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <h4 className="text-white font-semibold mb-3">💡 Recommendations</h4>
                    <ul className="space-y-2 text-slate-300 text-sm">
                      <li>• Focus on lead quality improvements - conversion rate is a key metric</li>
                      <li>• Analyze top-performing vehicle models and replicate their success</li>
                      <li>• Review marketing channels that drove the highest ROI</li>
                      <li>• Consider seasonal factors when comparing distant periods</li>
                      <li>• Set targets based on Period 1 performance + 15% growth</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Comparison Bar Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Metrics Comparison Chart</CardTitle>
            <CardDescription className="text-slate-400">
              Visual comparison of all metrics between the two periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar dataKey="Period 1" fill="#f59e0b" />
                <Bar dataKey="Period 2" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
