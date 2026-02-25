import type {
  SessionReport,
  Session,
  ClassEntity,
  SessionReportSummary,
  SessionReportDetailView,
  SessionReportStatusAdmin,
  LearnerBadgeAward,
} from "@/types";
import { toSessionReportSessionTypeAdmin } from "@/types";

export type GetSession = (sessionId: string) => Session | undefined;
export type GetClass = (classId: string) => ClassEntity | undefined;
export type GetEducatorName = (educatorId: string) => string;

function deriveStatus(report: SessionReport): SessionReportStatusAdmin {
  if (report.status === "submitted" && report.incidentOccurred) return "FLAGGED";
  if (report.status === "submitted") return "SUBMITTED";
  return "MISSING";
}

/** Build one list row from a stored SessionReport + session/class/educator and present count. */
export function buildSessionReportSummary(
  report: SessionReport,
  getSession: GetSession,
  getClass: GetClass,
  getEducatorName: GetEducatorName,
  presentCount: number
): SessionReportSummary {
  const session = getSession(report.sessionId);
  const cls = session ? getClass(session.classId) : undefined;
  return {
    id: report.id,
    sessionId: report.sessionId,
    sessionDate: report.date,
    sessionType: toSessionReportSessionTypeAdmin(report.sessionType),
    organisationName: report.schoolOrOrganizationName,
    className: cls?.name ?? report.sessionId,
    leadEducatorName: getEducatorName(report.leadEducatorId),
    presentCount,
    totalLearners: report.totalLearners,
    engagementRating: report.engagementLevel ?? null,
    status: deriveStatus(report),
  };
}

/** Build a "missing" row for a session that has no report (or only draft). */
export function buildMissingSessionSummary(
  session: Session,
  getClass: GetClass,
  getEducatorName: GetEducatorName,
  presentCount: number
): SessionReportSummary {
  const cls = getClass(session.classId);
  return {
    id: `missing-${session.id}`,
    sessionId: session.id,
    sessionDate: session.date,
    sessionType: toSessionReportSessionTypeAdmin(session.sessionType),
    organisationName: "—", // not in session; fill from class/org when available
    className: cls?.name ?? session.classId,
    leadEducatorName: getEducatorName(session.leadEducatorId),
    presentCount,
    totalLearners: 0,
    engagementRating: null,
    status: "MISSING",
  };
}

/** Build detail view from summary + report + badge awards for that session. Optional starsFromAttendance = sum of stars from attendance records. */
export function buildSessionReportDetailView(
  summary: SessionReportSummary,
  report: SessionReport,
  getBadgeAwardsBySession: (sessionId: string) => LearnerBadgeAward[],
  starsFromAttendance?: number
): SessionReportDetailView {
  const awards = getBadgeAwardsBySession(report.sessionId);
  const badgesSummary: Record<string, number> = {};
  for (const a of awards) {
    badgesSummary[a.badgeId] = (badgesSummary[a.badgeId] ?? 0) + 1;
  }
  const starsGiven = starsFromAttendance ?? 0;

  const notesParts: string[] = [];
  if (report.ranAsPlannedNotes) notesParts.push(report.ranAsPlannedNotes);
  if (report.highlights?.length) notesParts.push(...report.highlights);
  if (report.exceptionalLearnersNotes) notesParts.push(report.exceptionalLearnersNotes);
  const notes = notesParts.length ? notesParts.join("\n\n") : null;

  const challengesParts: string[] = [];
  if (report.technicalChallenges && report.technicalChallengesDescription)
    challengesParts.push(report.technicalChallengesDescription);
  if (report.curriculumAdjustmentsSuggested && report.curriculumAdjustmentsDescription)
    challengesParts.push(report.curriculumAdjustmentsDescription);
  const challenges = challengesParts.length ? challengesParts.join("\n\n") : null;

  return {
    ...summary,
    notes: notes ?? null,
    challenges: challenges ?? null,
    starsGiven,
    badgesSummary: Object.keys(badgesSummary).length ? badgesSummary : undefined,
    incidents: report.incidentOccurred ? (report.incidentFollowUp ?? "Incident noted.") : null,
    followUpActions: report.incidentFollowUp ?? null,
  };
}
