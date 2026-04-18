import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type { Session } from "@/types";
import { mockSessions } from "@/mockData";
import { isApiEnabled, sessionsGetAll, type SessionApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

const today = new Date().toISOString().split("T")[0];

interface SessionsContextType {
  sessions: Session[];
  getSessionById: (sessionId: string) => Session | undefined;
  getSessionsForEducator: (educatorId: string) => Session[];
  getSessionsForEducatorByRole: (
    educatorId: string,
    opts: { date?: string; from?: string; to?: string; past?: boolean }
  ) => Session[];
  getSessionsForClass: (classId: string) => Session[];
  updateSession: (sessionId: string, partial: Partial<Session>) => void;
}

const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

type SupabaseSessionRow = {
  id: string;
  class_id?: string | null;
  classId?: string | null;
  date: string;
  start_time?: string | null;
  startTime?: string | null;
  end_time?: string | null;
  endTime?: string | null;
  topic?: string | null;
  session_type?: string | null;
  sessionType?: string | null;
  duration_hours?: number | null;
  durationHours?: number | null;
  learning_track?: string | null;
  learningTrack?: string | null;
  term_id?: string | null;
  termId?: string | null;
  lead_educator_id?: string | null;
  leadEducatorId?: string | null;
  assistant_educator_ids?: string[] | null;
  assistantEducatorIds?: string[] | null;
};

function mapSessionApiToSession(s: SessionApi): Session {
  return {
    id: s.id,
    classId: s.classId,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    topic: s.topic,
    sessionType: s.sessionType as Session["sessionType"],
    duration: "1_hour",
    learningTrack: s.learningTrack as Session["learningTrack"],
    termId: s.termId,
    leadEducatorId: s.leadEducatorId,
    assistantEducatorIds: s.assistantEducatorIds ?? [],
    durationHours: s.durationHours ?? 1,
  };
}

function mapSupabaseRowToSession(row: SupabaseSessionRow): Session {
  const durationHours = row.duration_hours ?? row.durationHours ?? 1;
  const inferredDuration: Session["duration"] =
    durationHours >= 8 ? "full_day" : durationHours >= 4 ? "4_hours" : durationHours >= 3 ? "3_hours" : durationHours >= 2 ? "2_hours" : "1_hour";
  return {
    id: row.id,
    classId: row.class_id ?? row.classId ?? "",
    date: row.date,
    startTime: row.start_time ?? row.startTime ?? "00:00",
    endTime: row.end_time ?? row.endTime ?? "00:00",
    topic: row.topic ?? "",
    sessionType: (row.session_type ?? row.sessionType ?? "makerspace") as Session["sessionType"],
    duration: inferredDuration,
    learningTrack: (row.learning_track ?? row.learningTrack ?? "computer_basics") as Session["learningTrack"],
    termId: row.term_id ?? row.termId ?? "",
    leadEducatorId: row.lead_educator_id ?? row.leadEducatorId ?? "",
    assistantEducatorIds: row.assistant_educator_ids ?? row.assistantEducatorIds ?? [],
    durationHours,
  };
}

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(() => [...mockSessions]);
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();

  useEffect(() => {
    if (!supabaseEnabled && !apiEnabled) return;

    let cancelled = false;
    const load = async () => {
      if (supabaseEnabled) {
        const client = getSupabaseClient();
        try {
          const { data, error } = await client.from("sessions").select("*");
          if (error) throw error;
          const mapped = ((data as SupabaseSessionRow[] | null) ?? []).map(mapSupabaseRowToSession);
          if (!cancelled) setSessions(mapped);
          return;
        } catch {
          if (!isApiEnabled()) return;
        }
      }

      try {
        const list = await sessionsGetAll();
        if (!cancelled) setSessions(list.map(mapSessionApiToSession));
      } catch {
        // keep current in-memory fallback
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled, apiEnabled]);

  const getSessionById = useCallback(
    (sessionId: string) => sessions.find((s) => s.id === sessionId),
    [sessions]
  );

  const getSessionsForEducator = useCallback(
    (educatorId: string) =>
      sessions.filter(
        (s) =>
          s.leadEducatorId === educatorId ||
          (s.assistantEducatorIds ?? []).includes(educatorId)
      ),
    [sessions]
  );

  const getSessionsForEducatorByRole = useCallback(
    (
      educatorId: string,
      opts: { date?: string; from?: string; to?: string; past?: boolean }
    ) => {
      let list = sessions.filter(
        (s) =>
          s.leadEducatorId === educatorId ||
          (s.assistantEducatorIds ?? []).includes(educatorId)
      );
      if (opts.date) list = list.filter((s) => s.date === opts.date);
      if (opts.from) list = list.filter((s) => s.date >= opts.from!);
      if (opts.to) list = list.filter((s) => s.date <= opts.to!);
      if (opts.past) {
        list = list.filter((s) => s.date < today).sort((a, b) => b.date.localeCompare(a.date));
      } else if (opts.from ?? opts.to ?? opts.date) {
        list = [...list].sort((a, b) => a.date.localeCompare(b.date));
      }
      return list;
    },
    [sessions]
  );

  const getSessionsForClass = useCallback(
    (classId: string) => sessions.filter((s) => s.classId === classId),
    [sessions]
  );

  const updateSession = useCallback((sessionId: string, partial: Partial<Session>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...partial } : s))
    );
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      getSessionById,
      getSessionsForEducator,
      getSessionsForEducatorByRole,
      getSessionsForClass,
      updateSession,
    }),
    [
      sessions,
      getSessionById,
      getSessionsForEducator,
      getSessionsForEducatorByRole,
      getSessionsForClass,
      updateSession,
    ]
  );

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  );
}

export function useSessions() {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error("useSessions must be used within SessionsProvider");
  return ctx;
}
