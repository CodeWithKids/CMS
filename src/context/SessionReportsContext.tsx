import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type { SessionReport, CoachFeedbackEntry, SessionReportStatus, SessionDuration, SessionType, LearningTrack, ObjectivesMet } from "@/types";
import { mockSessionReports } from "@/mockData";
import {
  isApiEnabled,
  sessionReportsGetAll,
  sessionReportsCreate,
  sessionReportsPatch,
  type SessionReportApi,
} from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

export interface SessionReportFilters {
  dateFrom?: string;
  dateTo?: string;
  program?: string;
  location?: string;
  educatorId?: string;
}

interface SessionReportsContextType {
  reports: SessionReport[];
  getBySession: (sessionId: string) => SessionReport | undefined;
  getReportById: (id: string) => SessionReport | undefined;
  list: (filters?: SessionReportFilters) => SessionReport[];
  saveReport: (report: SessionReport) => void;
  saveCoachFeedback: (sessionId: string, educatorId: string, text: string) => void;
  submitReport: (id: string) => void;
  submitReportBySession: (sessionId: string) => void;
}

const SessionReportsContext = createContext<SessionReportsContextType | undefined>(undefined);

function nextId(existing: SessionReport[]): string {
  const nums = existing
    .map((r) => r.id.replace("sr", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `sr${max + 1}`;
}

function apiToSessionReport(api: SessionReportApi): SessionReport {
  return {
    id: api.id,
    sessionId: api.sessionId,
    status: (api.status as SessionReportStatus) ?? "draft",
    leadEducatorId: api.leadEducatorId,
    assistantEducatorIds: api.assistantEducatorIds ?? [],
    date: api.date,
    duration: (api.duration as SessionDuration) ?? "1_hour",
    sessionType: (api.sessionType as SessionType) ?? "makerspace",
    schoolOrOrganizationName: api.schoolOrOrganizationName ?? "",
    totalLearners: api.totalLearners ?? 0,
    learningTrack: (api.learningTrack as LearningTrack) ?? "computer_basics",
    durationHours: api.durationHours ?? 1,
    femaleCount: api.femaleCount ?? 0,
    maleCount: api.maleCount ?? 0,
    highlights: api.highlights ?? [],
    objectivesMet: (api.objectivesMet as ObjectivesMet) ?? "yes",
    ranAsPlanned: true,
    technicalChallenges: false,
    curriculumAdjustmentsSuggested: false,
    incidentOccurred: false,
    equipmentReturned: true,
    honestyConfirmed: true,
    coachFeedback: [],
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

function reportToSupabasePatch(report: SessionReport): Record<string, unknown> {
  return {
    session_id: report.sessionId,
    status: report.status,
    lead_educator_id: report.leadEducatorId,
    assistant_educator_ids: report.assistantEducatorIds ?? [],
    date: report.date,
    duration: report.duration,
    session_type: report.sessionType,
    school_or_organization_name: report.schoolOrOrganizationName ?? "",
    total_learners: report.totalLearners ?? 0,
    learning_track: report.learningTrack,
    duration_hours: report.durationHours ?? 1,
    female_count: report.femaleCount ?? 0,
    male_count: report.maleCount ?? 0,
    highlights: report.highlights ?? [],
    objectives_met: report.objectivesMet ?? "yes",
    updated_at: new Date().toISOString(),
  };
}

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export function SessionReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<SessionReport[]>(() => [...mockSessionReports]);
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();
  const backendEnabled = supabaseEnabled || apiEnabled;

  useEffect(() => {
    if (!backendEnabled) return;

    let cancelled = false;
    const load = async () => {
      if (supabaseEnabled) {
        const client = getSupabaseClient();
        try {
          const { data, error } = await client.from("session_reports").select("*");
          if (error) throw error;
          const rows = (data as Record<string, unknown>[] | null) ?? [];
          const mapped: SessionReport[] = rows.map((r) =>
            apiToSessionReport({
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
            })
          );
          if (!cancelled) setReports(mapped);
          return;
        } catch {
          if (!isApiEnabled()) return;
        }
      }

      try {
        const list = await sessionReportsGetAll();
        if (!cancelled) setReports(list.map(apiToSessionReport));
      } catch {
        // keep mock fallback if API fails
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [backendEnabled, supabaseEnabled, apiEnabled]);

  const getBySession = useCallback(
    (sessionId: string) => reports.find((r) => r.sessionId === sessionId),
    [reports]
  );

  const getReportById = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports]
  );

  const list = useCallback(
    (filters?: SessionReportFilters): SessionReport[] => {
      let out = [...reports];
      if (!filters) return out;
      if (filters.dateFrom) out = out.filter((r) => r.date >= filters!.dateFrom!);
      if (filters.dateTo) out = out.filter((r) => r.date <= filters!.dateTo!);
      if (filters.educatorId) out = out.filter((r) => r.leadEducatorId === filters!.educatorId);
      return out;
    },
    [reports]
  );

  const saveReport = useCallback((report: SessionReport) => {
    const now = new Date().toISOString();
    const mergeIntoState = (prev: SessionReport[]) => {
      const id = report.id || nextId(prev);
      const existing = prev.find((r) => r.sessionId === report.sessionId);
      const merged: SessionReport = {
        ...report,
        id: existing?.id ?? id,
        updatedAt: now,
        createdAt: existing?.createdAt ?? now,
      };
      const rest = prev.filter((r) => r.sessionId !== report.sessionId);
      return [...rest, merged];
    };

    if (supabaseEnabled) {
      const client = getSupabaseClient();
      const existing = reports.find((r) => r.sessionId === report.sessionId);
      if (existing?.id) {
        client.from("session_reports").update(reportToSupabasePatch(report)).eq("id", existing.id)
          .then(({ error }) => {
            if (error) throw error;
            setReports((prev) =>
              prev.map((r) => (r.id === existing.id ? { ...r, ...report, id: existing.id, updatedAt: now } : r))
            );
          })
          .catch(() => {});
      } else {
        const id = report.id || nextId(reports);
        client.from("session_reports").insert({ id, ...reportToSupabasePatch(report), created_at: now })
          .then(({ error }) => {
            if (error) throw error;
            setReports((prev) => {
              const rest = prev.filter((r) => r.sessionId !== report.sessionId);
              return [...rest, { ...report, id, createdAt: now, updatedAt: now }];
            });
          })
          .catch(() => {});
      }
      return;
    }

    if (apiEnabled) {
      const existing = reports.find((r) => r.sessionId === report.sessionId);
      if (existing?.id) {
        sessionReportsPatch(existing.id, {
          status: report.status,
          assistantEducatorIds: report.assistantEducatorIds,
          date: report.date,
          duration: report.duration,
          totalLearners: report.totalLearners,
          femaleCount: report.femaleCount,
          maleCount: report.maleCount,
          highlights: report.highlights,
          objectivesMet: report.objectivesMet,
        })
          .then((updated) => {
            setReports((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...apiToSessionReport(updated), ...r, coachFeedback: r.coachFeedback } : r))
            );
          })
          .catch(() => {});
      } else {
        sessionReportsCreate({
          sessionId: report.sessionId,
          status: report.status,
          leadEducatorId: report.leadEducatorId,
          assistantEducatorIds: report.assistantEducatorIds,
          date: report.date,
          duration: report.duration,
          sessionType: report.sessionType,
          schoolOrOrganizationName: report.schoolOrOrganizationName,
          totalLearners: report.totalLearners,
          learningTrack: report.learningTrack,
          durationHours: report.durationHours,
          femaleCount: report.femaleCount,
          maleCount: report.maleCount,
          highlights: report.highlights,
          objectivesMet: report.objectivesMet,
        })
          .then((created) => {
            setReports((prev) => [
              ...prev.filter((r) => r.sessionId !== report.sessionId),
              apiToSessionReport(created),
            ]);
          })
          .catch(() => {});
      }
      return;
    }
    setReports(mergeIntoState);
  }, [supabaseEnabled, apiEnabled, reports]);

  const saveCoachFeedback = useCallback((sessionId: string, educatorId: string, text: string) => {
    const now = new Date().toISOString();
    setReports((prev) => {
      const report = prev.find((r) => r.sessionId === sessionId);
      if (!report) return prev;
      const existing = report.coachFeedback ?? [];
      const rest = existing.filter((e) => e.educatorId !== educatorId);
      const entry: CoachFeedbackEntry = { educatorId, text, createdAt: now };
      const updated: SessionReport = { ...report, coachFeedback: [...rest, entry], updatedAt: now };
      return prev.map((r) => (r.sessionId === sessionId ? updated : r));
    });
  }, []);

  const submitReport = useCallback((id: string) => {
    const now = new Date().toISOString();
    if (supabaseEnabled) {
      const report = reports.find((r) => r.id === id);
      if (report) {
        const client = getSupabaseClient();
        client.from("session_reports").update({ status: "submitted", updated_at: now }).eq("id", id)
          .then(({ error }) => {
            if (error) throw error;
            setReports((prev) =>
              prev.map((r) =>
                r.id === id ? { ...r, status: "submitted" as const, submittedAt: now, updatedAt: now } : r
              )
            );
          })
          .catch(() => {});
      }
      return;
    }
    if (apiEnabled) {
      sessionReportsPatch(id, { status: "submitted" }).then((updated) => {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...apiToSessionReport(updated), submittedAt: now, coachFeedback: r.coachFeedback } : r))
        );
      }).catch(() => {});
    }
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "submitted" as const, submittedAt: now, updatedAt: now } : r
      )
    );
  }, [supabaseEnabled, apiEnabled, reports]);

  const submitReportBySession = useCallback(
    (sessionId: string) => {
      const report = reports.find((r) => r.sessionId === sessionId);
      if (report) submitReport(report.id);
    },
    [reports, submitReport]
  );

  const value = useMemo(
    () => ({ reports, getBySession, getReportById, list, saveReport, saveCoachFeedback, submitReport, submitReportBySession }),
    [reports, getBySession, getReportById, list, saveReport, saveCoachFeedback, submitReport, submitReportBySession]
  );

  return (
    <SessionReportsContext.Provider value={value}>
      {children}
    </SessionReportsContext.Provider>
  );
}

export function useSessionReports() {
  const ctx = useContext(SessionReportsContext);
  if (!ctx) throw new Error("useSessionReports must be used within SessionReportsProvider");
  return ctx;
}
