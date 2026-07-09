import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { TrendingUp, Users, ShoppingCart, Eye, BarChart3 } from "lucide-react";
import { format } from "date-fns";

export function MarketplaceAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month");

  // Mock analytics data (backend procedures not yet implemented)
  const analytics = {
    totalViews: 2847,
    totalInquiries: 156,
    totalSales: 28,
    conversionRate: 5.5,
    averageLeadTime: 18,
    topVehicles: [
      {
        year: 2023,
        make: "Toyota",
        model: "Hilux",
        views: 342,
        inquiries: 28,
        conversionRate: 8.2,
      },
      {
        year: 2022,
        make: "BMW",
        model: "X5",
        views: 298,
        inquiries: 19,
        conversionRate: 6.4,
      },
      {
        year: 2024,
        make: "Mercedes",
        model: "C-Class",
        views: 267,
        inquiries: 15,
        conversionRate: 5.6,
      },
    ],
    topSources: [
      { source: "marketplace", count: 892, percentage: 45 },
      { source: "google_search", count: 654, percentage: 33 },
      { source: "social_media", count: 287, percentage: 15 },
      { source: "direct", count: 114, percentage: 7 },
    ],
    dailyMetrics: [
      { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), views: 145, inquiries: 8 },
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), views: 167, inquiries: 12 },
      { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), views: 189, inquiries: 14 },
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), views: 156, inquiries: 10 },
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), views: 198, inquiries: 15 },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), views: 212, inquiries: 18 },
      { date: new Date(), views: 180, inquiries: 13 },
    ],
  };

  if (!user?.dealershipId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">You need to be associated with a dealership to view analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Marketplace Analytics</h1>
          <p className="text-lg text-muted-foreground">
            Track your showroom performance and customer engagement
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2 mb-8">
          {(["week", "month", "year"] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              onClick={() => setDateRange(range)}
              className="capitalize"
            >
              Last {range}
            </Button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">vehicle page views</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics.totalInquiries}</div>
              <p className="text-xs text-muted-foreground mt-1">customer inquiries</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analytics.conversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">inquiries to sales</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Avg Lead Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics.averageLeadTime}</div>
              <p className="text-xs text-muted-foreground mt-1">hours to convert</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Vehicles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Performing Vehicles
              </CardTitle>
              <CardDescription>Most viewed and inquired vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topVehicles.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topVehicles.map((vehicle, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.views} views • {vehicle.inquiries} inquiries
                        </p>
                      </div>
                      <Badge variant="outline">{vehicle.conversionRate}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Traffic Sources
              </CardTitle>
              <CardDescription>Where your customers come from</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topSources.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground capitalize">
                          {source.source.replace("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {source.percentage}% of traffic
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{source.count}</p>
                        <p className="text-xs text-muted-foreground">visitors</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Metrics Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
            <CardDescription>
              Views and inquiries over the last {dateRange === "week" ? "7 days" : dateRange === "month" ? "30 days" : "365 days"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyMetrics.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No data available for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Views</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Inquiries</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.dailyMetrics.map((metric, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          {format(new Date(metric.date), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">{metric.views}</td>
                        <td className="py-3 px-4 text-right font-medium">{metric.inquiries}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {metric.views > 0
                            ? ((metric.inquiries / metric.views) * 100).toFixed(1)
                            : "0"}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <Card className="border-border mt-8 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Optimize top performers:</strong> Focus marketing on your best-converting vehicles
                </span>
              </li>
              <li className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Improve response time:</strong> Faster responses lead to higher conversion rates
                </span>
              </li>
              <li className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Expand inventory:</strong> Add more vehicles similar to your top performers
                </span>
              </li>
              <li className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Leverage top sources:</strong> Double down on channels driving the most traffic
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
