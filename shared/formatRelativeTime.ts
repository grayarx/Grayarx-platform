/** Relative time formatting for trade-in invites */
export function formatRelativeTime(from: Date, now = new Date()): string {
  const ms = now.getTime() - from.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return from.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function formatResponseBadge(minutes: number): { label: string; variant: "fast" | "normal" | "slow" } {
  if (minutes < 60) return { label: `Responded in ${minutes} min`, variant: "fast" };
  if (minutes < 24 * 60) return { label: `Responded in ${Math.round(minutes / 60)} hr`, variant: "normal" };
  return { label: `Responded in ${Math.round(minutes / (24 * 60))} days`, variant: "slow" };
}
