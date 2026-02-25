import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { ClassEnrollment, ClassEnrollmentStatus } from "@/types";
import { mockClassEnrollments } from "@/mockData";

interface EnrollmentsContextType {
  enrollments: ClassEnrollment[];
  getEnrollmentsForClass: (classId: string, termId: string) => ClassEnrollment[];
  getEnrollmentsForLearner: (learnerId: string) => ClassEnrollment[];
  addEnrollment: (entry: Omit<ClassEnrollment, "id">) => void;
  updateEnrollmentStatus: (id: string, status: ClassEnrollmentStatus) => void;
}

const EnrollmentsContext = createContext<EnrollmentsContextType | undefined>(undefined);

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
      return [...prev, { ...entry, id }];
    });
  }, []);

  const updateEnrollmentStatus = useCallback((id: string, status: ClassEnrollmentStatus) => {
    setEnrollments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  }, []);

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
