/**
 * Terms from Supabase when configured, otherwise API, otherwise mock.
 * Use this in finance/educator filters and anywhere terms are needed.
 */
import { useQuery } from "@tanstack/react-query";
import type { Term } from "@/types";
import { mockTerms, getCurrentTerm as getMockCurrentTerm } from "@/mockData";
import { isApiEnabled, termsGetAll, termsGetCurrent, type TermApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

function mapTermApiToTerm(t: TermApi): Term {
  const year = t.startDate?.length >= 4 ? parseInt(t.startDate.slice(0, 4), 10) : new Date().getFullYear();
  return { id: t.id, name: t.name, year: Number.isFinite(year) ? year : new Date().getFullYear(), startDate: t.startDate, endDate: t.endDate };
}

interface SupabaseTermRow {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  is_current?: boolean | null;
  isCurrent?: boolean | null;
}

function mapSupabaseTermToTerm(t: SupabaseTermRow): Term {
  const startDate = t.start_date ?? t.startDate ?? "";
  const endDate = t.end_date ?? t.endDate ?? "";
  const year = startDate.length >= 4 ? parseInt(startDate.slice(0, 4), 10) : new Date().getFullYear();
  return { id: t.id, name: t.name, year: Number.isFinite(year) ? year : new Date().getFullYear(), startDate, endDate };
}

function isCurrentSupabaseTerm(t: SupabaseTermRow): boolean {
  return t.is_current === true || t.isCurrent === true;
}

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

const TERMS_QUERY_KEY = ["terms"];
const CURRENT_TERM_QUERY_KEY = ["terms", "current"];

export function useTerms(): { terms: Term[]; currentTerm: Term | undefined; isLoading: boolean } {
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();

  const termsQuery = useQuery({
    queryKey: TERMS_QUERY_KEY,
    queryFn: async () => {
      if (supabaseEnabled) {
        const client = getSupabaseClient();
        const { data, error } = await client.from("terms").select("*");
        if (error) throw error;
        return ((data as SupabaseTermRow[] | null) ?? [])
          .map(mapSupabaseTermToTerm)
          .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
      }
      const list = await termsGetAll();
      return list.map(mapTermApiToTerm);
    },
    enabled: supabaseEnabled || apiEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const currentQuery = useQuery({
    queryKey: CURRENT_TERM_QUERY_KEY,
    queryFn: async () => {
      if (supabaseEnabled) {
        const client = getSupabaseClient();
        const { data, error } = await client.from("terms").select("*");
        if (error) throw error;
        const rows = (data as SupabaseTermRow[] | null) ?? [];
        const current = rows.find(isCurrentSupabaseTerm);
        return current ? mapSupabaseTermToTerm(current) : undefined;
      }
      const current = await termsGetCurrent();
      return current ? mapTermApiToTerm(current) : undefined;
    },
    enabled: supabaseEnabled || apiEnabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!supabaseEnabled && !apiEnabled) {
    const current = getMockCurrentTerm();
    return { terms: mockTerms, currentTerm: current, isLoading: false };
  }

  const terms = termsQuery.data ?? [];
  const currentTerm = currentQuery.data ?? (terms.length > 0 ? terms[terms.length - 1] : undefined);
  return {
    terms,
    currentTerm,
    isLoading: termsQuery.isLoading || currentQuery.isLoading,
  };
}
