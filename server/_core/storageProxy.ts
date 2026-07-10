import type { Express } from "express";
import { ENV } from "./env";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Client = s3Bucket ? new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
}) : null;

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      if (s3Client && s3Bucket) {
        // If public bucket URL is provided, redirect to that directly
        const publicUrlBase = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");
        if (publicUrlBase) {
          res.redirect(301, `${publicUrlBase}/${key}`);
          return;
        }

        // Generate signed URL
        const url = await getSignedUrl(s3Client, new GetObjectCommand({
          Bucket: s3Bucket,
          Key: key,
        }), { expiresIn: 3600 });
        
        res.set("Cache-Control", "no-store");
        res.redirect(307, url);
        return;
      }

      if (ENV.forgeApiUrl && ENV.forgeApiKey) {
        const forgeUrl = new URL(
          "v1/storage/presign/get",
          ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
        );
        forgeUrl.searchParams.set("path", key);

        const forgeResp = await fetch(forgeUrl, {
          headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
        });

        if (!forgeResp.ok) {
          const body = await forgeResp.text().catch(() => "");
          console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
          res.status(502).send("Storage backend error");
          return;
        }

        const { url } = (await forgeResp.json()) as { url: string };
        if (!url) {
          res.status(502).send("Empty signed URL from backend");
          return;
        }

        res.set("Cache-Control", "no-store");
        res.redirect(307, url);
        return;
      }

      res.status(500).send("Storage proxy not configured");
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
