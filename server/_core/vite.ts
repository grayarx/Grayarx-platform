import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { maybeServeVehicleOg, requestPathname } from "./vehicleOgHtml";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    // Express `*` mounts strip req.path to `/` — use originalUrl pathname.
    const pathname = requestPathname(req);

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      // Social crawlers need vehicle OG meta before Vite transform
      const ogHtml = await maybeServeVehicleOg(
        pathname,
        req.get("user-agent") ?? undefined,
        template,
      );
      if (ogHtml) {
        const page = await vite.transformIndexHtml(url, ogHtml);
        return res
          .status(200)
          .set({
            "Content-Type": "text/html; charset=utf-8",
            Vary: "User-Agent",
          })
          .end(page);
      }

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Bundled server runs from dist/index.js — assets live in dist/public beside it.
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, { index: false }));

  // Never serve SPA index.html for API routes — webhooks must return JSON
  app.use("*", async (req, res, next) => {
    // Under `app.use("*")`, req.path is `/` — pathname must come from originalUrl.
    const pathname = requestPathname(req);

    if (pathname.startsWith("/api/")) {
      return res.status(404).json({ error: "API route not found", path: pathname });
    }
    // Static assets with extensions must not fall through to SPA (logo-crest.png, etc.)
    if (/\.[a-z0-9]+$/i.test(pathname)) {
      return res.status(404).send("Not found");
    }

    const indexPath = path.resolve(distPath, "index.html");
    try {
      const baseHtml = await fs.promises.readFile(indexPath, "utf-8");
      const ogHtml = await maybeServeVehicleOg(
        pathname,
        req.get("user-agent") ?? undefined,
        baseHtml,
      );
      if (ogHtml) {
        return res
          .status(200)
          .set({
            "Content-Type": "text/html; charset=utf-8",
            Vary: "User-Agent",
            "Cache-Control": "public, max-age=120",
          })
          .send(ogHtml);
      }
    } catch (err) {
      console.warn(
        "[serveStatic] OG / index read failed:",
        err instanceof Error ? err.message : String(err),
      );
    }

    res.sendFile(indexPath);
  });
}
