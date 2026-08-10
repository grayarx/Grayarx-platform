/**
 * CSV Parser & Auto-Repair Service
 * Handles CSV parsing, validation, and automatic repair of common issues
 */

import { MODELS_BY_MAKE, VEHICLE_MAKES } from "../shared/vehicleCatalog";

interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  repairs: Array<{ row: number; action: string }>;
}

// SA catalog (+ Mercedes shorthand for legacy CSVs)
const COMMON_MAKES = [...VEHICLE_MAKES, "Mercedes"];

const COMMON_MODELS = Array.from(
  new Set(Object.values(MODELS_BY_MAKE).flat()),
);

// Common transmission types
const TRANSMISSION_TYPES = ["Manual", "Automatic", "CVT", "Semi-Automatic"];

// Common fuel types
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "CNG"];

// Common colors
const COLORS = [
  "White",
  "Black",
  "Silver",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Brown",
  "Gold",
  "Beige",
];

/**
 * Parse CSV content into structured data
 */
export function parseCSV(content: string): ParseResult {
  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  const warnings: Array<{ row: number; message: string }> = [];
  const repairs: Array<{ row: number; action: string }> = [];

  // Validate headers
  if (headers.length === 0) {
    throw new Error("CSV has no headers");
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    try {
      const values = parseCSVLine(lines[i]);

      // Check column count
      if (values.length !== headers.length) {
        if (values.length < headers.length) {
          // Pad with empty values
          while (values.length < headers.length) {
            values.push("");
          }
          repairs.push({
            row: i - 1,
            action: `Padded ${headers.length - values.length} missing columns`,
          });
        } else {
          // Truncate extra columns
          const extra = values.length - headers.length;
          values.splice(headers.length);
          repairs.push({
            row: i - 1,
            action: `Removed ${extra} extra columns`,
          });
        }
      }

      // Create row object
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = (values[idx] || "").trim();
      });

      // Validate and repair row data
      const { isValid, rowWarnings, rowRepairs } = validateAndRepairRow(row, headers, i - 1);

      if (!isValid) {
        errors.push({
          row: i - 1,
          message: "Row has critical missing fields",
        });
      } else {
        rows.push(row);
        warnings.push(...rowWarnings);
        repairs.push(...rowRepairs);
      }
    } catch (error: any) {
      errors.push({
        row: i - 1,
        message: `Failed to parse row: ${error.message}`,
      });
    }
  }

  return {
    headers,
    rows,
    errors,
    warnings,
    repairs,
  };
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Validate and repair a single row
 */
