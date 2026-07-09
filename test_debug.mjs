import { autoRepairCSV } from './server/_core/csvAutoRepair.ts';

const csvText = `name,email
John Smith,john@example.com`;

const result = autoRepairCSV(csvText);
console.log('Result rows:', JSON.stringify(result.rows, null, 2));
console.log('Mapped columns:', result.report.mappedColumns);
