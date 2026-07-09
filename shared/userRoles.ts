/** Roles with full platform ops access (agent roster, cross-dealer stats, etc.). */
export function isFounderOrAdmin(user: { role?: string | null } | null | undefined): boolean {
  return !!user && (user.role === "founder" || user.role === "admin");
}
