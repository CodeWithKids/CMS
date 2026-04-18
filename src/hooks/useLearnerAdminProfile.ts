import { useMemo } from "react";
import type { LearnerAdminProfile, LearnerAdminEnrolmentStatus } from "@/types";
import { getDemoLoginUsers } from "@/lib/demoLoginUsers";
import { getPresetAvatar } from "@/data/presetAvatars";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";
import { useSessions } from "@/context/SessionsContext";
import { useLearners } from "@/hooks/useLearners";
import { useTerms } from "@/hooks/useTerms";
import { useClasses } from "@/hooks/useClasses";
import { useOrganisation } from "@/hooks/useOrganisation";

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
 *
 * Data is composed from learners, terms, classes, sessions contexts/hooks plus
 * attendance, enrolments, and badges. Organisation name uses `useOrganisation`.
 * Demo avatar for linked accounts uses seeded demo users when auth backends are off.
 */
export function useLearnerAdminProfile(learnerId: string | undefined): LearnerAdminProfile | null {
  const { learners } = useLearners();
  const learner = useMemo(
    () => (learnerId ? learners.find((l) => l.id === learnerId) : undefined),
    [learnerId, learners]
  );

  const { terms, currentTerm } = useTerms();
  const { sessions, getSessionById } = useSessions();
  const { classes } = useClasses();
  const { organisation } = useOrganisation(learner?.organizationId ?? null);

  const { getEnrollmentsForLearner } = useEnrollments();
  const { getByLearner } = useAttendance();
  const { getByLearner: getBadgeAwardsByLearner } = useBadgeAwards();

  const termById = useMemo(() => new Map(terms.map((t) => [t.id, t])), [terms]);
  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

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

    const organisationName = organisation?.name ?? null;

    let avatarUrl: string | null = null;
    if (learner.userId) {
      const demoUser = getDemoLoginUsers().find((u) => u.id === learner.userId);
      if (demoUser?.avatarId) {
        avatarUrl = getPresetAvatar(demoUser.avatarId)?.imageUrl ?? null;
      }
    }

    const badgeAwards = getBadgeAwardsByLearner(learnerId);
    const badgesByType: Record<string, number> = {};
    for (const a of badgeAwards) {
      badgesByType[a.badgeId] = (badgesByType[a.badgeId] ?? 0) + 1;
    }

    const currentTermSessionIds = currentTerm
      ? new Set(sessions.filter((s) => s.termId === currentTerm.id).map((s) => s.id))
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
      .map((r) => ({ record: r, session: getSessionById(r.sessionId) }))
      .filter(
        (x): x is { record: (typeof attendanceRecords)[0]; session: NonNullable<ReturnType<typeof getSessionById>> } =>
          !!x.session
      )
      .sort((a, b) => (b.session.date > a.session.date ? 1 : -1));

    const recentAttendance = withSession.slice(0, 15).map(({ record, session }) => {
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
        className: classNameById.get(session.classId) ?? session.classId,
      };
    });

    const enrollmentRows = getEnrollmentsForLearner(learnerId);
    const enrolments = enrollmentRows
      .map((e) => ({
        term: termById.get(e.termId),
        className: classNameById.get(e.classId),
        status: e.status,
      }))
      .filter(
        (
          x
        ): x is {
          term: NonNullable<ReturnType<typeof termById.get>>;
          className: string;
          status: (typeof enrollmentRows)[0]["status"];
        } => !!x.term && !!x.className
      )
      .sort((a, b) => ((a.term.startDate ?? "") > (b.term.startDate ?? "") ? -1 : 1))
      .map(({ term, className, status }) => ({
        termName: term.name,
        className,
        status: mapEnrolmentStatus(status),
      }));

    const profile: LearnerAdminProfile = {
      id: learner.id,
      fullName: `${learner.firstName} ${learner.lastName}`.trim(),
      avatarUrl: avatarUrl ?? undefined,
      joinedAt: learner.joinedAt ?? null,
      gender: learner.gender ?? null,

      schoolName: learner.school ?? null,
      organisationName,
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
    getSessionById,
    sessions,
    currentTerm,
    termById,
    classNameById,
    organisation,
  ]);
}
