import React, { useState } from 'react';
import { SimpleCSVUpload } from '@/components/SimpleCSVUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDataImport() {
  const [importedData, setImportedData] = useState<any>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/trpc/csvAutoRepair.getTemplate');
      const result = await response.json();
      const { template } = result.result?.data || {};

      if (!template) throw new Error('Failed to get template');

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(template));
      element.setAttribute('download', 'grayarx-import-template.csv');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success('Template downloaded!');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Import Historical Data</h1>
          <p className="text-gray-600 mt-2">
            Upload your dealership's past leads and conversions. We'll automatically fix any issues and calibrate our lead scoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Easy Upload</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Just drag and drop your CSV. We handle the rest.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900">Auto-Repair</h3>
                <p className="text-sm text-green-800 mt-1">
                  Corrupted data? Missing columns? We fix it automatically.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-900">Smart Mapping</h3>
                <p className="text-sm text-purple-800 mt-1">
                  Column names don't matter. We figure out what's what.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Upload Your Data</h2>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          <SimpleCSVUpload
            onComplete={(data) => {
              setImportedData(data);
              toast.success(`Imported ${data.report.repairedRows} records successfully!`);
            }}
          />
        </Card>

        {importedData && (
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Import Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-green-700">Original Records</p>
                <p className="text-2xl font-bold text-green-900">
                  {importedData.report.originalRows}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Imported Records</p>
                <p className="text-2xl font-bold text-green-900">
                  {importedData.report.repairedRows}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Mapping Confidence</p>
                <p className="text-2xl font-bold text-green-900">
                  {(importedData.report.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Issues Fixed</p>
                <p className="text-2xl font-bold text-green-900">
                  {importedData.report.issuesFound.length}
                </p>
              </div>
            </div>

            {importedData.report.issuesFound.length > 0 && (
              <div className="mt-6 pt-6 border-t border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">Issues Fixed:</h4>
                <ul className="space-y-2">
                  {importedData.report.issuesFound.map((issue: string, i: number) => (
                    <li key={i} className="text-sm text-green-800">
                      ✓ {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">How It Works</h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <p className="font-semibold">Upload Your CSV</p>
                <p className="text-gray-600">
                  Drag and drop any CSV file. Column names and order don't matter.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <p className="font-semibold">We Analyze & Repair</p>
                <p className="text-gray-600">
                  GrayArx automatically detects what each column contains, fixes corrupted data, removes duplicates, and normalizes formats.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <p className="font-semibold">Calibrate Lead Scoring</p>
                <p className="text-gray-600">
                  Your historical data helps us fine-tune lead scoring to match your dealership's actual conversion patterns.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <p className="font-semibold">Start Getting Better Leads</p>
                <p className="text-gray-600">
                  GrayArx now identifies hot leads with higher accuracy based on your specific market and preferences.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
}
