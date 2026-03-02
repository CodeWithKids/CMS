/**
 * Compulsory blocks shown on everyone's calendar by default.
 * - Monday 9:00–10:00: Team meeting (every week)
 * - Thursday 9:00–10:00: Educators meeting (bi-weekly)
 */

/** ISO week number (1–53) for a given date. */
export function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7; // Mon=1 .. Sun=7
  d.setDate(d.getDate() + 4 - day);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return 1 + Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() - 1) / 7);
}

/** True if the date is a Thursday in an odd ISO week (1, 3, 5, …) — bi-weekly educators meeting. */
export function isBiWeeklyThursday(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00");
  if (d.getDay() !== 4) return false; // 4 = Thursday
  return getISOWeek(d) % 2 === 1;
}

export const COMPULSORY_TEAM_MEETING = {
  dayOfWeek: 0, // Monday
  startTime: "09:00",
  endTime: "10:00",
  label: "Team meeting (compulsory)",
} as const;

export const COMPULSORY_EDUCATORS_MEETING = {
  dayOfWeek: 3, // Thursday
  startTime: "09:00",
  endTime: "10:00",
  label: "Educators meeting (compulsory, bi-weekly)",
} as const;

/** Check if a given date and time falls in the Monday team meeting block. */
export function isTeamMeetingSlot(dateStr: string, startTime: string, endTime: string): boolean {
  const d = new Date(dateStr + "T12:00:00");
  const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0
  if (dayOfWeek !== COMPULSORY_TEAM_MEETING.dayOfWeek) return false;
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  const blockStart = timeToMinutes(COMPULSORY_TEAM_MEETING.startTime);
  const blockEnd = timeToMinutes(COMPULSORY_TEAM_MEETING.endTime);
  return s < blockEnd && e > blockStart;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Check if a given date and time falls in the bi-weekly Thursday educators meeting block. */
export function isEducatorsMeetingSlot(dateStr: string, startTime: string, endTime: string): boolean {
  if (!isBiWeeklyThursday(dateStr)) return false;
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  const blockStart = timeToMinutes(COMPULSORY_EDUCATORS_MEETING.startTime);
  const blockEnd = timeToMinutes(COMPULSORY_EDUCATORS_MEETING.endTime);
  return s < blockEnd && e > blockStart;
}
