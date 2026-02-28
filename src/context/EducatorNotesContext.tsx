import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export interface EducatorNote {
  id: string;
  sessionId: string;
  text: string;
  createdAt: string; // ISO
}

const DATE_NOTE_PREFIX = "date:";

interface EducatorNotesContextType {
  getNotesForSession: (sessionId: string) => EducatorNote[];
  addNote: (sessionId: string, text: string) => void;
  deleteNote: (sessionId: string, noteId: string) => void;
  /** Notes for a given date (e.g. "Today's notes"). Uses sessionId `date:YYYY-MM-DD`. */
  getNotesForDate: (date: string) => EducatorNote[];
  addNoteForDate: (date: string, text: string) => void;
}

const EducatorNotesContext = createContext<EducatorNotesContextType | undefined>(undefined);

function nextId(notes: EducatorNote[]): string {
  const nums = notes
    .map((n) => n.id.replace("en", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `en${max + 1}`;
}

export function EducatorNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<EducatorNote[]>([]);

  const getNotesForSession = useCallback(
    (sessionId: string) =>
      notes.filter((n) => n.sessionId === sessionId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes]
  );

  const getNotesForDate = useCallback(
    (date: string) => getNotesForSession(`${DATE_NOTE_PREFIX}${date}`),
    [getNotesForSession]
  );

  const addNote = useCallback((sessionId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    setNotes((prev) => {
      const id = nextId(prev);
      return [...prev, { id, sessionId, text: trimmed, createdAt: now }];
    });
  }, []);

  const addNoteForDate = useCallback(
    (date: string, text: string) => addNote(`${DATE_NOTE_PREFIX}${date}`, text),
    [addNote]
  );

  const deleteNote = useCallback((sessionId: string, noteId: string) => {
    setNotes((prev) => prev.filter((n) => !(n.sessionId === sessionId && n.id === noteId)));
  }, []);

  const value = useMemo(
    () => ({ getNotesForSession, addNote, deleteNote, getNotesForDate, addNoteForDate }),
    [getNotesForSession, addNote, deleteNote, getNotesForDate, addNoteForDate]
  );

  return (
    <EducatorNotesContext.Provider value={value}>
      {children}
    </EducatorNotesContext.Provider>
  );
}

export function useEducatorNotes() {
  const ctx = useContext(EducatorNotesContext);
  if (!ctx) throw new Error("useEducatorNotes must be used within EducatorNotesProvider");
  return ctx;
}
