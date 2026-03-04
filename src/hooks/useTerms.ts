/**
 * Terms from API when VITE_API_URL is set, otherwise from mock.
 * Use this in finance/educator filters and anywhere terms are needed.
 */
import { useQuery } from "@tanstack/react-query";
import type { Term } from "@/types";
import { mockTerms, getCurrentTerm as getMockCurrentTerm } from "@/mockData";
import { isApiEnabled, termsGetAll, termsGetCurrent, type TermApi } from "@/lib/api";

function mapTermApiToTerm(t: TermApi): Term {
  const year = t.startDate?.length >= 4 ? parseInt(t.startDate.slice(0, 4), 10) : new Date().getFullYear();
  return { id: t.id, name: t.name, year: Number.isFinite(year) ? year : new Date().getFullYear(), startDate: t.startDate, endDate: t.endDate };
}

const TERMS_QUERY_KEY = ["terms"];
const CURRENT_TERM_QUERY_KEY = ["terms", "current"];

export function useTerms(): { terms: Term[]; currentTerm: Term | undefined; isLoading: boolean } {
  const enabled = isApiEnabled();

  const termsQuery = useQuery({
    queryKey: TERMS_QUERY_KEY,
    queryFn: async () => {
      const list = await termsGetAll();
      return list.map(mapTermApiToTerm);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const currentQuery = useQuery({
    queryKey: CURRENT_TERM_QUERY_KEY,
    queryFn: async () => {
      const current = await termsGetCurrent();
      return current ? mapTermApiToTerm(current) : undefined;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) {
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
