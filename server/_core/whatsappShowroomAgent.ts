/**
 * WhatsApp Showroom Agent
 * Handles live enquiries and vehicle information on WhatsApp
 */

import { TRPCError } from "@trpc/server";

export interface WhatsAppAgent {
  id: string;
  name: string;
  phone: string;
  status: "available" | "busy" | "offline";
  currentChats: number;
  maxConcurrentChats: number;
  capabilities: string[];
  responseTime: number; // milliseconds
}

export interface WhatsAppMessage {
  id: string;
  agentId: string;
  customerPhone: string;
  customerName: string;
  vehicleId?: string;
  vehicleTitle?: string;
  message: string;
  timestamp: Date;
  type: "text" | "image" | "document";
}

/**
 * Get available WhatsApp agents for showroom
 */
export async function getAvailableShowroomAgents(): Promise<WhatsAppAgent[]> {
  // TODO: Integrate with WhatsApp Business API to get real agent status
  // For now, return mock agents
  return [
    {
      id: "agent-1",
      name: "Nala",
      phone: "+27 (0)11 123 4567",
      status: "available",
      currentChats: 2,
      maxConcurrentChats: 10,
      capabilities: [
        "Vehicle enquiries",
        "Test drive booking",
        "Finance information",
        "Trade-in valuation",
      ],
      responseTime: 1200, // 1.2 seconds average
    },
    {
      id: "agent-2",
      name: "Bongi",
      phone: "+27 (0)11 234 5678",
      status: "available",
      currentChats: 1,
      maxConcurrentChats: 10,
      capabilities: [
        "Vehicle enquiries",
        "Pricing information",
        "Availability check",
        "Appointment booking",
      ],
      responseTime: 900, // 0.9 seconds average
    },
  ];
}

/**
 * Send message to WhatsApp agent
 */
export async function sendMessageToAgent(
  agentId: string,
  customerPhone: string,
  customerName: string,
  message: string,
  vehicleId?: string,
  vehicleTitle?: string,
): Promise<WhatsAppMessage> {
  if (!agentId || !customerPhone || !message) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Agent ID, customer phone, and message required",
    });
  }

  // TODO: Integrate with WhatsApp Business API to send message
  // For now, return mock message
  return {
    id: `msg-${Date.now()}`,
    agentId,
    customerPhone,
    customerName,
    vehicleId,
    vehicleTitle,
    message,
    timestamp: new Date(),
    type: "text",
  };
}

/**
 * Get chat history with agent
 */
export async function getChatHistory(
  agentId: string,
  customerPhone: string,
  limit: number = 50,
): Promise<WhatsAppMessage[]> {
  // TODO: Fetch real chat history from WhatsApp Business API
  // For now, return empty array
  return [];
}

/**
 * Start new conversation with agent
 */
export async function startConversation(
  customerPhone: string,
  customerName: string,
  vehicleId?: string,
  vehicleTitle?: string,
): Promise<{ agentId: string; conversationId: string; greeting: string }> {
  const agents = await getAvailableShowroomAgents();

  // Find least busy agent
  const agent = agents.reduce((prev, current) =>
    prev.currentChats < current.currentChats ? prev : current,
  );

  if (!agent || agent.status !== "available") {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "No agents available at the moment. Please try again later.",
    });
  }

  const greeting = vehicleTitle
    ? `Hi ${customerName}! 👋 I'm ${agent.name} from GrayArx. I see you're interested in the ${vehicleTitle}. How can I help you today?`
    : `Hi ${customerName}! 👋 I'm ${agent.name} from GrayArx. Welcome to our showroom! What vehicle are you interested in?`;

  // TODO: Create conversation in WhatsApp Business API
  return {
    agentId: agent.id,
    conversationId: `conv-${Date.now()}`,
    greeting,
  };
}

/**
 * Get agent status
 */
export async function getAgentStatus(agentId: string): Promise<WhatsAppAgent | null> {
  const agents = await getAvailableShowroomAgents();
  return agents.find((a) => a.id === agentId) || null;
}

/**
 * Send vehicle details to customer via WhatsApp
 */
export async function sendVehicleDetails(
  agentId: string,
  customerPhone: string,
  vehicle: {
    id: string;
    title: string;
    price: number;
    year: number;
    km: number;
    fuel: string;
    transmission: string;
    image?: string;
  },
): Promise<WhatsAppMessage> {
  const vehicleInfo = `
📍 *${vehicle.title}*

💰 Price: R${vehicle.price.toLocaleString("en-ZA")}
📅 Year: ${vehicle.year}
🔧 Mileage: ${vehicle.km.toLocaleString("en-ZA")} km
⛽ Fuel: ${vehicle.fuel}
🚗 Transmission: ${vehicle.transmission}

Would you like to book a test drive or get more information?
  `.trim();

  return sendMessageToAgent(
    agentId,
    customerPhone,
    "Customer",
    vehicleInfo,
    vehicle.id,
    vehicle.title,
  );
}
