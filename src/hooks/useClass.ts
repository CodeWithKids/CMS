/**
 * Class by ID from API when VITE_API_URL is set.
 * Use for display labels (e.g. in tables); render in a cell component so the hook is not called in a loop.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, classesGetById, type ClassApi } from "@/lib/api";
import { getClass } from "@/mockData";

const CLASS_QUERY_KEY = ["class"];

export function useClass(id: string | null | undefined): {
  class: ClassApi | { id: string; name: string } | null;
  displayName: string;
  isLoading: boolean;
} {
  const enabled = isApiEnabled() && !!id;

  const query = useQuery({
    queryKey: [...CLASS_QUERY_KEY, id ?? ""],
    queryFn: () => classesGetById(id!),
    enabled: !!enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) {
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
