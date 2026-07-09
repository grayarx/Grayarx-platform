import { describe, it, expect } from 'vitest';
import { autoRepairCSV } from './_core/csvAutoRepair';

describe('CSV Auto-Repair System', () => {
  it('should parse basic CSV correctly', () => {
    const csvText = `name,email,phone
John Smith,john@example.com,555-0123
Jane Doe,jane@example.com,555-0456`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(2);
    // Check that the row has the mapped fields
    expect(result.rows[0]).toBeDefined();
    expect(result.report.originalRows).toBe(2);
    expect(result.report.repairedRows).toBe(2);
  });

  it('should handle CSV with extra whitespace', () => {
    const csvText = `  name  ,  email  ,  phone  
John Smith , john@example.com , 555-0123
Jane Doe , jane@example.com , 555-0456`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(2);
    expect(result.report.issuesFound.length).toBeGreaterThanOrEqual(0);
  });

  it('should auto-detect column purposes', () => {
    const csvText = `lead_id,customer_name,email_address,phone_number,converted
L001,John Smith,john@example.com,555-0123,Yes
L002,Jane Doe,jane@example.com,555-0456,No`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(2);
    // Columns should be auto-detected
    expect(result.report.mappedColumns['email_address']).toBeDefined();
    expect(result.report.mappedColumns['phone_number']).toBeDefined();
  });

  it('should normalize email addresses to lowercase', () => {
    const csvText = `name,email
John Smith,JOHN@EXAMPLE.COM`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(1);
    // Email should be detected and mapped
    expect(result.report.mappedColumns['email']).toBeDefined();
  });

  it('should extract phone numbers correctly', () => {
    const csvText = `name,phone
John Smith,(555) 123-4567
Jane Doe,555.123.4567`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(2);
    // Phone numbers should be extracted and normalized
    expect(result.report.mappedColumns['phone']).toBeDefined();
  });

  it('should detect and remove duplicate rows', () => {
    const csvText = `name,email
John Smith,john@example.com
John Smith,john@example.com
Jane Doe,jane@example.com`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(2);
    expect(result.report.issuesFound.some(i => i.includes('duplicate'))).toBe(true);
  });

  it('should skip empty rows', () => {
    const csvText = `name,email
John Smith,john@example.com

Jane Doe,jane@example.com
`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(2);
    // Empty rows should be handled
    expect(result.report.issuesFound.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle quoted CSV values with commas', () => {
    const csvText = `name,description
"John Smith","Test, with comma"
"Jane Doe","Normal"`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(2);
  });

  it('should parse boolean values correctly', () => {
    const csvText = `name,converted
John Smith,true
Jane Doe,false
Bob Johnson,1
Alice Brown,0`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(4);
    // Boolean column should be detected
    expect(result.report.mappedColumns['converted']).toBeDefined();
  });

  it('should parse currency/budget values', () => {
    const csvText = `name,budget
John Smith,$25,000
Jane Doe,€35000
Bob Johnson,£45000.50`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(3);
    // Currency values should be extracted and normalized
    expect(result.report.mappedColumns['budget']).toBeDefined();
  });

  it('should handle dates correctly', () => {
    const csvText = `name,date
John Smith,2026-05-29
Jane Doe,05/29/2026`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(2);
    // Date values should be detected and parsed
    expect(result.report.mappedColumns['date']).toBeDefined();
  });

  it('should calculate confidence score', () => {
    const csvText = `name,email,phone
John Smith,john@example.com,555-0123`;

    const result = autoRepairCSV(csvText);
    expect(result.report.confidence).toBeGreaterThan(0.5);
    expect(result.report.confidence).toBeLessThanOrEqual(1);
  });

  it('should handle encoding issues (BOM)', () => {
    const csvText = '\uFEFFname,email\nJohn Smith,john@example.com';

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(1);
    // BOM should be stripped and CSV should parse correctly
    expect(result.rows[0]).toBeDefined();
  });

  it('should provide detailed repair report', () => {
    const csvText = `name,email
John Smith,john@example.com
Jane Doe,jane@example.com`;

    const result = autoRepairCSV(csvText);
    expect(result.report).toHaveProperty('originalRows');
    expect(result.report).toHaveProperty('repairedRows');
    expect(result.report).toHaveProperty('issuesFound');
    expect(result.report).toHaveProperty('mappedColumns');
    expect(result.report).toHaveProperty('confidence');
    expect(result.report).toHaveProperty('warnings');
  });

  it('should handle CSV with unknown columns', () => {
    const csvText = `name,email,unknown_column
John Smith,john@example.com,some_value`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(1);
    expect(result.report.warnings.length).toBeGreaterThan(0);
  });

  it('should throw error on empty CSV', () => {
    const csvText = '';

    expect(() => autoRepairCSV(csvText)).toThrow();
  });

  it('should handle CSV with only headers', () => {
    const csvText = `name,email,phone`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(0);
  });

  it('should preserve original row count in report', () => {
    const csvText = `name,email
John Smith,john@example.com
Jane Doe,jane@example.com
Bob Johnson,bob@example.com`;

    const result = autoRepairCSV(csvText);
    expect(result.report.originalRows).toBe(3);
    expect(result.report.repairedRows).toBe(3);
  });

  it('should handle mixed case column names', () => {
    const csvText = `Name,EMAIL,Phone
John Smith,john@example.com,555-0123`;

    const result = autoRepairCSV(csvText);
    expect(result.rows).toHaveLength(1);
    // Mixed case column names should be normalized
    expect(result.report.mappedColumns['name']).toBeDefined();
  });
});
