import { Router, Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { leads, vehicles, testDriveBookings } from "../drizzle/schema";
import {
  validateApiKey,
  checkRateLimit,
  getRateLimitStatus,
  hasScope,
} from "./apiKeyService";

export const apiRouter = Router();

/**
 * Middleware: Validate API key and attach context
 */
apiRouter.use(async (req: Request, res: Response, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid API key" });
  }

  const key = authHeader.substring(7);
  const keyInfo = await validateApiKey(key);

  if (!keyInfo) {
    return res.status(401).json({ error: "Invalid or expired API key" });
  }

  // Check rate limit
  if (!checkRateLimit(keyInfo.keyId)) {
    const rateLimitStatus = getRateLimitStatus(keyInfo.keyId);
    return res.status(429).json({
      error: "Rate limit exceeded",
      remaining: rateLimitStatus.remaining,
      resetAt: rateLimitStatus.resetAt,
    });
  }

  // Attach to request
  (req as any).apiKey = {
    dealershipId: keyInfo.dealershipId,
    scopes: keyInfo.scopes,
    keyId: keyInfo.keyId,
  };

  // Add rate limit headers
  const rateLimitStatus = getRateLimitStatus(keyInfo.keyId);
  res.set("X-RateLimit-Remaining", rateLimitStatus.remaining.toString());
  res.set("X-RateLimit-Reset", rateLimitStatus.resetAt.toISOString());

  next();
});

/**
 * GET /api/leads - List leads for dealership
 */
apiRouter.get("/leads", async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;

  if (!hasScope(apiKey.scopes, "read_leads")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const dealershipLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.dealershipId, apiKey.dealershipId))
      .limit(limit)
      .offset(offset);

    res.json({
      data: dealershipLeads,
      limit,
      offset,
      total: dealershipLeads.length,
    });
  } catch (error) {
    console.error("[API] Error fetching leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/leads/:id - Get lead details
 */
apiRouter.get("/leads/:id", async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;

  if (!hasScope(apiKey.scopes, "read_leads")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const leadId = parseInt(req.params.id);
    const lead = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.dealershipId, apiKey.dealershipId)
        )
      );

    if (!lead.length) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json({ data: lead[0] });
  } catch (error) {
    console.error("[API] Error fetching lead:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/inventory - List vehicles for dealership
 */
apiRouter.get("/inventory", async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;

  if (!hasScope(apiKey.scopes, "read_inventory")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const allVehicles = await db
      .select()
      .from(vehicles)
      .limit(limit)
      .offset(offset);

    res.json({
      data: allVehicles,
      limit,
      offset,
      total: allVehicles.length,
    });
  } catch (error) {
    console.error("[API] Error fetching inventory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/bookings - List test drive bookings
 */
apiRouter.get("/bookings", async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;

  if (!hasScope(apiKey.scopes, "read_bookings")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const dealershipBookings = await db
      .select()
      .from(testDriveBookings)
      .where(eq(testDriveBookings.dealershipId, apiKey.dealershipId))
      .limit(limit)
      .offset(offset);

    res.json({
      data: dealershipBookings,
      limit,
      offset,
      total: dealershipBookings.length,
    });
  } catch (error) {
    console.error("[API] Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/stats - Get dealership statistics
 */
apiRouter.get("/stats", async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const totalLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.dealershipId, apiKey.dealershipId));

    const totalVehicles = await db
      .select()
      .from(vehicles);

    const totalBookings = await db
      .select()
      .from(testDriveBookings)
      .where(eq(testDriveBookings.dealershipId, apiKey.dealershipId));

    res.json({
      data: {
        totalLeads: totalLeads.length,
        totalVehicles: totalVehicles.length,
        totalBookings: totalBookings.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Error fetching stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Health check endpoint (no auth required)
 */
export const healthRouter = Router();
healthRouter.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
