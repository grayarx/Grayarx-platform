import { getDb } from "./db";
import { leadImports, leadImportErrors, leads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ImportResult {
  importId: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ rowNumber: number; error: string; data: Record<string, any> }>;
}

/**
 * Parse CSV data and import leads
 */
export async function importLeadsFromCSV(
  dealershipId: number,
  fileName: string,
  csvData: string
): Promise<ImportResult | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const importResult = await db
      .insert(leadImports)
      .values({
        dealershipId,
        fileName,
        totalRows: 0,
        successCount: 0,
        errorCount: 0,
        status: "processing",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();

    // @ts-expect-error Drizzle MySQL returns insertId
    const importId = Number(importResult?.[0]?.insertId ?? importResult?.insertId ?? 0);

    const lines = csvData.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV must contain header and at least one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredFields = ["email", "phone"];
    const missingFields = requiredFields.filter((f) => !headers.includes(f));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ rowNumber: number; error: string; data: Record<string, any> }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      try {
        const dealershipName = row.dealership_name || row.dealershipname || "Imported";
        const contactName = row.contact_name || row.contactname || row.name || "";
        const email = row.email || "";
        const phone = row.phone || "";

        if (!contactName || !email || !phone) {
          throw new Error("Missing required fields: contact_name, email, or phone");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("Invalid email format");
        }

        const leadData = {
          dealershipId,
          dealershipName,
          contactName,
          email,
          phone,
          source: row.source || "import",
          language: row.language || "en",
          notes: row.notes || "",
          status: "new" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(leads).values(leadData).execute();

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          rowNumber: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
          data: row,
        });

        await db
          .insert(leadImportErrors)
          .values({
            importId,
            rowNumber: i + 1,
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            rawData: row,
            createdAt: new Date(),
          })
          .execute();
      }
    }

    await db
      .update(leadImports)
      .set({
        totalRows: lines.length - 1,
        successCount,
        errorCount,
        status: errorCount === 0 ? "completed" : "completed",
        importedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leadImports.id, importId))
      .execute();

    return {
      importId,
      totalRows: lines.length - 1,
      successCount,
      errorCount,
      errors,
    };
  } catch (error) {
    console.error("[BulkLeadImporter] Error importing leads:", error);
    return null;
  }
}

/**
 * Get import history for dealership
 */
export async function getImportHistory(dealershipId: number, limit = 50) {
  try {
    const db = await getDb();
    if (!db) return [];

    const imports = await db
      .select()
      .from(leadImports)
      .where(eq(leadImports.dealershipId, dealershipId))
      .limit(limit)
      .execute();

    return imports;
  } catch (error) {
    console.error("[BulkLeadImporter] Error getting import history:", error);
    return [];
  }
}

/**
 * Get import details with errors
 */
export async function getImportDetails(importId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const importData = await db.select().from(leadImports).where(eq(leadImports.id, importId)).limit(1).execute();

    if (importData.length === 0) return null;

    const errors = await db.select().from(leadImportErrors).where(eq(leadImportErrors.importId, importId)).execute();

    return {
      ...importData[0],
      errors,
    };
  } catch (error) {
    console.error("[BulkLeadImporter] Error getting import details:", error);
    return null;
  }
}

/**
 * Retry failed imports
 */
export async function retryFailedImport(importId: number): Promise<ImportResult | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const importData = await db.select().from(leadImports).where(eq(leadImports.id, importId)).limit(1).execute();

    if (importData.length === 0) return null;

    const importRecord = importData[0];
    const errors = await db.select().from(leadImportErrors).where(eq(leadImportErrors.importId, importId)).execute();

    if (errors.length === 0) {
      return {
        importId,
        totalRows: importRecord.totalRows,
        successCount: importRecord.successCount,
        errorCount: 0,
        errors: [],
      };
    }

    let successCount = 0;
    let errorCount = 0;
    const retryErrors: Array<{ rowNumber: number; error: string; data: Record<string, any> }> = [];

    for (const error of errors) {
      try {
        const row = error.rawData as Record<string, any>;
        const dealershipName = row.dealership_name || row.dealershipname || "Imported";
        const contactName = row.contact_name || row.contactname || row.name || "";
        const email = row.email || "";
        const phone = row.phone || "";

        if (!contactName || !email || !phone) {
          throw new Error("Missing required fields");
        }

        const leadData = {
          dealershipId: importRecord.dealershipId,
          dealershipName,
          contactName,
          email,
          phone,
          source: row.source || "import",
          language: row.language || "en",
          notes: row.notes || "",
          status: "new" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(leads).values(leadData).execute();

        successCount++;

        await db.delete(leadImportErrors).where(eq(leadImportErrors.id, error.id)).execute();
      } catch (err) {
        errorCount++;
        retryErrors.push({
          rowNumber: error.rowNumber,
          error: err instanceof Error ? err.message : "Unknown error",
          data: error.rawData as Record<string, any>,
        });
      }
    }

    await db
      .update(leadImports)
      .set({
        successCount: importRecord.successCount + successCount,
        errorCount: importRecord.errorCount - successCount,
        updatedAt: new Date(),
      })
      .where(eq(leadImports.id, importId))
      .execute();

    return {
      importId,
      totalRows: importRecord.totalRows,
      successCount: importRecord.successCount + successCount,
      errorCount: importRecord.errorCount - successCount,
      errors: retryErrors,
    };
  } catch (error) {
    console.error("[BulkLeadImporter] Error retrying import:", error);
    return null;
  }
}
