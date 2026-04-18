import type { AppUser } from "@/types";
import { mockUsers } from "@/mockData";

/**
 * Seeded users for offline / no-API demo login and related UX (e.g. resolving avatar by user id).
 * Prefer real auth (Supabase or API) in production; this list is only used when those are disabled.
 */
export function getDemoLoginUsers(): AppUser[] {
  return mockUsers;
}
