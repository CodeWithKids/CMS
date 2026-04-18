import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
import type { AttendanceRecord } from "@/types";
import { attendanceGet, attendancePut, isApiEnabled } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

interface AttendanceContextType {
  records: AttendanceRecord[];
  getBySession: (sessionId: string) => AttendanceRecord[];
  getByLearner: (learnerId: string) => AttendanceRecord[];
  setRecord: (record: AttendanceRecord) => void;
  loadSessionRecords: (sessionId: string) => Promise<void>;
  saveSessionRecords: (sessionId: string, records: AttendanceRecord[]) => Promise<void>;
  markAllPresent: (
    sessionId: string,
    learnerIds: string[],
    markedBy: string
  ) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

type SupabaseAttendanceRow = {
  session_id?: string | null;
  sessionId?: string | null;
  learner_id?: string | null;
  learnerId?: string | null;
  status?: string | null;
  stars?: number | null;
  notes?: string | null;
  marked_at?: string | null;
  markedAt?: string | null;
  marked_by?: string | null;
  markedBy?: string | null;
};

function upsertSessionRecords(
  setRecords: Dispatch<SetStateAction<AttendanceRecord[]>>,
  sessionId: string,
  rows: AttendanceRecord[]
) {
  setRecords((prev) => {
    const withoutSession = prev.filter((r) => r.sessionId !== sessionId);
    return [...withoutSession, ...rows];
  });
}

function mapSupabaseRowToAttendance(row: SupabaseAttendanceRow): AttendanceRecord | null {
  const sessionId = row.session_id ?? row.sessionId;
  const learnerId = row.learner_id ?? row.learnerId;
  if (!sessionId || !learnerId) return null;
  return {
    sessionId,
    learnerId,
    status: (row.status ?? "present") as AttendanceRecord["status"],
    stars: typeof row.stars === "number" ? row.stars : undefined,
    notes: typeof row.notes === "string" ? row.notes : undefined,
    markedAt: (row.marked_at ?? row.markedAt) ?? undefined,
    markedBy: (row.marked_by ?? row.markedBy) ?? undefined,
  };
}

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();

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
      markedBy: record.markedBy ?? undefined,
    };
    setRecords((prev) => {
      const rest = prev.filter(
        (r) => !(r.sessionId === record.sessionId && r.learnerId === record.learnerId)
      );
      return [...rest, withMeta];
    });
  }, []);

  const loadSessionRecords = useCallback(
    async (sessionId: string) => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase.from("attendance_records").select("*").eq("session_id", sessionId);
          if (error) throw error;
          const mapped = ((data as SupabaseAttendanceRow[] | null) ?? [])
            .map(mapSupabaseRowToAttendance)
            .filter((r): r is AttendanceRecord => r !== null);
          upsertSessionRecords(setRecords, sessionId, mapped);
          return;
        } catch {
          if (!isApiEnabled()) return;
        }
      }

      if (apiEnabled || isApiEnabled()) {
        try {
          const apiRows = await attendanceGet(sessionId);
          const mapped: AttendanceRecord[] = apiRows.map((row) => ({
            sessionId: row.sessionId,
            learnerId: row.learnerId,
            status: row.status as AttendanceRecord["status"],
            stars: row.stars ?? undefined,
            notes: row.notes ?? undefined,
            markedAt: row.markedAt ?? undefined,
            markedBy: row.markedBy ?? undefined,
          }));
          upsertSessionRecords(setRecords, sessionId, mapped);
        } catch {
          // keep current local state
        }
      }
    },
    [supabaseEnabled, apiEnabled]
  );

  const saveSessionRecords = useCallback(
    async (sessionId: string, sessionRecords: AttendanceRecord[]) => {
      if (supabaseEnabled && supabase) {
        try {
          const { error: delErr } = await supabase.from("attendance_records").delete().eq("session_id", sessionId);
          if (delErr) throw delErr;
          if (sessionRecords.length > 0) {
            const payload = sessionRecords.map((r) => ({
              session_id: r.sessionId,
              learner_id: r.learnerId,
              status: r.status,
              stars: r.stars ?? null,
              notes: r.notes ?? null,
              marked_at: r.markedAt ?? null,
              marked_by: r.markedBy ?? null,
            }));
            const { error: insErr } = await supabase.from("attendance_records").insert(payload);
            if (insErr) throw insErr;
          }
          upsertSessionRecords(setRecords, sessionId, sessionRecords);
          return;
        } catch {
          if (!isApiEnabled()) throw new Error("Could not save attendance to Supabase.");
        }
      }

      if (apiEnabled || isApiEnabled()) {
        const payload = sessionRecords.map((r) => ({
          learnerId: r.learnerId,
          status: r.status,
          stars: r.stars ?? 0,
          notes: r.notes ?? undefined,
        }));
        await attendancePut(sessionId, payload);
      }
      upsertSessionRecords(setRecords, sessionId, sessionRecords);
    },
    [supabaseEnabled, apiEnabled]
  );

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
      loadSessionRecords,
      saveSessionRecords,
      markAllPresent,
    }),
    [records, getBySession, getByLearner, setRecord, loadSessionRecords, saveSessionRecords, markAllPresent]
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
