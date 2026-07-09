import { AlertCircle } from "lucide-react";

interface FormErrorBoundaryProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function FormErrorBoundary({ error, onDismiss, className = "" }: FormErrorBoundaryProps) {
  if (!error) return null;

  return (
    <div className={`p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-400 text-sm font-medium">Error</p>
        <p className="text-red-400/80 text-sm mt-1">{error}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400/60 hover:text-red-400 transition flex-shrink-0"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
