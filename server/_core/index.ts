import "dotenv/config";
// Sentry must be imported as early as possible (before other modules) so its
// auto-instrumentation can wrap them. No-ops cleanly when SENTRY_DSN is unset.
import { attachSentryErrorHandler, captureException } from "./sentry";
import express from "express";
import path from "path";
import { createServer, type Server as HttpServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerCustomAuthRoutes } from "./customAuth";
import { registerStorageProxy } from "./storageProxy";
import { registerScheduledRoutes } from "./scheduled";
import { attachAutonomousAuditMiddleware } from "./autonomousAudit";
import { attachMarketGuideRefreshMiddleware } from "./marketGuideScheduler";
import {
  attachPrincipalEnrichmentMiddleware,
  startAlwaysOnPrincipalEnrichment,
} from "./principalEnrichmentScheduler";
import { registerSitemapRoutes } from "./sitemap";
import { registerWebhookRoutes } from "./webhookRoutes";
import { registerLivenessHealthRoutes, startBackgroundHealthProbes } from "./livenessHealth";
import { registerNalaOsRoutes } from "./nalaOsRoutes";
import { registerEmbedRoutes } from "./embedRoutes";
import { registerSecurityHeaders, registerCanonicalRedirect } from "./securityHeaders";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { apiRouter, healthRouter } from "../api";
import { serveStatic, setupVite } from "./vite";
import { registerVehicleOgMiddleware } from "./vehicleOgHtml";
import { alertFounder } from "./founderAlert";
// import { websocketServerManager } from "./websocketServer";
// import { incidentEscalationEngine } from "./incidentEscalation";

/**
 * Process-level safety net. Before this, an uncaught exception or unhandled
 * promise rejection anywhere in the app would either crash Node with a raw
 * stack trace in the Railway logs (no alert to the founder) or — for
 * unhandled rejections on older/permissive Node configs — silently vanish,
 * leaving the process limping in a possibly-corrupt state.
 *
 * Node best practice (see Node.js docs on `process.on('uncaughtException')`):
 * an uncaughtException means the app is in an undefined state, so the
 * correct move is to log it, alert a human, and exit — letting Railway's
 * restart policy bring up a clean process — rather than trying to keep
 * running. `unhandledRejection` is treated the same way for consistency
 * (Node itself terminates on unhandled rejections by default since v15).
 */
function registerProcessSafetyNet() {
  const handleFatal = (kind: "uncaughtException" | "unhandledRejection", err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`[FATAL] ${kind}:`, err);
    captureException(err, { kind });

    alertFounder({
      title: `CRITICAL: ${kind} — server restarting`,
      content: `${kind} caught at process level.\n\nMessage: ${message}\n\nStack:\n${stack?.slice(0, 1500) ?? "(no stack)"}\n\nProcess will exit; Railway's restart policy should bring it back up.`,
      category: "ops",
    })
      .catch(() => {})
      .finally(() => {
        // Give the alert (best-effort) a brief moment to flush before exiting.
        setTimeout(() => process.exit(1), 250);
      });
  };

  process.on("uncaughtException", (err) => handleFatal("uncaughtException", err));
  process.on("unhandledRejection", (reason) => handleFatal("unhandledRejection", reason));
}

registerProcessSafetyNet();

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

