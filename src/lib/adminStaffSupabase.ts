/**
 * Staff profile updates against public.profiles when using Supabase (RLS allows admin updates).
 */
import type { AdminAccountUser } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  organization_id?: string | null;
  membership_status?: string | null;
  avatar_id?: string | null;
  created_at?: string | null;
};

/** Pending approvals from public.profiles (Supabase-only or hybrid primary store). */
export async function fetchPendingProfilesForAdmin(): Promise<AdminAccountUser[]> {
  if (!isSupabaseEnabled() || !supabase) {
    throw new ApiError(503, { message: "Supabase is not configured." }, "Supabase is not configured.");
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new ApiError(
      400,
      { message: error.message },
      error.message || "Could not load pending accounts."
    );
  }

  return ((data as ProfileRow[] | null) ?? []).map((row) => {
    const email = typeof row.email === "string" ? row.email : null;
    const fallbackName = email?.split("@")[0] ?? "User";
    return {
      id: row.id,
      name: row.name?.trim() ? row.name.trim() : fallbackName,
      email,
      role: row.role?.trim() ? row.role.trim() : "educator",
      status: row.status ?? "pending",
      organizationId: row.organization_id ?? null,
      membershipStatus: row.membership_status ?? null,
      avatarId: row.avatar_id ?? null,
      createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    };
  });
}

export async function adminPatchStaffProfileSupabase(
  id: string,
  patch: Partial<{ name: string; email: string; role: string; status: string }>
): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) {
    throw new ApiError(503, { message: "Supabase is not configured." }, "Supabase is not configured.");
  }
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.status !== undefined) row.status = patch.status;

  const { error } = await supabase.from("profiles").update(row).eq("id", id);
  if (error) {
    throw new ApiError(
      400,
      { message: error.message },
      error.message || "Could not update profile."
    );
  }
}
