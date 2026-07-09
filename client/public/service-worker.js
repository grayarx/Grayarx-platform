const CACHE_NAME = "grayarx-v2";
const RUNTIME_CACHE = "grayarx-runtime-v2";
const STATIC_ASSETS = [
  "/manifest.json",
];

/** Brand icons must always revalidate — stale SW cache caused wrong tab favicon */
const BRAND_ICON_PATHS = new Set([
  "/favicon-32.png",
  "/favicon.ico",
  "/icon-96x96.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/logo-icon.png",
  "/logo.svg",
]);

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome extensions and external requests
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // Always fetch fresh brand icons (tab favicon / nav emblem)
  if (BRAND_ICON_PATHS.has(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  // API requests - network first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Return cached response on network failure
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first with network fallback
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((response) => {
            if (response.ok) {
              const cache = caches.open(CACHE_NAME);
              cache.then((c) => c.put(request, response.clone()));
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // HTML pages - network first
  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Default - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cache = caches.open(RUNTIME_CACHE);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-audit-logs") {
    event.waitUntil(syncAuditLogs());
  } else if (event.tag === "sync-alerts") {
    event.waitUntil(syncAlerts());
  } else if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  }
});

async function syncAuditLogs() {
  try {
    const db = await openIndexedDB();
    const logs = await getAllFromStore(db, "pending-audit-logs");
    
    for (const log of logs) {
      const response = await fetch("/api/audit/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
      
      if (response.ok) {
        await deleteFromStore(db, "pending-audit-logs", log.id);
      }
    }
  } catch (error) {
    console.error("Failed to sync audit logs:", error);
    throw error;
  }
}

async function syncAlerts() {
  try {
    const db = await openIndexedDB();
    const alerts = await getAllFromStore(db, "pending-alerts");
    
    for (const alert of alerts) {
      const response = await fetch("/api/alerts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      });
      
      if (response.ok) {
        await deleteFromStore(db, "pending-alerts", alert.id);
      }
    }
  } catch (error) {
    console.error("Failed to sync alerts:", error);
    throw error;
  }
}

async function syncNotifications() {
  try {
    const db = await openIndexedDB();
    const notifications = await getAllFromStore(db, "pending-notifications");
    
    for (const notification of notifications) {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });
      
      if (response.ok) {
        await deleteFromStore(db, "pending-notifications", notification.id);
      }
    }
  } catch (error) {
    console.error("Failed to sync notifications:", error);
    throw error;
  }
}

// IndexedDB helpers
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("GrayArxDB", 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains("pending-audit-logs")) {
        db.createObjectStore("pending-audit-logs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending-alerts")) {
        db.createObjectStore("pending-alerts", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending-notifications")) {
        db.createObjectStore("pending-notifications", { keyPath: "id" });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || "New notification",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    tag: data.tag || "notification",
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || "GrayArx", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if window already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Periodic background sync
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-security-data") {
    event.waitUntil(updateSecurityData());
  } else if (event.tag === "sync-compliance-reports") {
    event.waitUntil(syncComplianceReports());
  }
});

async function updateSecurityData() {
  try {
    const response = await fetch("/api/security/data");
    if (response.ok) {
      const data = await response.json();
      const db = await openIndexedDB();
      // Store in IndexedDB
      console.log("Security data updated:", data);
    }
  } catch (error) {
    console.error("Failed to update security data:", error);
  }
}

async function syncComplianceReports() {
  try {
    const response = await fetch("/api/compliance/reports");
    if (response.ok) {
      const reports = await response.json();
      const db = await openIndexedDB();
      // Store in IndexedDB
      console.log("Compliance reports synced:", reports);
    }
  } catch (error) {
    console.error("Failed to sync compliance reports:", error);
  }
}
