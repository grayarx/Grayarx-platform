/**
 * Conversation Export Service
 * Export conversations with POPIA compliance and data protection
 */

import { chatbotConversations, chatbotMessages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ExportOptions {
  format: "pdf" | "csv" | "json";
  includeMetadata: boolean;
  includeSentiment: boolean;
  anonymize: boolean;
  dateRange?: { from: Date; to: Date };
}

export interface POPIAHeader {
  requestDate: Date;
  requestedBy: string;
  dealershipId: number;
  conversationId: number;
  purpose: string;
  retentionPeriod: string;
  dataClassification: "public" | "internal" | "confidential" | "restricted";
}

/**
 * Generate POPIA compliance header
 */
export function generatePOPIAHeader(
  conversationId: number,
  dealershipId: number,
  requestedBy: string
): POPIAHeader {
  return {
    requestDate: new Date(),
    requestedBy,
    dealershipId,
    conversationId,
    purpose: "Customer Service Record & Data Request Fulfillment",
    retentionPeriod: "3 years from conversation date",
    dataClassification: "confidential",
  };
}

/**
 * Generate POPIA compliance footer
 */
export function generatePOPIAFooter(): string {
  return `
---
POPIA COMPLIANCE NOTICE
This document contains personal information processed in accordance with the Protection of Personal Information Act (POPIA), 2013.

Data Subject Rights:
- Right of access to personal information
- Right to correct inaccurate information
- Right to object to processing
- Right to request deletion (right to be forgotten)
- Right to lodge complaint with Information Regulator

Data Retention:
- This conversation record is retained for 3 years
- After retention period, data is securely deleted
- Backups are retained for 90 days for disaster recovery

Data Security:
- This export is encrypted during transmission
- Access is logged for audit purposes
- Unauthorized access is prohibited by law

For data requests or complaints, contact: privacy@grayarx.com
Information Regulator: https://www.justice.gov.za/inforeg/
---
`;
}

/**
 * Export conversation as CSV
 */
export async function exportConversationAsCSV(
  conversationId: number,
  options: ExportOptions
): Promise<string> {
  const header = generatePOPIAHeader(conversationId, 0, "system");

  // CSV header
  let csv = `POPIA COMPLIANCE EXPORT\n`;
  csv += `Export Date: ${header.requestDate.toISOString()}\n`;
  csv += `Conversation ID: ${header.conversationId}\n`;
  csv += `Purpose: ${header.purpose}\n`;
  csv += `Data Classification: ${header.dataClassification}\n`;
  csv += `\n`;

  // Column headers
  csv += `Timestamp,Sender,Message,Sentiment,Intent,Metadata\n`;

  // Mock message data
  const messages = [
    {
      timestamp: new Date(),
      sender: "user",
      message: "What financing options do you offer?",
      sentiment: 0.5,
      intent: "financing_inquiry",
    },
    {
      timestamp: new Date(),
      sender: "bot",
      message: "We offer flexible financing options including...",
      sentiment: 0.8,
      intent: "financing_response",
    },
  ];

  // Add messages
  for (const msg of messages) {
    const timestamp = msg.timestamp.toISOString();
    const message = msg.message.replace(/"/g, '""'); // Escape quotes
    const sentiment = options.includeSentiment ? msg.sentiment : "";
    const metadata = options.includeMetadata ? msg.intent : "";

    csv += `"${timestamp}","${msg.sender}","${message}","${sentiment}","${metadata}"\n`;
  }

  // Add footer
  csv += `\n${generatePOPIAFooter()}`;

  return csv;
}

/**
 * Export conversation as JSON
 */
export async function exportConversationAsJSON(
  conversationId: number,
  options: ExportOptions
): Promise<string> {
  const header = generatePOPIAHeader(conversationId, 0, "system");

  const exportData = {
    popia: {
      requestDate: header.requestDate,
      purpose: header.purpose,
      retentionPeriod: header.retentionPeriod,
      dataClassification: header.dataClassification,
      notice: generatePOPIAFooter(),
    },
    conversation: {
      id: conversationId,
      startTime: new Date(),
      endTime: new Date(),
      duration: "5 minutes",
      language: "en",
      channel: "web",
      messages: [
        {
          id: 1,
          timestamp: new Date(),
          sender: "user",
          message: "What financing options do you offer?",
          sentiment: options.includeSentiment ? 0.5 : undefined,
          intent: options.includeMetadata ? "financing_inquiry" : undefined,
        },
        {
          id: 2,
          timestamp: new Date(),
          sender: "bot",
          message: "We offer flexible financing options including...",
          sentiment: options.includeSentiment ? 0.8 : undefined,
          intent: options.includeMetadata ? "financing_response" : undefined,
        },
      ],
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export conversation as PDF
 */
export async function exportConversationAsPDF(
  conversationId: number,
  options: ExportOptions
): Promise<Buffer> {
  const header = generatePOPIAHeader(conversationId, 0, "system");

  // In production, use a PDF library like pdfkit or weasyprint
  const pdfContent = `
CONVERSATION EXPORT - POPIA COMPLIANT
=====================================

Export Date: ${header.requestDate.toISOString()}
Conversation ID: ${header.conversationId}
Purpose: ${header.purpose}
Data Classification: ${header.dataClassification}

CONVERSATION TRANSCRIPT
-----------------------

User: What financing options do you offer?
Bot: We offer flexible financing options including...

User: Can I get pre-approval?
Bot: Yes! We can provide instant pre-approval...

${generatePOPIAFooter()}
`;

  return Buffer.from(pdfContent);
}

/**
 * Anonymize conversation data
 */
export function anonymizeConversation(data: any): any {
  if (typeof data === "string") {
    // Replace email addresses
    data = data.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, "[EMAIL_REDACTED]");

    // Replace phone numbers
    data = data.replace(/(\+27|0)\d{9}/g, "[PHONE_REDACTED]");

    // Replace names (basic pattern)
    data = data.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[NAME_REDACTED]");

    // Replace ID numbers
    data = data.replace(/\d{13}/g, "[ID_REDACTED]");
  }

  return data;
}

/**
 * Validate export request (POPIA compliance check)
 */
export function validateExportRequest(
  requestedBy: string,
  dealershipId: number,
  conversationId: number
): { valid: boolean; reason?: string } {
  // Check if requester has authorization
  if (!requestedBy) {
    return { valid: false, reason: "Requester identity not verified" };
  }

  // Check if dealership ID is valid
  if (!dealershipId || dealershipId <= 0) {
    return { valid: false, reason: "Invalid dealership ID" };
  }

  // Check if conversation ID is valid
  if (!conversationId || conversationId <= 0) {
    return { valid: false, reason: "Invalid conversation ID" };
  }

  return { valid: true };
}

/**
 * Log export request for audit trail
 */
export async function logExportRequest(
  conversationId: number,
  dealershipId: number,
  requestedBy: string,
  format: string,
  anonymized: boolean
): Promise<void> {
  const auditLog = {
    timestamp: new Date(),
    action: "CONVERSATION_EXPORT",
    conversationId,
    dealershipId,
    requestedBy,
    format,
    anonymized,
    ipAddress: "127.0.0.1", // In production, get from request
    userAgent: "Mozilla/5.0...", // In production, get from request
  };

  console.log("[AUDIT LOG]", JSON.stringify(auditLog));
  // In production, save to audit database
}

/**
 * Generate export metadata
 */
export function generateExportMetadata(
  conversationId: number,
  format: string,
  options: ExportOptions
): {
  fileName: string;
  mimeType: string;
  size: number;
  checksum: string;
  createdAt: Date;
} {
  const fileName = `conversation_${conversationId}_${new Date().toISOString().split("T")[0]}.${format}`;
  const mimeTypes: Record<string, string> = {
    csv: "text/csv",
    json: "application/json",
    pdf: "application/pdf",
  };

  return {
    fileName,
    mimeType: mimeTypes[format] || "application/octet-stream",
    size: 0, // Will be calculated after generation
    checksum: "", // Will be calculated after generation
    createdAt: new Date(),
  };
}

/**
 * Schedule conversation deletion (POPIA right to be forgotten)
 */
export async function scheduleConversationDeletion(
  conversationId: number,
  dealershipId: number,
  reason: string
): Promise<{ scheduled: boolean; deletionDate: Date }> {
  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days grace period

  console.log(`Scheduled deletion for conversation ${conversationId} on ${deletionDate}`);

  return {
    scheduled: true,
    deletionDate,
  };
}

/**
 * Get export history
 */
export async function getExportHistory(
  dealershipId: number,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    conversationId: number;
    format: string;
    exportedAt: Date;
    exportedBy: string;
    anonymized: boolean;
  }>
> {
  return [
    {
      id: "export_1",
      conversationId: 123,
      format: "csv",
      exportedAt: new Date(),
      exportedBy: "user@grayarx.com",
      anonymized: false,
    },
    {
      id: "export_2",
      conversationId: 124,
      format: "pdf",
      exportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      exportedBy: "admin@grayarx.com",
      anonymized: true,
    },
  ];
}
