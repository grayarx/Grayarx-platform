import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

interface PricingTier {
  name: string;
  basePrice: number;
  leadPrice: number;
  bookingPrice: number;
  salePrice: number;
  features: string[];
  color: string;
}

const PRICING_TIERS: Record<string, PricingTier> = {
  starter: {
    name: "Starter",
    basePrice: 1500,
    leadPrice: 50,
    bookingPrice: 200,
    salePrice: 0,
    features: [
      "Up to 5 team members",
      "50 leads/month included",
      "Email & SMS support",
      "Basic analytics",
      "1 dealership location",
    ],
    color: "from-blue-500 to-blue-600",
  },
  professional: {
    name: "Professional",
    basePrice: 3500,
    leadPrice: 40,
    bookingPrice: 150,
    salePrice: 500,
    features: [
      "Up to 15 team members",
      "Unlimited leads",
      "WhatsApp integration",
      "Advanced analytics",
      "5 dealership locations",
      "Priority support",
      "Custom branding",
    ],
    color: "from-purple-500 to-purple-600",
  },
  enterprise: {
    name: "Enterprise",
    basePrice: 7500,
    leadPrice: 30,
    bookingPrice: 100,
    salePrice: 300,
    features: [
      "Unlimited team members",
      "Unlimited leads",
      "Full WhatsApp integration",
      "Real-time analytics",
      "Unlimited locations",
      "24/7 dedicated support",
      "Custom integrations",
      "API access",
      "SLA guarantee",
    ],
    color: "from-yellow-500 to-yellow-600",
  },
};

