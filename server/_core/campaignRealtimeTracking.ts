/**
 * Campaign Real-time Tracking
 * WebSocket support for live delivery status updates
 */

import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface CampaignSubscriber {
  campaignId: number;
  ws: WebSocket;
  userId: number;
}

interface CampaignDeliveryUpdate {
  campaignId: number;
  eventType: "delivered" | "opened" | "clicked" | "bounced" | "failed";
  email: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface CampaignMetrics {
  campaignId: number;
  totalRecipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  failureRate: number;
}

class CampaignRealtimeTracker {
  private wss: WebSocketServer;
  private subscribers: Map<number, CampaignSubscriber[]> = new Map();
  private campaignMetrics: Map<number, CampaignMetrics> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws/campaigns" });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[CampaignTracker] New WebSocket connection");

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error("[CampaignTracker] Failed to parse message:", error);
          ws.send(
            JSON.stringify({ error: "Invalid message format" })
          );
        }
      });

      ws.on("close", () => {
        console.log("[CampaignTracker] WebSocket disconnected");
        this.unsubscribeAll(ws);
      });

      ws.on("error", (error) => {
        console.error("[CampaignTracker] WebSocket error:", error);
      });
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: WebSocket, data: any) {
    const { type, campaignId, userId } = data;

    if (type === "subscribe") {
      this.subscribe(campaignId, userId, ws);
    } else if (type === "unsubscribe") {
      this.unsubscribe(campaignId, ws);
    }
  }

  /**
   * Subscribe to campaign updates
   */
  private subscribe(campaignId: number, userId: number, ws: WebSocket) {
    if (!this.subscribers.has(campaignId)) {
      this.subscribers.set(campaignId, []);
    }

    const subscriber: CampaignSubscriber = { campaignId, ws, userId };
    this.subscribers.get(campaignId)!.push(subscriber);

    // Send current metrics
    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics) {
      ws.send(
        JSON.stringify({
          type: "metrics_update",
          metrics,
        })
      );
    }

    console.log(
      `[CampaignTracker] User ${userId} subscribed to campaign ${campaignId}`
    );
  }

  /**
   * Unsubscribe from campaign updates
   */
  private unsubscribe(campaignId: number, ws: WebSocket) {
    const subscribers = this.subscribers.get(campaignId);
    if (subscribers) {
      const index = subscribers.findIndex((s) => s.ws === ws);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  /**
   * Unsubscribe from all campaigns
   */
  private unsubscribeAll(ws: WebSocket) {
    for (const [campaignId, subscribers] of this.subscribers.entries()) {
      const index = subscribers.findIndex((s) => s.ws === ws);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  /**
   * Broadcast delivery update to all subscribers
   */
  public broadcastDeliveryUpdate(update: CampaignDeliveryUpdate) {
    const subscribers = this.subscribers.get(update.campaignId);
    if (!subscribers) return;

    // Update metrics
    this.updateMetrics(update);

    // Broadcast to all subscribers
    const message = JSON.stringify({
      type: "delivery_update",
      update,
      metrics: this.campaignMetrics.get(update.campaignId),
    });

    for (const subscriber of subscribers) {
      if (subscriber.ws.readyState === WebSocket.OPEN) {
        subscriber.ws.send(message);
      }
    }
  }

  /**
   * Update campaign metrics based on delivery event
   */
  private updateMetrics(update: CampaignDeliveryUpdate) {
    let metrics = this.campaignMetrics.get(update.campaignId);

    if (!metrics) {
      metrics = {
        campaignId: update.campaignId,
        totalRecipients: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        failureRate: 0,
      };
      this.campaignMetrics.set(update.campaignId, metrics);
    }

    // Increment appropriate counter
    switch (update.eventType) {
      case "delivered":
        metrics.delivered++;
        break;
      case "opened":
        metrics.opened++;
        break;
      case "clicked":
        metrics.clicked++;
        break;
      case "bounced":
        metrics.bounced++;
        break;
      case "failed":
        metrics.failed++;
        break;
    }

    // Recalculate rates
    const total = metrics.delivered + metrics.bounced + metrics.failed;
    if (total > 0) {
      metrics.openRate = (metrics.opened / total) * 100;
      metrics.clickRate = (metrics.clicked / total) * 100;
      metrics.bounceRate = (metrics.bounced / total) * 100;
      metrics.failureRate = (metrics.failed / total) * 100;
    }
  }

  /**
   * Get campaign metrics
   */
  public getMetrics(campaignId: number): CampaignMetrics | undefined {
    return this.campaignMetrics.get(campaignId);
  }

  /**
   * Initialize metrics for a campaign
   */
  public initializeMetrics(campaignId: number, totalRecipients: number) {
    const metrics: CampaignMetrics = {
      campaignId,
      totalRecipients,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      failureRate: 0,
    };
    this.campaignMetrics.set(campaignId, metrics);
  }

  /**
   * Get subscriber count for a campaign
   */
  public getSubscriberCount(campaignId: number): number {
    return this.subscribers.get(campaignId)?.length || 0;
  }
}

// Singleton instance
let tracker: CampaignRealtimeTracker | null = null;

/**
 * Initialize campaign real-time tracker
 */
export function initializeCampaignTracker(server: Server) {
  if (!tracker) {
    tracker = new CampaignRealtimeTracker(server);
    console.log("[CampaignTracker] Initialized");
  }
  return tracker;
}

/**
 * Get campaign tracker instance
 */
export function getCampaignTracker(): CampaignRealtimeTracker | null {
  return tracker;
}

/**
 * Broadcast delivery update
 */
export function broadcastCampaignUpdate(update: CampaignDeliveryUpdate) {
  if (tracker) {
    tracker.broadcastDeliveryUpdate(update);
  }
}

/**
 * Get campaign metrics
 */
export function getCampaignMetrics(campaignId: number) {
  if (tracker) {
    return tracker.getMetrics(campaignId);
  }
}

/**
 * Initialize campaign metrics
 */
export function initializeCampaignMetrics(
  campaignId: number,
  totalRecipients: number
) {
  if (tracker) {
    tracker.initializeMetrics(campaignId, totalRecipients);
  }
}
