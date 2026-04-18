import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getOrganization,
  getOrganisationScopedLearners,
  type Learner,
  type Organization,
} from "@/mockData";
import {
  isApiEnabled,
  organisationsGetById,
  organisationsGetLearners,
  type LearnerApi,
  type OrganisationApi,
} from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { mapSupabaseRowToLearner, type SupabaseLearnerRow } from "@/lib/learnersSupabase";
import type { LearnerEnrolmentType, LearnerProgramType } from "@/types";

export interface UseOrganisationLearnersResult {
  /** Current user's organisation (null if not an org user or org not found). */
  organisation: Organization | null;
  /** Learners scoped to this organisation only. Never use unfiltered learner lists in /organisation/*. */
  learners: Learner[];
  /** Current user's organizationId from auth. */
  organizationId: string | null;
  /** True if the current user has role "organisation" and a valid organizationId. */
  isOrgUser: boolean;
  /** True while organisation/learners are loading from API (only when API enabled). */
  isLoading?: boolean;
}

type SupabaseOrganisationRow = {
  id: string;
  name: string;
  type?: string | null;
  contact_person?: string | null;
  contactPerson?: string | null;
  contact_email?: string | null;
  contactEmail?: string | null;
  contact_phone?: string | null;
  contactPhone?: string | null;
  location?: string | null;
};

function mapOrgApiToOrganization(api: OrganisationApi | null): Organization | null {
  if (!api) return null;
  return {
    id: api.id,
    name: api.name,
    type: api.type as Organization["type"],
    contactPerson: api.contactPerson,
    contactEmail: api.contactEmail ?? undefined,
    contactPhone: api.contactPhone ?? undefined,
    location: api.location,
  };
}

function mapSupabaseOrgToOrganization(row: SupabaseOrganisationRow | null): Organization | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: (row.type as Organization["type"]) ?? "organisation",
    contactPerson: row.contact_person ?? row.contactPerson ?? "",
    contactEmail: row.contact_email ?? row.contactEmail ?? undefined,
    contactPhone: row.contact_phone ?? row.contactPhone ?? undefined,
    location: row.location ?? "",
  };
}

function mapLearnerApiToLearner(api: LearnerApi): Learner {
  return {
    id: api.id,
    firstName: api.firstName,
    lastName: api.lastName,
    dateOfBirth: api.dateOfBirth,
    school: api.school,
    enrolmentType: api.enrolmentType as LearnerEnrolmentType,
    programType: api.programType as LearnerProgramType,
    membershipStatus: api.membershipStatus as Learner["membershipStatus"],
    userId: api.userId ?? undefined,
    parentName: api.parentName ?? undefined,
    parentPhone: api.parentPhone ?? undefined,
    parentEmail: api.parentEmail ?? undefined,
    organizationId: api.organizationId ?? undefined,
    status: (api.status === "active" ? "active" : "alumni") as Learner["status"],
    gender: api.gender as Learner["gender"],
    joinedAt: api.joinedAt ?? undefined,
  };
}

/**
 * Hook for all /organisation/* pages. Always returns organisation-scoped learners;
 * never exposes unfiltered data. When API is enabled, fetches from GET /organisations/:id and GET /organisations/:id/learners.
 */
export function useOrganisationLearners(): UseOrganisationLearnersResult {
  const { currentUser } = useAuth();
  const organizationId =
    currentUser?.role === "organisation" && currentUser.organizationId
      ? currentUser.organizationId
      : null;

  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();
  const backendEnabled = supabaseEnabled || apiEnabled;
  const { data: orgData = null, isLoading: orgLoading } = useQuery({
    queryKey: ["organisations", organizationId!],
    queryFn: async () => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase
            .from("organisations")
            .select("*")
            .eq("id", organizationId!)
            .maybeSingle();
          if (error) throw error;
          return mapSupabaseOrgToOrganization((data as SupabaseOrganisationRow | null) ?? null);
        } catch {
          if (isApiEnabled()) {
            const fromApi = await organisationsGetById(organizationId!);
            return mapOrgApiToOrganization(fromApi);
          }
          return null;
        }
      }
      const fromApi = await organisationsGetById(organizationId!);
      return mapOrgApiToOrganization(fromApi);
    },
    enabled: backendEnabled && !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: learnersData = [], isLoading: learnersLoading } = useQuery({
    queryKey: ["organisations", organizationId!, "learners"],
    queryFn: async () => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase
            .from("learners")
            .select("*")
            .eq("organization_id", organizationId!);
          if (error) throw error;
          return ((data as SupabaseLearnerRow[] | null) ?? []).map(mapSupabaseRowToLearner);
        } catch {
          if (isApiEnabled()) {
            const fromApi = await organisationsGetLearners(organizationId!);
            return fromApi.map(mapLearnerApiToLearner);
          }
          return [];
        }
      }
      const fromApi = await organisationsGetLearners(organizationId!);
      return fromApi.map(mapLearnerApiToLearner);
    },
    enabled: backendEnabled && !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    if (!organizationId) {
      return {
        organisation: null,
        learners: [],
        organizationId: null,
        isOrgUser: false,
      };
    }

    if (backendEnabled) {
      return {
        organisation: orgData ?? getOrganization(organizationId) ?? null,
        learners: learnersData,
        organizationId,
        isOrgUser: true,
        isLoading: orgLoading || learnersLoading,
      };
    }

    const organisation = getOrganization(organizationId) ?? null;
    const learners = getOrganisationScopedLearners(organizationId);
    return {
      organisation,
      learners,
      organizationId,
      isOrgUser: true,
    };
  }, [
    organizationId,
    backendEnabled,
    orgData,
    learnersData,
    orgLoading,
    learnersLoading,
  ]);
}
