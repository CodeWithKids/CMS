/**
 * Load a single staff/educator profile for admin views: Supabase profiles first, then API fallback.
 */
import { educatorsGetById, type EducatorApi, isApiEnabled } from "@/lib/api";
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

function mapProfileRowToEducatorApi(row: ProfileRow): EducatorApi {
  const email = typeof row.email === "string" ? row.email : null;
  const fallbackName = email?.split("@")[0] ?? "User";
  return {
    id: row.id,
    name: row.name?.trim() ? row.name.trim() : fallbackName,
    email,
    role: row.role?.trim() ? row.role.trim() : "educator",
    status: row.status ?? "active",
    organizationId: row.organization_id ?? null,
    membershipStatus: row.membership_status ?? null,
    avatarId: row.avatar_id ?? null,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export async function fetchStaffProfileForDisplay(id: string): Promise<EducatorApi | null> {
  if (!id) return null;

  if (isSupabaseEnabled() && supabase) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (data) return mapProfileRowToEducatorApi(data as ProfileRow);
    if (isApiEnabled()) return educatorsGetById(id);
    return null;
  }

  if (isApiEnabled()) return educatorsGetById(id);
  return null;
}
