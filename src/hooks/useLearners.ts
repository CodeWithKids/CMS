/**
 * Learners from Supabase when configured, otherwise API, otherwise mock.
 */
import { useQuery } from "@tanstack/react-query";
import type { Learner } from "@/types";
import { mockLearners } from "@/mockData";
import {
  isApiEnabled,
  learnersGetAll,
  type LearnerApi,
} from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { mapSupabaseRowToLearner, type SupabaseLearnerRow } from "@/lib/learnersSupabase";

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

function applyLocalLearnerFilters(list: Learner[], params?: UseLearnersParams): Learner[] {
  let filtered = [...list];
  if (params?.enrolmentType) filtered = filtered.filter((l) => l.enrolmentType === params.enrolmentType);
  if (params?.organisationId) filtered = filtered.filter((l) => l.organizationId === params.organisationId);
  if (params?.status) filtered = filtered.filter((l) => l.status === params.status);
  if (params?.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter((l) => `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) || l.school.toLowerCase().includes(q));
  }
  return filtered;
}

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
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
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();

  const query = useQuery({
    queryKey: [...LEARNERS_QUERY_KEY, params?.search ?? "", params?.enrolmentType ?? "", params?.organisationId ?? "", params?.status ?? ""],
    queryFn: async () => {
      if (supabaseEnabled) {
        const client = getSupabaseClient();
        try {
          const { data, error } = await client.from("learners").select("*");
          if (error) throw error;
          const mapped = ((data as SupabaseLearnerRow[] | null) ?? []).map(mapSupabaseRowToLearner);
          return applyLocalLearnerFilters(mapped, params);
        } catch (e) {
          if (isApiEnabled()) {
            const list = await learnersGetAll(params);
            return list.map(mapApiToLearner);
          }
          throw e;
        }
      }

      const list = await learnersGetAll(params);
      return list.map(mapApiToLearner);
    },
    enabled: supabaseEnabled || apiEnabled,
    staleTime: 2 * 60 * 1000,
  });

  if (!supabaseEnabled && !apiEnabled) {
    const list = applyLocalLearnerFilters(mockLearners, params);
    return { learners: list, isLoading: false };
  }

  const list = query.data ?? [];
  return { learners: list, isLoading: query.isLoading };
}
