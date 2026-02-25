import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { SessionReport, CoachFeedbackEntry } from "@/types";
import { mockSessionReports } from "@/mockData";

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

export function SessionReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<SessionReport[]>(() => [...mockSessionReports]);

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
      // program/location require joining to session/class; we can add when we have getSession/getClass in context or pass sessions/classes
      return out;
    },
    [reports]
  );

  const saveReport = useCallback((report: SessionReport) => {
    const now = new Date().toISOString();
    setReports((prev) => {
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
    });
  }, []);

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
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "submitted" as const, submittedAt: now, updatedAt: now } : r
      )
    );
  }, []);

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
