import { useEffect, useState, useCallback } from "react";

export interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
  installPrompt: PWAInstallPrompt | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    canInstall: false,
    isUpdating: false,
    hasUpdate: false,
    installPrompt: null,
  });

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          // Check for updates periodically
          const interval = setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setState((prev) => ({ ...prev, hasUpdate: true }));
                }
              });
            }
          });

          return () => clearInterval(interval);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setState((prev) => ({
        ...prev,
        canInstall: true,
        installPrompt: event as PWAInstallPrompt,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = async () => {
      if ("getInstalledRelatedApps" in navigator) {
        const apps = await (navigator as any).getInstalledRelatedApps?.();
        setState((prev) => ({
          ...prev,
          isInstalled: apps && apps.length > 0,
        }));
      }

      // Alternative check: display mode
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setState((prev) => ({ ...prev, isInstalled: true }));
      }
    };

    checkInstalled();
  }, []);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Install app
  const installApp = useCallback(async () => {
    if (!state.installPrompt) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, isUpdating: true }));
      await state.installPrompt.prompt();
      const { outcome } = await state.installPrompt.userChoice;

      if (outcome === "accepted") {
        setState((prev) => ({
          ...prev,
          isInstalled: true,
          canInstall: false,
          installPrompt: null,
        }));
      }
    } catch (error) {
      console.error("Installation failed:", error);
    } finally {
      setState((prev) => ({ ...prev, isUpdating: false }));
    }
  }, [state.installPrompt]);

  // Update app
  const updateApp = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        setState((prev) => ({ ...prev, isUpdating: true }));
        await registration.update();
        setState((prev) => ({ ...prev, isUpdating: false, hasUpdate: false }));

        // Reload page to activate new service worker
        window.location.reload();
      }
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
    }

    return false;
  }, []);

  // Send notification
  const sendNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if ("serviceWorker" in navigator && "Notification" in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, options);
        }
      }
    },
    []
  );

  // Request periodic background sync
  const requestPeriodicSync = useCallback(async (tag: string, minInterval?: number) => {
    if ("serviceWorker" in navigator && "periodicSync" in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await (registration as any).periodicSync.register(tag, {
            minInterval: minInterval || 24 * 60 * 60 * 1000, // 24 hours
          });
          console.log(`Periodic sync registered for: ${tag}`);
        }
      } catch (error) {
        console.error("Periodic sync registration failed:", error);
      }
    }
  }, []);

  // Request background sync
  const requestBackgroundSync = useCallback(async (tag: string) => {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && "sync" in registration) {
          await (registration as any).sync.register(tag);
          console.log(`Background sync registered for: ${tag}`);
        }
      } catch (error) {
        console.error("Background sync registration failed:", error);
      }
    }
  }, []);

  // Share API
  const share = useCallback(
    async (data: ShareData) => {
      if ("share" in navigator) {
        try {
          await (navigator as any).share(data);
        } catch (error) {
          console.error("Share failed:", error);
        }
      }
    },
    []
  );

  // Get cache size
  const getCacheSize = useCallback(async () => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
      };
    }
    return null;
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }, []);

  return {
    ...state,
    installApp,
    updateApp,
    requestNotificationPermission,
    sendNotification,
    requestPeriodicSync,
    requestBackgroundSync,
    share,
    getCacheSize,
    clearCache,
  };
}
