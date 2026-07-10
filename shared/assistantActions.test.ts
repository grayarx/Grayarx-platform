import { describe, it, expect } from "vitest";
import {
  isInventoryBulkDeleteConfirm,
  isInventoryBulkDeleteRequest,
} from "./assistantActions";
import { classifyDashboardIntent } from "./dashboardAssistant";

describe("inventory bulk delete detection", () => {
  it("detects delete all inventory requests", () => {
    expect(isInventoryBulkDeleteRequest("delete all my inventory")).toBe(true);
    expect(isInventoryBulkDeleteRequest("please clear all vehicles")).toBe(true);
    expect(isInventoryBulkDeleteRequest("bulk delete stock")).toBe(true);
    expect(classifyDashboardIntent("delete all my inventory")).toBe("inventory_bulk_delete");
  });

  it("detects text confirmations", () => {
    expect(isInventoryBulkDeleteConfirm("yes, delete all inventory")).toBe(true);
    expect(isInventoryBulkDeleteConfirm("Delete all 3 vehicles")).toBe(true);
    expect(classifyDashboardIntent("yes delete all inventory")).toBe(
      "inventory_bulk_delete_confirm",
    );
  });

  it("does not treat navigation as delete", () => {
    expect(isInventoryBulkDeleteRequest("how do I import inventory")).toBe(false);
  });
});
