/**
 * Organisation by ID from API when VITE_API_URL is set.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, organisationsGetById, type OrganisationApi } from "@/lib/api";
import { getOrganization } from "@/mockData";

const ORG_QUERY_KEY = ["organisation"];

export function useOrganisation(id: string | null | undefined): {
  organisation: OrganisationApi | { id: string; name: string; contactPerson: string } | null;
  isLoading: boolean;
} {
  const enabled = isApiEnabled() && !!id;

  const query = useQuery({
    queryKey: [...ORG_QUERY_KEY, id ?? ""],
    queryFn: () => organisationsGetById(id!),
    enabled: !!enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) {
    if (!id) return { organisation: null, isLoading: false };
    const mock = getOrganization(id);
    return {
      organisation: mock ? { id: mock.id, name: mock.name, contactPerson: mock.contactPerson } : null,
      isLoading: false,
    };
  }

  return {
    organisation: query.data ?? null,
    isLoading: query.isLoading,
  };
}
