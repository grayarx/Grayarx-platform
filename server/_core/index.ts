import "dotenv/config";
import express from "express";
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
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  registerSecurityHeaders(app);
  registerCanonicalRedirect(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
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
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket server available at ws://localhost:${port}/api/ws`);
  });

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
