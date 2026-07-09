import React, { useEffect, useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Hide indicator after 2 seconds when coming back online
      const timer = setTimeout(() => setShowIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showIndicator) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 py-2 px-4 text-center text-sm font-medium transition-all ${
        isOnline
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi size={16} />
            <span>Back Online</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>You are offline. Some features may be limited.</span>
          </>
        )}
      </div>
    </div>
  );
}
