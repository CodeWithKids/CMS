/**
 * Educators/staff from Supabase when configured, otherwise API, otherwise mock.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, educatorsGetAll, type EducatorApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { mockStaff } from "@/mockData";

export type EducatorListItem = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status?: string | null;
};

function mapApiToItem(e: EducatorApi): EducatorListItem {
  return { id: e.id, name: e.name, email: e.email, role: e.role, status: e.status };
}

type SupabaseProfileRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
};

function mapSupabaseToItem(p: SupabaseProfileRow): EducatorListItem {
  const email = typeof p.email === "string" ? p.email : null;
  const fallbackName = email?.split("@")[0] ?? "CWK User";
  return {
    id: p.id,
    name: p.name?.trim() ? p.name : fallbackName,
    email,
    role: p.role?.trim() ? p.role : "educator",
    status: p.status ?? "active",
  };
}

function mapMockToItem(s: (typeof mockStaff)[0]): EducatorListItem {
  return { id: s.id, name: s.name, email: s.email ?? null, role: s.role, status: "active" };
}

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

const EDUCATORS_QUERY_KEY = ["educators"];

export function useEducators(params?: { role?: string; status?: string }): {
  educators: EducatorListItem[];
  isLoading: boolean;
} {
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();
  const enabled = supabaseEnabled || apiEnabled;

  const query = useQuery({
    queryKey: [...EDUCATORS_QUERY_KEY, params?.role ?? "", params?.status ?? ""],
    queryFn: async () => {
      if (supabaseEnabled) {
        const client = getSupabaseClient();
        try {
          let q = client.from("profiles").select("*");
          if (params?.role) q = q.eq("role", params.role);
          if (params?.status) q = q.eq("status", params.status);
          const { data, error } = await q;
          if (error) throw error;
          return ((data as SupabaseProfileRow[] | null) ?? []).map(mapSupabaseToItem);
        } catch {
          if (isApiEnabled()) {
            const list = await educatorsGetAll(params);
            return list.map(mapApiToItem);
          }
          throw new Error("Could not load educators from Supabase.");
        }
      }
      const list = await educatorsGetAll(params);
      return list.map(mapApiToItem);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) {
    let list = mockStaff;
    if (params?.role) list = list.filter((s) => s.role === params.role);
    if (params?.status) list = list.filter((s) => (s.employmentStatus ?? "active") === params.status);
    return { educators: list.map(mapMockToItem), isLoading: false };
  }

  return {
    educators: query.data ?? [],
    isLoading: query.isLoading,
  };
}
