import type { AppUser } from "@/types";

/**
 * L&D Manager permission helpers.
 * Use in route guards, navigation, and component-level checks.
 */

export function isLDManager(user: AppUser | null): boolean {
  return user?.role === "ld_manager";
}

/** True for L&D Managers and Admins. */
export function canManageTrackTemplates(user: AppUser | null): boolean {
  return user?.role === "ld_manager" || user?.role === "admin";
}

/** True for L&D Managers, Admins, and relevant leadership. */
export function canViewEducatorReports(user: AppUser | null): boolean {
  return user?.role === "ld_manager" || user?.role === "admin";
}

/** True for L&D Managers and track owners (here: L&D and Admin). */
export function canCommentOnLessonPlans(user: AppUser | null): boolean {
  return user?.role === "ld_manager" || user?.role === "admin";
}

/** L&D can view and add coaching notes; cannot edit attendance or expenses. */
export function canAddCoachingNotes(user: AppUser | null): boolean {
  return user?.role === "ld_manager" || user?.role === "admin";
}
