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

interface SupabaseLearnerRow {
  id: string;
  first_name?: string | null;
  firstName?: string | null;
  last_name?: string | null;
  lastName?: string | null;
  date_of_birth?: string | null;
  dateOfBirth?: string | null;
  school?: string | null;
  enrolment_type?: string | null;
  enrolmentType?: string | null;
  program_type?: string | null;
  programType?: string | null;
  membership_status?: string | null;
  membershipStatus?: string | null;
  user_id?: string | null;
  userId?: string | null;
  parent_name?: string | null;
  parentName?: string | null;
  parent_phone?: string | null;
  parentPhone?: string | null;
  parent_email?: string | null;
  parentEmail?: string | null;
  organization_id?: string | null;
  organizationId?: string | null;
  status?: string | null;
  gender?: string | null;
  joined_at?: string | null;
  joinedAt?: string | null;
}

function normalizeLearnerStatus(value: unknown): "active" | "alumni" {
  return value === "alumni" ? "alumni" : "active";
}

function normalizeGender(value: unknown): "male" | "female" | "other" | undefined {
  return value === "male" || value === "female" || value === "other" ? value : undefined;
}

function mapSupabaseToLearner(row: SupabaseLearnerRow): Learner {
  return {
    id: row.id,
    firstName: row.first_name ?? row.firstName ?? "",
    lastName: row.last_name ?? row.lastName ?? "",
    dateOfBirth: row.date_of_birth ?? row.dateOfBirth ?? "",
    school: row.school ?? "",
    enrolmentType: (row.enrolment_type ?? row.enrolmentType ?? "member") as "member" | "partner_org",
    programType: (row.program_type ?? row.programType ?? "MAKERSPACE") as "MAKERSPACE" | "SCHOOL_CLUB" | "ORGANISATION",
    membershipStatus: (row.membership_status ?? row.membershipStatus ?? undefined) as Learner["membershipStatus"],
    userId: row.user_id ?? row.userId ?? undefined,
    parentName: row.parent_name ?? row.parentName ?? undefined,
    parentPhone: row.parent_phone ?? row.parentPhone ?? undefined,
    parentEmail: row.parent_email ?? row.parentEmail ?? undefined,
    organizationId: row.organization_id ?? row.organizationId ?? undefined,
    status: normalizeLearnerStatus(row.status),
    gender: normalizeGender(row.gender),
    joinedAt: row.joined_at ?? row.joinedAt ?? undefined,
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
          const mapped = ((data as SupabaseLearnerRow[] | null) ?? []).map(mapSupabaseToLearner);
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
