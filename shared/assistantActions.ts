/**
 * Destructive / mutating commands the dashboard assistant can execute.
 */

export type AssistantActionType = "inventory_delete_all";

export type AssistantPendingAction = {
  type: AssistantActionType;
  label: string;
  confirmPhrase: string;
  vehicleCount: number;
};

/** User wants to wipe inventory — e.g. "delete all my inventory". */
export function isInventoryBulkDeleteRequest(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (!lower) return false;

  if (isInventoryBulkDeleteConfirm(lower)) return false;

  return (
    (/\b(delete|remove|clear|wipe|empty|reset|purge)\b/i.test(lower) &&
      /\b(all|every|entire|whole|everything|bulk|my)\b/i.test(lower) &&
      /\b(inventory|vehicles?|stock|cars?|showroom)\b/i.test(lower)) ||
    /\bbulk\s+delete\b/i.test(lower) ||
    /\bdelete\s+all\b.*\binventory\b/i.test(lower)
  );
}

/** Text confirmation — e.g. "yes, delete all inventory" or the confirm button label. */
export function isInventoryBulkDeleteConfirm(message: string): boolean {
  const lower = message.trim().toLowerCase();
  return (
    (/\b(yes|confirm|affirmative|do it|go ahead|proceed|ok|okay)\b/i.test(lower) &&
      /\b(delete|clear|remove|wipe)\b/i.test(lower) &&
      /\b(all|everything|inventory|vehicles?|stock)\b/i.test(lower)) ||
    /\bdelete\s+all\s+\d+\s+vehicles?\b/i.test(lower)
  );
}

export function buildInventoryDeletePendingReply(input: {
  vehicleCount: number;
  mode: "owner" | "dealer";
}): {
  reply: string;
  pendingAction: AssistantPendingAction;
  links: Array<{ label: string; href: string }>;
} {
  const count = input.vehicleCount;
  const who = input.mode === "owner" ? "Kagiso" : "I";

  return {
    reply: [
      `This will permanently delete **${count}** vehicle${count === 1 ? "" : "s"} and their photos. **Cannot be undone.**`,
      "",
      `Tap **Confirm delete** below, or type: *yes, delete all inventory*`,
    ].join("\n"),
    pendingAction: {
      type: "inventory_delete_all",
      label: `Delete all ${count} vehicles`,
      confirmPhrase: "yes, delete all inventory",
      vehicleCount: count,
    },
    links: [{ label: "View inventory", href: "/dealer/inventory" }],
  };
}

export function buildInventoryDeleteDoneReply(deleted: number): string {
  if (deleted === 0) {
    return "Your inventory is already empty — nothing to delete.";
  }
  return [
    `Done — removed **${deleted}** vehicle${deleted === 1 ? "" : "s"} from inventory.`,
    "",
    "Your showroom will update on the next refresh.",
  ].join("\n");
}