export async function startServer(existing?: { app: express.Express; server: HttpServer }) {
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

  const app = existing?.app ?? express();
  const server = existing?.server ?? createServer(app);
  registerSecurityHeaders(app);
  registerCanonicalRedirect(app);
  // Always register the full health handler. The liveness entry's stub answers
  // Railway first; `?full=1` calls next() into this handler after boot.
  registerLivenessHealthRoutes(app);
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
  registerCustomAuthRoutes(app);
  registerScheduledRoutes(app);
  // Kagiso autonomous audit — self-scheduling, no external scheduler needed
  attachAutonomousAuditMiddleware(app);
  // Weekly market guide live refresh — self-scheduling on first request after boot
  attachMarketGuideRefreshMiddleware(app);
  // Sipho principal-email enrichment — self-scheduling every ~4h on traffic
  attachPrincipalEnrichmentMiddleware(app);
  // Public SEO: /robots.txt + /sitemap.xml
  registerSitemapRoutes(app);
  // Founder business plan — standalone HTML at repo root
  app.get(["/business-plan", "/business-plan.html"], (_req, res) => {
    res.sendFile(path.join(process.cwd(), "GrayArx-International-Business-Plan.html"));
  });
  // Webhook routes for WhatsApp and other integrations
  registerWebhookRoutes(app);
  // Nala Dealership OS REST pack (pricing, regions, prospector ICP, metering).
  // Must sit BEFORE apiRouter's Bearer catch-all. Does not replace WhatsApp webhooks.
  registerNalaOsRoutes(app);
  // Dealer website drop-in: /embed/:shortcode (+ .js bootstrap)
  registerEmbedRoutes(app);
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
  // Crawler OG for /showroom/:id — MUST run before SPA catch-all (Vite/static).
  // Express `app.use("*")` sets req.path to `/`, so OG must not rely on that alone.
  registerVehicleOgMiddleware(app);
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  // Error-handling middleware MUST be registered last, after every route
  // (including the Vite/static SPA catch-all above) — Express only walks
  // forward through the stack for `next(err)`, so anything registered
  // earlier would miss errors thrown by later middleware.
  attachSentryErrorHandler(app);
  // Fallback error handler — Express's default is an HTML page, which isn't
  // useful for API/JSON clients. Anything that reaches here has already been
  // reported to Sentry (above); this just makes sure the client gets a clean
  // JSON response instead of a stack trace.
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[Express error] ${req.method} ${req.originalUrl}:`, err);
    if (res.headersSent) return;
    const status = typeof err?.status === "number" ? err.status : typeof err?.statusCode === "number" ? err.statusCode : 500;
    const sentryEventId = (res as any).sentry;
    res.status(status).json({
      error: "Internal server error",
      ...(sentryEventId ? { sentryEventId } : {}),
    });
  });

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  // Railway assigns PORT exclusively — bind/close probing can delay listen past healthcheck.
  const onRailway = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_NAME,
  );

  const onListening = (boundPort: number) => {
    console.log(`Server running on http://0.0.0.0:${boundPort}/`);
    console.log(`WebSocket server available at ws://0.0.0.0:${boundPort}/api/ws`);
    startAlwaysOnPrincipalEnrichment();
    startBackgroundHealthProbes();
  };

  if (server.listening) {
    const addr = server.address();
    const bound =
      typeof addr === "object" && addr && "port" in addr ? addr.port : preferredPort;
    onListening(bound);
  } else {
    const port = onRailway ? preferredPort : await findAvailablePort(preferredPort);
    if (port !== preferredPort) {
      console.warn(`⚠️  Port ${preferredPort} is busy — using port ${port} instead.`);
    }
    // Bind to 0.0.0.0 so Railway's proxy can route traffic to the container.
    // Binding to localhost/127.0.0.1 only is invisible to Railway's ingress and causes 522.
    server.listen(port, "0.0.0.0", () => onListening(port));
  }

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

  // ── One-time demo stock purge (only when PURGE_DEMO_INVENTORY is set) ──
  (async () => {
    try {
      const { purgeDemoInventoryIfRequested } = await import("./purgeDemoInventory");
      await purgeDemoInventoryIfRequested();
    } catch (e) {
      console.warn("[Startup] demo inventory purge skipped:", (e as Error).message);
    }
  })();

  // ── One-time account fix (only when FIX_DEALER_ACCOUNT is set) ──
  (async () => {
    try {
      const { fixDealerAccountsIfRequested } = await import("./fixDealerAccount");
      await fixDealerAccountsIfRequested();
    } catch (e) {
      console.warn("[Startup] dealer account fix skipped:", (e as Error).message);
    }
  })();

  // ── Demo showroom: fill missing year/fuel/km/transmission for pitch demos ──
  (async () => {
    try {
      const { healDemoInventoryMetadata } = await import("./demoInventoryHeal");
      await healDemoInventoryMetadata();
    } catch (e) {
      console.warn("[Startup] demo inventory heal skipped:", (e as Error).message);
    }
  })();

  // ── Heal missing publicShortcode on any dealership (book/apply/embed URLs) ──
  (async () => {
    try {
      const { ensureAllDealershipShortcodes } = await import("../db");
      const healed = await ensureAllDealershipShortcodes();
      if (healed > 0) {
        console.log(`[Startup] Assigned publicShortcode to ${healed} dealership(s)`);
      }
    } catch (e) {
      console.warn("[Startup] shortcode heal skipped:", (e as Error).message);
    }
  })();

  // ── Auto-seed: create demo dealership + dealer user + vehicles if DB is empty ──
  (async () => {
    try {
      const { getDb } = await import("../db");
      const { dealerships, users, vehicles } = await import("../../drizzle/schema");
      const { eq, sql, isNull } = await import("drizzle-orm");
      const bcrypt = (await import("bcryptjs")).default;
      const db = await getDb();
      if (!db) return;

      const allDealerships = await db.select({ id: dealerships.id }).from(dealerships).limit(1);

      // ── Always-on healing: assign orphaned vehicles to the primary dealership ──
      if (allDealerships.length > 0) {
        const primaryId = allDealerships[0].id;
        const orphaned = await db
          .select({ id: vehicles.id })
          .from(vehicles)
          .where(isNull(vehicles.dealershipId))
          .limit(1);
        if (orphaned.length > 0) {
          await db
            .update(vehicles)
            .set({ dealershipId: primaryId })
            .where(isNull(vehicles.dealershipId));
          console.log(`[Startup] Assigned orphaned vehicles → dealership ${primaryId}`);
        }
        return;
      }

      console.log("[Startup] No dealerships found — seeding demo dealership…");

      // Create demo dealership
      await db.insert(dealerships).values({
        name: "GrayArx Demo Dealership",
        contactEmail: "dealer@grayarx.com",
        contactPhone: "+27101234567",
        region: "Gauteng",
        status: "active",
        plan: "professional",
        publicShortcode: "demo",
        showroomTheme: "futuristic",
        whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
      });
      // Query back to get the real ID (avoids insertId ambiguity across drivers)
      const [created] = await db
        .select({ id: dealerships.id })
        .from(dealerships)
        .where(eq(dealerships.publicShortcode, "demo"))
        .limit(1);
      const demoId = created?.id ?? 1;
      console.log(`[Startup] Created demo dealership id=${demoId}`);

      // Create dealer user
      const dealerEmail = "dealer@grayarx.com";
      const [existingDealer] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`LOWER(${users.email}) = ${dealerEmail}`)
        .limit(1);
      if (!existingDealer) {
        const hash = await bcrypt.hash("Dealer2024!", 12);
        await db.insert(users).values({
          openId: `local_dealer_${Date.now()}`,
          email: dealerEmail,
          name: "Demo Dealer",
          passwordHash: hash,
          loginMethod: "email",
          role: "dealer_owner",
          dealershipId: demoId,
          lastSignedIn: new Date(),
        });
        console.log("[Startup] Created demo dealer user (dealer@grayarx.com / Dealer2024!)");
      }

      // Create admin user if missing
      const adminEmail = "admin@grayarx.com";
      const [existingAdmin] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`LOWER(${users.email}) = ${adminEmail}`)
        .limit(1);
      if (!existingAdmin) {
        const hash = await bcrypt.hash("AdminPassword123!", 12);
        await db.insert(users).values({
          openId: `local_admin_${Date.now()}`,
          email: adminEmail,
          name: "GrayArx Administrator",
          passwordHash: hash,
          loginMethod: "email",
          role: "admin",
          lastSignedIn: new Date(),
        });
        console.log("[Startup] Created admin user (admin@grayarx.com / AdminPassword123!)");
      }

      // Add demo vehicles
      const demoVehicles = [
        { title: "2022 McLaren P1 GTR", make: "McLaren", model: "P1 GTR", year: 2022, price: "8950000.00", km: 1200, fuel: "Petrol", transmission: "Automatic", bodyType: "Coupe", color: "Papaya Orange", location: "Sandton", primaryPhotoUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=80", imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=80", externalRef: "MCL-P1-GTR-001" },
        { title: "2023 Porsche 911 Carrera S", make: "Porsche", model: "911 Carrera S", year: 2023, price: "1890000.00", km: 8500, fuel: "Petrol", transmission: "Automatic", bodyType: "Coupe", color: "Arctic Grey", location: "Sandton", primaryPhotoUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80", imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80", externalRef: "POR-911-S-002" },
        { title: "2022 Lamborghini Huracán EVO", make: "Lamborghini", model: "Huracán EVO", year: 2022, price: "4750000.00", km: 6200, fuel: "Petrol", transmission: "Automatic", bodyType: "Coupe", color: "Giallo Midas", location: "Cape Town", primaryPhotoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80", imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80", externalRef: "LAM-HURA-EVO-003" },
        { title: "2021 Mercedes-Benz C63 AMG", make: "Mercedes-Benz", model: "C63 AMG", year: 2021, price: "1245000.00", km: 32000, fuel: "Petrol", transmission: "Automatic", bodyType: "Sedan", color: "Obsidian Black", location: "Johannesburg", primaryPhotoUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&q=80", imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&q=80", externalRef: "MBZ-C63-AMG-004" },
        { title: "2022 Ferrari Roma", make: "Ferrari", model: "Roma", year: 2022, price: "5100000.00", km: 4800, fuel: "Petrol", transmission: "Automatic", bodyType: "Coupe", color: "Rosso Corsa", location: "Pretoria", primaryPhotoUrl: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=900&q=80", imageUrl: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=900&q=80", externalRef: "FER-ROMA-005" },
      ];
      for (const v of demoVehicles) {
        await db.insert(vehicles).values({
          ...v,
          dealershipId: demoId,
          condition: "used",
          status: "available",
          views: 0,
          leadCount: 0,
        });
      }
      console.log(`[Startup] Added ${demoVehicles.length} demo vehicles to showroom.`);
    } catch (e) {
      console.warn("[Startup] Demo seed skipped:", (e as Error).message);
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

if (process.env.GRAYARX_LIVENESS_BOOT !== "1") {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
