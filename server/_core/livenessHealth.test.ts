import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import {
  buildLivenessHealthBody,
  isLivenessPath,
  registerLivenessHealthRoutes,
  _resetLivenessHealthForTests,
  _setCachedInboundMxForTests,
} from "./livenessHealth";

async function listen(app: express.Express): Promise<{ server: Server; base: string }> {
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return { server, base: `http://127.0.0.1:${port}` };
}

describe("liveness health (Railway healthcheck)", () => {
  afterEach(() => {
    _resetLivenessHealthForTests();
    vi.unstubAllGlobals();
  });

  it("recognizes Railway probe paths and ignores query strings", () => {
    expect(isLivenessPath("/api/health")).toBe(true);
    expect(isLivenessPath("/api/webhooks/health")).toBe(true);
    expect(isLivenessPath("/api/webhooks/health?full=1")).toBe(true);
    expect(isLivenessPath("/api/webhooks/whatsapp")).toBe(false);
    expect(isLivenessPath("/api/trpc/dealer.stats")).toBe(false);
  });

  it("builds a 200 body from env only — no outbound I/O", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "1245737138612982";
    process.env.WHATSAPP_ACCESS_TOKEN = "tok";
    const body = buildLivenessHealthBody();
    expect(body.status).toBe("ok");
    expect(body.liveness).toBe(true);
    expect(body.openai.ok).toBe(true);
    expect(body.webhooks.whatsapp).toMatchObject({
      url: "/api/webhooks/whatsapp",
      canAutoReply: true,
    });
    expect(body.inboundEmail.probed).toBe(false);
  });

  it("GET /api/webhooks/health returns 200 without calling fetch", async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async () => {
      throw new Error("fetch must not run on liveness");
    });
    vi.stubGlobal("fetch", fetchSpy);
    const app = express();
    registerLivenessHealthRoutes(app);
    const { server, base } = await listen(app);
    try {
      const res = await originalFetch(`${base}/api/webhooks/health`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(body.liveness).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("GET /api/health returns 200 immediately", async () => {
    const app = express();
    registerLivenessHealthRoutes(app);
    const { server, base } = await listen(app);
    try {
      const res = await fetch(`${base}/api/health`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(typeof body.timestamp).toBe("string");
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("uses cached MX when the background probe has finished", () => {
    _setCachedInboundMxForTests({
      domain: "grayarx.com",
      hasMx: true,
      canReceiveMail: true,
      mxRecords: ["10 inbound-smtp.us-east-1.amazonaws.com."],
      detail: "MX OK (1 record)",
      probed: true,
    });
    const body = buildLivenessHealthBody();
    expect(body.inboundEmail.hasMx).toBe(true);
    expect(body.inboundEmail.probed).toBe(true);
  });
});
