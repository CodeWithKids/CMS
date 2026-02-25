import type {
  Organization,
  Learner,
  Session,
  SessionReport,
  ClassEnrollment,
  AdminOverviewSummary,
  OrganisationOverviewType,
  LearningTrack,
} from "@/types";
import { LEARNING_TRACK_LABELS } from "@/types";

/** Derive overview type from organisation (SCHOOL, ORGANISATION, MIRADI). */
export function getOrganisationOverviewType(org: Organization): OrganisationOverviewType {
  if (org.overviewType) return org.overviewType;
  if (org.type === "school") return "SCHOOL";
  if (org.name.toLowerCase().includes("miradi")) return "MIRADI";
  return "ORGANISATION";
}

function isOrganisationActive(org: Organization): boolean {
  return org.status !== "INACTIVE";
}

/**
 * Build admin overview summary: active partners (schools, organisations, Miradi) and learners by track.
 *
 * Track counts: computed from Learner.learningTrackId when set; where missing, inferred from
 * recent educator session reports (or session.learningTrack) for that learner via class enrollments.
 * Replace this with GET /api/admin/overview when the backend is available.
 */
export function getAdminOverviewSummary(
  organizations: Organization[],
  learners: Learner[],
  sessions: Session[],
  sessionReports: SessionReport[],
  enrollments: ClassEnrollment[]
): AdminOverviewSummary {
  const reportsBySessionId = new Map(sessionReports.map((r) => [r.sessionId, r]));
  const sessionsByClassId = new Map<string, Session[]>();
  for (const s of sessions) {
    const list = sessionsByClassId.get(s.classId) ?? [];
    list.push(s);
    sessionsByClassId.set(s.classId, list);
  }

  const activeLearners = learners.filter((l) => l.status === "active");

  /** Infer learning track for a learner from sessions they attended (via enrollments). Uses Session.learningTrack; if a session has a report, use report.learningTrack. */
  function inferLearningTrack(learnerId: string): LearningTrack | null {
    const learnerEnrollments = enrollments.filter(
      (e) => e.learnerId === learnerId && e.status === "active"
    );
    const classIds = new Set(learnerEnrollments.map((e) => e.classId));
    const trackCounts: Partial<Record<LearningTrack, number>> = {};
    for (const classId of classIds) {
      const classSessions = sessionsByClassId.get(classId) ?? [];
      for (const session of classSessions) {
        const report = reportsBySessionId.get(session.id);
        const track = report?.learningTrack ?? session.learningTrack;
        trackCounts[track] = (trackCounts[track] ?? 0) + 1;
      }
    }
    const entries = Object.entries(trackCounts) as [LearningTrack, number][];
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  const activeByOrg = new Map<string, number>();
  for (const l of activeLearners) {
    if (l.organizationId) {
      activeByOrg.set(l.organizationId, (activeByOrg.get(l.organizationId) ?? 0) + 1);
    }
  }

  let activeSchools = 0;
  let activeOrganisations = 0;
  let activeMiradis = 0;

  const partners: AdminOverviewSummary["partners"] = [];

  for (const org of organizations) {
    if (!isOrganisationActive(org)) continue;
    const type = getOrganisationOverviewType(org);
    if (type === "SCHOOL") activeSchools += 1;
    else if (type === "ORGANISATION") activeOrganisations += 1;
    else activeMiradis += 1;

    partners.push({
      organisationId: org.id,
      organisationName: org.name,
      type,
      activeLearners: activeByOrg.get(org.id) ?? 0,
    });
  }

  const trackCounts = new Map<LearningTrack, number>();
  const allTracks = Object.keys(LEARNING_TRACK_LABELS) as LearningTrack[];
  for (const t of allTracks) trackCounts.set(t, 0);

  for (const l of activeLearners) {
    const track = l.learningTrackId ?? inferLearningTrack(l.id);
    if (track) trackCounts.set(track, (trackCounts.get(track) ?? 0) + 1);
  }

  const learnersByTrack: AdminOverviewSummary["learnersByTrack"] = allTracks.map((learningTrackId) => ({
    learningTrackId,
    learningTrackName: LEARNING_TRACK_LABELS[learningTrackId],
    learnerCount: trackCounts.get(learningTrackId) ?? 0,
  }));

  return {
    activeSchools,
    activeOrganisations,
    activeMiradis,
    partners,
    learnersByTrack,
  };
}
