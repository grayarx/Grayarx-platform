/**
 * Real-time Sales Dashboard
 * Live monitoring of conversations, leads, appointments, and conversions
 */

export interface DashboardMetrics {
  activeConversations: number;
  hotLeads: number;
  todayTestDrives: number;
  conversionRate: number;
  avgResponseTime: number;
  topSalesRep: string;
  revenueToday: number;
  pendingFollowUps: number;
}

export interface ActiveConversation {
  conversationId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  vehicleInterest: string;
  lastMessageTime: Date;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "critical" | "high" | "medium" | "low";
  assignedTo?: string;
}

export interface HotLead {
  leadId: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  leadScore: number; // 0-100
  leadReason: string;
  vehicleInterest: string;
  budget: number;
  estimatedValue: number;
  nextAction: string;
  createdAt: Date;
  assignedTo?: string;
}

export interface TestDriveAppointment {
  appointmentId: number;
  customerId: number;
  customerName: string;
  vehicleTitle: string;
  appointmentDate: Date;
  appointmentTime: string;
  status: "confirmed" | "completed" | "cancelled" | "no-show";
  assignedTo?: string;
}

export interface SalesRepPerformance {
  repId: number;
  repName: string;
  conversationsHandled: number;
  leadsConverted: number;
  conversionRate: number;
  totalRevenue: number;
  avgDealValue: number;
  responseTime: number; // minutes
  customerSatisfaction: number; // 0-100
}

/**
 * Get real-time dashboard metrics
 */
export async function getDashboardMetrics(dealershipId: number): Promise<DashboardMetrics> {
  // In production, calculate from real-time data
  return {
    activeConversations: Math.floor(Math.random() * 50),
    hotLeads: Math.floor(Math.random() * 15),
    todayTestDrives: Math.floor(Math.random() * 20),
    conversionRate: 15 + Math.random() * 10,
    avgResponseTime: 2 + Math.random() * 5,
    topSalesRep: "John Smith",
    revenueToday: 50000 + Math.random() * 100000,
    pendingFollowUps: Math.floor(Math.random() * 30),
  };
}

/**
 * Get active conversations
 */
export async function getActiveConversations(dealershipId: number): Promise<ActiveConversation[]> {
  return [
    {
      conversationId: 1,
      customerId: 101,
      customerName: "Alice Johnson",
      customerPhone: "+27 123 456 7890",
      vehicleInterest: "2023 Toyota Camry",
      lastMessageTime: new Date(Date.now() - 5 * 60000),
      sentiment: "positive",
      urgency: "high",
      assignedTo: "John Smith",
    },
    {
      conversationId: 2,
      customerId: 102,
      customerName: "Bob Wilson",
      customerPhone: "+27 987 654 3210",
      vehicleInterest: "2022 Honda Civic",
      lastMessageTime: new Date(Date.now() - 15 * 60000),
      sentiment: "neutral",
      urgency: "medium",
    },
    {
      conversationId: 3,
      customerId: 103,
      customerName: "Carol Davis",
      customerPhone: "+27 555 123 4567",
      vehicleInterest: "2024 BMW X5",
      lastMessageTime: new Date(Date.now() - 2 * 60000),
      sentiment: "positive",
      urgency: "critical",
    },
  ];
}

/**
 * Get hot leads
 */
export async function getHotLeads(dealershipId: number): Promise<HotLead[]> {
  return [
    {
      leadId: 1,
      customerId: 101,
      customerName: "Alice Johnson",
      customerEmail: "alice@example.com",
      customerPhone: "+27 123 456 7890",
      leadScore: 92,
      leadReason: "Test drive booked, high engagement",
      vehicleInterest: "2023 Toyota Camry",
      budget: 300000,
      estimatedValue: 280000,
      nextAction: "Send financing options",
      createdAt: new Date(Date.now() - 2 * 60 * 60000),
      assignedTo: "John Smith",
    },
    {
      leadId: 2,
      customerId: 103,
      customerName: "Carol Davis",
      customerEmail: "carol@example.com",
      customerPhone: "+27 555 123 4567",
      leadScore: 88,
      leadReason: "Premium vehicle interest, ready to buy",
      vehicleInterest: "2024 BMW X5",
      budget: 800000,
      estimatedValue: 750000,
      nextAction: "Schedule test drive",
      createdAt: new Date(Date.now() - 1 * 60 * 60000),
    },
  ];
}

