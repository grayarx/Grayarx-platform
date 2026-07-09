import React, { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../_core/hooks/useAuth";

export function ChatbotPerformanceAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30");

  // Mock data for performance metrics
  const performanceData = [
    { date: "May 1", successScore: 72, conversations: 24, satisfaction: 68 },
    { date: "May 5", successScore: 75, conversations: 28, satisfaction: 71 },
    { date: "May 10", successScore: 78, conversations: 32, satisfaction: 74 },
    { date: "May 15", successScore: 82, conversations: 35, satisfaction: 79 },
    { date: "May 20", successScore: 85, conversations: 38, satisfaction: 82 },
    { date: "May 25", successScore: 88, conversations: 42, satisfaction: 85 },
    { date: "May 29", successScore: 91, conversations: 45, satisfaction: 88 },
  ];

  const learningProfile = {
    totalConversations: 245,
    averageSuccessScore: 91,
    learningTrend: "improving",
    adaptedPrompts: ["Financing questions", "Inventory matching", "Test drive booking", "Trade-in evaluation"],
    frequentMistakes: ["Unclear pricing", "Inventory confusion", "Timeline misunderstanding"],
    bestResponses: ["Financing explanations", "Vehicle recommendations", "Dealership benefits"],
  };

  const improvementAreas = [
    { area: "Reduce pricing confusion", impact: "High", status: "In Progress" },
    { area: "Improve inventory accuracy", impact: "High", status: "Completed" },
    { area: "Better timeline management", impact: "Medium", status: "Planned" },
    { area: "Enhanced trade-in explanations", impact: "Medium", status: "In Progress" },
  ];

  const getTrendColor = (trend: string) => {
    if (trend === "improving") return "text-green-500";
    if (trend === "stable") return "text-blue-500";
    return "text-red-500";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return "📈";
    if (trend === "stable") return "➡️";
    return "📉";
  };

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "bg-green-100 text-green-800";
    if (status === "In Progress") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Chatbot Performance Analytics</h1>
          <p className="text-gray-400">Track your AI chatbot's learning progress and continuous improvement</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="text-gray-400 text-sm mb-2">Success Score</div>
            <div className="text-3xl font-bold text-white">{learningProfile.averageSuccessScore}%</div>
            <div className={`text-sm mt-2 ${getTrendColor(learningProfile.learningTrend)}`}>
              {getTrendIcon(learningProfile.learningTrend)} {learningProfile.learningTrend}
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="text-gray-400 text-sm mb-2">Total Conversations</div>
            <div className="text-3xl font-bold text-white">{learningProfile.totalConversations}</div>
            <div className="text-amber-500 text-sm mt-2">↑ 45 this week</div>
          </Card>

          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="text-gray-400 text-sm mb-2">Patterns Learned</div>
            <div className="text-3xl font-bold text-white">{learningProfile.adaptedPrompts.length}</div>
            <div className="text-green-500 text-sm mt-2">✓ Auto-adapted</div>
          </Card>

          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="text-gray-400 text-sm mb-2">Improvement Areas</div>
            <div className="text-3xl font-bold text-white">{improvementAreas.length}</div>
            <div className="text-blue-500 text-sm mt-2">Being addressed</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="performance" className="mb-8">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="performance" className="text-white">Performance Trends</TabsTrigger>
            <TabsTrigger value="learning" className="text-white">Learning Profile</TabsTrigger>
            <TabsTrigger value="improvements" className="text-white">Improvements</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Success Score Trend */}
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">Success Score Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #4B5563" }} />
                    <Area type="monotone" dataKey="successScore" stroke="#F59E0B" fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Conversation Volume */}
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">Conversation Volume</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #4B5563" }} />
                    <Bar dataKey="conversations" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Customer Satisfaction */}
              <Card className="bg-gray-800 border-gray-700 p-6 lg:col-span-2">
                <h3 className="text-white font-semibold mb-4">Customer Satisfaction Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #4B5563" }} />
                    <Legend />
                    <Line type="monotone" dataKey="satisfaction" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981" }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Learning Profile Tab */}
          <TabsContent value="learning" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patterns Learned */}
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">Patterns Learned</h3>
                <div className="space-y-3">
                  {learningProfile.adaptedPrompts.map((pattern, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-white text-sm">{pattern}</span>
                      <span className="ml-auto text-amber-500 text-xs font-semibold">AUTO-ADAPTED</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Best Responses */}
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">Best Responses</h3>
                <div className="space-y-3">
                  {learningProfile.bestResponses.map((response, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-white text-sm">{response}</span>
                      <span className="ml-auto text-green-500 text-xs font-semibold">⭐ EXCELLENT</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Frequent Mistakes */}
              <Card className="bg-gray-800 border-gray-700 p-6 lg:col-span-2">
                <h3 className="text-white font-semibold mb-4">Mistakes Being Corrected</h3>
                <div className="space-y-3">
                  {learningProfile.frequentMistakes.map((mistake, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-white text-sm">{mistake}</span>
                      <span className="ml-auto text-orange-500 text-xs font-semibold">🔧 FIXING</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Improvements Tab */}
          <TabsContent value="improvements" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">Improvement Roadmap</h3>
              <div className="space-y-3">
                {improvementAreas.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-700 rounded">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.area}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {item.impact} Impact
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.status === "Completed"
                            ? "bg-green-500 w-full"
                            : item.status === "In Progress"
                            ? "bg-blue-500 w-2/3"
                            : "bg-gray-500 w-1/3"
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Self-Improvement Summary */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">Self-Improvement Summary</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-900 bg-opacity-30 border border-green-700 rounded">
                  <p className="text-green-400 font-medium">✓ Excellent Performance</p>
                  <p className="text-green-300 text-sm mt-2">Your chatbot is performing excellently with a 91% success score. It's continuously learning and improving from every conversation.</p>
                </div>

                <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded">
                  <p className="text-blue-400 font-medium">📈 Improvement Trend</p>
                  <p className="text-blue-300 text-sm mt-2">Success score has improved by 19% over the last 28 days. The chatbot is getting smarter with every interaction.</p>
                </div>

                <div className="p-4 bg-purple-900 bg-opacity-30 border border-purple-700 rounded">
                  <p className="text-purple-400 font-medium">🎯 Focus Areas</p>
                  <p className="text-purple-300 text-sm mt-2">Continue focusing on reducing pricing confusion and improving inventory accuracy for even better results.</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ChatbotPerformanceAnalytics;
