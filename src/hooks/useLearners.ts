/**
 * Learners from API when VITE_API_URL is set, otherwise from mock.
 */
import { useQuery } from "@tanstack/react-query";
import type { Learner } from "@/types";
import { mockLearners } from "@/mockData";
import {
  isApiEnabled,
  learnersGetAll,
  type LearnerApi,
} from "@/lib/api";

function mapApiToLearner(a: LearnerApi): Learner {
  return {
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    dateOfBirth: a.dateOfBirth,
    school: a.school,
    enrolmentType: a.enrolmentType as "member" | "partner_org",
    programType: a.programType as "MAKERSPACE" | "SCHOOL_CLUB" | "ORGANISATION",
    membershipStatus: a.membershipStatus ?? undefined,
    userId: a.userId ?? undefined,
    parentName: a.parentName ?? undefined,
    parentPhone: a.parentPhone ?? undefined,
    parentEmail: a.parentEmail ?? undefined,
    organizationId: a.organizationId ?? undefined,
    status: a.status as "active" | "alumni",
    gender: (a.gender as "male" | "female" | "other") ?? undefined,
    joinedAt: a.joinedAt ?? undefined,
  };
}

const LEARNERS_QUERY_KEY = ["learners"];

export interface UseLearnersParams {
  search?: string;
  enrolmentType?: string;
  organisationId?: string;
  status?: string;
}

export function useLearners(params?: UseLearnersParams): {
  learners: Learner[];
  isLoading: boolean;
} {
  const enabled = isApiEnabled();

  const query = useQuery({
    queryKey: [...LEARNERS_QUERY_KEY, params?.search ?? "", params?.enrolmentType ?? "", params?.organisationId ?? "", params?.status ?? ""],
    queryFn: () => learnersGetAll(params),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  if (!enabled) {
    let list = [...mockLearners];
    if (params?.enrolmentType) list = list.filter((l) => l.enrolmentType === params.enrolmentType);
    if (params?.organisationId) list = list.filter((l) => l.organizationId === params.organisationId);
    if (params?.status) list = list.filter((l) => l.status === params.status);
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
          l.school.toLowerCase().includes(q)
      );
    }
    return { learners: list, isLoading: false };
  }

  const list = (query.data ?? []).map(mapApiToLearner);
  return { learners: list, isLoading: query.isLoading };
}
