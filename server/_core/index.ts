import "dotenv/config";
import express from "express";
import path from "path";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerCustomAuthRoutes } from "./customAuth";
import { registerStorageProxy } from "./storageProxy";
import { registerScheduledRoutes } from "./scheduled";
import { attachAutonomousAuditMiddleware } from "./autonomousAudit";
import { attachMarketGuideRefreshMiddleware } from "./marketGuideScheduler";
import { registerSitemapRoutes } from "./sitemap";
import { registerWebhookRoutes } from "./webhookRoutes";
import { registerSecurityHeaders, registerCanonicalRedirect } from "./securityHeaders";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { apiRouter, healthRouter } from "../api";
import { serveStatic, setupVite } from "./vite";
// import { websocketServerManager } from "./websocketServer";
// import { incidentEscalationEngine } from "./incidentEscalation";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  // On tsx watch restarts the previous process may still be releasing the port.
  // Retry the preferred port up to 8 times (4 s total) before falling back.
  const RETRY_ATTEMPTS = 32;
  const RETRY_DELAY_MS = 500;
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    if (await isPortAvailable(startPort)) return startPort;
    if (attempt < RETRY_ATTEMPTS - 1) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  // Preferred port still busy — find the next free one
  for (let port = startPort + 1; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Apply idempotent SQL migrations (compliance inbox, etc.)
  try {
    const { spawn } = await import("child_process");
    spawn("node", ["scripts/apply-pending-migrations.mjs"], {
      detached: true,
      stdio: "ignore",
    }).unref();
  } catch {
    /* non-fatal */
  }

  const app = express();
  const server = createServer(app);
  registerSecurityHeaders(app);
  registerCanonicalRedirect(app);
  // Configure body parser — capture raw body so webhook HMAC validation uses
  // the exact bytes Meta signed (not a re-serialized JSON.stringify).
  app.use(express.json({
    limit: "50mb",
    verify: (req: any, _res, buf) => { req.rawBody = buf.toString("utf8"); },
  }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  // Serve local uploads when Forge is not configured
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
  registerOAuthRoutes(app);
  registerCustomAuthRoutes(app);
  registerScheduledRoutes(app);
  // Kagiso autonomous audit — self-scheduling, no external scheduler needed
  attachAutonomousAuditMiddleware(app);
  // Weekly market guide live refresh — self-scheduling on first request after boot
  attachMarketGuideRefreshMiddleware(app);
  // Public SEO: /robots.txt + /sitemap.xml
  registerSitemapRoutes(app);
  // Webhook routes for WhatsApp and other integrations
  registerWebhookRoutes(app);
  // Health check endpoint
  app.use("/api", healthRouter);
  // tRPC API — must be registered BEFORE apiRouter because apiRouter's
  // catch-all middleware requires a Bearer token for every /api/* request.
  // Placing tRPC first ensures /api/trpc/* is handled before that check runs.
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // REST API endpoints (leads, inventory, bookings, stats)
  app.use("/api", apiRouter);
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.warn(`⚠️  Port ${preferredPort} is busy — using port ${port} instead.`);
  }

  // Bind to 0.0.0.0 so Railway's proxy can route traffic to the container.
  // Binding to localhost/127.0.0.1 only is invisible to Railway's ingress and causes 522.
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`WebSocket server available at ws://0.0.0.0:${port}/api/ws`);
  });

  // ── Self-healing: sync whatsappPhoneNumberId from env to DB on startup ──
  // Only fills an empty DB field — never overwrites a value set by webhook sync.
  (async () => {
    try {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const dealershipId = Number(process.env.WHATSAPP_DEALERSHIP_ID || "1");
      if (phoneId && dealershipId) {
        const { getDb } = await import("../db");
        const { dealerships } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          const [row] = await db
            .select({ whatsappPhoneNumberId: dealerships.whatsappPhoneNumberId })
            .from(dealerships)
            .where(eq(dealerships.id, dealershipId))
            .limit(1);
          if (!row?.whatsappPhoneNumberId?.trim()) {
            await db
              .update(dealerships)
              .set({ whatsappPhoneNumberId: phoneId })
              .where(eq(dealerships.id, dealershipId));
            console.log(`[Startup] Set dealership ${dealershipId} whatsappPhoneNumberId=${phoneId}`);
          }
        }
      }
    } catch (e) {
      console.warn("[Startup] whatsappPhoneNumberId sync skipped:", (e as Error).message);
    }
  })();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    // websocketServerManager.shutdown();
    // incidentEscalationEngine.shutdown();
    server.close(() => {
      console.log("Server shut down");
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