function validateAndRepairRow(
  row: Record<string, string>,
  headers: string[],
  rowIndex: number
): {
  isValid: boolean;
  rowWarnings: Array<{ row: number; message: string }>;
  rowRepairs: Array<{ row: number; action: string }>;
} {
  const rowWarnings: Array<{ row: number; message: string }> = [];
  const rowRepairs: Array<{ row: number; action: string }> = [];

  // Find key fields (case-insensitive)
  const makeField = findField(headers, ["make", "brand", "manufacturer"]);
  const modelField = findField(headers, ["model", "name"]);
  const yearField = findField(headers, ["year", "model year", "year"]);

  // Check critical fields
  if (!makeField || !row[makeField]?.trim()) {
    return { isValid: false, rowWarnings, rowRepairs };
  }

  if (!modelField || !row[modelField]?.trim()) {
    return { isValid: false, rowWarnings, rowRepairs };
  }

  // Repair make (fix common typos)
  if (makeField && row[makeField]) {
    const originalMake = row[makeField];
    const repairedMake = repairMake(originalMake);
    if (repairedMake !== originalMake) {
      row[makeField] = repairedMake;
      rowRepairs.push({
        row: rowIndex,
        action: `Fixed make: "${originalMake}" → "${repairedMake}"`,
      });
    }
  }

  // Repair model (fix common typos)
  if (modelField && row[modelField]) {
    const originalModel = row[modelField];
    const repairedModel = repairModel(originalModel);
    if (repairedModel !== originalModel) {
      row[modelField] = repairedModel;
      rowRepairs.push({
        row: rowIndex,
        action: `Fixed model: "${originalModel}" → "${repairedModel}"`,
      });
    }
  }

  // Validate year
  if (yearField && row[yearField]) {
    const year = parseInt(row[yearField]);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      rowWarnings.push({
        row: rowIndex,
        message: `Invalid year: ${row[yearField]}`,
      });
    }
  }

  // Validate price
  const priceField = findField(headers, ["price", "cost", "value"]);
  if (priceField && row[priceField]) {
    const price = parseFloat(row[priceField].replace(/[^0-9.]/g, ""));
    if (isNaN(price) || price <= 0) {
      rowWarnings.push({
        row: rowIndex,
        message: `Invalid price: ${row[priceField]}`,
      });
    }
  }

  // Validate transmission
  const transmissionField = findField(headers, ["transmission", "gearbox", "trans"]);
  if (transmissionField && row[transmissionField]) {
    const transmission = row[transmissionField];
    const validTransmission = TRANSMISSION_TYPES.find(
      (t) => t.toLowerCase() === transmission.toLowerCase()
    );
    if (!validTransmission) {
      rowWarnings.push({
        row: rowIndex,
        message: `Unknown transmission: ${transmission}`,
      });
    } else if (validTransmission !== transmission) {
      row[transmissionField] = validTransmission;
      rowRepairs.push({
        row: rowIndex,
        action: `Standardized transmission: "${transmission}" → "${validTransmission}"`,
      });
    }
  }

  // Validate fuel type
  const fuelField = findField(headers, ["fuel", "fuel type", "fuel_type"]);
  if (fuelField && row[fuelField]) {
    const fuel = row[fuelField];
    const validFuel = FUEL_TYPES.find((f) => f.toLowerCase() === fuel.toLowerCase());
    if (!validFuel) {
      rowWarnings.push({
        row: rowIndex,
        message: `Unknown fuel type: ${fuel}`,
      });
    } else if (validFuel !== fuel) {
      row[fuelField] = validFuel;
      rowRepairs.push({
        row: rowIndex,
        action: `Standardized fuel: "${fuel}" → "${validFuel}"`,
      });
    }
  }

  // Validate color
  const colorField = findField(headers, ["color", "colour"]);
  if (colorField && row[colorField]) {
    const color = row[colorField];
    const validColor = COLORS.find((c) => c.toLowerCase() === color.toLowerCase());
    if (!validColor) {
      rowWarnings.push({
        row: rowIndex,
        message: `Unknown color: ${color}`,
      });
    } else if (validColor !== color) {
      row[colorField] = validColor;
      rowRepairs.push({
        row: rowIndex,
        action: `Standardized color: "${color}" → "${validColor}"`,
      });
    }
  }

  return {
    isValid: true,
    rowWarnings,
    rowRepairs,
  };
}

/**
 * Find a field by alternative names (case-insensitive)
 */
function findField(headers: string[], alternatives: string[]): string | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase());
  for (const alt of alternatives) {
    const index = lowerHeaders.indexOf(alt.toLowerCase());
    if (index !== -1) {
      return headers[index];
    }
  }
  return null;
}

/**
 * Repair make name (fix common typos)
 */
function repairMake(make: string): string {
  const lower = make.toLowerCase();

  // Exact match
  const exact = COMMON_MAKES.find((m) => m.toLowerCase() === lower);
  if (exact) return exact;

  // Fuzzy match (Levenshtein distance)
  let bestMatch = make;
  let bestDistance = Infinity;

  for (const commonMake of COMMON_MAKES) {
    const distance = levenshteinDistance(lower, commonMake.toLowerCase());
    if (distance < bestDistance && distance <= 2) {
      bestDistance = distance;
      bestMatch = commonMake;
    }
  }

  return bestMatch;
}

/**
 * Repair model name (fix common typos)
 */
function repairModel(model: string): string {
  const lower = model.toLowerCase();

  // Exact match
  const exact = COMMON_MODELS.find((m) => m.toLowerCase() === lower);
  if (exact) return exact;

  // Fuzzy match
  let bestMatch = model;
  let bestDistance = Infinity;

  for (const commonModel of COMMON_MODELS) {
    const distance = levenshteinDistance(lower, commonModel.toLowerCase());
    if (distance < bestDistance && distance <= 2) {
      bestDistance = distance;
      bestMatch = commonModel;
    }
  }

  return bestMatch;
}

/**
 * Calculate Levenshtein distance (for fuzzy matching)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export { ParseResult };
