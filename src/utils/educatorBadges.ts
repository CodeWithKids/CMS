import type { Session } from "@/types";
import type { EducatorBadge } from "@/types";
import type { LearningTrack } from "@/types";
import { LEARNING_TRACK_LABELS } from "@/types";

const MIN_SESSIONS_FOR_MASTER = 5;
const MIN_HOURS_FOR_MASTER = 10;

/**
 * Compute educator badges from sessions where they are facilitator.
 * Groups by track, counts sessions and hours, applies simple rules (e.g. Python Master).
 */
export function computeEducatorBadges(
  educatorId: string,
  sessions: Session[]
): EducatorBadge[] {
  const asFacilitator = sessions.filter((s) => s.leadEducatorId === educatorId);
  const byTrack = new Map<LearningTrack, { sessions: number; hours: number; latestDate: string }>();

  for (const s of asFacilitator) {
    const t = s.learningTrack;
    const h = s.durationHours ?? 1;
    const cur = byTrack.get(t) ?? { sessions: 0, hours: 0, latestDate: s.date };
    byTrack.set(t, {
      sessions: cur.sessions + 1,
      hours: cur.hours + h,
      latestDate: s.date > cur.latestDate ? s.date : cur.latestDate,
    });
  }

  const badges: EducatorBadge[] = [];
  for (const [track, data] of byTrack.entries()) {
    if (
      data.sessions >= MIN_SESSIONS_FOR_MASTER &&
      data.hours >= MIN_HOURS_FOR_MASTER
    ) {
      const trackLabel = LEARNING_TRACK_LABELS[track] ?? track;
      badges.push({
        id: `computed-${track}-${educatorId}`,
        educatorId,
        trackId: track,
        name: `${trackLabel} Master`,
        description: `${data.sessions}+ sessions and ${data.hours}+ hours in ${trackLabel}`,
        earnedAt: data.latestDate,
      });
    }
  }
  return badges;
}
