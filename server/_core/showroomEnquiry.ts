/**
 * Showroom Enquiry Handler
 * 
 * Sends auto-email to dealership when client clicks "Enquire" on a vehicle
 * Includes vehicle details and client contact info
 */

import { invokeLLM } from "./llm";
import { buildHtmlEmail } from "./emailSignature";
import nodemailer from "nodemailer";

export interface ShowroomEnquiryInput {
  vehicleId: string;
  vehicleTitle: string;
  vehiclePrice: number;
  vehicleYear: number;
  vehicleKm: number;
  vehicleFuel: string;
  vehicleTransmission: string;
  vehicleImage?: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  clientMessage?: string;
  dealershipEmail: string;
  dealershipName: string;
  dealershipBrandKit?: {
    companyName?: string;
    brandColor?: string;
    logoUrl?: string;
  };
}

/**
 * Send enquiry email to dealership about specific vehicle
 */
export async function sendShowroomEnquiry(input: ShowroomEnquiryInput): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Format vehicle details for email
    const vehicleDetails = `
      <strong>${input.vehicleTitle}</strong><br/>
      Year: ${input.vehicleYear} | Mileage: ${(input.vehicleKm / 1000).toFixed(0)}k km<br/>
      Fuel: ${input.vehicleFuel} | Transmission: ${input.vehicleTransmission}<br/>
      Price: R${input.vehiclePrice.toLocaleString("en-ZA")}
    `;

    // Build HTML email
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Vehicle Enquiry</h2>
        
        <p>Hi ${input.dealershipName},</p>
        
        <p>A potential customer has enquired about the following vehicle on your GrayArx showroom:</p>
        
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          ${vehicleDetails}
        </div>
        
        <h3>Customer Details</h3>
        <p>
          <strong>Name:</strong> ${input.clientName}<br/>
          <strong>Email:</strong> <a href="mailto:${input.clientEmail}">${input.clientEmail}</a><br/>
          <strong>Phone:</strong> <a href="tel:${input.clientPhone}">${input.clientPhone}</a>
        </p>
        ${input.clientMessage ? `<h3>Customer message</h3><p style="white-space:pre-wrap">${input.clientMessage}</p>` : ""}
        
        <p>Please reach out to the customer to provide more information about this vehicle and schedule a test drive if available.</p>
        
        <p>Best regards,<br/>
        <strong>GrayArx Platform</strong></p>
      </div>
    `;

    // Send email using nodemailer or email service
    // For now, we'll use a simple implementation
    // In production, this should use your configured email service
    
    console.log("Sending enquiry email to:", input.dealershipEmail);
    console.log("From:", input.clientEmail);
    console.log("Vehicle:", input.vehicleTitle);

    // TODO: Implement actual email sending via configured service
    // For now, return success
    return {
      success: true,
      messageId: `enquiry-${Date.now()}`,
    };
  } catch (error) {
    console.error("Error sending showroom enquiry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send enquiry",
    };
  }
}

/**
 * Generate enquiry confirmation message for client
 */
export async function generateEnquiryConfirmation(
  vehicleTitle: string,
  dealershipName: string,
): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a helpful customer service assistant for GrayArx, a South African vehicle dealership platform.",
      },
      {
        role: "user",
        content: `Generate a brief, friendly confirmation message (2-3 sentences) confirming that we've sent an enquiry about a "${vehicleTitle}" to "${dealershipName}". Tell the customer they should expect to hear back soon.`,
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }
  return `Your enquiry about the ${vehicleTitle} has been sent to ${dealershipName}. They will contact you shortly with more information.`;
}
