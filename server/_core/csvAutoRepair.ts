import { z } from 'zod';

/**
 * Intelligent CSV Auto-Repair System
 * Automatically detects, repairs, and maps ANY CSV format to GrayArx schema
 * Dealerships upload messy data - GrayArx handles everything
 */

export interface RepairReport {
  originalRows: number;
  repairedRows: number;
  issuesFound: string[];
  mappedColumns: Record<string, string>;
  confidence: number;
  warnings: string[];
}

export interface RepairedData {
  rows: Record<string, any>[];
  report: RepairReport;
}

/**
 * Detect column purpose using fuzzy matching and content analysis
 */
function detectColumnPurpose(
  columnName: string,
  sampleValues: string[],
  allColumnNames: string[]
): { purpose: string; confidence: number } {
  const name = columnName.toLowerCase().trim();
  
  // Common lead column patterns
  const patterns: Record<string, { keywords: string[]; confidence: number }> = {
    leadId: { keywords: ['id', 'lead_id', 'leadid', 'lead id', 'reference', 'ref'], confidence: 0.95 },
    customerName: { keywords: ['name', 'customer', 'customer_name', 'full_name', 'fullname', 'contact'], confidence: 0.9 },
    email: { keywords: ['email', 'email_address', 'e-mail', 'mail', 'contact_email'], confidence: 0.95 },
    phone: { keywords: ['phone', 'phone_number', 'phonenumber', 'mobile', 'cell', 'contact_phone', 'tel'], confidence: 0.9 },
    vehicleInterest: { keywords: ['vehicle', 'car', 'model', 'interest', 'interested_in', 'vehicle_interest'], confidence: 0.85 },
    budget: { keywords: ['budget', 'price', 'amount', 'max_price', 'budget_range'], confidence: 0.8 },
    tradeIn: { keywords: ['trade', 'trade_in', 'tradein', 'trade-in', 'current_vehicle'], confidence: 0.85 },
    testDrive: { keywords: ['test', 'test_drive', 'testdrive', 'test-drive', 'appointment'], confidence: 0.8 },
    source: { keywords: ['source', 'channel', 'origin', 'where', 'how_found', 'lead_source'], confidence: 0.85 },
    status: { keywords: ['status', 'stage', 'state', 'lead_status', 'progress'], confidence: 0.8 },
    createdAt: { keywords: ['date', 'created', 'created_at', 'date_added', 'timestamp', 'when'], confidence: 0.85 },
    converted: { keywords: ['converted', 'closed', 'sold', 'purchased', 'bought', 'conversion'], confidence: 0.85 },
  };

  let bestMatch = { purpose: 'unknown', confidence: 0 };

  for (const [purpose, { keywords }] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      const similarity = calculateStringSimilarity(name, keyword);
      if (similarity > bestMatch.confidence) {
        bestMatch = { purpose, confidence: similarity };
      }
    }
  }

  // Content-based detection if name matching is weak
  if (bestMatch.confidence < 0.5) {
    const contentAnalysis = analyzeColumnContent(sampleValues);
    if (contentAnalysis) {
      bestMatch = contentAnalysis;
    }
  }

  return bestMatch;
}

/**
 * Analyze column content to infer purpose
 */
function analyzeColumnContent(values: string[]): { purpose: string; confidence: number } | null {
  const cleanValues = values.filter(v => v && v.trim());
  if (cleanValues.length === 0) return null;

  // Email detection
  if (cleanValues.some(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
    return { purpose: 'email', confidence: 0.95 };
  }

  // Phone detection
  if (cleanValues.some(v => /^[\d\s\-\+\(\)]{7,}$/.test(v.replace(/\D/g, '')))) {
    return { purpose: 'phone', confidence: 0.9 };
  }

  // Date detection
  if (cleanValues.some(v => /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/.test(v))) {
    return { purpose: 'createdAt', confidence: 0.85 };
  }

  // Boolean/Status detection
  if (cleanValues.every(v => ['yes', 'no', 'true', 'false', '1', '0', 'y', 'n'].includes(v.toLowerCase()))) {
    return { purpose: 'converted', confidence: 0.8 };
  }

  // Currency/Budget detection
  if (cleanValues.some(v => /^[\$€£]?[\d,\.]+$/.test(v))) {
    return { purpose: 'budget', confidence: 0.75 };
  }

  return null;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let j = 0; j <= s2.length; j++) {
    let lastValue = j;
    for (let i = 1; i <= s1.length; i++) {
      let newValue = costs[j] || 0;
      if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
        newValue = Math.min(Math.min(newValue + 1, lastValue + 1), (costs[j - 1] || 0) + 1);
      }
      costs[j] = lastValue;
      lastValue = newValue;
    }
    costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Repair and normalize a single value
 */
function repairValue(value: any, purpose: string): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const str = String(value).trim();

  switch (purpose) {
    case 'email':
      return str.toLowerCase();
    
    case 'phone':
      return str.replace(/\D/g, '').slice(-10); // Keep last 10 digits
    
    case 'budget':
      const numMatch = str.replace(/[^\d.]/g, '');
      return numMatch ? parseFloat(numMatch) : null;
    
    case 'converted':
      return ['yes', 'true', '1', 'y'].includes(str.toLowerCase());
    
    case 'createdAt':
      try {
        const date = new Date(str);
        return date.getTime() > 0 ? date.toISOString() : null;
      } catch {
        return null;
      }
    
    case 'customerName':
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    
    default:
      return str;
  }
}

