import { useMemo } from "react";
import type { LearnerAdminProfile, LearnerAdminEnrolmentStatus } from "@/types";
import {
  getLearner,
  getOrganization,
  getClass,
  getTerm,
  getCurrentTerm,
  getSessionsForTerm,
  getSession,
} from "@/mockData";
import { mockUsers } from "@/mockData";
import { getPresetAvatar } from "@/data/presetAvatars";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";

function mapEnrolmentStatus(
  status: "active" | "dropped" | "completed"
): LearnerAdminEnrolmentStatus {
  if (status === "active") return "CURRENT";
  if (status === "completed") return "COMPLETED";
  return "WITHDRAWN";
}

/**
 * Returns the admin profile for a learner (shape for GET /api/admin/learners/:id).
 * Returns null if the learner is not found.
 */
export function useLearnerAdminProfile(learnerId: string | undefined): LearnerAdminProfile | null {
  const learner = useMemo(
    () => (learnerId ? getLearner(learnerId) : undefined),
    [learnerId]
  );
  const { getEnrollmentsForLearner } = useEnrollments();
  const { getByLearner } = useAttendance();
  const { getByLearner: getBadgeAwardsByLearner } = useBadgeAwards();

  return useMemo(() => {
    if (!learner || !learnerId) return null;

    const programType =
      learner.programType === "MAKERSPACE"
        ? "MAKERSPACE"
        : learner.programType === "SCHOOL_CLUB"
          ? "SCHOOL_CLUB"
          : "ORGANISATION";

    const status: LearnerAdminProfile["status"] =
      learner.status === "active" ? "ACTIVE" : "ALUMNI";

    const organisation =
      learner.organizationId ? getOrganization(learner.organizationId) : undefined;

    let avatarUrl: string | null = null;
    if (learner.userId) {
      const user = mockUsers.find((u) => u.id === learner.userId);
      if (user?.avatarId) {
        avatarUrl = getPresetAvatar(user.avatarId)?.imageUrl ?? null;
      }
    }

    const badgeAwards = getBadgeAwardsByLearner(learnerId);
    const badgesByType: Record<string, number> = {};
    for (const a of badgeAwards) {
      badgesByType[a.badgeId] = (badgesByType[a.badgeId] ?? 0) + 1;
    }

    const currentTerm = getCurrentTerm();
    const currentTermSessionIds = currentTerm
      ? new Set(getSessionsForTerm(currentTerm.id).map((s) => s.id))
      : new Set<string>();

    const attendanceRecords = getByLearner(learnerId);
    const currentTermRecords = attendanceRecords.filter((r) =>
      currentTermSessionIds.has(r.sessionId)
    );

    const presentCountCurrentTerm = currentTermRecords.filter(
      (r) => r.status === "present" || r.status === "late"
    ).length;
    const lateCountCurrentTerm = currentTermRecords.filter((r) => r.status === "late").length;
    const absentCountCurrentTerm = currentTermRecords.filter((r) => r.status === "absent").length;
    const totalCurrent = currentTermRecords.length;
    const attendancePercentageCurrentTerm =
      totalCurrent > 0 ? Math.round((presentCountCurrentTerm / totalCurrent) * 100) : 0;

    const withSession = attendanceRecords
      .map((r) => ({ record: r, session: getSession(r.sessionId) }))
      .filter(
        (x): x is { record: (typeof attendanceRecords)[0]; session: NonNullable<ReturnType<typeof getSession>> } =>
          !!x.session
      )
      .sort((a, b) => (b.session.date > a.session.date ? 1 : -1));

    const recentAttendance = withSession.slice(0, 15).map(({ record, session }) => {
      const cls = getClass(session.classId);
      const status: "present" | "absent" | "late" =
        record.status === "present" || record.status === "late"
          ? "present"
          : record.status === "absent" || record.status === "excused"
            ? "absent"
            : "late";
      return {
        sessionId: session.id,
        date: session.date,
        status,
        className: cls?.name ?? session.classId,
      };
    });

    const enrollments = getEnrollmentsForLearner(learnerId);
    const enrolments = enrollments
      .map((e) => ({
        term: getTerm(e.termId),
        cls: getClass(e.classId),
        status: e.status,
      }))
      .filter((x) => x.term && x.cls)
      .sort((a, b) => (a.term!.startDate > b.term!.startDate ? -1 : 1))
      .map(({ term, cls, status }) => ({
        termName: term!.name,
        className: cls!.name,
        status: mapEnrolmentStatus(status),
      }));

    const profile: LearnerAdminProfile = {
      id: learner.id,
      fullName: `${learner.firstName} ${learner.lastName}`.trim(),
      avatarUrl: avatarUrl ?? undefined,
      dateOfBirth: learner.dateOfBirth ?? null,
      gender: null,

      schoolName: learner.school ?? null,
      organisationName: organisation?.name ?? null,
      programType,
      status,

      totalBadges: badgeAwards.length,
      badgesByType,

      attendancePercentageCurrentTerm,
      presentCountCurrentTerm,
      absentCountCurrentTerm,
      lateCountCurrentTerm,
      recentAttendance,

      enrolments,

      membershipStatus: learner.membershipStatus ?? undefined,
      parentName: learner.parentName ?? undefined,
    };

    return profile;
  }, [
    learner,
    learnerId,
    getEnrollmentsForLearner,
    getByLearner,
    getBadgeAwardsByLearner,
  ]);
}
