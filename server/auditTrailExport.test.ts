import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  generateExportFile,
  getExportSummary,
} from "./_core/auditTrailExportService";
import { generateComplianceReport, formatReportAsHTML, formatReportAsText } from "./_core/complianceReportGenerator";

/**
 * Audit Trail Export Tests
 * Tests for export functionality and report generation
 */

describe("Audit Trail Export Service", () => {
  const testDealershipId = 1;
  const testOptions = {
    dealershipId: testDealershipId,
    format: "csv" as const,
  };

  describe("Export to CSV", () => {
    it("should generate CSV export", async () => {
      const csv = await exportToCSV(testOptions);
      expect(typeof csv).toBe("string");
      expect(csv.length).toBeGreaterThan(0);
    });

    it("should include CSV headers", async () => {
      const csv = await exportToCSV(testOptions);
      expect(csv).toContain("id");
      expect(csv).toContain("timestamp");
      expect(csv).toContain("action");
    });

    it("should handle empty results gracefully", async () => {
      const csv = await exportToCSV({
        ...testOptions,
        startDate: new Date("2000-01-01"),
        endDate: new Date("2000-01-02"),
      });
      expect(typeof csv).toBe("string");
    });
  });

  describe("Export to Excel", () => {
    it("should generate Excel buffer", async () => {
      const buffer = await exportToExcel(testOptions);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should create valid Excel file", async () => {
      const buffer = await exportToExcel(testOptions);
      // Excel files start with PK (ZIP signature)
      expect(buffer[0]).toBe(0x50); // P
      expect(buffer[1]).toBe(0x4b); // K
    });
  });

  describe("Export to PDF", () => {
    it("should generate PDF buffer", async () => {
      const buffer = await exportToPDF(testOptions);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should create valid PDF file", async () => {
      const buffer = await exportToPDF(testOptions);
      // PDF files start with %PDF
      const header = buffer.toString("utf8", 0, 4);
      expect(header).toBe("%PDF");
    });
  });

  describe("Generate Export File", () => {
    it("should generate CSV file with metadata", async () => {
      const result = await generateExportFile({
        ...testOptions,
        format: "csv",
      });
      expect(result.filename).toContain(".csv");
      expect(result.mimeType).toBe("text/csv");
      expect(typeof result.data).toBe("string");
    });

    it("should generate Excel file with metadata", async () => {
      const result = await generateExportFile({
        ...testOptions,
        format: "xlsx",
      });
      expect(result.filename).toContain(".xlsx");
      expect(result.mimeType).toContain("spreadsheet");
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it("should generate PDF file with metadata", async () => {
      const result = await generateExportFile({
        ...testOptions,
        format: "pdf",
      });
      expect(result.filename).toContain(".pdf");
      expect(result.mimeType).toBe("application/pdf");
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it("should include dealership ID in filename", async () => {
      const result = await generateExportFile(testOptions);
      expect(result.filename).toContain(testDealershipId.toString());
    });

    it("should include date in filename", async () => {
      const result = await generateExportFile(testOptions);
      const today = new Date().toISOString().split("T")[0];
      expect(result.filename).toContain(today);
    });
  });

  describe("Export Summary", () => {
    it("should return summary statistics", async () => {
      const summary = await getExportSummary(testDealershipId, {});
      expect(summary).toHaveProperty("totalRecords");
      expect(summary).toHaveProperty("actionBreakdown");
      expect(summary).toHaveProperty("entityTypeBreakdown");
      expect(summary).toHaveProperty("dateRange");
    });

    it("should have numeric total records", async () => {
      const summary = await getExportSummary(testDealershipId, {});
      expect(typeof summary.totalRecords).toBe("number");
      expect(summary.totalRecords).toBeGreaterThanOrEqual(0);
    });

    it("should have action breakdown", async () => {
      const summary = await getExportSummary(testDealershipId, {});
      expect(typeof summary.actionBreakdown).toBe("object");
    });

    it("should have entity type breakdown", async () => {
      const summary = await getExportSummary(testDealershipId, {});
      expect(typeof summary.entityTypeBreakdown).toBe("object");
    });

    it("should have valid date range", async () => {
      const summary = await getExportSummary(testDealershipId, {});
      expect(summary.dateRange).toHaveProperty("start");
      expect(summary.dateRange).toHaveProperty("end");
      expect(typeof summary.dateRange.start).toBe("string");
      expect(typeof summary.dateRange.end).toBe("string");
    });

    it("should filter by entity type", async () => {
      const summary = await getExportSummary(testDealershipId, {
        entityType: "template",
      });
      expect(summary).toHaveProperty("totalRecords");
    });

    it("should filter by action", async () => {
      const summary = await getExportSummary(testDealershipId, {
        action: "create",
      });
      expect(summary).toHaveProperty("totalRecords");
    });

    it("should filter by date range", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const summary = await getExportSummary(testDealershipId, {
        startDate,
        endDate,
      });
      expect(summary).toHaveProperty("totalRecords");
    });
  });
});

describe("Compliance Report Generator", () => {
  const testDealershipId = 1;

  describe("Generate Compliance Report", () => {
    it("should generate compliance report", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      expect(report).toHaveProperty("title");
      expect(report).toHaveProperty("generatedDate");
      expect(report).toHaveProperty("dealershipId");
      expect(report).toHaveProperty("period");
      expect(report).toHaveProperty("summary");
      expect(report).toHaveProperty("auditSummary");
      expect(report).toHaveProperty("trainingSummary");
      expect(report).toHaveProperty("recommendations");
    });

    it("should have valid compliance score", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      expect(report.summary.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.complianceScore).toBeLessThanOrEqual(100);
    });

    it("should have summary metrics", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      expect(typeof report.summary.totalAuditEntries).toBe("number");
      expect(typeof report.summary.totalTrainingAssignments).toBe("number");
      expect(typeof report.summary.completedTraining).toBe("number");
      expect(typeof report.summary.overdueTraining).toBe("number");
    });

    it("should include audit summary", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      expect(report.auditSummary).toHaveProperty("actionCounts");
      expect(report.auditSummary).toHaveProperty("entityTypeCounts");
      expect(report.auditSummary).toHaveProperty("topUsers");
    });

    it("should include training summary", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      expect(report.trainingSummary).toHaveProperty("modulesCovered");
      expect(report.trainingSummary).toHaveProperty("averageCompletionRate");
      expect(report.trainingSummary).toHaveProperty("overdueAssignments");
      expect(report.trainingSummary).toHaveProperty("topPerformers");
    });

    it("should include recommendations", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("should respect custom date range", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
        startDate,
        endDate,
      });
      expect(report.period.start).toBeDefined();
      expect(report.period.end).toBeDefined();
    });
  });

  describe("Format Report as HTML", () => {
    it("should generate valid HTML", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      const html = formatReportAsHTML(report);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
      expect(html).toContain(report.title);
    });

    it("should include compliance score in HTML", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      const html = formatReportAsHTML(report);
      expect(html).toContain(report.summary.complianceScore.toString());
    });

    it("should include recommendations in HTML", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      const html = formatReportAsHTML(report);
      expect(html).toContain("RECOMMENDATIONS");
      report.recommendations.forEach((rec) => {
        expect(html).toContain(rec.substring(0, 20)); // Check first 20 chars
      });
    });

    it("should include tables for data", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      const html = formatReportAsHTML(report);
      expect(html).toContain("<table>");
      expect(html).toContain("</table>");
    });
  });

  describe("Format Report as Text", () => {
    it("should generate valid text", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      const text = formatReportAsText(report);
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain(report.title);
    });

    it("should include compliance score in text", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      const text = formatReportAsText(report);
      expect(text).toContain(report.summary.complianceScore.toString());
    });

    it("should include section headers", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      const text = formatReportAsText(report);
      expect(text).toContain("COMPLIANCE SCORE");
      expect(text).toContain("SUMMARY METRICS");
      expect(text).toContain("RECOMMENDATIONS");
    });

    it("should include recommendations in text", async () => {
      const report = await generateComplianceReport({
        dealershipId: testDealershipId,
      });
      const text = formatReportAsText(report);
      expect(text).toContain("RECOMMENDATIONS");
      report.recommendations.forEach((rec) => {
        expect(text).toContain(rec.substring(0, 20)); // Check first 20 chars
      });
    });
  });
});
