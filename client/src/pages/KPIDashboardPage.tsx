import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowUp, ArrowDown, Download, TrendingUp, Users, Zap, Target } from "lucide-react";

export default function KPIDashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "quarter" | "year">("month");
  const [subscriptionTier, setSubscriptionTier] = useState<"starter" | "professional" | "enterprise">("professional");

  const dealershipId = user?.id?.toString() || "";

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.dashboard.getDashboard.useQuery(
    {
      dealershipId: dealershipId || "1",
      period,
      subscriptionTier,
    },
    { enabled: !!dealershipId }
  );

  // Fetch historical data for charts
  const { data: kpiHistory, isLoading: historyLoading } = trpc.dashboard.getKPIHistory.useQuery(
    {
      dealershipId: dealershipId || "1",
      days: period === "today" ? 7 : period === "week" ? 14 : period === "month" ? 30 : period === "quarter" ? 90 : 365,
    },
    { enabled: !!dealershipId }
  );

  // Fetch comparison data
  const { data: comparisonData } = trpc.dashboard.getComparison.useQuery(
    {
      dealershipId: dealershipId || "1",
      period: period as "week" | "month" | "quarter" | "year",
    },
    { enabled: !!dealershipId && period !== "today" }
  );

  const isLoading = dashboardLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No data available. Please check back later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { kpis, roi } = dashboardData;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Metric card component
  const MetricCard = ({
    title,
    value,
    unit = "",
    icon: Icon,
    trend,
    trendLabel,
    color = "bg-blue-50",
  }: {
    title: string;
    value: string | number;
    unit?: string;
    icon?: any;
    trend?: number;
    trendLabel?: string;
    color?: string;
  }) => (
    <Card className={color}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">
              {value}
              {unit && <span className="text-lg ml-1">{unit}</span>}
            </p>
            {trend !== undefined && (
              <p className={`text-sm mt-2 flex items-center ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                {Math.abs(trend).toFixed(1)}% {trendLabel}
              </p>
            )}
          </div>
          {Icon && <Icon className="w-8 h-8 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KPI Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your dealership's performance and ROI</p>
        </div>
        <div className="flex gap-4">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={kpis.totalLeads}
          icon={Users}
          trend={kpis.leadTrend}
          trendLabel="vs last period"
          color="bg-blue-50"
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercent(kpis.conversionRate)}
          icon={Target}
          trend={kpis.conversionTrend}
          trendLabel="vs last period"
          color="bg-green-50"
        />
        <MetricCard
          title="Estimated ROI"
          value={formatPercent(kpis.estimatedROI)}
          icon={TrendingUp}
          color="bg-purple-50"
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(kpis.estimatedMonthlyRevenue)}
          icon={Zap}
          color="bg-amber-50"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Lead Metrics</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Trend</CardTitle>
                <CardDescription>Leads captured over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={kpiHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Trend</CardTitle>
                <CardDescription>Test drive conversions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpiHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Estimated monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={kpiHistory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" name="Revenue (R)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Metrics Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Qualified Leads"
              value={kpis.qualifiedLeads}
              icon={Target}
              color="bg-green-50"
            />
            <MetricCard
              title="Qualification Rate"
              value={formatPercent(kpis.qualificationRate)}
              icon={TrendingUp}
              color="bg-blue-50"
            />
            <MetricCard
              title="Avg Lead Score"
              value={kpis.averageLeadScore.toFixed(1)}
              unit="/100"
              color="bg-purple-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Avg Response Time"
              value={(kpis.averageResponseTime / 1000).toFixed(2)}
              unit="s"
              color="bg-amber-50"
            />
            <MetricCard
              title="Response Time P95"
              value={(kpis.responseTimeP95 / 1000).toFixed(2)}
              unit="s"
              color="bg-amber-50"
            />
            <MetricCard
              title="Response Time P99"
              value={(kpis.responseTimeP99 / 1000).toFixed(2)}
              unit="s"
              color="bg-amber-50"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lead Score Distribution</CardTitle>
              <CardDescription>Distribution of lead quality scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "High Quality (70+)", value: kpis.qualifiedLeads, fill: "#10b981" },
                      { name: "Medium Quality (40-70)", value: Math.max(0, kpis.totalLeads - kpis.qualifiedLeads - Math.floor(kpis.totalLeads * 0.1)), fill: "#f59e0b" },
                      { name: "Low Quality (<40)", value: Math.floor(kpis.totalLeads * 0.1), fill: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Analysis Tab */}
        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Monthly Subscription"
              value={formatCurrency(roi.monthlySubscriptionCost)}
              color="bg-red-50"
            />
            <MetricCard
              title="Monthly Revenue"
              value={formatCurrency(roi.estimatedMonthlyRevenue)}
              color="bg-green-50"
            />
            <MetricCard
              title="Net Monthly Profit"
              value={formatCurrency(roi.netMonthlyProfit)}
              trend={roi.netMonthlyProfit > 0 ? 100 : -100}
              trendLabel={roi.netMonthlyProfit > 0 ? "Profitable" : "Loss"}
              color={roi.netMonthlyProfit > 0 ? "bg-green-50" : "bg-red-50"}
            />
            <MetricCard
              title="Profit Margin"
              value={formatPercent(roi.profitMargin)}
              color="bg-purple-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Cost Per Lead"
              value={formatCurrency(roi.costPerLead)}
              color="bg-amber-50"
            />
            <MetricCard
              title="Cost Per Conversion"
              value={formatCurrency(roi.costPerConversion)}
              color="bg-amber-50"
            />
            <MetricCard
              title="Break-even Leads"
              value={roi.breakEvenLeads}
              color="bg-blue-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Payback Period"
              value={roi.paybackPeriod}
              unit="days"
              color="bg-blue-50"
            />
            <MetricCard
              title="Annual Projected Revenue"
              value={formatCurrency(roi.annualProjectedRevenue)}
              color="bg-green-50"
            />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Platform Uptime"
              value={formatPercent(kpis.platformUptime)}
              color="bg-green-50"
            />
            <MetricCard
              title="Webhook Delivery"
              value={formatPercent(kpis.webhookDeliveryRate)}
              color="bg-green-50"
            />
            <MetricCard
              title="API Response Time"
              value={kpis.apiResponseTime}
              unit="ms"
              color="bg-blue-50"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Growth Metrics</CardTitle>
              <CardDescription>Month-over-month growth analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Lead Growth</p>
                  <p className="text-2xl font-bold mt-2">{formatPercent(roi.monthlyGrowth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Growth</p>
                  <p className="text-2xl font-bold mt-2">{formatPercent(roi.conversionGrowth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue Growth</p>
                  <p className="text-2xl font-bold mt-2">{formatPercent(roi.revenueGrowth)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
