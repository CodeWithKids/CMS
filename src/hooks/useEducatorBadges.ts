/**
 * Educator badge rows from Supabase `educator_badges` when configured, else REST API.
 * Aligns with `public.educator_badges` in `docs/SUPABASE_EDUCATOR_BADGES_RLS.sql` and Prisma `EducatorBadge`.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, educatorBadgesGetAll, type EducatorBadgeApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

export const EDUCATOR_BADGES_QUERY_KEY = ["educator", "badges"] as const;

function mapSupabaseRowToApi(row: Record<string, unknown>): EducatorBadgeApi {
  const trackRaw = row.track_id ?? row.trackId;
  return {
    id: String(row.id ?? ""),
    educatorId: String(row.educator_id ?? row.educatorId ?? ""),
    badgeId: String(row.badge_id ?? row.badgeId ?? ""),
    trackId: trackRaw != null && String(trackRaw).length > 0 ? String(trackRaw) : null,
    earnedAt: String(row.earned_at ?? row.earnedAt ?? ""),
  };
}

async function fetchEducatorBadges(educatorId: string): Promise<EducatorBadgeApi[]> {
  const supabaseOn = isSupabaseEnabled();
  const apiOn = isApiEnabled();

  if (supabaseOn && supabase) {
    try {
      const { data, error } = await supabase
        .from("educator_badges")
        .select("*")
        .eq("educator_id", educatorId)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return ((data as Record<string, unknown>[]) ?? []).map(mapSupabaseRowToApi);
    } catch {
      if (apiOn) return educatorBadgesGetAll(educatorId);
      return [];
    }
  }

  if (apiOn) return educatorBadgesGetAll(educatorId);
  return [];
}

export function useEducatorBadges(educatorId: string | undefined): {
  badges: EducatorBadgeApi[];
  isLoading: boolean;
  isError: boolean;
} {
  const enabled = !!educatorId && (isSupabaseEnabled() || isApiEnabled());

  const query = useQuery({
    queryKey: [...EDUCATOR_BADGES_QUERY_KEY, educatorId ?? ""],
    queryFn: () => fetchEducatorBadges(educatorId!),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    badges: query.data ?? [],
    isLoading: enabled ? query.isLoading : false,
    isError: query.isError,
  };
}
