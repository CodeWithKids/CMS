import type { ClassApi } from "@/lib/api";

/** Row shape from `public.classes` (snake_case) with optional legacy camelCase. */
export interface SupabaseClassRow {
  id: string;
  name: string;
  program: string;
  age_group?: string | null;
  ageGroup?: string | null;
  location: string;
  educator_id?: string | null;
  educatorId?: string | null;
  term_id?: string | null;
  termId?: string | null;
  learner_ids?: string[] | null;
  learnerIds?: string[] | null;
  capacity?: number | null;
  school_or_organisation_name?: string | null;
  schoolOrOrganisationName?: string | null;
  track_id?: string | null;
  trackId?: string | null;
}

export function mapSupabaseRowToClassApi(row: SupabaseClassRow): ClassApi {
  const learnerIds = row.learner_ids ?? row.learnerIds ?? [];
  return {
    id: row.id,
    name: row.name,
    program: row.program,
    ageGroup: row.age_group ?? row.ageGroup ?? "",
    location: row.location,
    educatorId: row.educator_id ?? row.educatorId ?? "",
    termId: row.term_id ?? row.termId ?? "",
    learnerIds: Array.isArray(learnerIds) ? learnerIds : [],
    capacity: row.capacity ?? null,
    schoolOrOrganisationName: row.school_or_organisation_name ?? row.schoolOrOrganisationName ?? null,
    trackId: row.track_id ?? row.trackId ?? null,
  };
}

export type ClassCreateBody = {
  name: string;
  program: string;
  ageGroup: string;
  location: string;
  educatorId: string;
  termId: string;
  /** Optional; defaults to [] in the database row. */
  learnerIds?: string[];
  capacity?: number | null;
  schoolOrOrganisationName?: string | null;
  trackId?: string | null;
};

export function classCreateBodyToSupabaseRow(id: string, body: ClassCreateBody): Record<string, unknown> {
  return {
    id,
    name: body.name,
    program: body.program,
    age_group: body.ageGroup,
    location: body.location,
    educator_id: body.educatorId,
    term_id: body.termId,
    learner_ids: body.learnerIds ?? [],
    capacity: body.capacity ?? null,
    school_or_organisation_name: body.schoolOrOrganisationName?.trim() ? body.schoolOrOrganisationName : null,
    track_id: body.trackId?.trim() ? body.trackId : null,
  };
}

export type ClassPatchBody = Partial<{
  name: string;
  program: string;
  ageGroup: string;
  location: string;
  educatorId: string;
  termId: string;
  learnerIds: string[];
  capacity: number | null;
  schoolOrOrganisationName: string | null;
  trackId: string | null;
}>;

export function classPatchBodyToSupabasePatch(body: ClassPatchBody): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.program !== undefined) patch.program = body.program;
  if (body.ageGroup !== undefined) patch.age_group = body.ageGroup;
  if (body.location !== undefined) patch.location = body.location;
  if (body.educatorId !== undefined) patch.educator_id = body.educatorId;
  if (body.termId !== undefined) patch.term_id = body.termId;
  if (body.learnerIds !== undefined) patch.learner_ids = body.learnerIds;
  if (body.capacity !== undefined) patch.capacity = body.capacity;
  if (body.schoolOrOrganisationName !== undefined) {
    patch.school_or_organisation_name = body.schoolOrOrganisationName?.trim()
      ? body.schoolOrOrganisationName
      : null;
  }
  if (body.trackId !== undefined) patch.track_id = body.trackId?.trim() ? body.trackId : null;
  return patch;
}
