/**
 * Self-scheduling market guide refresh — runs in background when stale (>7 days).
 */

import type { Express, NextFunction, Request, Response } from "express";

let isRunning = false;

export function attachMarketGuideRefreshMiddleware(app: Express): void {
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    if (!isRunning) {
      isRunning = true;
      void (async () => {
        try {
          const { triggerMarketGuideRefreshIfDue, reloadLiveGuideCache } = await import(
            "./marketGuideRefresh"
          );
          await reloadLiveGuideCache();
          const result = await triggerMarketGuideRefreshIfDue(false);
          if (result.ran) {
            console.log("[MarketGuide] autonomous refresh", result.result);
          }
        } catch (e) {
          console.warn("[MarketGuide] refresh check failed", e);
        } finally {
          isRunning = false;
        }
      })();
    }
    next();
  });
}
