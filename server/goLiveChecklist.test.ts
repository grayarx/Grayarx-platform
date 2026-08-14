import { describe, expect, it } from "vitest";
import { buildGoLiveStatus } from "../shared/goLiveChecklist";

describe("go-live checklist", () => {
  it("is not live until stock, showroom, and WhatsApp are done", () => {
    const status = buildGoLiveStatus({
      availableVehicles: 12,
      publicShortcode: "jubilee",
      whatsappPhoneNumberId: null,
      leadDripEnabled: true,
      stockSyncEnabled: false,
      stockSyncFeedUrl: null,
      stockSyncLastAt: null,
    });
    expect(status.isLive).toBe(false);
    expect(status.steps.find((s) => s.id === "stock")?.done).toBe(true);
    expect(status.steps.find((s) => s.id === "whatsapp")?.done).toBe(false);
    expect(status.nextStep?.id).toBe("whatsapp");
  });

  it("marks live when stock + showroom + WhatsApp are ready", () => {
    const status = buildGoLiveStatus({
      availableVehicles: 5,
      publicShortcode: "amc",
      whatsappPhoneNumberId: "123456",
      leadDripEnabled: true,
      stockSyncEnabled: true,
      stockSyncFeedUrl: "https://example.com/feed.csv",
      stockSyncLastAt: new Date(),
    });
    expect(status.isLive).toBe(true);
    expect(status.percent).toBe(100);
    expect(status.steps.find((s) => s.id === "stock_sync")?.done).toBe(true);
  });

  it("treats stale stock sync as not done", () => {
    const stale = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const status = buildGoLiveStatus({
      availableVehicles: 5,
      publicShortcode: "amc",
      whatsappPhoneNumberId: "123",
      leadDripEnabled: true,
      stockSyncEnabled: true,
      stockSyncFeedUrl: "https://example.com/feed.csv",
      stockSyncLastAt: stale,
      stockSyncFreshHours: 48,
    });
    expect(status.steps.find((s) => s.id === "stock_sync")?.done).toBe(false);
    expect(status.isLive).toBe(true); // optional step
  });
});
