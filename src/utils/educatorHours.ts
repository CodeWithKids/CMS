import type { Session } from "@/types";

export interface EducatorHoursSummary {
  educatorId: string;
  termId: string;
  leadHours: number;
  coachingHours: number;
  totalHours: number;
}

/**
 * Aggregate teaching hours per educator per term from sessions.
 * Lead hours = sessions where educator is leadEducatorId; coaching = sessions where in assistantEducatorIds.
 */
export function calculateEducatorHoursByTerm(sessions: Session[]): EducatorHoursSummary[] {
  const byKey = new Map<string, { leadHours: number; coachingHours: number }>();

  for (const session of sessions) {
    const termId = session.termId;
    const hours = session.durationHours;

    if (hours <= 0) continue;

    const leadId = session.leadEducatorId;
    if (leadId) {
      const key = `${leadId}|${termId}`;
      const prev = byKey.get(key) ?? { leadHours: 0, coachingHours: 0 };
      byKey.set(key, { ...prev, leadHours: prev.leadHours + hours });
    }

    for (const assistantId of session.assistantEducatorIds ?? []) {
      if (!assistantId) continue;
      const key = `${assistantId}|${termId}`;
      const prev = byKey.get(key) ?? { leadHours: 0, coachingHours: 0 };
      byKey.set(key, { ...prev, coachingHours: prev.coachingHours + hours });
    }
  }

  const result: EducatorHoursSummary[] = [];
  for (const [key, { leadHours, coachingHours }] of byKey) {
    const [educatorId, termId] = key.split("|");
    result.push({
      educatorId,
      termId,
      leadHours,
      coachingHours,
      totalHours: leadHours + coachingHours,
    });
  }
  return result;
}

export function filterEducatorHoursByTerm(
  summaries: EducatorHoursSummary[],
  termId: string
): EducatorHoursSummary[] {
  return summaries.filter((s) => s.termId === termId);
}
