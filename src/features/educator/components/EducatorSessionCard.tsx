import { useState } from "react";
import { Link } from "react-router-dom";
import { getClass } from "@/mockData";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { Session } from "@/types";
import { getSessionRoleForUser } from "@/features/educator/lib/auth";
import { useEducatorNotes } from "@/context/EducatorNotesContext";
import type { AppUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardCheck, FileText, Receipt, BookOpen, Laptop, StickyNote, Trash2 } from "lucide-react";

type LessonPlanStatus = "not_started" | "draft" | "ready";
type AttendanceStatus = "pending" | "done";
type ReportStatus = "pending" | "submitted";
type ExpensesStatus = "pending" | "logged";

interface EducatorSessionCardProps {
  session: Session;
  currentUser: AppUser | null;
  lessonPlanStatus: LessonPlanStatus;
  attendanceStatus: AttendanceStatus;
  reportStatus: ReportStatus;
  expensesStatus: ExpensesStatus;
  hasDeviceCheckedOut: boolean;
}

const LESSON_PLAN_LABELS: Record<LessonPlanStatus, string> = {
  not_started: "Pending",
  draft: "Draft",
  ready: "Ready",
};

export function EducatorSessionCard({
  session,
  currentUser,
  lessonPlanStatus,
  attendanceStatus,
  reportStatus,
  expensesStatus,
  hasDeviceCheckedOut,
}: EducatorSessionCardProps) {
  const cls = getClass(session.classId);
  const role = getSessionRoleForUser(session, currentUser);
  const { getNotesForSession, addNote, deleteNote } = useEducatorNotes();
  const [notesOpen, setNotesOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const notes = getNotesForSession(session.id);

  const handleAddNote = () => {
    const t = newNoteText.trim();
    if (t) {
      addNote(session.id, t);
      setNewNoteText("");
    }
  };

  return (
    <div className="p-3 rounded-lg bg-muted/50 flex flex-col gap-2 sm:gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <p className="font-medium text-sm">{cls?.name}</p>
          {role && (
            <span
              className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                role === "facilitator" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {role === "facilitator" ? "Facilitator" : "Coach"}
            </span>
          )}
          {hasDeviceCheckedOut && (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground" title="You have a device checked out">
              <Laptop className="w-3.5 h-3.5" />
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto shrink-0" onClick={() => setNotesOpen(true)} title="Notes">
            <StickyNote className={`w-3.5 h-3.5 ${notes.length > 0 ? "text-primary" : "text-muted-foreground"}`} />
            {notes.length > 0 && <span className="sr-only">{notes.length} note(s)</span>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {session.date} · {session.startTime}–{session.endTime} · {cls?.location ?? ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {LEARNING_TRACK_LABELS[session.learningTrack] ?? session.learningTrack}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-muted">
            Lesson: {LESSON_PLAN_LABELS[lessonPlanStatus]}
          </span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] ${attendanceStatus === "done" ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-muted"}`}>
            Attendance: {attendanceStatus === "done" ? "Done" : "Pending"}
          </span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] ${reportStatus === "submitted" ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-muted"}`}>
            Report: {reportStatus === "submitted" ? "Submitted" : "Pending"}
          </span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] ${expensesStatus === "logged" ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-muted"}`}>
            Expenses: {expensesStatus === "logged" ? "Logged" : "Pending"}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Link to={`/educator/sessions/${session.id}/lesson-plan`}>
          <Button size="sm" variant="outline" className="touch-manipulation">
            <BookOpen className="w-4 h-4 mr-1" /> Lesson plan
          </Button>
        </Link>
        <Link to={`/educator/sessions/${session.id}/attendance`}>
          <Button size="sm" variant={attendanceStatus === "pending" ? "default" : "outline"} className="touch-manipulation">
            <ClipboardCheck className="w-4 h-4 mr-1" /> Attendance
          </Button>
        </Link>
        <Link to={`/educator/sessions/${session.id}/report`}>
          <Button size="sm" variant="outline" className="touch-manipulation">
            <FileText className="w-4 h-4 mr-1" /> Report
          </Button>
        </Link>
        <Link to={`/educator/sessions/${session.id}/expenses`}>
          <Button size="sm" variant="outline" className="touch-manipulation">
            <Receipt className="w-4 h-4 mr-1" /> Expenses
          </Button>
        </Link>
      </div>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Notes
            </DialogTitle>
            <DialogDescription>
              {cls?.name} · {session.date} {session.startTime}–{session.endTime}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a note or reminder..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNote())}
              />
              <Button size="sm" onClick={handleAddNote} disabled={!newNoteText.trim()}>
                Add
              </Button>
            </div>
            <ul className="space-y-2 max-h-[200px] overflow-y-auto">
              {notes.length === 0 ? (
                <li className="text-sm text-muted-foreground">No notes yet.</li>
              ) : (
                notes.map((note) => (
                  <li key={note.id} className="rounded border bg-muted/30 p-2 text-sm flex justify-between gap-2">
                    <span className="min-w-0 break-words">{note.text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteNote(session.id, note.id)} title="Delete note">
                        ×
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
