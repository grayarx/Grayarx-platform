import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, DollarSign, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

interface ROIData {
  monthlyLeads: number;
  conversionRate: number;
  averageSalePrice: number;
  currentMonthlyRevenue: number;
  currentMonthlySpend: number;
  grayarxMonthlyRevenue: number;
  grayarxMonthlySpend: number;
  monthlyProfit: number;
  annualProfit: number;
  roi: number;
  paybackMonths: number;
}

const TIER_PRICING = {
  starter: { base: 1500, lead: 50, booking: 200 },
  professional: { base: 3500, lead: 40, booking: 150 },
  enterprise: { base: 7500, lead: 30, booking: 100 },
};

export function ROICalculator() {
  const [staffCount, setStaffCount] = useState(8);
  const [monthlyLeads, setMonthlyLeads] = useState(40);
  const [conversionRate, setConversionRate] = useState(25);
  const [averageSalePrice, setAverageSalePrice] = useState(350000);
  const [currentMonthlySpend, setCurrentMonthlySpend] = useState(50000);

  const getTier = (staff: number) => {
    if (staff <= 5) return "starter";
    if (staff <= 15) return "professional";
    return "enterprise";
  };

  const tier = getTier(staffCount);
  const pricing = TIER_PRICING[tier as keyof typeof TIER_PRICING];

  const roi = useMemo(() => {
    // Current situation (without GrayArx)
    const currentLeads = Math.max(5, monthlyLeads * 0.3); // Assume 30% of GrayArx leads
    const currentBookings = currentLeads * (conversionRate / 100) * 0.4;
    const currentSales = currentBookings * 0.5;
    const currentMonthlyRevenue = currentSales * averageSalePrice;
    const currentProfit = currentMonthlyRevenue - currentMonthlySpend;

    // With GrayArx
    const grayarxBookings = monthlyLeads * (conversionRate / 100) * 0.4;
    const grayarxSales = grayarxBookings * 0.5;
    const grayarxMonthlyRevenue = grayarxSales * averageSalePrice;

    // GrayArx costs
    const leadCharges = monthlyLeads * pricing.lead;
    const bookingCharges = grayarxBookings * pricing.booking;
    const grayarxMonthlySpend = pricing.base + leadCharges + bookingCharges;

    const grayarxProfit = grayarxMonthlyRevenue - grayarxMonthlySpend;
    const monthlyProfit = grayarxProfit - currentProfit;
    const annualProfit = monthlyProfit * 12;

    const paybackMonths = grayarxMonthlySpend > 0 ? Math.ceil(grayarxMonthlySpend / monthlyProfit) : 0;
    const roiPercent = monthlyProfit > 0 ? ((monthlyProfit / grayarxMonthlySpend) * 100).toFixed(0) : "0";

    return {
      monthlyLeads,
      conversionRate,
      averageSalePrice,
      currentMonthlyRevenue,
      currentMonthlySpend,
      grayarxMonthlyRevenue,
      grayarxMonthlySpend,
      monthlyProfit,
      annualProfit,
      roi: parseInt(roiPercent),
      paybackMonths: Math.max(1, paybackMonths),
    };
  }, [staffCount, monthlyLeads, conversionRate, averageSalePrice, currentMonthlySpend, tier]);

  // 12-month projection
  const projectionData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    current: roi.currentMonthlyRevenue * (i + 1),
    grayarx: roi.grayarxMonthlyRevenue * (i + 1),
  }));

  // Monthly breakdown
  const breakdownData = [
    { name: "Base Fee", value: pricing.base },
    { name: "Lead Charges", value: monthlyLeads * pricing.lead },
    { name: "Booking Charges", value: (monthlyLeads * (conversionRate / 100) * 0.4) * pricing.booking },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">ROI Calculator</h1>
          <p className="text-xl text-slate-300">See exactly how much GrayArx will increase your dealership revenue</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Your Dealership</CardTitle>
                <CardDescription className="text-slate-400">Adjust your numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Staff Count */}
                <div>
                  <Label className="text-slate-200">Sales Staff: {staffCount}</Label>
                  <Slider
                    value={[staffCount]}
                    onValueChange={(val) => setStaffCount(val[0])}
                    min={1}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                  <Badge className="mt-2" variant="outline">
                    {tier.toUpperCase()} TIER - R{pricing.base.toLocaleString()}/mo
                  </Badge>
                </div>

                {/* Monthly Leads */}
                <div>
                  <Label className="text-slate-200">Monthly Leads: {monthlyLeads}</Label>
                  <Slider
                    value={[monthlyLeads]}
                    onValueChange={(val) => setMonthlyLeads(val[0])}
                    min={5}
                    max={200}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Conversion Rate */}
                <div>
                  <Label className="text-slate-200">Conversion Rate: {conversionRate}%</Label>
                  <Slider
                    value={[conversionRate]}
                    onValueChange={(val) => setConversionRate(val[0])}
                    min={5}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Average Sale Price */}
                <div>
                  <Label className="text-slate-200">Avg Sale Price</Label>
                  <Input
                    type="number"
                    value={averageSalePrice}
                    onChange={(e) => setAverageSalePrice(parseInt(e.target.value) || 0)}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
                    placeholder="R350,000"
                  />
                </div>

                {/* Current Monthly Spend */}
                <div>
                  <Label className="text-slate-200">Current Monthly Marketing Spend</Label>
                  <Input
                    type="number"
                    value={currentMonthlySpend}
                    onChange={(e) => setCurrentMonthlySpend(parseInt(e.target.value) || 0)}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
                    placeholder="R50,000"
                  />
                </div>

                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-200 text-sm">Monthly Profit Increase</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        R{roi.monthlyProfit.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-green-300 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm">Annual Profit Increase</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        R{roi.annualProfit.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-12 w-12 text-blue-300 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm">ROI</p>
                      <p className="text-3xl font-bold text-white mt-2">{roi.roi}%</p>
                      <p className="text-purple-300 text-xs mt-1">Payback: {roi.paybackMonths} month{roi.paybackMonths !== 1 ? "s" : ""}</p>
                    </div>
                    <Zap className="h-12 w-12 text-purple-300 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">GrayArx Monthly Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={breakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="value" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 12-Month Projection */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">12-Month Revenue Projection</CardTitle>
                <CardDescription className="text-slate-400">Cumulative revenue comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Legend />
                    <Line type="monotone" dataKey="current" stroke="#ef4444" name="Current Method" strokeWidth={2} />
                    <Line type="monotone" dataKey="grayarx" stroke="#22c55e" name="With GrayArx" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Comparison */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Current Monthly Revenue</p>
                      <p className="text-2xl font-bold text-white mt-1">R{roi.currentMonthlyRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">With GrayArx Monthly Revenue</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">R{roi.grayarxMonthlyRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Current Monthly Spend</p>
                      <p className="text-2xl font-bold text-white mt-1">R{roi.currentMonthlySpend.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">GrayArx Monthly Spend</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">R{roi.grayarxMonthlySpend.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
