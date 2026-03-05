import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { CoachingNote } from "@/types";
import { mockCoachingNotes } from "@/mockData/educator";
import { isApiEnabled, coachingNotesGetAll, coachingNotesCreate } from "@/lib/api";

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
  const apiEnabled = isApiEnabled();

  useEffect(() => {
    if (!apiEnabled) return;
    coachingNotesGetAll()
      .then((list) => {
        setNotes(
          list.map((n) => ({
            id: n.id,
            educatorId: n.educatorId,
            authorId: n.authorId,
            date: n.date,
            text: n.text,
            trackRef: n.trackRef ?? undefined,
            sessionId: n.sessionId ?? undefined,
          }))
        );
      })
      .catch(() => {});
  }, [apiEnabled]);

  const getNotesForEducator = useCallback(
    (educatorId: string) => notes.filter((n) => n.educatorId === educatorId).sort((a, b) => b.date.localeCompare(a.date)),
    [notes]
  );

  const addNote = useCallback((note: Omit<CoachingNote, "id">) => {
    if (apiEnabled) {
      coachingNotesCreate({
        educatorId: note.educatorId,
        authorId: note.authorId,
        date: note.date,
        text: note.text,
        trackRef: note.trackRef ?? null,
        sessionId: note.sessionId ?? null,
      })
        .then((created) => {
          setNotes((prev) => [
            ...prev,
            {
              id: created.id,
              educatorId: created.educatorId,
              authorId: created.authorId,
              date: created.date,
              text: created.text,
              trackRef: created.trackRef ?? undefined,
              sessionId: created.sessionId ?? undefined,
            },
          ]);
        })
        .catch(() => {});
      return;
    }
    setNotes((prev) => [...prev, { ...note, id: nextId(prev) }]);
  }, [apiEnabled]);

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
