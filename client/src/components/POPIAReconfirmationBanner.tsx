import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface POPIAReconfirmationBannerProps {
  onReconfirm: () => void;
  isLoading?: boolean;
  daysUntilExpiry?: number;
}

export function POPIAReconfirmationBanner({
  onReconfirm,
  isLoading = false,
  daysUntilExpiry,
}: POPIAReconfirmationBannerProps) {
  return (
    <Alert className="border-red-200 bg-red-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="text-red-900">
          <p className="font-semibold">POPIA Consent Expired</p>
          <p className="text-sm">
            Your POPIA consent has expired and needs to be re-confirmed to continue using GrayArx.
            {daysUntilExpiry !== undefined && daysUntilExpiry < 0 && (
              <span className="block mt-1">
                Expired {Math.abs(daysUntilExpiry)} day{Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago.
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={onReconfirm}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
        >
          {isLoading ? 'Re-confirming...' : 'Re-confirm Now'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
