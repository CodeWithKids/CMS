/**
 * Educator by ID from API when VITE_API_URL is set.
 * Use for display labels (e.g. in tables); render in a cell component so the hook is not called in a loop.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, educatorsGetById, type EducatorApi } from "@/lib/api";
import { getEducatorName } from "@/mockData";

const EDUCATOR_QUERY_KEY = ["educator"];

export function useEducator(id: string | null | undefined): {
  educator: EducatorApi | { id: string; name: string } | null;
  displayName: string;
  isLoading: boolean;
} {
  const enabled = isApiEnabled() && !!id;

  const query = useQuery({
    queryKey: [...EDUCATOR_QUERY_KEY, id ?? ""],
    queryFn: () => educatorsGetById(id!),
    enabled: !!enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) {
    if (!id) return { educator: null, displayName: "—", isLoading: false };
    const name = getEducatorName(id);
    return {
      educator: { id, name },
      displayName: name,
      isLoading: false,
    };
  }

  const educator = query.data ?? null;
  return {
    educator,
    displayName: educator?.name ?? "—",
    isLoading: query.isLoading,
  };
}
