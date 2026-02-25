import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { AttendanceRecord } from "@/types";

interface AttendanceContextType {
  records: AttendanceRecord[];
  getBySession: (sessionId: string) => AttendanceRecord[];
  getByLearner: (learnerId: string) => AttendanceRecord[];
  setRecord: (record: AttendanceRecord) => void;
  markAllPresent: (
    sessionId: string,
    learnerIds: string[],
    markedBy: string
  ) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const getBySession = useCallback(
    (sessionId: string) =>
      records.filter((r) => r.sessionId === sessionId),
    [records]
  );

  const getByLearner = useCallback(
    (learnerId: string) =>
      records.filter((r) => r.learnerId === learnerId),
    [records]
  );

  const setRecord = useCallback((record: AttendanceRecord) => {
    const now = new Date().toISOString();
    const withMeta: AttendanceRecord = {
      ...record,
      markedAt: record.markedAt ?? now,
      markedBy: record.markedBy ?? record.markedBy,
    };
    setRecords((prev) => {
      const rest = prev.filter(
        (r) => !(r.sessionId === record.sessionId && r.learnerId === record.learnerId)
      );
      return [...rest, withMeta];
    });
  }, []);

  const markAllPresent = useCallback(
    (sessionId: string, learnerIds: string[], markedBy: string) => {
      const now = new Date().toISOString();
      setRecords((prev) => {
        const without = prev.filter((r) => r.sessionId !== sessionId);
        const newOnes: AttendanceRecord[] = learnerIds.map((learnerId) => {
          const existing = prev.find((r) => r.sessionId === sessionId && r.learnerId === learnerId);
          return {
            learnerId,
            sessionId,
            status: "present" as const,
            stars: existing?.stars,
            markedAt: now,
            markedBy,
          };
        });
        return [...without, ...newOnes];
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      records,
      getBySession,
      getByLearner,
      setRecord,
      markAllPresent,
    }),
    [records, getBySession, getByLearner, setRecord, markAllPresent]
  );

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
}
