/**
 * Session reports list from API when VITE_API_URL is set.
 * Returns SessionReportSummary-like rows for the admin session reports table.
 */
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { SessionReportSummary, SessionReportSessionTypeAdmin, SessionReportStatusAdmin } from "@/types";
import { toSessionReportSessionTypeAdmin } from "@/types";
import {
  isApiEnabled,
  sessionReportsGetAll,
  sessionsGetAll,
  classesGetAll,
  educatorsGetAll,
} from "@/lib/api";

function mapSessionType(s: string): SessionReportSessionTypeAdmin {
  const mapped = toSessionReportSessionTypeAdmin(s as import("@/types").SessionType);
  return mapped ?? "MAKERSPACE";
}

export function useSessionReportsList(params: { dateFrom?: string; dateTo?: string }): {
  summaries: SessionReportSummary[];
  isLoading: boolean;
} {
  const enabled = isApiEnabled();
  const dateFrom = params.dateFrom || "2000-01-01";
  const dateTo = params.dateTo || "2099-12-31";

  const reportsQuery = useQuery({
    queryKey: ["session-reports", dateFrom, dateTo],
    queryFn: () => sessionReportsGetAll({ dateFrom, dateTo }),
    enabled,
  });
  const sessionsQuery = useQuery({
    queryKey: ["sessions", dateFrom, dateTo],
    queryFn: () => sessionsGetAll({ dateFrom, dateTo }),
    enabled,
  });
  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => classesGetAll(),
    enabled,
  });
  const educatorsQuery = useQuery({
    queryKey: ["educators"],
    queryFn: () => educatorsGetAll(),
    enabled,
  });

  const summaries = useMemo(() => {
    if (!enabled || !reportsQuery.data || !sessionsQuery.data || !classesQuery.data || !educatorsQuery.data) {
      return [];
    }
    const reports = reportsQuery.data;
    const sessions = sessionsQuery.data;
    const classes = classesQuery.data;
    const educators = educatorsQuery.data;
    const educatorNameMap = new Map(educators.map((e) => [e.id, e.name]));
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));
    const classMap = new Map(classes.map((c) => [c.id, c]));

    const reportSessionIds = new Set(reports.map((r) => r.sessionId));
    const missingSessions = sessions.filter((s) => !reportSessionIds.has(s.id));

    const fromReports: SessionReportSummary[] = reports.map((r) => {
      const session = sessionMap.get(r.sessionId);
      const cls = session ? classMap.get(session.classId) : null;
      return {
        id: r.id,
        sessionId: r.sessionId,
        sessionDate: r.date,
        sessionType: mapSessionType(r.sessionType),
        organisationName: r.schoolOrOrganizationName ?? "—",
        className: cls?.name ?? "—",
        leadEducatorName: educatorNameMap.get(r.leadEducatorId) ?? "—",
        presentCount: 0,
        totalLearners: r.totalLearners ?? 0,
        engagementRating: null,
        status: (r.status === "submitted" ? "SUBMITTED" : "MISSING") as SessionReportStatusAdmin,
      };
    });

    const fromMissing: SessionReportSummary[] = missingSessions.map((s) => {
      const cls = classMap.get(s.classId);
      return {
        id: `missing-${s.id}`,
        sessionId: s.id,
        sessionDate: s.date,
        sessionType: mapSessionType(s.sessionType),
        organisationName: "—",
        className: cls?.name ?? "—",
        leadEducatorName: educatorNameMap.get(s.leadEducatorId) ?? "—",
        presentCount: 0,
        totalLearners: 0,
        engagementRating: null,
        status: "MISSING" as SessionReportStatusAdmin,
      };
    });

    const combined = [...fromReports, ...fromMissing];
    return combined.sort((a, b) => (b.sessionDate > a.sessionDate ? 1 : -1));
  }, [
    enabled,
    reportsQuery.data,
    sessionsQuery.data,
    classesQuery.data,
    educatorsQuery.data,
  ]);

  const isLoading =
    enabled &&
    (reportsQuery.isLoading || sessionsQuery.isLoading || classesQuery.isLoading || educatorsQuery.isLoading);

  return { summaries, isLoading };
}
