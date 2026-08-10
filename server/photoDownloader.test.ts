import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  isDurablePhotoStorageConfigured,
  resolveImportPhotoUrls,
} from "./_core/photoDownloader";

describe("photoDownloader / save-to-GrayArx guards", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    delete process.env.S3_BUCKET_NAME;
    delete process.env.BUILT_IN_FORGE_API_URL;
    delete process.env.BUILT_IN_FORGE_API_KEY;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("detects durable storage from S3_BUCKET_NAME", () => {
    expect(isDurablePhotoStorageConfigured()).toBe(false);
    process.env.S3_BUCKET_NAME = "grayarx-photos";
    expect(isDurablePhotoStorageConfigured()).toBe(true);
  });

  it("keeps external URLs when mirroring is skipped", async () => {
    const urls = [
      "https://upload.wikimedia.org/wikipedia/commons/a.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b.jpg",
    ];
    const res = await resolveImportPhotoUrls(
      urls,
      { title: "Test", externalRef: "STK-1" },
      { skipMirror: true },
    );
    expect(res.urls).toEqual(urls);
    expect(res.mirrored).toBe(0);
    expect(res.linked).toBe(2);
    expect(res.skippedMirror).toBe(true);
  });

  it("keeps external URLs when durable storage is not configured", async () => {
    const urls = ["https://upload.wikimedia.org/wikipedia/commons/a.jpg"];
    const res = await resolveImportPhotoUrls(
      urls,
      { title: "Test", externalRef: "STK-1" },
      { skipMirror: false },
    );
    expect(res.urls).toEqual(urls);
    expect(res.mirrored).toBe(0);
    expect(res.skippedMirror).toBe(true);
  });
});
