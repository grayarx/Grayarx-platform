/**
 * Production entry — bind PORT and answer Railway healthchecks BEFORE loading
 * the 2MB app bundle. Cold import of routers can exceed Railway's ~30s window.
 * Full health JSON (MX/OpenAI) is registered after dist/app.js loads.
 */
import express from "express";
import { createServer } from "http";

process.env.GRAYARX_LIVENESS_BOOT = "1";

const app = express();
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", liveness: true });
});
app.get("/api/webhooks/health", (req, res, next) => {
  const full =
    req.query.full === "1" || req.query.full === "true" || req.query.deep === "1";
  if (full) {
    next();
    return;
  }
  res.status(200).json({ status: "ok", liveness: true });
});
const server = createServer(app);
const port = parseInt(process.env.PORT || "3000", 10);

server.listen(port, "0.0.0.0", () => {
  console.log(`[liveness] 0.0.0.0:${port} — loading application`);
  const appHref = new URL("./app.js", import.meta.url).href;
  void import(appHref)
    .then((mod: { startServer?: (opts: { app: typeof app; server: typeof server }) => Promise<unknown> }) => {
      if (typeof mod.startServer !== "function") {
        throw new Error("dist/app.js did not export startServer");
      }
      return mod.startServer({ app, server });
    })
    .catch((err: unknown) => {
      console.error("[liveness] failed to load application — healthcheck still 200", err);
    });
});
