import type { UserRole } from "@/types";

/**
 * AI Marketing access matrix (aligned with spec).
 * Uses existing app roles: admin, marketing, partnerships, ld_manager, finance.
 * When SUPERADMIN/STRATEGY are added to UserRole, include them in the appropriate arrays.
 */

/** Who can view AI Marketing routes (overview, canvas, experiments, products). */
export function canViewAiMarketing(role: UserRole): boolean {
  return [
    "admin",
    "marketing",
    "partnerships",
    "ld_manager",
    "finance",
  ].includes(role);
}

/** Who can edit AI Marketing content (canvas, products, overview). Not experiments board. */
export function canEditAiMarketing(role: UserRole): boolean {
  return ["admin", "marketing"].includes(role);
}

/** Who can edit experiments (status dropdowns, move experiments on the board). Includes Partnerships. */
export function canEditAiExperiments(role: UserRole): boolean {
  return ["admin", "marketing", "partnerships"].includes(role);
}

/** @deprecated Use canViewAiMarketing. Kept for compatibility. */
export function canViewMarketingArea(role: UserRole): boolean {
  return canViewAiMarketing(role);
}

/** @deprecated Use canEditAiMarketing or canEditAiExperiments per page. Kept for compatibility. */
export function isMarketingRole(role: UserRole): boolean {
  return canEditAiMarketing(role);
}
