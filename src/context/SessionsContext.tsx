import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Session } from "@/types";
import { mockSessions } from "@/mockData";

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

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(() => [...mockSessions]);

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
