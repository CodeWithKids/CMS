/**
 * Class by ID from Supabase when configured, else API, else mock.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, classesGetById, type ClassApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { mapSupabaseRowToClassApi, type SupabaseClassRow } from "@/lib/classesSupabase";
import { getClass } from "@/mockData";

const CLASS_QUERY_KEY = ["class"];

export function useClass(id: string | null | undefined): {
  class: ClassApi | { id: string; name: string } | null;
  displayName: string;
  isLoading: boolean;
} {
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();
  const backendEnabled = supabaseEnabled || apiEnabled;

  const query = useQuery({
    queryKey: [...CLASS_QUERY_KEY, id ?? ""],
    queryFn: async (): Promise<ClassApi | null> => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase.from("classes").select("*").eq("id", id!).maybeSingle();
          if (error) throw error;
          return data ? mapSupabaseRowToClassApi(data as SupabaseClassRow) : null;
        } catch {
          if (isApiEnabled()) return classesGetById(id!);
          return null;
        }
      }
      return classesGetById(id!);
    },
    enabled: backendEnabled && !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (!backendEnabled) {
    if (!id) return { class: null, displayName: "—", isLoading: false };
    const mock = getClass(id);
    const cls = mock ? { id: mock.id, name: mock.name } : null;
    return {
      class: cls,
      displayName: cls?.name ?? "—",
      isLoading: false,
    };
  }

  const cls = query.data ?? null;
  return {
    class: cls,
    displayName: cls?.name ?? "—",
    isLoading: query.isLoading,
  };
}
