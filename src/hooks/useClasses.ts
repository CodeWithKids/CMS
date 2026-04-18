/**
 * Classes from Supabase when configured, otherwise API, otherwise mock.
 */
import { useQuery } from "@tanstack/react-query";
import { mockClasses } from "@/mockData";
import { isApiEnabled, classesGetAll, type ClassApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { mapSupabaseRowToClassApi, type SupabaseClassRow } from "@/lib/classesSupabase";
import type { ClassEntity } from "@/types";

function mockEntityToClassApi(c: ClassEntity): ClassApi {
  return {
    id: c.id,
    name: c.name,
    program: c.program,
    ageGroup: c.ageGroup,
    location: c.location,
    educatorId: c.educatorId,
    termId: c.termId,
    learnerIds: c.learnerIds,
    capacity: c.capacity ?? null,
    schoolOrOrganisationName: null,
    trackId: null,
  };
}

function applyLocalClassFilters(list: ClassApi[], params?: UseClassesParams): ClassApi[] {
  let filtered = [...list];
  if (params?.termId) filtered = filtered.filter((c) => c.termId === params.termId);
  if (params?.program) filtered = filtered.filter((c) => c.program === params.program);
  if (params?.educatorId) filtered = filtered.filter((c) => c.educatorId === params.educatorId);
  if (params?.trackId) filtered = filtered.filter((c) => c.trackId === params.trackId);
  return filtered;
}

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

const CLASSES_QUERY_KEY = ["classes"];

export interface UseClassesParams {
  termId?: string;
  program?: string;
  educatorId?: string;
  trackId?: string;
}

export function useClasses(params?: UseClassesParams): {
  classes: ClassApi[];
  isLoading: boolean;
  isError: boolean;
} {
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();
  const invalidEducatorParam = params?.educatorId === "";

  const query = useQuery({
    queryKey: [
      ...CLASSES_QUERY_KEY,
      params?.termId ?? "",
      params?.program ?? "",
      params?.educatorId ?? "",
      params?.trackId ?? "",
    ],
    queryFn: async () => {
      if (supabaseEnabled) {
        const client = getSupabaseClient();
        try {
          let q = client.from("classes").select("*");
          if (params?.termId) q = q.eq("term_id", params.termId);
          if (params?.program) q = q.eq("program", params.program);
          if (params?.educatorId) q = q.eq("educator_id", params.educatorId);
          if (params?.trackId) q = q.eq("track_id", params.trackId);
          const { data, error } = await q;
          if (error) throw error;
          return ((data as SupabaseClassRow[] | null) ?? []).map(mapSupabaseRowToClassApi);
        } catch {
          if (isApiEnabled()) {
            return classesGetAll(params);
          }
          throw new Error("Could not load classes from Supabase.");
        }
      }

      return classesGetAll(params);
    },
    enabled: (supabaseEnabled || apiEnabled) && !invalidEducatorParam,
    staleTime: 2 * 60 * 1000,
  });

  if (!supabaseEnabled && !apiEnabled) {
    if (invalidEducatorParam) return { classes: [], isLoading: false, isError: false };
    const list = applyLocalClassFilters(mockClasses.map(mockEntityToClassApi), params);
    return { classes: list, isLoading: false, isError: false };
  }

  const list = query.data ?? [];
  return { classes: list, isLoading: query.isLoading, isError: query.isError };
}
