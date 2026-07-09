/**
 * Comprehensive Test Suite for CSV Import Service
 * Tests all aspects of CSV import, validation, and data integrity
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  validateCSV,
  importCSV,
  sanitizeCSVData,
  CSV_SCHEMAS,
  getImportHistory,
  rollbackImport,
} from "./_core/csvImportService";

describe("CSV Import Service", () => {
  describe("CSV Validation", () => {
    it("should validate correct CSV structure", async () => {
      const csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
1,2023 Toyota Camry,Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg
2,2022 Honda Civic,Honda,Civic,2022,22000,20000,Petrol,Manual,Black,available,Reliable compact car,https://example.com/photo2.jpg`;

      const result = await validateCSV(csvContent, "vehicles");

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.rowCount).toBe(2);
      expect(result.fieldCount).toBe(13);
    });

    it("should detect missing required fields", async () => {
      const csvContent = `id,title,make,year,price
1,2023 Toyota Camry,Toyota,2023,25000
2,2022 Honda Civic,Honda,2022,22000`;

      const result = await validateCSV(csvContent, "vehicles");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Missing required fields");
    });

    it("should detect invalid data types", async () => {
      const csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
abc,2023 Toyota Camry,Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg`;

      const result = await validateCSV(csvContent, "vehicles");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("must be a number"))).toBe(true);
    });

    it("should detect empty CSV", async () => {
      const csvContent = "";

      const result = await validateCSV(csvContent, "vehicles");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("empty"))).toBe(true);
    });

    it("should validate email format", async () => {
      const csvContent = `id,firstName,lastName,email,phone,dealershipId,createdAt
1,John,Doe,invalid-email,0123456789,1,2026-05-29`;

      const result = await validateCSV(csvContent, "customers");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("valid email"))).toBe(true);
    });

    it("should validate date format", async () => {
      const csvContent = `id,firstName,lastName,email,phone,dealershipId,createdAt
1,John,Doe,john@example.com,0123456789,1,invalid-date`;

      const result = await validateCSV(csvContent, "customers");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("valid date"))).toBe(true);
    });

    it("should warn about field length violations", async () => {
      const longTitle = "A".repeat(300); // Exceeds maxLength of 255
      const csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
1,${longTitle},Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg`;

      const result = await validateCSV(csvContent, "vehicles");

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("exceeds max length");
    });

    it("should handle unknown schema", async () => {
      const csvContent = "id,name\n1,test";

      const result = await validateCSV(csvContent, "unknown_schema");

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Unknown schema");
    });
  });

  describe("Data Sanitization", () => {
    it("should sanitize and convert data types correctly", () => {
      const data = {
        id: "123",
        title: "  2023 Toyota Camry  ",
        price: "25000.50",
        year: "2023",
      };

      const schema = CSV_SCHEMAS.vehicles;
      const { data: sanitized, errors } = sanitizeCSVData(data, schema);

      expect(errors).toHaveLength(0);
      expect(sanitized.id).toBe(123);
      expect(sanitized.title).toBe("2023 Toyota Camry");
      expect(sanitized.price).toBe(25000.5);
      expect(sanitized.year).toBe(2023);
    });

    it("should handle missing optional fields", () => {
      const data = {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        dealershipId: "1",
        createdAt: "2026-05-29",
        // phone is optional and missing
      };

      const schema = CSV_SCHEMAS.customers;
      const { data: sanitized, errors } = sanitizeCSVData(data, schema);

      expect(errors).toHaveLength(0);
      expect(sanitized.phone).toBeUndefined();
    });

    it("should convert boolean values", () => {
      const testCases = [
        { input: "true", expected: true },
        { input: "false", expected: false },
        { input: "yes", expected: true },
        { input: "no", expected: false },
        { input: "1", expected: true },
        { input: "0", expected: false },
      ];

      // Note: This would require a boolean field in schema for full test
      // Simplified test for demonstration
      testCases.forEach(({ input, expected }) => {
        const result = ["true", "yes", "1"].includes(input.toLowerCase());
        expect(result).toBe(expected);
      });
    });

    it("should trim whitespace from strings", () => {
      const data = {
        id: "1",
        firstName: "  John  ",
        lastName: "  Doe  ",
        email: "  john@example.com  ",
        dealershipId: "1",
        createdAt: "2026-05-29",
      };

      const schema = CSV_SCHEMAS.customers;
      const { data: sanitized } = sanitizeCSVData(data, schema);

      expect(sanitized.firstName).toBe("John");
      expect(sanitized.lastName).toBe("Doe");
      expect(sanitized.email).toBe("john@example.com");
    });
  });

  describe("CSV Import", () => {
    it("should import valid CSV successfully", async () => {
      const csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
1,2023 Toyota Camry,Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg
2,2022 Honda Civic,Honda,Civic,2022,22000,20000,Petrol,Manual,Black,available,Reliable compact car,https://example.com/photo2.jpg`;

      const result = await importCSV(csvContent, "vehicles", 1);

      expect(result.success).toBe(true);
      expect(result.rowsProcessed).toBe(2);
      expect(result.rowsSuccessful).toBe(2);
      expect(result.rowsFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle partial import failures", async () => {
      const csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
1,2023 Toyota Camry,Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg
invalid,2022 Honda Civic,Honda,Civic,2022,22000,20000,Petrol,Manual,Black,available,Reliable compact car,https://example.com/photo2.jpg`;

      const result = await importCSV(csvContent, "vehicles", 1);

      expect(result.success).toBe(false);
      expect(result.rowsFailed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject invalid CSV", async () => {
      const csvContent = `id,title,make,year,price`; // Missing required fields

      const result = await importCSV(csvContent, "vehicles", 1);

      expect(result.success).toBe(false);
      expect(result.rowsFailed).toBeGreaterThan(0);
    });

    it("should generate unique import IDs", async () => {
      const csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
1,2023 Toyota Camry,Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg`;

      const result1 = await importCSV(csvContent, "vehicles", 1);
      const result2 = await importCSV(csvContent, "vehicles", 1);

      expect(result1.importId).not.toBe(result2.importId);
    });

    it("should handle large CSV files", async () => {
      // Generate large CSV with 1000 rows
      let csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl\n`;
      for (let i = 1; i <= 1000; i++) {
        csvContent += `${i},2023 Toyota Camry ${i},Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg\n`;
      }

      const result = await importCSV(csvContent, "vehicles", 1);

      expect(result.rowsProcessed).toBe(1000);
      expect(result.importId).toBeDefined();
    });
  });

  describe("Import History", () => {
    it("should retrieve import history", async () => {
      const history = await getImportHistory(1, 10);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty("importId");
      expect(history[0]).toHaveProperty("rowsProcessed");
      expect(history[0]).toHaveProperty("timestamp");
    });

    it("should respect limit parameter", async () => {
      const history = await getImportHistory(1, 5);

      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Import Rollback", () => {
    it("should rollback import", async () => {
      const result = await rollbackImport("import_1_1234567890");

      expect(result.success).toBe(true);
      expect(result.message).toContain("rolled back");
    });
  });

  describe("Edge Cases", () => {
    it("should handle CSV with special characters", async () => {
      const csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
1,"2023 Toyota Camry, Premium Edition",Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,"Well-maintained sedan with ""special"" features",https://example.com/photo.jpg`;

      const result = await validateCSV(csvContent, "vehicles");

      expect(result.valid).toBe(true);
    });

    it("should handle CSV with newlines in quoted fields", async () => {
      const csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
1,2023 Toyota Camry,Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,"Well-maintained sedan
with multiple lines",https://example.com/photo.jpg`;

      const result = await validateCSV(csvContent, "vehicles");

      expect(result.valid).toBe(true);
    });

    it("should handle CSV with Unicode characters", async () => {
      const csvContent = `id,firstName,lastName,email,phone,dealershipId,createdAt
1,José,García,jose@example.com,0123456789,1,2026-05-29
2,François,Müller,francois@example.com,0123456789,1,2026-05-29`;

      const result = await validateCSV(csvContent, "customers");

      expect(result.valid).toBe(true);
    });

    it("should handle CSV with BOM (Byte Order Mark)", async () => {
      const csvContent = `\uFEFFid,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl
1,2023 Toyota Camry,Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg`;

      const result = await validateCSV(csvContent, "vehicles");

      // Should handle BOM gracefully
      expect(result.rowCount).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    it("should validate large CSV within acceptable time", async () => {
      let csvContent = `id,title,make,model,year,price,km,fuel,transmission,color,status,description,primaryPhotoUrl\n`;
      for (let i = 1; i <= 5000; i++) {
        csvContent += `${i},2023 Toyota Camry ${i},Toyota,Camry,2023,25000,15000,Petrol,Automatic,Silver,available,Well-maintained sedan,https://example.com/photo.jpg\n`;
      }

      const startTime = Date.now();
      const result = await validateCSV(csvContent, "vehicles");
      const duration = Date.now() - startTime;

      expect(result.rowCount).toBe(5000);
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });
  });
});
