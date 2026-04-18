/**
 * Organisation by ID from Supabase when configured, otherwise API, otherwise mock.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, organisationsGetById, type OrganisationApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { getOrganization } from "@/mockData";

const ORG_QUERY_KEY = ["organisation"];

type SupabaseOrganisationRow = {
  id: string;
  name: string;
  type?: string | null;
  overview_type?: string | null;
  overviewType?: string | null;
  contact_person?: string | null;
  contactPerson?: string | null;
  contact_email?: string | null;
  contactEmail?: string | null;
  contact_phone?: string | null;
  contactPhone?: string | null;
  location?: string | null;
};

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function mapSupabaseToOrganisation(row: SupabaseOrganisationRow): OrganisationApi {
  const overviewRaw = row.overview_type ?? row.overviewType ?? undefined;
  const overviewType =
    overviewRaw === "SCHOOL" || overviewRaw === "ORGANISATION" || overviewRaw === "MIRADI"
      ? overviewRaw
      : undefined;
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? "organisation",
    overviewType: overviewType ?? null,
    contactPerson: row.contact_person ?? row.contactPerson ?? "",
    contactEmail: row.contact_email ?? row.contactEmail ?? null,
    contactPhone: row.contact_phone ?? row.contactPhone ?? null,
    location: row.location ?? "",
  };
}

export function useOrganisation(id: string | null | undefined): {
  organisation: OrganisationApi | { id: string; name: string; contactPerson: string } | null;
  isLoading: boolean;
} {
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();
  const enabled = (supabaseEnabled || apiEnabled) && !!id;

  const query = useQuery({
    queryKey: [...ORG_QUERY_KEY, id ?? ""],
    queryFn: async () => {
      if (supabaseEnabled) {
        const client = getSupabaseClient();
        try {
          const { data, error } = await client.from("organisations").select("*").eq("id", id!).maybeSingle();
          if (error) throw error;
          return data ? mapSupabaseToOrganisation(data as SupabaseOrganisationRow) : null;
        } catch {
          if (isApiEnabled()) return organisationsGetById(id!);
          return null;
        }
      }
      return organisationsGetById(id!);
    },
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
