import type { Learner } from "@/types";
import type { LearnerApi } from "@/lib/api";

/** Row shape from `public.learners` (snake_case) with optional legacy camelCase. */
export interface SupabaseLearnerRow {
  id: string;
  first_name?: string | null;
  firstName?: string | null;
  last_name?: string | null;
  lastName?: string | null;
  date_of_birth?: string | null;
  dateOfBirth?: string | null;
  school?: string | null;
  enrollment_type?: string | null;
  enrollmentType?: string | null;
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
  parent_user_id?: string | null;
  parentUserId?: string | null;
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

export function mapSupabaseRowToLearner(row: SupabaseLearnerRow): Learner {
  return {
    id: row.id,
    firstName: row.first_name ?? row.firstName ?? "",
    lastName: row.last_name ?? row.lastName ?? "",
    dateOfBirth: row.date_of_birth ?? row.dateOfBirth ?? "",
    school: row.school ?? "",
    enrollmentType: (row.enrollment_type ??
      row.enrollmentType ??
      row.enrolment_type ??
      row.enrolmentType ??
      "member") as Learner["enrollmentType"],
    programType: (row.program_type ?? row.programType ?? "MAKERSPACE") as Learner["programType"],
    membershipStatus: (row.membership_status ?? row.membershipStatus ?? undefined) as Learner["membershipStatus"],
    userId: row.user_id ?? row.userId ?? undefined,
    parentUserId: row.parent_user_id ?? row.parentUserId ?? undefined,
    parentName: row.parent_name ?? row.parentName ?? undefined,
    parentPhone: row.parent_phone ?? row.parentPhone ?? undefined,
    parentEmail: row.parent_email ?? row.parentEmail ?? undefined,
    organizationId: row.organization_id ?? row.organizationId ?? undefined,
    status: normalizeLearnerStatus(row.status),
    gender: normalizeGender(row.gender),
    joinedAt: row.joined_at ?? row.joinedAt ?? undefined,
  };
}

export function mapSupabaseRowToLearnerApi(row: SupabaseLearnerRow): LearnerApi {
  const l = mapSupabaseRowToLearner(row);
  return {
    id: l.id,
    firstName: l.firstName,
    lastName: l.lastName,
    dateOfBirth: l.dateOfBirth,
    school: l.school,
    enrollmentType: l.enrollmentType,
    programType: l.programType,
    membershipStatus: l.membershipStatus ?? null,
    userId: l.userId ?? null,
    parentUserId: l.parentUserId ?? null,
    parentName: l.parentName ?? null,
    parentPhone: l.parentPhone ?? null,
    parentEmail: l.parentEmail ?? null,
    organizationId: l.organizationId ?? null,
    status: l.status,
    gender: l.gender ?? null,
    joinedAt: l.joinedAt ?? null,
  };
}

export function mapLearnerToLearnerApi(l: Learner): LearnerApi {
  return {
    id: l.id,
    firstName: l.firstName,
    lastName: l.lastName,
    dateOfBirth: l.dateOfBirth,
    school: l.school,
    enrollmentType: l.enrollmentType,
    programType: l.programType,
    membershipStatus: l.membershipStatus ?? null,
    userId: l.userId ?? null,
    parentUserId: l.parentUserId ?? null,
    parentName: l.parentName ?? null,
    parentPhone: l.parentPhone ?? null,
    parentEmail: l.parentEmail ?? null,
    organizationId: l.organizationId ?? null,
    status: l.status,
    gender: l.gender ?? null,
    joinedAt: l.joinedAt ?? null,
  };
}

/** Only set `user_id` when it is a valid UUID (links to auth.users). */
export function authUserIdOrNull(raw: string | null | undefined): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRe.test(s) ? s : null;
}

export type LearnerCreateBody = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  school: string;
  enrollmentType: string;
  programType: string;
  membershipStatus?: string | null;
  userId?: string | null;
  parentUserId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  organizationId?: string | null;
  status?: string;
  gender?: string | null;
  joinedAt?: string | null;
};

export function learnerCreateBodyToSupabaseRow(id: string, body: LearnerCreateBody): Record<string, unknown> {
  return {
    id,
    first_name: body.firstName,
    last_name: body.lastName,
    date_of_birth: body.dateOfBirth,
    school: body.school,
    enrollment_type: body.enrollmentType,
    program_type: body.programType,
    membership_status: body.membershipStatus?.trim() ? body.membershipStatus : null,
    user_id: authUserIdOrNull(body.userId ?? undefined),
    parent_user_id: authUserIdOrNull(body.parentUserId ?? undefined),
    parent_name: body.parentName?.trim() ? body.parentName : null,
    parent_phone: body.parentPhone?.trim() ? body.parentPhone : null,
    parent_email: body.parentEmail?.trim() ? body.parentEmail : null,
    organization_id: body.organizationId?.trim() ? body.organizationId : null,
    status: body.status && body.status.trim() ? body.status : "active",
    gender: body.gender?.trim() ? body.gender : null,
    joined_at: body.joinedAt?.trim() ? body.joinedAt : null,
  };
}

export type LearnerPatchBody = Partial<{
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  school: string;
  enrollmentType: string;
  programType: string;
  membershipStatus: string | null;
  userId: string | null;
  parentUserId: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  organizationId: string | null;
  status: string;
  gender: string | null;
  joinedAt: string | null;
}>;

export function learnerPatchBodyToSupabasePatch(body: LearnerPatchBody): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (body.firstName !== undefined) patch.first_name = body.firstName;
  if (body.lastName !== undefined) patch.last_name = body.lastName;
  if (body.dateOfBirth !== undefined) patch.date_of_birth = body.dateOfBirth;
  if (body.school !== undefined) patch.school = body.school;
  if (body.enrollmentType !== undefined) patch.enrollment_type = body.enrollmentType;
  if (body.programType !== undefined) patch.program_type = body.programType;
  if (body.membershipStatus !== undefined) patch.membership_status = body.membershipStatus;
  if (body.userId !== undefined) patch.user_id = authUserIdOrNull(body.userId ?? undefined);
  if (body.parentUserId !== undefined) patch.parent_user_id = authUserIdOrNull(body.parentUserId ?? undefined);
  if (body.parentName !== undefined) patch.parent_name = body.parentName;
  if (body.parentPhone !== undefined) patch.parent_phone = body.parentPhone;
  if (body.parentEmail !== undefined) patch.parent_email = body.parentEmail;
  if (body.organizationId !== undefined) patch.organization_id = body.organizationId;
  if (body.status !== undefined) patch.status = body.status;
  if (body.gender !== undefined) patch.gender = body.gender;
  if (body.joinedAt !== undefined) patch.joined_at = body.joinedAt;
  return patch;
}
