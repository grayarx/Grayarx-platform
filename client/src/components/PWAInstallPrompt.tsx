import React, { useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download } from "lucide-react";

export function PWAInstallPrompt() {
  const { canInstall, isUpdating, hasUpdate, installApp, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && !hasUpdate) {
    return null;
  }

  if (hasUpdate) {
    return (
      <Card className="fixed bottom-4 right-4 p-4 max-w-sm shadow-lg z-50 bg-blue-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Update Available</h3>
            <p className="text-sm text-blue-800 mt-1">
              A new version of GrayArx is available. Update now to get the latest features and improvements.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="ml-2 text-blue-600 hover:text-blue-900"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            onClick={updateApp}
            disabled={isUpdating}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? "Updating..." : "Update Now"}
          </Button>
          <Button
            onClick={() => setDismissed(true)}
            variant="outline"
            className="flex-1"
          >
            Later
          </Button>
        </div>
      </Card>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 max-w-sm shadow-lg z-50 bg-green-50 border-green-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-green-900">Install GrayArx</h3>
          <p className="text-sm text-green-800 mt-1">
            Install GrayArx on your device for quick access and offline support.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 text-green-600 hover:text-green-900"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          onClick={installApp}
          disabled={isUpdating}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Download size={16} className="mr-2" />
          {isUpdating ? "Installing..." : "Install"}
        </Button>
        <Button
          onClick={() => setDismissed(true)}
          variant="outline"
          className="flex-1"
        >
          Not Now
        </Button>
      </div>
    </Card>
  );
}
