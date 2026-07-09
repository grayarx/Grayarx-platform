import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

/**
 * Advanced Analytics Dashboard
 * Real-time funnel visualization, conversion tracking, and ROI metrics
 * with custom date range filtering
 */

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export default function AdvancedAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("conversion");
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  // Generate date ranges
  const getDateRange = (range: string): DateRange => {
    const today = new Date();
    let startDate = new Date();

    switch (range) {
      case "7d":
        startDate.setDate(today.getDate() - 7);
        return { startDate, endDate: today, label: "Last 7 Days" };
      case "30d":
        startDate.setDate(today.getDate() - 30);
        return { startDate, endDate: today, label: "Last 30 Days" };
      case "90d":
        startDate.setDate(today.getDate() - 90);
        return { startDate, endDate: today, label: "Last 90 Days" };
      case "1y":
        startDate.setFullYear(today.getFullYear() - 1);
        return { startDate, endDate: today, label: "Last Year" };
      default:
        return { startDate: today, endDate: today, label: "Today" };
    }
  };

  const currentDateRange = customDateRange || getDateRange(dateRange);

  // Generate mock data based on date range
  const generateConversionTrends = (range: DateRange) => {
    const days = Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];

    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(range.startDate);
      date.setDate(date.getDate() + i);

      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        conversion: parseFloat((0.8 + Math.random() * 2.5).toFixed(1)),
        leads: Math.floor(100 + Math.random() * 300),
        sales: Math.floor(1 + Math.random() * 15),
      });
    }

    return data;
  };

  const generateVehiclePerformance = (range: DateRange) => {
    const multiplier = Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    return [
      { vehicle: "Toyota Hilux", leads: Math.floor(450 * multiplier), conversions: Math.floor(18 * multiplier), roi: 245 },
      { vehicle: "Ford Ranger", leads: Math.floor(380 * multiplier), conversions: Math.floor(12 * multiplier), roi: 198 },
      { vehicle: "Isuzu D-Max", leads: Math.floor(320 * multiplier), conversions: Math.floor(14 * multiplier), roi: 212 },
      { vehicle: "Volkswagen Amarok", leads: Math.floor(290 * multiplier), conversions: Math.floor(9 * multiplier), roi: 156 },
      { vehicle: "Nissan Navara", leads: Math.floor(260 * multiplier), conversions: Math.floor(8 * multiplier), roi: 142 },
    ];
  };

  // Mock data for funnel
  const funnelData = [
    { stage: "Visitors", count: 10000, percentage: 100 },
    { stage: "Leads", count: 2500, percentage: 25 },
    { stage: "Test Drives", count: 750, percentage: 7.5 },
    { stage: "Negotiations", count: 300, percentage: 3 },
    { stage: "Sales", count: 120, percentage: 1.2 },
  ];

  // Mock data for lead source attribution
  const leadSources = [
    { source: "Showroom", value: 35, color: "#3b82f6" },
    { source: "WhatsApp", value: 28, color: "#10b981" },
    { source: "Email", value: 18, color: "#f59e0b" },
    { source: "Direct", value: 12, color: "#8b5cf6" },
    { source: "Referral", value: 7, color: "#ec4899" },
  ];

  // Dynamic data based on date range
  const conversionTrends = useMemo(() => generateConversionTrends(currentDateRange), [currentDateRange]);
  const vehiclePerformance = useMemo(() => generateVehiclePerformance(currentDateRange), [currentDateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalLeads = funnelData[1].count;
    const totalSales = funnelData[4].count;
    const conversionRate = ((totalSales / funnelData[0].count) * 100).toFixed(2);
    const avgLeadValue = (120000 / totalSales).toFixed(0);

    // Calculate ROI based on vehicle performance
    const totalRevenue = vehiclePerformance.reduce((sum, v) => sum + v.conversions * 350000, 0);
    const avgROI = (vehiclePerformance.reduce((sum, v) => sum + v.roi, 0) / vehiclePerformance.length).toFixed(0);

    return {
      totalLeads,
      totalSales,
      conversionRate,
      avgLeadValue,
      leadQuality: (75).toFixed(1),
      avgResponseTime: "2.3h",
      totalRevenue: (totalRevenue / 1000000).toFixed(1),
      avgROI,
    };
  }, [vehiclePerformance]);

  const handleCustomDateRange = () => {
    if (tempStartDate && tempEndDate) {
      const startDate = new Date(tempStartDate);
      const endDate = new Date(tempEndDate);

      if (startDate <= endDate) {
        setCustomDateRange({
          startDate,
          endDate,
          label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        });
        setDateRange("custom");
        setShowCustomDatePicker(false);
      }
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Advanced Analytics</h1>
          <p className="text-slate-400">
            Real-time conversion funnel, ROI metrics, and performance insights
            {customDateRange && <span className="ml-4 text-amber-400">📅 {customDateRange.label}</span>}
          </p>
        </div>

        {/* Date Range Controls */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {["7d", "30d", "90d", "1y"].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                onClick={() => {
                  setDateRange(range);
                  setCustomDateRange(null);
                }}
                className={dateRange === range ? "bg-amber-500 hover:bg-amber-600" : ""}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
              </Button>
            ))}

            {/* Custom Date Range Picker */}
            <Dialog open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
              <DialogTrigger asChild>
                <Button
                  variant={dateRange === "custom" ? "default" : "outline"}
                  className={dateRange === "custom" ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Custom Range
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Select Custom Date Range</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300 mb-2 block">Start Date</Label>
                    <Input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">End Date</Label>
                    <Input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowCustomDatePicker(false)}
                      className="text-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCustomDateRange}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Date Range Info */}
          <div className="text-sm text-slate-400">
            Showing data from <span className="text-amber-400 font-semibold">{currentDateRange.startDate.toLocaleDateString()}</span> to{" "}
            <span className="text-amber-400 font-semibold">{currentDateRange.endDate.toLocaleDateString()}</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpis.totalLeads.toLocaleString()}</div>
              <p className="text-xs text-green-400 mt-1">+12% from previous period</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpis.totalSales}</div>
              <p className="text-xs text-green-400 mt-1">+18% from previous period</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpis.conversionRate}%</div>
              <p className="text-xs text-green-400 mt-1">+0.3% from previous period</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">R{kpis.totalRevenue}M</div>
              <p className="text-xs text-amber-400 mt-1">Period total</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpis.avgROI}%</div>
              <p className="text-xs text-green-400 mt-1">Across all vehicles</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg Lead Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">R{kpis.avgLeadValue}</div>
              <p className="text-xs text-amber-400 mt-1">Based on avg sale</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="funnel" className="mb-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="trends">Conversion Trends</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicle Performance</TabsTrigger>
            <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          </TabsList>

          {/* Conversion Funnel */}
          <TabsContent value="funnel">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Conversion Funnel</CardTitle>
                <CardDescription className="text-slate-400">
                  Track leads through each stage of the sales process ({currentDateRange.label})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((stage, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
                        <span className="text-white font-medium">{stage.stage}</span>
                        <span className="text-slate-400">
                          {stage.count.toLocaleString()} ({stage.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full flex items-center justify-end pr-3 transition-all"
                          style={{ width: `${stage.percentage}%` }}
                        >
                          {stage.percentage > 5 && (
                            <span className="text-white text-sm font-semibold">{stage.percentage}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Funnel Insights */}
                <div className="mt-8 p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Funnel Insights</h4>
                  <ul className="text-slate-300 text-sm space-y-1">
                    <li>• Highest drop-off: Leads to Test Drives (70%)</li>
                    <li>• Strongest conversion: Test Drives to Negotiations (40%)</li>
                    <li>• Overall conversion rate: {kpis.conversionRate}% (industry average: 0.8%)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversion Trends */}
          <TabsContent value="trends">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Conversion Trends</CardTitle>
                <CardDescription className="text-slate-400">
                  Track conversion rate, leads, and sales over time ({currentDateRange.label})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={conversionTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="conversion"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Conversion Rate (%)"
                    />
                    <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} name="Leads" />
                    <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Sales" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Performance */}
          <TabsContent value="vehicles">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Vehicle Performance</CardTitle>
                <CardDescription className="text-slate-400">
                  Leads, conversions, and ROI by vehicle model ({currentDateRange.label})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={vehiclePerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="vehicle" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                    <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                    <Bar dataKey="roi" fill="#f59e0b" name="ROI (%)" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Vehicle Performance Summary */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Top Performer</h4>
                    <p className="text-amber-400 text-lg font-bold">
                      {vehiclePerformance[0].vehicle}
                    </p>
                    <p className="text-slate-300 text-sm">
                      {vehiclePerformance[0].conversions} conversions • {vehiclePerformance[0].roi}% ROI
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Average Performance</h4>
                    <p className="text-slate-300 text-sm">
                      Avg Leads: {Math.floor(vehiclePerformance.reduce((sum, v) => sum + v.leads, 0) / vehiclePerformance.length)}
                    </p>
                    <p className="text-slate-300 text-sm">
                      Avg Conversions: {Math.floor(vehiclePerformance.reduce((sum, v) => sum + v.conversions, 0) / vehiclePerformance.length)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Sources */}
          <TabsContent value="sources">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Lead Source Attribution</CardTitle>
                <CardDescription className="text-slate-400">
                  Distribution of leads by source channel ({currentDateRange.label})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={leadSources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, value }) => `${source}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leadSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-4">
                    {leadSources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: source.color }}
                          ></div>
                          <span className="text-white">{source.source}</span>
                        </div>
                        <span className="text-amber-400 font-semibold">{source.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ROI Calculator with Date Range */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">ROI Calculator</CardTitle>
            <CardDescription className="text-slate-400">
              Estimate your return on investment for {currentDateRange.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Monthly Leads</label>
                <input
                  type="number"
                  defaultValue="2500"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Conversion Rate (%)</label>
                <input
                  type="number"
                  defaultValue={kpis.conversionRate}
                  step="0.1"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Avg Sale Price (R)</label>
                <input
                  type="number"
                  defaultValue="350000"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-amber-900 to-amber-800 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-slate-300 text-sm">Monthly Sales</p>
                  <p className="text-2xl font-bold text-amber-300">30</p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-amber-300">R10.5M</p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Your Commission (20%)</p>
                  <p className="text-2xl font-bold text-amber-300">R2.1M</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
