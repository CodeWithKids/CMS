/**
 * Educators/staff from API when VITE_API_URL is set, otherwise from mock.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, educatorsGetAll, type EducatorApi } from "@/lib/api";
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

function mapMockToItem(s: (typeof mockStaff)[0]): EducatorListItem {
  return { id: s.id, name: s.name, email: s.email ?? null, role: s.role, status: "active" };
}

const EDUCATORS_QUERY_KEY = ["educators"];

export function useEducators(params?: { role?: string; status?: string }): {
  educators: EducatorListItem[];
  isLoading: boolean;
} {
  const enabled = isApiEnabled();

  const query = useQuery({
    queryKey: [...EDUCATORS_QUERY_KEY, params?.role ?? "", params?.status ?? ""],
    queryFn: async () => {
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
