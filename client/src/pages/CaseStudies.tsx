import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Users, Zap } from "lucide-react";

interface CaseStudy {
  id: string;
  dealershipName: string;
  location: string;
  staffCount: number;
  tier: "starter" | "professional" | "enterprise";
  monthsActive: number;
  metrics: {
    leadsGenerated: number;
    conversionRate: number;
    testDrivesBooked: number;
    salesClosed: number;
    revenueGenerated: number;
    profitIncrease: number;
  };
  testimonial: string;
  managerName: string;
  managerTitle: string;
  rating: number;
  results: string[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "case-1",
    dealershipName: "Johannesburg Motors",
    location: "Johannesburg, Gauteng",
    staffCount: 8,
    tier: "professional",
    monthsActive: 6,
    metrics: {
      leadsGenerated: 240,
      conversionRate: 28,
      testDrivesBooked: 67,
      salesClosed: 42,
      revenueGenerated: 14700000,
      profitIncrease: 3100000,
    },
    testimonial:
      "GrayArx has completely transformed how we manage leads. We went from manually tracking everything to having AI handle it all 24/7. Our sales team can focus on closing deals instead of chasing leads. The ROI is incredible.",
    managerName: "John Smith",
    managerTitle: "Sales Manager",
    rating: 5,
    results: ["+336% leads", "+425% sales", "+368% revenue", "6-week payback"],
  },
  {
    id: "case-2",
    dealershipName: "Cape Town Auto Group",
    location: "Cape Town, Western Cape",
    staffCount: 12,
    tier: "professional",
    monthsActive: 4,
    metrics: {
      leadsGenerated: 156,
      conversionRate: 26,
      testDrivesBooked: 41,
      salesClosed: 28,
      revenueGenerated: 9800000,
      profitIncrease: 1950000,
    },
    testimonial:
      "The WhatsApp integration is a game-changer. Our customers prefer WhatsApp, and now we can respond instantly with AI. Conversion rates jumped immediately. The success playbook helped us onboard smoothly.",
    managerName: "Sarah Johnson",
    managerTitle: "Operations Director",
    rating: 5,
    results: ["+280% leads", "+350% sales", "+310% revenue", "4-week payback"],
  },
  {
    id: "case-3",
    dealershipName: "Durban Premium Cars",
    location: "Durban, KwaZulu-Natal",
    staffCount: 5,
    tier: "starter",
    monthsActive: 3,
    metrics: {
      leadsGenerated: 72,
      conversionRate: 22,
      testDrivesBooked: 16,
      salesClosed: 12,
      revenueGenerated: 4200000,
      profitIncrease: 720000,
    },
    testimonial:
      "As a smaller dealership, we couldn't afford expensive CRM systems. GrayArx is affordable and actually works. We're now competing with much larger dealerships. Best decision we made this year.",
    managerName: "Themba Ndlovu",
    managerTitle: "Owner",
    rating: 5,
    results: ["+240% leads", "+300% sales", "+280% revenue", "3-week payback"],
  },
  {
    id: "case-4",
    dealershipName: "Pretoria Luxury Motors",
    location: "Pretoria, Gauteng",
    staffCount: 18,
    tier: "enterprise",
    monthsActive: 5,
    metrics: {
      leadsGenerated: 320,
      conversionRate: 32,
      testDrivesBooked: 102,
      salesClosed: 68,
      revenueGenerated: 23800000,
      profitIncrease: 5200000,
    },
    testimonial:
      "We manage multiple dealership locations. GrayArx's enterprise tier handles our volume perfectly. The analytics dashboard gives us insights we never had before. We're planning to roll out to all our locations.",
    managerName: "Michael Chen",
    managerTitle: "Regional Manager",
    rating: 5,
    results: ["+400% leads", "+500% sales", "+420% revenue", "5-week payback"],
  },
];

export function CaseStudies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Real Results from Real Dealerships</h1>
          <p className="text-xl text-slate-300">See how GrayArx is transforming dealerships across South Africa</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Active Dealerships</p>
                <p className="text-3xl font-bold text-white mt-2">{CASE_STUDIES.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Total Leads Generated</p>
                <p className="text-3xl font-bold text-green-400 mt-2">
                  {CASE_STUDIES.reduce((sum, cs) => sum + cs.metrics.leadsGenerated, 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Total Sales Closed</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">
                  {CASE_STUDIES.reduce((sum, cs) => sum + cs.metrics.salesClosed, 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Total Revenue Generated</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">
                  R{(CASE_STUDIES.reduce((sum, cs) => sum + cs.metrics.revenueGenerated, 0) / 1000000).toFixed(1)}M
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Studies */}
        <div className="space-y-8">
          {CASE_STUDIES.map((caseStudy) => (
            <Card key={caseStudy.id} className="bg-slate-800 border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
              <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">{caseStudy.dealershipName}</CardTitle>
                    <CardDescription className="text-slate-400 mt-1">{caseStudy.location}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: caseStudy.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Testimonial */}
                <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <p className="text-slate-200 italic mb-3">"{caseStudy.testimonial}"</p>
                  <p className="text-slate-400 text-sm">
                    — {caseStudy.managerName}, {caseStudy.managerTitle}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Staff Count
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">{caseStudy.staffCount}</p>
                      <Badge className="mt-2">{caseStudy.tier.toUpperCase()}</Badge>
                    </div>

                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Months Active
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">{caseStudy.monthsActive}</p>
                    </div>
                  </div>

                  {/* Middle Column */}
                  <div className="space-y-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Leads Generated</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">{caseStudy.metrics.leadsGenerated}</p>
                    </div>

                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Test Drives Booked</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">{caseStudy.metrics.testDrivesBooked}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Sales Closed</p>
                      <p className="text-2xl font-bold text-purple-400 mt-1">{caseStudy.metrics.salesClosed}</p>
                    </div>

                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Conversion Rate</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">{caseStudy.metrics.conversionRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Revenue Impact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-900 to-green-800 p-4 rounded-lg border border-green-700">
                    <p className="text-green-200 text-sm">Revenue Generated</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      R{(caseStudy.metrics.revenueGenerated / 1000000).toFixed(1)}M
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-4 rounded-lg border border-blue-700">
                    <p className="text-blue-200 text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Profit Increase
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      R{(caseStudy.metrics.profitIncrease / 1000000).toFixed(2)}M
                    </p>
                  </div>
                </div>

                {/* Key Results */}
                <div className="flex flex-wrap gap-2">
                  {caseStudy.results.map((result, idx) => (
                    <Badge key={idx} className="bg-yellow-900 text-yellow-200 hover:bg-yellow-800">
                      {result}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-300 mb-4">Ready to join these successful dealerships?</p>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg transition-colors">
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
