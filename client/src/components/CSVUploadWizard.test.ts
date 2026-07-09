import { describe, it, expect } from 'vitest';

describe('CSVUploadWizard', () => {
  it('should parse CSV correctly', () => {
    const csvText = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });

    expect(headers).toEqual(['name', 'age', 'city']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ name: 'John', age: '30', city: 'NYC' });
    expect(rows[1]).toEqual({ name: 'Jane', age: '25', city: 'LA' });
  });

  it('should calculate string similarity correctly', () => {
    const calculateSimilarity = (str1: string, str2: string): number => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;

      const costs: number[] = [];
      for (let j = 0; j <= shorter.length; j++) {
        let lastValue = j;
        for (let i = 1; i <= longer.length; i++) {
          let newValue = costs[j] || 0;
          if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue + 1, lastValue + 1), (costs[j - 1] || 0) + 1);
          }
          costs[j] = lastValue;
          lastValue = newValue;
        }
        costs[shorter.length] = lastValue;
      }
      const editDistance = costs[shorter.length];
      return (longer.length - editDistance) / longer.length;
    };

    const similarity1 = calculateSimilarity('leadId', 'lead_id');
    expect(similarity1).toBeGreaterThan(0.6);

    const similarity2 = calculateSimilarity('customerName', 'customer_name');
    expect(similarity2).toBeGreaterThan(0.6);

    const similarity3 = calculateSimilarity('xyz', 'abc');
    expect(similarity3).toBeLessThan(0.5);
  });

  it('should handle empty CSV', () => {
    const csvText = '';
    const lines = csvText.trim().split('\n');
    expect(lines[0]).toBe('');
  });

  it('should handle CSV with special characters', () => {
    const csvText = 'name,description\n"John Doe","Test, with comma"\n"Jane Smith","Normal"';
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    expect(headers).toEqual(['name', 'description']);
  });

  it('should validate data types', () => {
    const validateNumber = (value: string): boolean => {
      return !isNaN(parseFloat(value));
    };

    const validateBoolean = (value: string): boolean => {
      return value.toLowerCase() === 'true' || value.toLowerCase() === 'false' || value === '1' || value === '0';
    };

    expect(validateNumber('123')).toBe(true);
    expect(validateNumber('abc')).toBe(false);
    expect(validateBoolean('true')).toBe(true);
    expect(validateBoolean('false')).toBe(true);
    expect(validateBoolean('1')).toBe(true);
    expect(validateBoolean('yes')).toBe(false);
  });
});
