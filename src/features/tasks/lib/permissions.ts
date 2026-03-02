import type { AppUser } from "@/types";

export function isLDManager(user: AppUser | null): boolean {
  return user?.role === "ld_manager";
}

export function isEducator(user: AppUser | null): boolean {
  return user?.role === "educator";
}

/** Can create/edit any task (L&D and Admin). */
export function canManageTasks(user: AppUser | null): boolean {
  return user?.role === "ld_manager" || user?.role === "admin";
}

/** Can only update status on tasks assigned to them. */
export function canUpdateOwnTaskStatus(user: AppUser | null, taskAssigneeIds: string[]): boolean {
  if (!user?.id) return false;
  return taskAssigneeIds.includes(user.id);
}
