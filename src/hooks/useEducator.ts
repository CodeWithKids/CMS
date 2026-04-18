/**
 * Educator by ID from Supabase when configured, otherwise API.
 * Use for display labels (e.g. in tables); render in a cell component so the hook is not called in a loop.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, educatorsGetById, type EducatorApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

const EDUCATOR_QUERY_KEY = ["educator"];

export function useEducator(id: string | null | undefined): {
  educator: EducatorApi | { id: string; name: string } | null;
  displayName: string;
  isLoading: boolean;
} {
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = isApiEnabled();
  const enabled = (supabaseEnabled || apiEnabled) && !!id;

  const query = useQuery({
    queryKey: [...EDUCATOR_QUERY_KEY, id ?? ""],
    queryFn: async () => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id,name,email,role,status,organization_id,membership_status,avatar_id,created_at")
            .eq("id", id!)
            .maybeSingle();
          if (error) throw error;
          if (!data) return null;
          return {
            id: String(data.id),
            name: (typeof data.name === "string" && data.name.trim()) || String(data.id),
            email: typeof data.email === "string" ? data.email : null,
            role: typeof data.role === "string" ? data.role : "educator",
            status: typeof data.status === "string" ? data.status : "active",
            organizationId:
              typeof data.organization_id === "string" ? data.organization_id : null,
            membershipStatus:
              typeof data.membership_status === "string" ? data.membership_status : null,
            avatarId: typeof data.avatar_id === "string" ? data.avatar_id : null,
            createdAt:
              typeof data.created_at === "string"
                ? data.created_at
                : new Date().toISOString(),
          } as EducatorApi;
        } catch {
          if (apiEnabled) return educatorsGetById(id!);
          throw new Error("Could not load educator from Supabase.");
        }
      }
      return educatorsGetById(id!);
    },
    enabled: !!enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) {
    return { educator: null, displayName: id ?? "—", isLoading: false };
  }

  const educator = query.data ?? null;
  return {
    educator,
    displayName: educator?.name ?? "—",
    isLoading: query.isLoading,
  };
}
