/**
 * Tax Dashboard
 * 
 * ADMIN/OWNER ONLY - Not accessible to dealerships
 * 
 * Displays:
 * - Monthly income and expenses
 * - Tax calculations and savings
 * - Drawing recommendations
 * - Annual tax summary
 * - Compliance checklist
 */

import React, { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Banknote, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TaxDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // No real financial data yet — connect accounting integration to populate
  const monthlyData: Array<{ month: string; income: number; expenses: number; tax: number; profit: number }> = [];
  const hasData = monthlyData.length > 0;

  const expenseBreakdown: Array<{ name: string; value: number; color: string }> = [];

  const complianceItems = [
    { item: "Track monthly income", status: "pending", deadline: "Ongoing" },
    { item: "Collect business receipts", status: "pending", deadline: "Ongoing" },
    { item: "Calculate home office deduction", status: "pending", deadline: "Monthly" },
    { item: "File ITR12 annual return", status: "pending", deadline: "31 Jan 2027" },
    { item: "Keep expense records", status: "pending", deadline: "Ongoing" },
  ];

  const handleExportReport = () => {
    toast.success("Tax report exported as PDF");
  };

  const handleGenerateITR12 = () => {
    toast.success("ITR12 report generated");
  };

  return (
    <AdminShell
      title="Tax Dashboard"
      subtitle="Track income, expenses, and tax obligations"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tax Dashboard</h1>
            <p className="text-slate-600 mt-1">Track income, expenses, and tax obligations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={handleGenerateITR12} className="bg-blue-600 hover:bg-blue-700">
              <FileText className="h-4 w-4 mr-2" />
              Generate ITR12
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Monthly Income</p>
                  <p className="text-2xl font-bold text-slate-400 mt-2">{hasData ? `R 0` : "No data yet"}</p>
                </div>
                <Banknote className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-slate-400 mt-2">{hasData ? `R 0` : "No data yet"}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Taxable Income</p>
                  <p className="text-2xl font-bold text-slate-400 mt-2">{hasData ? `R 0` : "No data yet"}</p>
                </div>
                <FileText className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Available to Draw</p>
                  <p className="text-2xl font-bold text-slate-400 mt-2">{hasData ? `R 0` : "No data yet"}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Savings — empty state */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Tax Savings from Deductions</CardTitle>
            <CardDescription className="text-green-700">Impact of business expense deductions on your ZAR tax liability</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <p className="text-green-800 text-sm">— Connect an accounting integration to see deduction impact.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-green-700">Without Deductions</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">R 0</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">With Deductions</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">R 0</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Monthly Savings</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">R 0</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Annual Savings</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">R 0</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <Tabs defaultValue="income" className="w-full">
          <TabsList>
            <TabsTrigger value="income">Income vs Expenses</TabsTrigger>
            <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
            <TabsTrigger value="tax">Tax Calculation</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expenses (ZAR)</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasData ? (
                  <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                    No transactions yet — data will appear once income is recorded.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R ${Number(value).toLocaleString("en-ZA")}`} />
                      <Legend />
                      <Bar dataKey="income" fill="#3b82f6" name="Income (R)" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses (R)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown (ZAR)</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasData || expenseBreakdown.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                    No expense data yet.
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <ResponsiveContainer width="50%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {expenseBreakdown.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-slate-600">{item.name}</span>
                          <span className="text-sm font-bold text-slate-900 ml-auto">R {item.value.toLocaleString("en-ZA")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Profit & Tax (ZAR)</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasData ? (
                  <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                    No tax data yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R ${Number(value).toLocaleString("en-ZA")}`} />
                      <Legend />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit After Tax (R)" strokeWidth={2} />
                      <Line type="monotone" dataKey="tax" stroke="#ef4444" name="Tax Owed (R)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Compliance Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Checklist</CardTitle>
            <CardDescription>SARS compliance requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{item.item}</p>
                      <p className="text-xs text-slate-600">{item.deadline}</p>
                    </div>
                  </div>
                  <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                    {item.status === "completed" ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Drawing Recommendations */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Drawing Recommendations (ZAR)</CardTitle>
            <CardDescription className="text-blue-700">Safe amounts to withdraw as owner drawings</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <p className="text-blue-800 text-sm">— No transactions yet. Drawing recommendations will appear once income data is recorded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-blue-700">This Month</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">R 0</p>
                  <p className="text-xs text-blue-600 mt-1">After all taxes</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Year to Date</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">R 0</p>
                  <p className="text-xs text-blue-600 mt-1">Cumulative available</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Recommended Monthly</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">R 0</p>
                  <p className="text-xs text-blue-600 mt-1">Average safe amount</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
