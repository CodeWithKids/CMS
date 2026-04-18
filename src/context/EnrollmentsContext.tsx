import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type { ClassEnrollment, ClassEnrollmentStatus } from "@/types";
import { mockClassEnrollments } from "@/mockData";
import { isApiEnabled } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

interface EnrollmentsContextType {
  enrollments: ClassEnrollment[];
  getEnrollmentsForClass: (classId: string, termId: string) => ClassEnrollment[];
  getEnrollmentsForLearner: (learnerId: string) => ClassEnrollment[];
  addEnrollment: (entry: Omit<ClassEnrollment, "id">) => void;
  updateEnrollmentStatus: (id: string, status: ClassEnrollmentStatus) => void;
}

const EnrollmentsContext = createContext<EnrollmentsContextType | undefined>(undefined);

type SupabaseEnrollmentRow = {
  id: string;
  class_id?: string | null;
  classId?: string | null;
  learner_id?: string | null;
  learnerId?: string | null;
  term_id?: string | null;
  termId?: string | null;
  status?: string | null;
};

function mapSupabaseRowToEnrollment(row: SupabaseEnrollmentRow): ClassEnrollment | null {
  const classId = row.class_id ?? row.classId;
  const learnerId = row.learner_id ?? row.learnerId;
  const termId = row.term_id ?? row.termId;
  if (!classId || !learnerId || !termId) return null;
  return {
    id: row.id,
    classId,
    learnerId,
    termId,
    status: (row.status ?? "active") as ClassEnrollmentStatus,
  };
}

function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function nextId(existing: ClassEnrollment[]): string {
  const nums = existing
    .map((e) => e.id.replace("ce", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `ce${max + 1}`;
}

export function EnrollmentsProvider({ children }: { children: ReactNode }) {
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>(() => [...mockClassEnrollments]);
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();

  useEffect(() => {
    if (!supabaseEnabled && !apiEnabled) return;
    if (!supabaseEnabled || !supabase) return;
    let cancelled = false;
    void (async () => {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from("class_enrollments").select("*");
        if (error) throw error;
        const mapped = ((data as SupabaseEnrollmentRow[] | null) ?? [])
          .map(mapSupabaseRowToEnrollment)
          .filter((r): r is ClassEnrollment => r !== null);
        if (!cancelled) setEnrollments(mapped);
      } catch {
        // keep local/mock fallback (or API when introduced)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled, apiEnabled]);

  const getEnrollmentsForClass = useCallback(
    (classId: string, termId: string) =>
      enrollments.filter((e) => e.classId === classId && e.termId === termId),
    [enrollments]
  );

  const getEnrollmentsForLearner = useCallback(
    (learnerId: string) => enrollments.filter((e) => e.learnerId === learnerId),
    [enrollments]
  );

  const addEnrollment = useCallback((entry: Omit<ClassEnrollment, "id">) => {
    setEnrollments((prev) => {
      const exists = prev.some(
        (e) => e.classId === entry.classId && e.termId === entry.termId && e.learnerId === entry.learnerId
      );
      if (exists) return prev;
      const id = nextId(prev);
      if (supabaseEnabled && supabase) {
        void (async () => {
          try {
            const client = getSupabaseClient();
            await client.from("class_enrollments").insert({
              id,
              class_id: entry.classId,
              learner_id: entry.learnerId,
              term_id: entry.termId,
              status: entry.status,
            });
          } catch {
            // keep local fallback
          }
        })();
      }
      return [...prev, { ...entry, id }];
    });
  }, [supabaseEnabled]);

  const updateEnrollmentStatus = useCallback((id: string, status: ClassEnrollmentStatus) => {
    setEnrollments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
    if (supabaseEnabled && supabase) {
      void (async () => {
        try {
          const client = getSupabaseClient();
          await client.from("class_enrollments").update({ status }).eq("id", id);
        } catch {
          // keep local fallback
        }
      })();
    }
  }, [supabaseEnabled]);

  const value = useMemo(
    () => ({
      enrollments,
      getEnrollmentsForClass,
      getEnrollmentsForLearner,
      addEnrollment,
      updateEnrollmentStatus,
    }),
    [enrollments, getEnrollmentsForClass, getEnrollmentsForLearner, addEnrollment, updateEnrollmentStatus]
  );

  return (
    <EnrollmentsContext.Provider value={value}>
      {children}
    </EnrollmentsContext.Provider>
  );
}

export function useEnrollments() {
  const ctx = useContext(EnrollmentsContext);
  if (!ctx) throw new Error("useEnrollments must be used within EnrollmentsProvider");
  return ctx;
}
