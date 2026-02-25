import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getOrganization,
  getOrganisationScopedLearners,
  type Learner,
  type Organization,
} from "@/mockData";

export interface UseOrganisationLearnersResult {
  /** Current user's organisation (null if not an org user or org not found). */
  organisation: Organization | null;
  /** Learners scoped to this organisation only. Never use unfiltered learner lists in /organisation/*. */
  learners: Learner[];
  /** Current user's organizationId from auth. */
  organizationId: string | null;
  /** True if the current user has role "organisation" and a valid organizationId. */
  isOrgUser: boolean;
}

/**
 * Hook for all /organisation/* pages. Always returns organisation-scoped learners;
 * never exposes unfiltered data. Use this instead of fetching learners directly.
 */
export function useOrganisationLearners(): UseOrganisationLearnersResult {
  const { currentUser } = useAuth();

  return useMemo(() => {
    const organizationId =
      currentUser?.role === "organisation" && currentUser.organizationId
        ? currentUser.organizationId
        : null;

    if (!organizationId) {
      return {
        organisation: null,
        learners: [],
        organizationId: null,
        isOrgUser: false,
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
  }, [currentUser?.id, currentUser?.role, currentUser?.organizationId]);
}
