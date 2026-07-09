import { describe, it, expect } from "vitest";
import { documentManagementRouter } from "./documentManagementRouter";

describe("Document Management Router", () => {
  it("should get document templates", async () => {
    const caller = documentManagementRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getDocumentTemplates({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("templates");
    expect(Array.isArray(result.templates)).toBe(true);
    expect(result.templates.length).toBeGreaterThan(0);
  });

  it("should create document from template", async () => {
    const caller = documentManagementRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.createDocumentFromTemplate({
      dealershipId: 1,
      templateId: 1,
      customerId: 101,
      variables: { customer_name: "John Doe", vehicle_info: "BMW 3 Series" },
    });
    
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("status", "draft");
  });

  it("should get customer documents", async () => {
    const caller = documentManagementRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getCustomerDocuments({
      customerId: 101,
      dealershipId: 1,
    });
    
    expect(result).toHaveProperty("customerId", 101);
    expect(result).toHaveProperty("documents");
    expect(Array.isArray(result.documents)).toBe(true);
  });

  it("should send document for signature", async () => {
    const caller = documentManagementRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.sendDocumentForSignature({
      documentId: 1,
      dealershipId: 1,
      recipientEmail: "customer@example.com",
    });
    
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("status", "pending_signature");
  });

  it("should get document statistics", async () => {
    const caller = documentManagementRouter.createCaller({ user: { id: 1, role: "admin" } } as any);
    const result = await caller.getDocumentStats({ dealershipId: 1 });
    
    expect(result).toHaveProperty("dealershipId", 1);
    expect(result).toHaveProperty("stats");
    expect(result.stats).toHaveProperty("signatureSuccessRate");
  });
});
