import { describe, expect, it } from "vitest";
import {
  buildSrcSet,
  isStockPhotoUrl,
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

  it("merges gallery without duplicates", () => {
    const merged = mergeVehicleGallery("https://a.com/1.jpg", [
      { url: "https://a.com/1.jpg" },
      { url: "https://a.com/2.jpg" },
    ]);
    expect(merged).toEqual(["https://a.com/1.jpg", "https://a.com/2.jpg"]);
  });
});
