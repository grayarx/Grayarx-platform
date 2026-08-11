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

  it("rewrites Wikimedia Commons thumbs to the requested width", () => {
    const url = optimizeImageUrl(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Example.jpg/1280px-Example.jpg",
      480,
    );
    expect(url).toContain("/480px-Example.jpg");
    expect(url).not.toContain("1280px");
  });

  it("builds Wikimedia thumbs from original Commons paths", () => {
    const url = optimizeImageUrl(
      "https://upload.wikimedia.org/wikipedia/commons/d/d5/Example.jpg",
      768,
    );
    expect(url).toContain("/wikipedia/commons/thumb/d/d5/Example.jpg/768px-Example.jpg");
  });
});
