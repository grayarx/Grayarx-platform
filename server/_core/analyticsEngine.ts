/**
 * Analytics Engine
 * Provides real-time metrics and insights for dealership dashboards
 */

export interface DashboardMetrics {
  leads: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    conversionRate: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    completed: number;
    testDriveConversionRate: number;
  };
  vehicles: {
    total: number;
    active: number;
    sold: number;
    averageTimeToSale: number;
  };
  sales: {
    totalRevenue: number;
    thisMonth: number;
    averageDealValue: number;
    topVehicles: Array<{ make: string; model: string; count: number }>;
  };
  performance: {
    leadResponseTime: number; // in minutes
    bookingToSaleConversion: number;
    customerSatisfaction: number; // 0-100
    agentPerformance: Array<{ agentName: string; leadsGenerated: number; conversionRate: number }>;
  };
}

export interface ConversionFunnel {
  stage: "lead" | "qualified" | "booking" | "test_drive" | "sale";
  count: number;
  conversionFromPrevious: number; // percentage
}

export interface TimeSeriesData {
  date: string;
  leads: number;
  bookings: number;
  sales: number;
  revenue: number;
}

export function calculateDashboardMetrics(data: {
  leads: any[];
  bookings: any[];
  vehicles: any[];
  sales: any[];
  agents: any[];
}): DashboardMetrics {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

  const leadsToday = data.leads.filter((l) => new Date(l.createdAt) >= today).length;
  const leadsThisWeek = data.leads.filter((l) => new Date(l.createdAt) >= weekAgo).length;
  const leadsThisMonth = data.leads.filter((l) => new Date(l.createdAt) >= monthAgo).length;

  const convertedLeads = data.leads.filter((l) => l.status === "qualified" || l.status === "converted").length;
  const leadConversionRate = data.leads.length > 0 ? (convertedLeads / data.leads.length) * 100 : 0;

  const confirmedBookings = data.bookings.filter((b) => b.status === "confirmed").length;
  const completedBookings = data.bookings.filter((b) => b.status === "completed").length;
  const testDriveConversion = data.bookings.length > 0 ? (completedBookings / data.bookings.length) * 100 : 0;

  const activeVehicles = data.vehicles.filter((v) => v.status === "active").length;
  const soldVehicles = data.vehicles.filter((v) => v.status === "sold").length;

  const totalRevenue = data.sales.reduce((sum, s) => sum + (s.amount || 0), 0);
  const thisMonthRevenue = data.sales
    .filter((s) => new Date(s.saleDate) >= monthAgo)
    .reduce((sum, s) => sum + (s.amount || 0), 0);
  const averageDealValue = data.sales.length > 0 ? totalRevenue / data.sales.length : 0;

  const topVehicles = getTopVehicles(data.sales);

  const avgResponseTime = calculateAverageResponseTime(data.leads);
  const bookingToSaleConversion = calculateBookingToSaleConversion(data.bookings, data.sales);

  return {
    leads: {
      total: data.leads.length,
      today: leadsToday,
      thisWeek: leadsThisWeek,
      thisMonth: leadsThisMonth,
      conversionRate: Math.round(leadConversionRate * 100) / 100,
    },
    bookings: {
      total: data.bookings.length,
      confirmed: confirmedBookings,
      pending: data.bookings.filter((b) => b.status === "pending").length,
      completed: completedBookings,
      testDriveConversionRate: Math.round(testDriveConversion * 100) / 100,
    },
    vehicles: {
      total: data.vehicles.length,
      active: activeVehicles,
      sold: soldVehicles,
      averageTimeToSale: calculateAverageTimeToSale(data.vehicles),
    },
    sales: {
      totalRevenue,
      thisMonth: thisMonthRevenue,
      averageDealValue: Math.round(averageDealValue),
      topVehicles,
    },
    performance: {
      leadResponseTime: avgResponseTime,
      bookingToSaleConversion: Math.round(bookingToSaleConversion * 100) / 100,
      customerSatisfaction: 85, // Placeholder - would come from feedback data
      agentPerformance: calculateAgentPerformance(data.agents, data.leads),
    },
  };
}

