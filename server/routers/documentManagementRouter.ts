import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const documentManagementRouter = router({
  // Get document templates
  getDocumentTemplates: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        templates: [
          { id: 1, name: "Sales Contract", category: "Sales", variables: ["customer_name", "vehicle_info", "price"] },
          { id: 2, name: "Purchase Agreement", category: "Sales", variables: ["buyer", "seller", "terms"] },
          { id: 3, name: "Financing Agreement", category: "Financing", variables: ["loan_amount", "rate", "term"] },
          { id: 4, name: "Trade-in Appraisal", category: "Trade-in", variables: ["vehicle", "condition", "value"] },
          { id: 5, name: "Service Agreement", category: "Service", variables: ["services", "cost", "warranty"] },
          { id: 6, name: "Warranty Certificate", category: "Warranty", variables: ["coverage", "duration", "terms"] },
        ],
      };
    }),

  // Create document from template
  createDocumentFromTemplate: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        templateId: z.number(),
        customerId: z.number(),
        variables: z.record(z.string(), z.string()),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        documentId: Math.random(),
        templateId: input.templateId,
        status: "draft",
        created: true,
      };
    }),

  // Get customer documents
  getCustomerDocuments: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        dealershipId: z.number(),
        status: z.enum(["draft", "pending_signature", "signed", "archived"]).optional(),
      })
    )
    .query(({ input }) => {
      return {
        customerId: input.customerId,
        documents: [
          {
            id: 1,
            name: "Sales Contract",
            type: "Sales",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: "signed",
            signedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            signedBy: "John Doe",
          },
          {
            id: 2,
            name: "Financing Agreement",
            type: "Financing",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: "pending_signature",
            signatureLink: "https://example.com/sign/doc123",
          },
        ],
      };
    }),

  // Send document for signature
  sendDocumentForSignature: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        dealershipId: z.number(),
        recipientEmail: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        documentId: input.documentId,
        status: "pending_signature",
        signatureLink: "https://example.com/sign/doc123",
        sentAt: new Date(),
      };
    }),

  // Get signature status
  getSignatureStatus: protectedProcedure
    .input(z.object({ documentId: z.number(), dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        documentId: input.documentId,
        status: "signed",
        signedAt: new Date(),
        signedBy: "John Doe",
        signatureImage: "https://example.com/signatures/sig123.png",
      };
    }),

  // Download document
  downloadDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        dealershipId: z.number(),
        format: z.enum(["pdf", "docx"]).default("pdf"),
      })
    )
    .query(({ input }) => {
      return {
        documentId: input.documentId,
        downloadUrl: "https://example.com/documents/doc123.pdf",
        format: input.format,
      };
    }),

  // Archive document
  archiveDocument: protectedProcedure
    .input(z.object({ documentId: z.number(), dealershipId: z.number() }))
    .mutation(({ input }) => {
      return {
        success: true,
        documentId: input.documentId,
        archived: true,
      };
    }),

  // Get document audit trail
  getDocumentAuditTrail: protectedProcedure
    .input(z.object({ documentId: z.number(), dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        documentId: input.documentId,
        auditTrail: [
          { action: "created", by: "Jane Smith", at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { action: "sent_for_signature", by: "Jane Smith", at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
          { action: "signed", by: "John Doe", at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { action: "downloaded", by: "Jane Smith", at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        ],
      };
    }),

  // Create custom template
  createCustomTemplate: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        name: z.string(),
        category: z.string(),
        content: z.string(),
        variables: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        templateId: Math.random(),
        name: input.name,
        created: true,
      };
    }),

  // Get document statistics
  getDocumentStats: protectedProcedure
    .input(z.object({ dealershipId: z.number(), days: z.number().default(30) }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        period: `Last ${input.days} days`,
        stats: {
          totalDocumentsCreated: 234,
          documentsSigned: 198,
          averageSigningTime: "1.2 days",
          mostUsedTemplate: "Sales Contract",
          signatureSuccessRate: 94.2,
        },
      };
    }),
});
