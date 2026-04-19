/**
 * Unified staff admin mutations: Supabase profiles when DB is Supabase, legacy API when not.
 * Hard delete of login requires the Hub API (GoTrue Admin on server or Prisma API delete).
 */
import { ApiError, adminAccountsPatch, adminAccountsDelete, isApiEnabled } from "@/lib/api";
import { isSupabaseEnabled } from "@/lib/supabaseClient";
import { adminPatchStaffProfileSupabase } from "@/lib/adminStaffSupabase";
import { deleteSupabaseAuthUserViaApi } from "@/lib/adminSupabaseAuthUsersApi";

/** Show edit / role-change UI when any backend supports staff data. */
export function staffAdminMutationsAvailable(): boolean {
  return isSupabaseEnabled() || isApiEnabled();
}

/** Permanent account removal requires the Hub API (cannot call GoTrue Admin from the browser). */
export function staffHardDeleteAvailable(): boolean {
  return isApiEnabled();
}

export async function adminStaffPatch(
  id: string,
  body: { name?: string; email?: string; status?: string; role?: string; organizationId?: string | null }
): Promise<void> {
  if (isSupabaseEnabled()) {
    await adminPatchStaffProfileSupabase(id, {
      name: body.name,
      email: body.email,
      role: body.role,
      status: body.status,
    });
    return;
  }
  await adminAccountsPatch(id, body);
}

export async function adminStaffDelete(id: string): Promise<void> {
  if (isSupabaseEnabled()) {
    if (!isApiEnabled()) {
      throw new ApiError(
        503,
        {
          message:
            "Removing login access requires the Hub API. Set VITE_API_URL and run the server with SUPABASE_SERVICE_ROLE_KEY.",
        },
        "Connect the Hub API to delete accounts, or revoke access by setting profile status to rejected in the database."
      );
    }
    await deleteSupabaseAuthUserViaApi(id);
    return;
  }
  await adminAccountsDelete(id);
}
