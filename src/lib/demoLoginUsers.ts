import type { AppUser } from "@/types";
import { mockUsers } from "@/mockData";
import { isHybridBackendConfigured } from "@/lib/runtimeBackend";

/**
 * Seeded users for offline demo login and related UX (e.g. resolving avatar by user id).
 * Empty when Supabase or the REST API is configured — use real sign-in only.
 */
export function getDemoLoginUsers(): AppUser[] {
  if (isHybridBackendConfigured()) return [];
  return mockUsers;
}
