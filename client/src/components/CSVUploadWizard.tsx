import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
}

interface CSVData {
  headers: string[];
  rows: Record<string, any>[];
}

interface CSVUploadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: CSVData, mappings: ColumnMapping[]) => Promise<void>;
  expectedColumns: string[];
}

const STANDARD_COLUMNS = {
  leadId: { label: 'Lead ID', type: 'string' },
  dealershipName: { label: 'Dealership Name', type: 'string' },
  customerName: { label: 'Customer Name', type: 'string' },
  score: { label: 'Lead Score (0-100)', type: 'number' },
  grade: { label: 'Grade (A-F)', type: 'string' },
  converted: { label: 'Converted (true/false)', type: 'boolean' },
  daysToClose: { label: 'Days to Close', type: 'number' },
  interactionCount: { label: 'Interaction Count', type: 'number' },
  daysActive: { label: 'Days Active', type: 'number' },
  testDriveCompleted: { label: 'Test Drive Completed', type: 'boolean' },
  financingApplied: { label: 'Financing Applied', type: 'boolean' },
  tradeInInterest: { label: 'Trade-In Interest', type: 'boolean' },
  interestLevel: { label: 'Interest Level (hot/warm/cold)', type: 'string' },
  stageProgression: { label: 'Stage Progression (0-5)', type: 'number' },
  lastContactDaysAgo: { label: 'Last Contact Days Ago', type: 'number' },
  responseTime: { label: 'Response Time (minutes)', type: 'number' },
  chatbotEngagement: { label: 'Chatbot Engagement %', type: 'number' },
  emailOpenRate: { label: 'Email Open Rate %', type: 'number' },
  vehicleCategory: { label: 'Vehicle Category', type: 'string' },
  priceRange: { label: 'Price Range', type: 'string' },
};

export function CSVUploadWizard({ isOpen, onClose, onImport, expectedColumns }: CSVUploadWizardProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'confirm'>('upload');
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const parseCSV = (text: string): CSVData => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });
    return { headers, rows };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);

        if (data.headers.length === 0) {
          setError('CSV file is empty');
          return;
        }

        if (data.rows.length === 0) {
          setError('CSV file has no data rows');
          return;
        }

        setCSVData(data);
        autoMapColumns(data.headers);
        setStep('preview');
      } catch (err) {
        setError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsText(file);
  };

  const autoMapColumns = (csvHeaders: string[]) => {
    const newMappings: ColumnMapping[] = [];

    csvHeaders.forEach(csvHeader => {
      const normalized = csvHeader.toLowerCase().replace(/\s+/g, '');
      let bestMatch = '';
      let bestScore = 0;

      Object.keys(STANDARD_COLUMNS).forEach(dbColumn => {
        const dbNormalized = dbColumn.toLowerCase();
        const similarity = calculateSimilarity(normalized, dbNormalized);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = dbColumn;
        }
      });

      if (bestScore > 0.6) {
        newMappings.push({
          csvColumn: csvHeader,
          dbColumn: bestMatch,
          dataType: (STANDARD_COLUMNS as any)[bestMatch]?.type || 'string',
        });
      } else {
        newMappings.push({
          csvColumn: csvHeader,
          dbColumn: '',
          dataType: 'string',
        });
      }
    });

    setMappings(newMappings);
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const getEditDistance = (s1: string, s2: string): number => {
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
  };

  const handleMappingChange = (index: number, dbColumn: string) => {
    const newMappings = [...mappings];
    newMappings[index].dbColumn = dbColumn;
    if (dbColumn && (STANDARD_COLUMNS as any)[dbColumn]) {
      newMappings[index].dataType = (STANDARD_COLUMNS as any)[dbColumn].type;
    }
    setMappings(newMappings);
  };

  const handleImport = async () => {
    if (!csvData) return;

    const validMappings = mappings.filter(m => m.dbColumn);
    if (validMappings.length === 0) {
      setError('Please map at least one column');
      return;
    }

    setIsLoading(true);
    try {
      await onImport(csvData, validMappings);
      setStep('confirm');
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setCSVData(null);
    setMappings([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>GrayArx Historical Data Import</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">Drag and drop your CSV file</p>
              <p className="text-sm text-gray-600 mb-4">or click to select</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input">
                <Button variant="outline" asChild>
                  <span>Select CSV File</span>
                </Button>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Your CSV should include columns like: Lead ID, Customer Name, Score, Grade, Converted, Days to Close, etc.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'preview' && csvData && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-900">
                  CSV loaded successfully: <strong>{csvData.rows.length} records</strong>, <strong>{csvData.headers.length} columns</strong>
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {csvData.headers.map((header, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium border-b">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      {csvData.headers.map((header, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700">
                          {String(row[header]).substring(0, 20)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={() => setStep('mapping')} className="ml-auto">
                Next: Map Columns <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'mapping' && csvData && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Map your CSV columns to GrayArx database fields. Auto-detected mappings are shown below.
            </p>

            <div className="max-h-96 overflow-auto space-y-3 border rounded-lg p-4 bg-gray-50">
              {mappings.map((mapping, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div>
                      <p className="text-xs text-gray-500">CSV Column</p>
                      <p className="font-medium text-sm">{mapping.csvColumn}</p>
                    </div>
                    <div className="flex justify-center">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">GrayArx Field</p>
                      <select
                        value={mapping.dbColumn}
                        onChange={(e) => handleMappingChange(index, e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="">-- Skip this column --</option>
                        {Object.entries(STANDARD_COLUMNS).map(([key, value]) => (
                          <option key={key} value={key}>
                            {(value as any).label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('preview')}>
                Back
              </Button>
              <Button onClick={() => setStep('confirm')} className="ml-auto">
                Next: Review <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && csvData && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Ready to import <strong>{csvData.rows.length} leads</strong> with <strong>{mappings.filter(m => m.dbColumn).length} mapped fields</strong>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-auto">
              <p className="text-xs font-medium text-gray-600 mb-2">Mapped Fields:</p>
              <ul className="space-y-1">
                {mappings
                  .filter(m => m.dbColumn)
                  .map((mapping, i) => (
                    <li key={i} className="text-xs text-gray-700">
                      <span className="font-medium">{mapping.csvColumn}</span> → <span className="text-blue-600">{mapping.dbColumn}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading} className="ml-auto">
                {isLoading ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && !csvData && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-lg font-medium mb-2">Import Complete!</p>
            <p className="text-sm text-gray-600 mb-4">Your historical data has been imported and GrayArx is calibrating lead scores.</p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