/**
 * Detect and repair CSV encoding issues
 */
function repairEncoding(csvText: string): string {
  // Remove BOM if present
  if (csvText.charCodeAt(0) === 0xFEFF) {
    csvText = csvText.slice(1);
  }

  // Replace common encoding artifacts
  csvText = csvText
    .replace(/â€™/g, "'") // Smart quote
    .replace(/â€œ/g, '"') // Smart quote
    .replace(/â€\u009d/g, '"') // Smart quote
    .replace(/Â/g, ''); // Non-breaking space artifact

  return csvText;
}

/**
 * Parse CSV with robust error handling
 */
function parseCSV(csvText: string): string[][] {
  csvText = repairEncoding(csvText);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      }
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Main repair function - takes ANY CSV and returns clean, mapped data
 */
export function autoRepairCSV(csvText: string): RepairedData {
  const issues: string[] = [];
  const warnings: string[] = [];
  let originalRowCount = 0;

  try {
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }

    originalRowCount = rows.length - 1; // Exclude header

    // Extract headers
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    // Detect column purposes
    const columnMappings: Record<string, string> = {};
    const sampleSize = Math.min(5, dataRows.length);
    const samples = dataRows.slice(0, sampleSize);

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const sampleValues = samples.map(row => row[i] || '');
      const { purpose, confidence } = detectColumnPurpose(header, sampleValues, headers);
      
      if (confidence > 0.5) {
        columnMappings[header] = purpose;
        if (confidence < 0.7) {
          warnings.push(`Column "${header}" mapped to "${purpose}" with low confidence (${(confidence * 100).toFixed(0)}%)`);
        }
      } else {
        warnings.push(`Column "${header}" could not be automatically mapped - will be preserved as-is`);
      }
    }

    // Repair data rows
    const repairedRows: Record<string, any>[] = [];
    let duplicateCount = 0;
    let emptyRowCount = 0;
    const seenKeys = new Set<string>();

    for (const row of dataRows) {
      const repairedRow: Record<string, any> = {};
      let isEmpty = true;

      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const purpose = columnMappings[header] || header;
        const value = row[i] || '';
        
        if (value) {
          isEmpty = false;
          repairedRow[purpose] = repairValue(value, purpose);
        }
      }

      if (isEmpty) {
        emptyRowCount++;
        issues.push(`Row ${repairedRows.length + 1}: Empty row skipped`);
        continue;
      }

      // Duplicate detection
      const rowKey = JSON.stringify(repairedRow);
      if (seenKeys.has(rowKey)) {
        duplicateCount++;
        issues.push(`Row ${repairedRows.length + 1}: Duplicate row skipped`);
        continue;
      }
      seenKeys.add(rowKey);

      repairedRows.push(repairedRow);
    }

    if (emptyRowCount > 0) {
      issues.push(`${emptyRowCount} empty rows removed`);
    }
    if (duplicateCount > 0) {
      issues.push(`${duplicateCount} duplicate rows removed`);
    }

    const confidence = Math.min(
      1,
      Object.values(columnMappings).filter(p => p !== 'unknown').length / Math.max(1, Object.keys(columnMappings).length)
    );

    return {
      rows: repairedRows,
      report: {
        originalRows: originalRowCount,
        repairedRows: repairedRows.length,
        issuesFound: issues,
        mappedColumns: columnMappings,
        confidence,
        warnings,
      },
    };
  } catch (error) {
    throw new Error(`CSV repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