export function PricingSimulator() {
  const [staffCount, setStaffCount] = useState(8);
  const [monthlyLeads, setMonthlyLeads] = useState(40);
  const [conversionRate, setConversionRate] = useState(25);
  const [bookingRate, setBookingRate] = useState(40);
  const [saleRate, setSaleRate] = useState(50);
  const [averageSalePrice, setAverageSalePrice] = useState(350000);

  const getTier = (staff: number) => {
    if (staff <= 5) return "starter";
    if (staff <= 15) return "professional";
    return "enterprise";
  };

  const currentTier = getTier(staffCount);

  const pricing = useMemo(() => {
    const tier = PRICING_TIERS[currentTier];
    const bookings = monthlyLeads * (conversionRate / 100) * (bookingRate / 100);
    const sales = bookings * (saleRate / 100);

    const leadCharges = monthlyLeads * tier.leadPrice;
    const bookingCharges = bookings * tier.bookingPrice;
    const saleCharges = sales * tier.salePrice;

    const totalMonthlyPrice = tier.basePrice + leadCharges + bookingCharges + saleCharges;
    const revenue = sales * averageSalePrice;
    const roi = revenue > 0 ? ((revenue - totalMonthlyPrice) / totalMonthlyPrice) * 100 : 0;

    return {
      tier,
      bookings,
      sales,
      leadCharges,
      bookingCharges,
      saleCharges,
      totalMonthlyPrice,
      revenue,
      roi,
      annualPrice: totalMonthlyPrice * 12,
      annualRevenue: revenue * 12,
    };
  }, [staffCount, monthlyLeads, conversionRate, bookingRate, saleRate, averageSalePrice, currentTier]);

  // 12-month projection
  const projectionData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    cost: pricing.totalMonthlyPrice * (i + 1),
    revenue: pricing.revenue * (i + 1),
    profit: (pricing.revenue - pricing.totalMonthlyPrice) * (i + 1),
  }));

  // Cost breakdown
  const costBreakdown = [
    { name: "Base", value: pricing.tier.basePrice },
    { name: "Leads", value: pricing.leadCharges },
    { name: "Bookings", value: pricing.bookingCharges },
    { name: "Sales", value: pricing.saleCharges },
  ].filter((item) => item.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Pricing Simulator</h1>
          <p className="text-xl text-slate-300">See your exact pricing and ROI in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Your Setup</CardTitle>
                <CardDescription className="text-slate-400">Customize your parameters</CardDescription>
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
                    {currentTier.toUpperCase()} TIER
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
                  <Label className="text-slate-200">Lead to Booking: {conversionRate}%</Label>
                  <Slider
                    value={[conversionRate]}
                    onValueChange={(val) => setConversionRate(val[0])}
                    min={5}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Booking Rate */}
                <div>
                  <Label className="text-slate-200">Booking to Test Drive: {bookingRate}%</Label>
                  <Slider
                    value={[bookingRate]}
                    onValueChange={(val) => setBookingRate(val[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Sale Rate */}
                <div>
                  <Label className="text-slate-200">Test Drive to Sale: {saleRate}%</Label>
                  <Slider
                    value={[saleRate]}
                    onValueChange={(val) => setSaleRate(val[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Average Sale Price */}
                <div>
                  <Label className="text-slate-200">Avg Sale Price (R)</Label>
                  <Input
                    type="number"
                    value={averageSalePrice}
                    onChange={(e) => setAverageSalePrice(parseInt(e.target.value) || 0)}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
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
                  <p className="text-green-200 text-sm">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-white mt-2">R{pricing.revenue.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
                <CardContent className="pt-6">
                  <p className="text-blue-200 text-sm">Monthly Cost</p>
                  <p className="text-3xl font-bold text-white mt-2">R{pricing.totalMonthlyPrice.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
                <CardContent className="pt-6">
                  <p className="text-purple-200 text-sm">ROI</p>
                  <p className="text-3xl font-bold text-white mt-2">{pricing.roi.toFixed(0)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Details */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Pricing Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                    <span className="text-slate-300">Base Subscription</span>
                    <span className="text-white font-bold">R{pricing.tier.basePrice.toLocaleString()}</span>
                  </div>
                  {pricing.leadCharges > 0 && (
                    <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                      <span className="text-slate-300">{monthlyLeads} Leads @ R{pricing.tier.leadPrice}</span>
                      <span className="text-white font-bold">R{pricing.leadCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {pricing.bookingCharges > 0 && (
                    <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                      <span className="text-slate-300">
                        {pricing.bookings.toFixed(0)} Bookings @ R{pricing.tier.bookingPrice}
                      </span>
                      <span className="text-white font-bold">R{pricing.bookingCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {pricing.saleCharges > 0 && (
                    <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                      <span className="text-slate-300">
                        {pricing.sales.toFixed(0)} Sales @ R{pricing.tier.salePrice}
                      </span>
                      <span className="text-white font-bold">R{pricing.saleCharges.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-3 bg-yellow-900 rounded border border-yellow-700 mt-2">
                    <span className="text-yellow-200 font-bold">Total Monthly</span>
                    <span className="text-yellow-100 font-bold text-lg">R{pricing.totalMonthlyPrice.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 12-Month Projection */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">12-Month Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Legend />
                    <Line type="monotone" dataKey="cost" stroke="#ef4444" name="Cost" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" name="Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown Chart */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Monthly Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={costBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="value" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Annual Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Annual Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700 p-4 rounded">
                    <p className="text-slate-400 text-sm">Annual Cost</p>
                    <p className="text-2xl font-bold text-white mt-2">R{pricing.annualPrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded">
                    <p className="text-slate-400 text-sm">Annual Revenue</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">R{pricing.annualRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tier Comparison */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-white mb-8">Compare All Tiers</h2>
          <Tabs defaultValue="starter" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
              {Object.entries(PRICING_TIERS).map(([key, tier]) => (
                <TabsTrigger key={key} value={key} className="text-white">
                  {tier.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(PRICING_TIERS).map(([key, tier]) => (
              <TabsContent key={key} value={key}>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-4">{tier.name}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between p-2 bg-slate-700 rounded">
                            <span className="text-slate-300">Base</span>
                            <span className="text-white font-bold">R{tier.basePrice.toLocaleString()}/mo</span>
                          </div>
                          <div className="flex justify-between p-2 bg-slate-700 rounded">
                            <span className="text-slate-300">Per Lead</span>
                            <span className="text-white font-bold">R{tier.leadPrice}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-slate-700 rounded">
                            <span className="text-slate-300">Per Booking</span>
                            <span className="text-white font-bold">R{tier.bookingPrice}</span>
                          </div>
                          {tier.salePrice > 0 && (
                            <div className="flex justify-between p-2 bg-slate-700 rounded">
                              <span className="text-slate-300">Per Sale</span>
                              <span className="text-white font-bold">R{tier.salePrice}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Features</h4>
                        <ul className="space-y-2">
                          {tier.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-slate-300">
                              <Check className="h-5 w-5 text-green-400" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
