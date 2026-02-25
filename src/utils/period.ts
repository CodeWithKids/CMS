import { getCurrentTerm } from "@/mockData";

/** Session date (YYYY-MM-DD) falls within the current term's start/end. */
export function isInCurrentTerm(sessionDate: string): boolean {
  const term = getCurrentTerm();
  if (!term) return false;
  return sessionDate >= term.startDate && sessionDate <= term.endDate;
}

/** Session date is in the current calendar year. */
export function isInCurrentYear(sessionDate: string): boolean {
  const year = new Date().getFullYear();
  return new Date(sessionDate).getFullYear() === year;
}

export type PeriodFilter = "this_term" | "this_year" | "all_time";

/** Filter sessions by period. */
export function filterSessionsByPeriod<T extends { date: string }>(
  sessions: T[],
  period: PeriodFilter
): T[] {
  if (period === "all_time") return sessions;
  if (period === "this_term") return sessions.filter((s) => isInCurrentTerm(s.date));
  return sessions.filter((s) => isInCurrentYear(s.date));
}
