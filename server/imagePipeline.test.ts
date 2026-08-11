import { describe, expect, it } from "vitest";
import {
  buildSrcSet,
  isStockPhotoUrl,
  isWatermarkedRenderUrl,
  isHeroSafePhotoUrl,
  mergeVehicleGallery,
  optimizeImageUrl,
  parseMultiPhotoField,
} from "../shared/imagePipeline";

describe("imagePipeline", () => {
  it("optimizes Unsplash URLs with width and webp", () => {
    const url = optimizeImageUrl(
      "https://images.unsplash.com/photo-123?w=800",
      1920,
      90,
    );
    expect(url).toContain("w=1920");
    expect(url).toContain("fm=webp");
  });

  it("builds srcset for remote images", () => {
    const set = buildSrcSet("https://images.unsplash.com/photo-123", [480, 960]);
    expect(set).toContain("480w");
    expect(set).toContain("960w");
  });

  it("parses pipe-separated photo fields", () => {
    expect(parseMultiPhotoField("https://a.com/1.jpg|https://a.com/2.jpg")).toHaveLength(2);
  });

  it("detects stock photo hosts", () => {
    expect(isStockPhotoUrl("https://images.unsplash.com/x")).toBe(true);
    expect(isStockPhotoUrl("https://cdn.dealer.co.za/car.jpg")).toBe(false);
  });

  it("detects watermarked configurator renders", () => {
    expect(isWatermarkedRenderUrl("https://cdn.imagin.studio/car.png")).toBe(true);
    expect(isWatermarkedRenderUrl("https://example.com/magr-studio-render.jpg")).toBe(true);
    expect(isHeroSafePhotoUrl("https://cdn.dealer.co.za/car.jpg")).toBe(true);
    expect(isHeroSafePhotoUrl("https://cdn.imagin.studio/car.png")).toBe(false);
  });

  it("merges gallery without duplicates", () => {
    const merged = mergeVehicleGallery("https://a.com/1.jpg", [
      { url: "https://a.com/1.jpg" },
      { url: "https://a.com/2.jpg" },
    ]);
    expect(merged).toEqual(["https://a.com/1.jpg", "https://a.com/2.jpg"]);
  });

  it("snaps Wikimedia Commons thumbs to an allowed MediaWiki width", () => {
    const url = optimizeImageUrl(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Example.jpg/1280px-Example.jpg",
      480,
    );
    // 480 is not in $wgThumbLimits — snap to 500
    expect(url).toContain("/500px-Example.jpg");
    expect(url).not.toContain("1280px");
    expect(url).not.toContain("480px");
  });

  it("leaves a Wikimedia thumb alone when it already matches the snapped width", () => {
    const url = optimizeImageUrl(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Example.jpg/960px-Example.jpg",
      768,
    );
    // 768 snaps to 960 — already there
    expect(url).toContain("/960px-Example.jpg");
  });

  it("builds Wikimedia thumbs from original Commons paths using allowed widths", () => {
    const url = optimizeImageUrl(
      "https://upload.wikimedia.org/wikipedia/commons/d/d5/Example.jpg",
      768,
    );
    expect(url).toContain("/wikipedia/commons/thumb/d/d5/Example.jpg/960px-Example.jpg");
  });
});