/**
 * Get today's test drive appointments
 */
export async function getTodayTestDrives(dealershipId: number): Promise<TestDriveAppointment[]> {
  const today = new Date();
  return [
    {
      appointmentId: 1,
      customerId: 101,
      customerName: "Alice Johnson",
      vehicleTitle: "2023 Toyota Camry",
      appointmentDate: today,
      appointmentTime: "14:00",
      status: "confirmed",
      assignedTo: "John Smith",
    },
    {
      appointmentId: 2,
      customerId: 104,
      customerName: "David Martinez",
      vehicleTitle: "2022 Honda Civic",
      appointmentDate: today,
      appointmentTime: "15:30",
      status: "confirmed",
    },
    {
      appointmentId: 3,
      customerId: 105,
      customerName: "Emma Thompson",
      vehicleTitle: "2024 BMW X5",
      appointmentDate: today,
      appointmentTime: "16:00",
      status: "confirmed",
    },
  ];
}

/**
 * Get sales rep performance
 */
export async function getSalesRepPerformance(dealershipId: number): Promise<SalesRepPerformance[]> {
  return [
    {
      repId: 1,
      repName: "John Smith",
      conversationsHandled: 45,
      leadsConverted: 8,
      conversionRate: 17.8,
      totalRevenue: 2400000,
      avgDealValue: 300000,
      responseTime: 3,
      customerSatisfaction: 92,
    },
    {
      repId: 2,
      repName: "Sarah Johnson",
      conversationsHandled: 38,
      leadsConverted: 6,
      conversionRate: 15.8,
      totalRevenue: 1800000,
      avgDealValue: 300000,
      responseTime: 4,
      customerSatisfaction: 88,
    },
    {
      repId: 3,
      repName: "Mike Brown",
      conversationsHandled: 52,
      leadsConverted: 7,
      conversionRate: 13.5,
      totalRevenue: 2100000,
      avgDealValue: 300000,
      responseTime: 5,
      customerSatisfaction: 85,
    },
  ];
}

/**
 * Assign conversation to sales rep
 */
export async function assignConversation(
  conversationId: number,
  repId: number
): Promise<{ success: boolean; error?: string }> {
  console.log(`Assigning conversation ${conversationId} to rep ${repId}`);
  // In production, update database and notify rep
  return { success: true };
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(
  conversationId: number,
  status: "active" | "closed" | "escalated"
): Promise<{ success: boolean; error?: string }> {
  console.log(`Updating conversation ${conversationId} status to ${status}`);
  return { success: true };
}

/**
 * Get dashboard activity feed
 */
export async function getActivityFeed(dealershipId: number, limit: number = 20): Promise<
  Array<{
    timestamp: Date;
    type: string;
    description: string;
    relatedEntity: string;
  }>
> {
  return [
    {
      timestamp: new Date(Date.now() - 5 * 60000),
      type: "hot_lead",
      description: "Alice Johnson marked as hot lead",
      relatedEntity: "customer_101",
    },
    {
      timestamp: new Date(Date.now() - 10 * 60000),
      type: "test_drive_booked",
      description: "Test drive booked for 2023 Toyota Camry",
      relatedEntity: "appointment_1",
    },
    {
      timestamp: new Date(Date.now() - 15 * 60000),
      type: "lead_converted",
      description: "Carol Davis converted to customer",
      relatedEntity: "customer_103",
    },
    {
      timestamp: new Date(Date.now() - 30 * 60000),
      type: "conversation_started",
      description: "New conversation with Bob Wilson",
      relatedEntity: "conversation_2",
    },
  ];
}
