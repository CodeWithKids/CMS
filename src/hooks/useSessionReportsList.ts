/**
 * Session reports list from Supabase when configured, otherwise API.
 * Returns SessionReportSummary-like rows for the admin session reports table.
 */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { SessionReportSummary, SessionReportSessionTypeAdmin, SessionReportStatusAdmin } from "@/types";
import { toSessionReportSessionTypeAdmin } from "@/types";
import { isApiEnabled, sessionReportsGetAll, sessionsGetAll, classesGetAll, educatorsGetAll, type SessionApi, type SessionReportApi, type EducatorApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { mapSupabaseRowToClassApi, type SupabaseClassRow } from "@/lib/classesSupabase";

function mapSessionType(s: string): SessionReportSessionTypeAdmin {
  const mapped = toSessionReportSessionTypeAdmin(s as import("@/types").SessionType);
  return mapped ?? "MAKERSPACE";
}

export function useSessionReportsList(params: { dateFrom?: string; dateTo?: string }): {
  summaries: SessionReportSummary[];
  isLoading: boolean;
} {
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();
  const enabled = supabaseEnabled || apiEnabled;
  const dateFrom = params.dateFrom || "2000-01-01";
  const dateTo = params.dateTo || "2099-12-31";

  const reportsQuery = useQuery({
    queryKey: ["session-reports", dateFrom, dateTo],
    queryFn: async (): Promise<SessionReportApi[]> => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase
            .from("session_reports")
            .select("*")
            .gte("date", dateFrom)
            .lte("date", dateTo);
          if (error) throw error;
          const rows = (data as Record<string, unknown>[] | null) ?? [];
          return rows.map((r) => ({
            id: String(r.id ?? ""),
            sessionId: String(r.session_id ?? r.sessionId ?? ""),
            status: String(r.status ?? "draft"),
            leadEducatorId: String(r.lead_educator_id ?? r.leadEducatorId ?? ""),
            assistantEducatorIds: Array.isArray(r.assistant_educator_ids ?? r.assistantEducatorIds)
              ? ((r.assistant_educator_ids ?? r.assistantEducatorIds) as string[])
              : [],
            date: String(r.date ?? ""),
            duration: String(r.duration ?? "1_hour"),
            sessionType: String(r.session_type ?? r.sessionType ?? "makerspace"),
            schoolOrOrganizationName: String(r.school_or_organization_name ?? r.schoolOrOrganizationName ?? ""),
            totalLearners: Number(r.total_learners ?? r.totalLearners ?? 0),
            learningTrack: String(r.learning_track ?? r.learningTrack ?? "computer_basics"),
            durationHours: Number(r.duration_hours ?? r.durationHours ?? 1),
            femaleCount: Number(r.female_count ?? r.femaleCount ?? 0),
            maleCount: Number(r.male_count ?? r.maleCount ?? 0),
            highlights: Array.isArray(r.highlights) ? (r.highlights as string[]) : [],
            objectivesMet: String(r.objectives_met ?? r.objectivesMet ?? "yes"),
            createdAt: typeof r.created_at === "string" ? r.created_at : undefined,
            updatedAt: typeof r.updated_at === "string" ? r.updated_at : undefined,
          }));
        } catch {
          if (isApiEnabled()) return sessionReportsGetAll({ dateFrom, dateTo });
          return [];
        }
      }
      return sessionReportsGetAll({ dateFrom, dateTo });
    },
    enabled,
  });
  const sessionsQuery = useQuery({
    queryKey: ["sessions", dateFrom, dateTo],
    queryFn: async (): Promise<SessionApi[]> => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase
            .from("sessions")
            .select("*")
            .gte("date", dateFrom)
            .lte("date", dateTo);
          if (error) throw error;
          const rows = (data as Record<string, unknown>[] | null) ?? [];
          return rows.map((r) => ({
            id: String(r.id ?? ""),
            classId: String(r.class_id ?? r.classId ?? ""),
            date: String(r.date ?? ""),
            startTime: String(r.start_time ?? r.startTime ?? "00:00"),
            endTime: String(r.end_time ?? r.endTime ?? "00:00"),
            topic: String(r.topic ?? ""),
            sessionType: String(r.session_type ?? r.sessionType ?? "makerspace"),
            durationHours: Number(r.duration_hours ?? r.durationHours ?? 1),
            learningTrack: String(r.learning_track ?? r.learningTrack ?? "computer_basics"),
            termId: String(r.term_id ?? r.termId ?? ""),
            leadEducatorId: String(r.lead_educator_id ?? r.leadEducatorId ?? ""),
            assistantEducatorIds: Array.isArray(r.assistant_educator_ids ?? r.assistantEducatorIds)
              ? ((r.assistant_educator_ids ?? r.assistantEducatorIds) as string[])
              : [],
          }));
        } catch {
          if (isApiEnabled()) return sessionsGetAll({ dateFrom, dateTo });
          return [];
        }
      }
      return sessionsGetAll({ dateFrom, dateTo });
    },
    enabled,
  });
  const classesQuery = useQuery({
    queryKey: ["classes", "", "", "", ""],
    queryFn: async () => {
      if (isSupabaseEnabled() && supabase) {
        try {
          const { data, error } = await supabase.from("classes").select("*");
          if (error) throw error;
          return ((data as SupabaseClassRow[] | null) ?? []).map(mapSupabaseRowToClassApi);
        } catch {
          if (isApiEnabled()) return classesGetAll();
          return [];
        }
      }
      return classesGetAll();
    },
    enabled,
  });
  const educatorsQuery = useQuery({
    queryKey: ["educators"],
    queryFn: async (): Promise<EducatorApi[]> => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .in("role", ["admin", "educator", "finance", "ld_manager"]);
          if (error) throw error;
          const rows = (data as Record<string, unknown>[] | null) ?? [];
          return rows.map((r) => ({
            id: String(r.id ?? ""),
            name: String(r.name ?? (typeof r.email === "string" ? r.email.split("@")[0] : "CWK User")),
            email: typeof r.email === "string" ? r.email : null,
            role: String(r.role ?? "educator"),
            status: typeof r.status === "string" ? r.status : null,
            organizationId: typeof r.organization_id === "string" ? r.organization_id : null,
            membershipStatus: typeof r.membership_status === "string" ? r.membership_status : null,
            avatarId: typeof r.avatar_id === "string" ? r.avatar_id : null,
            createdAt: typeof r.created_at === "string" ? r.created_at : new Date().toISOString(),
          }));
        } catch {
          if (isApiEnabled()) return educatorsGetAll();
          return [];
        }
      }
      return educatorsGetAll();
    },
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
