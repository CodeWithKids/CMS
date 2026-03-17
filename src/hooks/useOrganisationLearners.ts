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

  const apiEnabled = isApiEnabled();
  const { data: orgApi = null, isLoading: orgLoading } = useQuery({
    queryKey: ["organisations", organizationId!],
    queryFn: () => organisationsGetById(organizationId!),
    enabled: apiEnabled && !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: learnersApi = [], isLoading: learnersLoading } = useQuery({
    queryKey: ["organisations", organizationId!, "learners"],
    queryFn: () => organisationsGetLearners(organizationId!),
    enabled: apiEnabled && !!organizationId,
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

    if (apiEnabled) {
      return {
        organisation: mapOrgApiToOrganization(orgApi),
        learners: learnersApi.map(mapLearnerApiToLearner),
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
    apiEnabled,
    orgApi,
    learnersApi,
    orgLoading,
    learnersLoading,
  ]);
}
