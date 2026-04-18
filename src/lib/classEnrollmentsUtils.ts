import type { Session, ClassEnrollment, LearningTrack } from "@/types";
import { LEARNING_TRACK_LABELS } from "@/types";

/** Primary learning track for a class (most common in its sessions). */
export function getClassPrimaryTrack(sessions: Session[]): LearningTrack | null {
  if (sessions.length === 0) return null;
  const counts: Partial<Record<LearningTrack, number>> = {};
  for (const s of sessions) {
    counts[s.learningTrack] = (counts[s.learningTrack] ?? 0) + 1;
  }
  const entries = Object.entries(counts) as [LearningTrack, number][];
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function getClassTrackLabel(sessions: Session[]): string {
  const track = getClassPrimaryTrack(sessions);
  return track ? LEARNING_TRACK_LABELS[track] : "—";
}

/** Attendance % for a learner in the given sessions (present or late = attended). */
export function getAttendancePctForLearnerInClass(
  learnerId: string,
  sessionIds: string[],
  getBySession: (sessionId: string) => { learnerId: string; status: string }[]
): number | null {
  if (sessionIds.length === 0) return null;
  let present = 0;
  for (const sid of sessionIds) {
    const records = getBySession(sid).filter((r) => r.learnerId === learnerId);
    if (records.length === 0) continue;
    const attended = records.some((r) => r.status === "present" || r.status === "late");
    if (attended) present++;
  }
  return Math.round((present / sessionIds.length) * 100);
}

/** Parse "HH:MM" to minutes for overlap check. */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function sessionsOverlap(a: Session, b: Session): boolean {
  if (a.date !== b.date) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && aEnd > bStart;
}

/** If learner is active in another class this term with overlapping session time, return that class name. */
export function getConflictOtherClassName(
  learnerId: string,
  classId: string,
  termId: string,
  enrollments: ClassEnrollment[],
  getClass: (id: string) => { name: string } | undefined,
  getSessionsForClass: (id: string) => Session[]
): string | null {
  const currentSessions = getSessionsForClass(classId).filter((s) => s.termId === termId);
  const otherEnrollments = enrollments.filter(
    (e) => e.learnerId === learnerId && e.termId === termId && e.status === "active" && e.classId !== classId
  );
  for (const e of otherEnrollments) {
    const otherSessions = getSessionsForClass(e.classId).filter((s) => s.termId === termId);
    for (const s1 of currentSessions) {
      for (const s2 of otherSessions) {
        if (sessionsOverlap(s1, s2)) {
          const cls = getClass(e.classId);
          return cls?.name ?? e.classId;
        }
      }
    }
  }
  return null;
}

/** Count badge awards for learner in the given session IDs. */
export function getBadgeCountInClassSessions(
  learnerId: string,
  sessionIds: string[],
  getBySession: (sessionId: string) => { learnerId: string }[]
): number {
  let count = 0;
  for (const sid of sessionIds) {
    count += getBySession(sid).filter((r) => r.learnerId === learnerId).length;
  }
  return count;
}
