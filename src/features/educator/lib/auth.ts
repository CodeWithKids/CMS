import type { AppUser } from "@/types";
import type { Session } from "@/types";

export function isEducator(user: AppUser | null): boolean {
  return user?.role === "educator";
}

/** Current user is the lead/facilitator for this session. */
export function isFacilitator(session: Session | null | undefined, user: AppUser | null): boolean {
  if (!session || !user?.id) return false;
  return session.leadEducatorId === user.id;
}

/** Current user is one of the coaches for this session. */
export function isCoach(session: Session | null | undefined, user: AppUser | null): boolean {
  if (!session || !user?.id) return false;
  return session.assistantEducatorIds?.includes(user.id) ?? false;
}

/** Whether the current user can edit this session (facilitator or admin). */
export function canEditSession(session: Session | null | undefined, user: AppUser | null): boolean {
  if (!session || !user) return false;
  if (user.role === "admin" || user.role === "finance") return true;
  return isFacilitator(session, user);
}

export type SessionRoleForUser = "facilitator" | "coach" | null;

/** Role of the current user for this session, for display (badges, permissions). */
export function getSessionRoleForUser(session: Session | null | undefined, user: AppUser | null): SessionRoleForUser {
  if (!session || !user?.id) return null;
  if (session.leadEducatorId === user.id) return "facilitator";
  if (session.assistantEducatorIds?.includes(user.id)) return "coach";
  return null;
}
