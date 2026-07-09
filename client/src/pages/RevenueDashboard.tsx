import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, TrendingUp, DollarSign, ShoppingCart, Target } from "lucide-react";
import { format } from "date-fns";

export function RevenueDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month");

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  if (dateRange === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (dateRange === "month") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  // Fetch sales data
  const { data: salesData, isLoading } = trpc.marketplace.getDealershipSales.useQuery(
    {
      dealershipId: user?.dealershipId || 0,
      startDate,
      endDate,
    },
    {
      enabled: !!user?.dealershipId,
    }
  );

  const sales = salesData?.sales || [];
  const metrics = salesData?.metrics || {
    totalSales: 0,
    totalAmount: 0,
    dealershipTotal: 0,
    grayarxTotal: 0,
    averageSalePrice: 0,
  };

  if (!user?.dealershipId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">You need to be associated with a dealership to view this dashboard.</p>
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Revenue Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Track your sales, commissions, and payouts
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{metrics.totalSales}</div>
                  <p className="text-xs text-muted-foreground mt-1">vehicles sold</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    R{metrics.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">combined sales value</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-gradient-to-br from-green-50 to-green-5 dark:from-green-950 dark:to-green-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Your Earnings (80%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    R{metrics.dealershipTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">your share</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Average Sale Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    R{metrics.averageSalePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">per vehicle</p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Table */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  Sales from {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No sales recorded in this period.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Source</th>
                          <th className="text-right py-3 px-4 font-semibold text-foreground">Sale Price</th>
                          <th className="text-right py-3 px-4 font-semibold text-foreground">Your Earnings</th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((sale) => (
                          <tr key={sale.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              {sale.saleDate ? format(new Date(sale.saleDate), "MMM d, yyyy") : "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-foreground">{sale.customerName}</p>
                                <p className="text-xs text-muted-foreground">{sale.customerEmail || "N/A"}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="capitalize">
                                {sale.source.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              R{Number(sale.salePrice).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                              R{Number(sale.dealershipRevenue).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={sale.status === "sold" ? "default" : "secondary"}
                                className="capitalize"
                              >
                                {sale.status.replace("_", " ")}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Breakdown */}
            <Card className="border-border mt-8">
              <CardHeader>
                <CardTitle>Commission Breakdown</CardTitle>
                <CardDescription>How your earnings are calculated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">Total Sales Value</span>
                    <span className="text-lg font-bold">R{metrics.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <span className="font-medium text-green-700 dark:text-green-300">Your Share (80%)</span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      R{metrics.dealershipTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <span className="font-medium text-amber-700 dark:text-amber-300">GrayArx Commission (20%)</span>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                      R{metrics.grayarxTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