export function calculateConversionFunnel(data: {
  leads: any[];
  qualifiedLeads: any[];
  bookings: any[];
  testDrives: any[];
  sales: any[];
}): ConversionFunnel[] {
  const stages: ConversionFunnel[] = [
    {
      stage: "lead",
      count: data.leads.length,
      conversionFromPrevious: 100,
    },
  ];

  const qualifiedCount = data.qualifiedLeads.length;
  stages.push({
    stage: "qualified",
    count: qualifiedCount,
    conversionFromPrevious: data.leads.length > 0 ? (qualifiedCount / data.leads.length) * 100 : 0,
  });

  const bookingCount = data.bookings.length;
  stages.push({
    stage: "booking",
    count: bookingCount,
    conversionFromPrevious: qualifiedCount > 0 ? (bookingCount / qualifiedCount) * 100 : 0,
  });

  const testDriveCount = data.testDrives.length;
  stages.push({
    stage: "test_drive",
    count: testDriveCount,
    conversionFromPrevious: bookingCount > 0 ? (testDriveCount / bookingCount) * 100 : 0,
  });

  const saleCount = data.sales.length;
  stages.push({
    stage: "sale",
    count: saleCount,
    conversionFromPrevious: testDriveCount > 0 ? (saleCount / testDriveCount) * 100 : 0,
  });

  return stages;
}

export function generateTimeSeriesData(data: {
  leads: any[];
  bookings: any[];
  sales: any[];
  days: number;
}): TimeSeriesData[] {
  const timeSeries: TimeSeriesData[] = [];
  const now = new Date();

  for (let i = data.days - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayLeads = data.leads.filter((l) => new Date(l.createdAt).toISOString().split("T")[0] === dateStr).length;

    const dayBookings = data.bookings.filter((b) => new Date(b.createdAt).toISOString().split("T")[0] === dateStr).length;

    const daySales = data.sales.filter((s) => new Date(s.saleDate).toISOString().split("T")[0] === dateStr);
    const dayRevenue = daySales.reduce((sum, s) => sum + (s.amount || 0), 0);

    timeSeries.push({
      date: dateStr,
      leads: dayLeads,
      bookings: dayBookings,
      sales: daySales.length,
      revenue: dayRevenue,
    });
  }

  return timeSeries;
}

function getTopVehicles(sales: any[]): Array<{ make: string; model: string; count: number }> {
  const vehicleCounts = new Map<string, number>();

  sales.forEach((s) => {
    const key = `${s.vehicleMake} ${s.vehicleModel}`;
    vehicleCounts.set(key, (vehicleCounts.get(key) || 0) + 1);
  });

  return Array.from(vehicleCounts.entries())
    .map(([key, count]) => {
      const [make, model] = key.split(" ");
      return { make, model, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function calculateAverageResponseTime(leads: any[]): number {
  if (leads.length === 0) return 0;

  const responseTimes = leads
    .filter((l) => l.firstResponseAt && l.createdAt)
    .map((l) => {
      const leadTime = new Date(l.createdAt).getTime();
      const responseTime = new Date(l.firstResponseAt).getTime();
      return (responseTime - leadTime) / (1000 * 60); // Convert to minutes
    });

  if (responseTimes.length === 0) return 0;

  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  return Math.round(avgTime);
}

function calculateBookingToSaleConversion(bookings: any[], sales: any[]): number {
  if (bookings.length === 0) return 0;
  return (sales.length / bookings.length) * 100;
}

function calculateAverageTimeToSale(vehicles: any[]): number {
  const soldVehicles = vehicles.filter((v) => v.status === "sold" && v.saleDate);

  if (soldVehicles.length === 0) return 0;

  const timesToSale = soldVehicles.map((v) => {
    const listDate = new Date(v.createdAt).getTime();
    const saleDate = new Date(v.saleDate).getTime();
    return (saleDate - listDate) / (1000 * 60 * 60 * 24); // Convert to days
  });

  const avgTime = timesToSale.reduce((a, b) => a + b, 0) / timesToSale.length;
  return Math.round(avgTime);
}

function calculateAgentPerformance(
  agents: any[],
  leads: any[],
): Array<{ agentName: string; leadsGenerated: number; conversionRate: number }> {
  return agents.map((agent) => {
    const agentLeads = leads.filter((l) => l.assignedAgentId === agent.id);
    const convertedLeads = agentLeads.filter((l) => l.status === "converted").length;
    const conversionRate = agentLeads.length > 0 ? (convertedLeads / agentLeads.length) * 100 : 0;

    return {
      agentName: agent.name,
      leadsGenerated: agentLeads.length,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  });
}
