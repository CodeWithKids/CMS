import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CoachingNote } from "@/types";
import { mockCoachingNotes } from "@/mockData/educator";

interface CoachingNotesContextType {
  notes: CoachingNote[];
  getNotesForEducator: (educatorId: string) => CoachingNote[];
  addNote: (note: Omit<CoachingNote, "id">) => void;
}

const CoachingNotesContext = createContext<CoachingNotesContextType | undefined>(undefined);

function nextId(notes: CoachingNote[]): string {
  const max = notes.reduce((m, n) => {
    const num = parseInt(n.id.replace(/\D/g, ""), 10);
    return Number.isNaN(num) ? m : Math.max(m, num);
  }, 0);
  return `cn${max + 1}`;
}

export function CoachingNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<CoachingNote[]>(() => [...mockCoachingNotes]);

  const getNotesForEducator = useCallback(
    (educatorId: string) => notes.filter((n) => n.educatorId === educatorId).sort((a, b) => b.date.localeCompare(a.date)),
    [notes]
  );

  const addNote = useCallback((note: Omit<CoachingNote, "id">) => {
    setNotes((prev) => [...prev, { ...note, id: nextId(prev) }]);
  }, []);

  const value = useMemo(
    () => ({ notes, getNotesForEducator, addNote }),
    [notes, getNotesForEducator, addNote]
  );

  return (
    <CoachingNotesContext.Provider value={value}>
      {children}
    </CoachingNotesContext.Provider>
  );
}

export function useCoachingNotes() {
  const ctx = useContext(CoachingNotesContext);
  if (!ctx) throw new Error("useCoachingNotes must be used within CoachingNotesProvider");
  return ctx;
}
