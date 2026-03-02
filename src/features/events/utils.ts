/**
 * Format event start (and optional end) date for display.
 * startDate/endDate are ISO strings (e.g. "2026-04-15T10:00:00.000Z").
 */
export function formatEventDateRange(
  startDate: string,
  endDate?: string | null
): string {
  const start = new Date(startDate);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
  const startStr = start.toLocaleDateString(undefined, opts);
  const startTime = start.toLocaleTimeString(undefined, timeOpts);
  if (!endDate || endDate.slice(0, 10) === startDate.slice(0, 10)) {
    return `${startStr}, ${startTime}`;
  }
  const end = new Date(endDate);
  const endStr = end.toLocaleDateString(undefined, opts);
  const endTime = end.toLocaleTimeString(undefined, timeOpts);
  return `${startStr} ${startTime} – ${endStr} ${endTime}`;
}

export function formatEventDateOnly(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** YYYY-MM-DD for input type="date" */
export function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

/** Generate URL-friendly slug from title */
export function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Summary text for admin list: "X orgs, Y schools, Z miradis" */
export function visibilitySummary(event: { visibility: { allowedOrganisationIds: string[]; allowedSchoolIds: string[]; allowedMiradiIds: string[]; allowedParentIds: string[] } }): string {
  const v = event.visibility;
  const parts: string[] = [];
  if (v.allowedOrganisationIds.length) parts.push(`${v.allowedOrganisationIds.length} orgs`);
  if (v.allowedSchoolIds.length) parts.push(`${v.allowedSchoolIds.length} schools`);
  if (v.allowedMiradiIds.length) parts.push(`${v.allowedMiradiIds.length} miradis`);
  if (v.allowedParentIds.length) parts.push(`${v.allowedParentIds.length} parents`);
  return parts.length ? parts.join(", ") : "Not tagged (internal only)";
}
