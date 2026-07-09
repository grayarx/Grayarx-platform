import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface UploadStatus {
  state: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  report?: {
    originalRows: number;
    repairedRows: number;
    issuesFound: string[];
    warnings: string[];
    confidence: number;
  };
}

export const SimpleCSVUpload: React.FC<{
  onComplete?: (data: any) => void;
}> = ({ onComplete }) => {
  const [status, setStatus] = useState<UploadStatus>({
    state: 'idle',
    progress: 0,
    message: 'Drag and drop your CSV file here or click to browse',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setStatus({
      state: 'uploading',
      progress: 25,
      message: 'Reading file...',
    });

    try {
      const text = await file.text();

      setStatus({
        state: 'processing',
        progress: 50,
        message: 'Analyzing and repairing data...',
      });

      // Send to server for auto-repair
      const response = await fetch('/api/trpc/calibration.autoRepairCSV', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text }),
      });

      if (!response.ok) throw new Error('Failed to process CSV');

      const result = await response.json();
      const data = result.result?.data;

      setStatus({
        state: 'complete',
        progress: 100,
        message: `✅ Successfully processed ${data.report.repairedRows} records!`,
        report: data.report,
      });

      toast.success(`Imported ${data.report.repairedRows} records from your file`);
      onComplete?.(data);
    } catch (error) {
      setStatus({
        state: 'error',
        progress: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      toast.error('Failed to process CSV file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = true;
  };

  const handleDragLeave = () => {
    dragOverRef.current = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-12 text-center cursor-pointer transition-colors ${
            dragOverRef.current ? 'bg-blue-50' : ''
          }`}
        >
          {status.state === 'idle' && (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Upload Your Data</h3>
              <p className="text-gray-600 mb-4">{status.message}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Choose File
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                We'll automatically fix any issues and map your data
              </p>
            </>
          )}

          {status.state === 'uploading' && (
            <>
              <Loader className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-gray-600">{status.message}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </>
          )}

          {status.state === 'processing' && (
            <>
              <Loader className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-gray-600">{status.message}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </>
          )}

          {status.state === 'complete' && status.report && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
              <p className="text-gray-600 mb-4">{status.message}</p>

              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Original Records</p>
                    <p className="text-xl font-semibold">{status.report.originalRows}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Imported Records</p>
                    <p className="text-xl font-semibold text-green-600">{status.report.repairedRows}</p>
                  </div>
                </div>

                {status.report.issuesFound.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-600 font-semibold mb-2">Issues Fixed:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {status.report.issuesFound.slice(0, 3).map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                      {status.report.issuesFound.length > 3 && (
                        <li>• +{status.report.issuesFound.length - 3} more issues</li>
                      )}
                    </ul>
                  </div>
                )}

                {status.report.warnings.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-600 font-semibold mb-2">Warnings:</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {status.report.warnings.slice(0, 2).map((warning, i) => (
                        <li key={i}>⚠️ {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  setStatus({
                    state: 'idle',
                    progress: 0,
                    message: 'Drag and drop your CSV file here or click to browse',
                  });
                }}
                variant="outline"
              >
                Upload Another File
              </Button>
            </>
          )}

          {status.state === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
              <p className="text-gray-600 mb-4">{status.message}</p>
              <Button
                onClick={() => {
                  setStatus({
                    state: 'idle',
                    progress: 0,
                    message: 'Drag and drop your CSV file here or click to browse',
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
